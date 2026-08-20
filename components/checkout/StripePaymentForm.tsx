'use client'

import React, { useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Lock, ShieldCheck } from 'lucide-react'

interface StripePaymentFormProps {
  onSuccess: (paymentIntentId: string) => void
  onError: (errorMessage: string) => void
  submitting: boolean
  setSubmitting: (loading: boolean) => void
}

export function StripeCheckoutForm({
  onSuccess,
  onError,
  submitting,
  setSubmitting,
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet.
      return
    }

    setSubmitting(true)
    setMessage(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout`,
      },
      redirect: 'if_required',
    })

    if (error) {
      console.error('[Stripe Payment Error]', error)
      const errorText = error.message || 'An unexpected payment error occurred.'
      setMessage(errorText)
      onError(errorText)
      setSubmitting(false)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id)
    } else if (paymentIntent && paymentIntent.status === 'requires_action') {
      // Handle 3DS verification if needed
      setMessage('Payment requires additional verification.')
      setSubmitting(false)
    } else {
      setMessage('Payment status: ' + (paymentIntent?.status || 'unknown'))
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-lg bg-background border border-border">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {message && (
        <div className="p-3 text-sm rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
          {message}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-muted-foreground mt-2">
        <span className="flex items-center gap-1">
          <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Encrypted and secured by Stripe Test Gateway</span>
        </span>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 hidden sm:inline" />
      </div>

      <Button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-lg transition-all"
      >
        {submitting ? 'Processing Payment...' : 'Pay with Card (Stripe Test)'}
      </Button>
    </form>
  )
}
