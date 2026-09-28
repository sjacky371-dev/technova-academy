import { NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is missing.')

      return NextResponse.json(
        { error: 'Webhook server configuration is missing.' },
        { status: 500 }
      )
    }

    const rawBody = await request.text()
    const receivedSignature = request.headers.get(
      'x-razorpay-signature'
    )

    if (!receivedSignature) {
      return NextResponse.json(
        { error: 'Missing webhook signature.' },
        { status: 401 }
      )
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    const receivedBuffer = Buffer.from(receivedSignature, 'utf8')
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8')

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid webhook signature.' },
        { status: 401 }
      )
    }

    let payload: any

    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload.' },
        { status: 400 }
      )
    }

    const event = payload?.event

    if (event !== 'order.paid') {
      return NextResponse.json({
        success: true,
        ignored: true,
        event,
      })
    }

    const razorpayOrderId =
      payload?.payload?.order?.entity?.id

    if (
      !razorpayOrderId ||
      typeof razorpayOrderId !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Missing Razorpay order ID.' },
        { status: 400 }
      )
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID
    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET
    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        { error: 'Razorpay server configuration is missing.' },
        { status: 500 }
      )
    }

    if (!supabaseSecretKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Supabase server configuration is missing.' },
        { status: 500 }
      )
    }

    const adminSupabase = createAdminSupabaseClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const {
      data: order,
      error: orderLookupError,
    } = await adminSupabase
      .from('orders')
      .select(
        'id, user_id, course_id, amount_inr, currency, status, gateway, gateway_order_id'
      )
      .eq('gateway', 'razorpay')
      .eq('gateway_order_id', razorpayOrderId)
      .maybeSingle()

    if (orderLookupError) {
      console.error(
        'Webhook order lookup error:',
        orderLookupError
      )

      return NextResponse.json(
        {
          error: 'Could not find the local payment order.',
        },
        { status: 500 }
      )
    }

    if (!order) {
      console.error(
        'Webhook received for unknown Razorpay order:',
        razorpayOrderId
      )

      return NextResponse.json(
        {
          error: 'Unknown Razorpay order.',
        },
        { status: 404 }
      )
    }

    if (order.status === 'paid') {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        orderId: order.id,
      })
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })

    const razorpayPayments =
      await razorpay.orders.fetchPayments(
        razorpayOrderId
      )

    const payments = razorpayPayments?.items || []

    const matchingPayment = payments.find(
      (payment: any) =>
        payment.status === 'captured' &&
        payment.order_id === razorpayOrderId &&
        payment.currency === order.currency &&
        Number(payment.amount) ===
          Number(order.amount_inr) * 100
    )

    if (!matchingPayment) {
      console.error(
        'No matching captured payment found for webhook:',
        razorpayOrderId
      )

      return NextResponse.json(
        {
          error:
            'No matching captured payment was found.',
        },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()

    const {
      data: updatedOrder,
      error: updateOrderError,
    } = await adminSupabase
      .from('orders')
      .update({
        status: 'paid',
        gateway_payment_id: matchingPayment.id,
        paid_at: now,
        verification_timestamp: now,
        updated_at: now,
      })
      .eq('id', order.id)
      .eq('user_id', order.user_id)
      .select(
        'id, user_id, course_id, amount_inr, currency, status, gateway_order_id, gateway_payment_id, paid_at'
      )
      .single()

    if (updateOrderError || !updatedOrder) {
      console.error(
        'Webhook order update error:',
        updateOrderError
      )

      return NextResponse.json(
        {
          error:
            'Payment was verified but the order could not be updated.',
        },
        { status: 500 }
      )
    }

    const {
      data: enrollment,
      error: enrollmentError,
    } = await adminSupabase
      .from('enrollments')
      .upsert(
        {
          user_id: order.user_id,
          course_id: order.course_id,
          status: 'active',
          enrolled_at: now,
        },
        {
          onConflict: 'user_id,course_id',
        }
      )
      .select(
        'id, user_id, course_id, status, enrolled_at'
      )
      .single()

    if (enrollmentError || !enrollment) {
      console.error(
        'Webhook enrollment error:',
        enrollmentError
      )

      return NextResponse.json(
        {
          error:
            'Payment was recorded but enrollment could not be activated.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      paymentId: matchingPayment.id,
      enrollmentId: enrollment.id,
    })
  } catch (error) {
    console.error(
      'Razorpay webhook error:',
      error
    )

    return NextResponse.json(
      {
        error: 'Unable to process Razorpay webhook.',
      },
      { status: 500 }
    )
  }
}