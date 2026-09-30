import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    // Identify the signed-in student.
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: 'You must be signed in.',
        },
        {
          status: 401,
        }
      )
    }

    const body = await request.json()

    const razorpayOrderId = body?.razorpay_order_id
    const razorpayPaymentId = body?.razorpay_payment_id
    const razorpaySignature = body?.razorpay_signature

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        {
          error: 'Missing Razorpay payment information.',
        },
        {
          status: 400,
        }
      )
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        {
          error: 'Razorpay server configuration is incomplete.',
        },
        {
          status: 500,
        }
      )
    }

    /*
     * Use the admin client for the orders lookup.
     *
     * The signed-in user's ID is still required in the query,
     * so one student cannot verify another student's order.
     */
    const adminSupabase = createAdminClient()

    const {
      data: order,
      error: orderLookupError,
    } = await adminSupabase
      .from('orders')
      .select(
        'id, user_id, course_id, amount_inr, currency, status, gateway, gateway_order_id'
      )
      .eq('gateway_order_id', razorpayOrderId)
      .eq('user_id', user.id)
      .eq('gateway', 'razorpay')
      .maybeSingle()

    if (orderLookupError) {
      console.error(
        'Payment order lookup error:',
        orderLookupError
      )

      return NextResponse.json(
        {
          error: 'Could not find the payment order.',
          databaseError: orderLookupError.message,
          databaseDetails: orderLookupError.details,
          databaseHint: orderLookupError.hint,
        },
        {
          status: 500,
        }
      )
    }

    if (!order) {
      return NextResponse.json(
        {
          error: 'Payment order was not found.',
          razorpayOrderId,
        },
        {
          status: 404,
        }
      )
    }

    /*
     * Verify the Razorpay payment signature.
     */
    const signaturePayload =
      order.gateway_order_id +
      '|' +
      razorpayPaymentId

    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(signaturePayload)
      .digest('hex')

    const expectedBuffer = Buffer.from(
      generatedSignature,
      'utf8'
    )

    const receivedBuffer = Buffer.from(
      razorpaySignature,
      'utf8'
    )

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      )
    ) {
      return NextResponse.json(
        {
          error: 'Payment signature verification failed.',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Ask Razorpay for the payment details.
     */
    const authHeader =
      'Basic ' +
      Buffer.from(
        razorpayKeyId +
          ':' +
          razorpayKeySecret
      ).toString('base64')

    const paymentResponse = await fetch(
      'https://api.razorpay.com/v1/payments/' +
        razorpayPaymentId,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
        },
        cache: 'no-store',
      }
    )

    if (!paymentResponse.ok) {
      const paymentErrorText =
        await paymentResponse.text()

      console.error(
        'Razorpay payment lookup failed:',
        paymentErrorText
      )

      return NextResponse.json(
        {
          error:
            'Could not verify the payment with Razorpay.',
          razorpayResponse: paymentErrorText,
        },
        {
          status: 500,
        }
      )
    }

    const payment = await paymentResponse.json()

    /*
     * Confirm the payment belongs to this order.
     */
    if (payment.order_id !== razorpayOrderId) {
      return NextResponse.json(
        {
          error:
            'Payment does not belong to this Razorpay order.',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Confirm the exact amount.
     */
    const expectedAmount =
      Number(order.amount_inr) * 100

    const paymentAmount =
      Number(payment.amount)

    if (paymentAmount !== expectedAmount) {
      return NextResponse.json(
        {
          error:
            'Payment amount does not match the course price.',
          expectedAmount,
          paymentAmount,
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Confirm the currency.
     */
    if (payment.currency !== order.currency) {
      return NextResponse.json(
        {
          error:
            'Payment currency does not match the order.',
          expectedCurrency: order.currency,
          paymentCurrency: payment.currency,
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Only grant access after Razorpay confirms
     * that the payment was captured.
     */
    if (payment.status !== 'captured') {
      return NextResponse.json(
        {
          error:
            'Payment has not been captured yet.',
          paymentStatus: payment.status,
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Mark the internal order as paid.
     */
    const {
      data: updatedOrder,
      error: updateOrderError,
    } = await adminSupabase
      .from('orders')
      .update({
        status: 'paid',
        gateway_payment_id: razorpayPaymentId,
        gateway_signature: razorpaySignature,
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .eq('user_id', user.id)
      .select(
        'id, course_id, amount_inr, currency, status, gateway_order_id, gateway_payment_id'
      )
      .single()

    if (updateOrderError || !updatedOrder) {
      console.error(
        'Order update error:',
        updateOrderError
      )

      return NextResponse.json(
        {
          error:
            'Payment was verified but the order could not be updated.',
          databaseError:
            updateOrderError?.message || null,
          databaseDetails:
            updateOrderError?.details || null,
          databaseHint:
            updateOrderError?.hint || null,
          orderId: order.id,
          razorpayOrderId,
          razorpayPaymentId,
        },
        {
          status: 500,
        }
      )
    }

    /*
     * Create or restore the student's enrollment.
     */
    const {
      data: enrollment,
      error: enrollmentError,
    } = await adminSupabase
      .from('enrollments')
      .upsert(
        {
          user_id: user.id,
          course_id: order.course_id,
          status: 'active',
          enrolled_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,course_id',
        }
      )
      .select(
        'id, course_id, status, enrolled_at'
      )
      .single()

    if (enrollmentError || !enrollment) {
      console.error(
        'Enrollment creation error:',
        enrollmentError
      )

      return NextResponse.json(
        {
          error:
            'Payment was verified and the order was updated, but enrollment could not be created.',
          databaseError:
            enrollmentError?.message || null,
          databaseDetails:
            enrollmentError?.details || null,
          databaseHint:
            enrollmentError?.hint || null,
          orderId: order.id,
          razorpayOrderId,
          razorpayPaymentId,
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json({
      success: true,

      message:
        'Payment verified and enrollment created.',

      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        gatewayOrderId:
          updatedOrder.gateway_order_id,
        gatewayPaymentId:
          updatedOrder.gateway_payment_id,
      },

      enrollment: {
        id: enrollment.id,
        courseId: enrollment.course_id,
        status: enrollment.status,
      },
    })
  } catch (error) {
    console.error(
      'Razorpay verification error:',
      error
    )

    return NextResponse.json(
      {
        error: 'Unable to verify payment.',
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    )
  }
}