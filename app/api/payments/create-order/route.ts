import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient as createServerSupabaseClient } from '../../../../lib/supabase/server'
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    /*
     * First use the normal server Supabase client to identify
     * the currently signed-in student.
     */
    const supabase =
      await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error:
            'Please sign in before purchasing a course.',
        },
        {
          status: 401,
        }
      )
    }

    const body = await request.json()

    const courseSlug = body?.courseSlug

    if (
      !courseSlug ||
      typeof courseSlug !== 'string'
    ) {
      return NextResponse.json(
        {
          error: 'Course slug is required.',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Load the course from our own database.
     *
     * The browser does not get to choose the price.
     */
    const {
      data: course,
      error: courseError,
    } = await supabase
      .from('courses')
      .select(
        'id, title, slug, price_inr, published'
      )
      .eq('slug', courseSlug)
      .eq('published', true)
      .single()

    if (courseError || !course) {
      console.error(
        'Course lookup error:',
        courseError
      )

      return NextResponse.json(
        {
          error: 'Course not found.',
        },
        {
          status: 404,
        }
      )
    }

    /*
     * Check whether this student is already enrolled.
     */
    const {
      data: existingEnrollment,
      error: enrollmentCheckError,
    } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .in('status', ['active', 'completed'])
      .maybeSingle()

    if (enrollmentCheckError) {
      console.error(
        'Enrollment check error:',
        enrollmentCheckError
      )

      return NextResponse.json(
        {
          error:
            'Could not check existing enrollment.',
        },
        {
          status: 500,
        }
      )
    }

    if (existingEnrollment) {
      return NextResponse.json(
        {
          error:
            'You are already enrolled in this course.',
        },
        {
          status: 409,
        }
      )
    }

    /*
     * Razorpay expects the amount in paise.
     */
    const amountInPaise =
      course.price_inr * 100

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID

    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET

    if (
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      console.error(
        'Razorpay server credentials are missing.'
      )

      return NextResponse.json(
        {
          error:
            'Payment configuration is incomplete.',
        },
        {
          status: 500,
        }
      )
    }

    /*
     * Create the Razorpay order.
     */
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `tn_${Date.now()}`,
        notes: {
          user_id: user.id,
          course_id: course.id,
          course_slug: course.slug,
        },
      })

    /*
     * The payment order has now been created at Razorpay.
     *
     * From this point onward, save the order in our database.
     *
     * This is a trusted server-side operation, so use the
     * Supabase secret key. It never reaches the browser.
     */
    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY

    if (!supabaseSecretKey) {
      console.error(
        'SUPABASE_SECRET_KEY is missing.'
      )

      return NextResponse.json(
        {
          error:
            'Server database configuration is incomplete.',
        },
        {
          status: 500,
        }
      )
    }

    const adminSupabase =
      createAdminSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
      error: orderError,
    } = await adminSupabase
      .from('orders')
      .insert({
        user_id: user.id,
        course_id: course.id,
        amount_inr: course.price_inr,
        currency: 'INR',
        status: 'created',
        gateway: 'razorpay',
        gateway_order_id:
          razorpayOrder.id,
      })
      .select(
        'id, gateway_order_id, amount_inr, currency, status'
      )
      .single()

    if (orderError || !order) {
      console.error(
        'Supabase order insert error:',
        orderError
      )

      /*
       * If the database insert fails, return the actual
       * database message during development so we can see
       * exactly what needs fixing.
       */
      return NextResponse.json(
        {
          error:
            'Could not save the payment order.',
          databaseError:
            orderError?.message || null,
          databaseDetails:
            orderError?.details || null,
          databaseHint:
            orderError?.hint || null,
        },
        {
          status: 500,
        }
      )
    }

    /*
     * Return only safe information to the browser.
     *
     * The Razorpay secret and Supabase secret never leave
     * this server route.
     */
    return NextResponse.json({
      success: true,

      order: {
        id: order.id,

        razorpayOrderId:
          razorpayOrder.id,

        amount:
          amountInPaise,

        amountInr:
          course.price_inr,

        currency: 'INR',

        courseId:
          course.id,

        courseTitle:
          course.title,

        status:
          order.status,
      },

      keyId:
        process.env
          .NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error(
      'Create Razorpay order error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Unable to create payment order.',
      },
      {
        status: 500,
      }
    )
  }
}