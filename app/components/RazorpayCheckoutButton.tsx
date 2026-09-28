'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function RazorpayCheckoutButton({
  courseSlug,
  courseTitle,
  priceInr,
}: {
  courseSlug: string
  courseTitle: string
  priceInr: number
}) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadRazorpay() {
    if (window.Razorpay) {
      return true
    }

    return new Promise<boolean>((resolve) => {
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      )

      if (existingScript) {
        existingScript.addEventListener('load', () =>
          resolve(true)
        )

        existingScript.addEventListener('error', () =>
          resolve(false)
        )

        return
      }

      const script = document.createElement('script')

      script.src =
        'https://checkout.razorpay.com/v1/checkout.js'

      script.async = true

      script.onload = () => resolve(true)

      script.onerror = () => resolve(false)

      document.body.appendChild(script)
    })
  }

  async function verifyPayment(response: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) {
    const verificationResponse = await fetch(
      '/api/payments/verify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_payment_id:
            response.razorpay_payment_id,

          razorpay_order_id:
            response.razorpay_order_id,

          razorpay_signature:
            response.razorpay_signature,
        }),
      }
    )

    const data = await verificationResponse.json()

    if (!verificationResponse.ok) {
      throw new Error(
        data?.error ||
          'Payment verification failed.'
      )
    }

    return data
  }

  async function startPayment() {
    if (loading) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const razorpayLoaded =
        await loadRazorpay()

      if (!razorpayLoaded) {
        setError(
          'Could not load the payment system. Please try again.'
        )

        setLoading(false)
        return
      }

      const response = await fetch(
        '/api/payments/create-order',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseSlug,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const detailedError = [
          data?.error,
          data?.databaseError,
          data?.databaseDetails,
          data?.databaseHint,
        ]
          .filter(Boolean)
          .join(' | ')

        setError(
          detailedError ||
            'Could not create payment order.'
        )

        setLoading(false)
        return
      }

      const options = {
        key: data.keyId,

        amount: data.order.amount,

        currency: data.order.currency,

        name: 'TechNova Academy',

        description: courseTitle,

        order_id:
          data.order.razorpayOrderId,

        handler: async function (
          paymentResponse: {
            razorpay_payment_id: string
            razorpay_order_id: string
            razorpay_signature: string
          }
        ) {
          try {
            setError('')

            setSuccess(
              'Payment received. Verifying securely...'
            )

            const verification =
              await verifyPayment(
                paymentResponse
              )

            if (!verification?.success) {
              throw new Error(
                'Payment verification was not completed.'
              )
            }

            setSuccess(
              'Payment verified. Your course is now enrolled.'
            )

            setLoading(false)

            setTimeout(() => {
              router.push('/dashboard')
              router.refresh()
            }, 800)
          } catch (verificationError) {
            console.error(
              'Payment verification error:',
              verificationError
            )

            setSuccess('')

            setError(
              verificationError instanceof Error
                ? verificationError.message
                : 'Payment was received but verification failed.'
            )

            setLoading(false)
          }
        },

        prefill: {},

        notes: {
          course_slug: courseSlug,
        },

        theme: {
          color: '#315ee7',
        },

        modal: {
          ondismiss: function () {
            setLoading(false)
          },
        },
      }

      const razorpay =
        new window.Razorpay(options)

      razorpay.on(
        'payment.failed',
        function (paymentFailure: any) {
          console.error(
            'Razorpay payment failed:',
            paymentFailure
          )

          setError(
            paymentFailure?.error?.description ||
              'Payment failed. Please try again.'
          )

          setLoading(false)
        }
      )

      razorpay.open()
    } catch (error) {
      console.error(
        'Checkout error:',
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong while starting payment.'
      )

      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startPayment}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: '10px',
          border: '1px solid #315ee7',
          background: loading
            ? '#7d95e8'
            : '#315ee7',
          color: '#ffffff',
          cursor: loading
            ? 'default'
            : 'pointer',
          fontWeight: '700',
          fontSize: '15px',
        }}
      >
        {loading
          ? 'Processing payment...'
          : `Buy Course · ₹${priceInr.toLocaleString(
              'en-IN'
            )}`}
      </button>

      {success && (
        <p
          style={{
            marginTop: '12px',
            color: '#087b67',
            fontSize: '13px',
            lineHeight: '1.5',
          }}
        >
          {success}
        </p>
      )}

      {error && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            background: '#fff4f2',
            border: '1px solid #f3c2ba',
            borderRadius: '9px',
            color: '#b42318',
            fontSize: '13px',
            lineHeight: '1.6',
            wordBreak: 'break-word',
          }}
        >
          <strong>Payment order error:</strong>
          <br />
          {error}
        </div>
      )}
    </div>
  )
}