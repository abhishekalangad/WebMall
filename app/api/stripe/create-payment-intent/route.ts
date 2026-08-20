import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { verifyAuthToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const user = await verifyAuthToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, currency = 'lkr', metadata = {} } = body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount provided' }, { status: 400 })
    }

    // Convert amount to smallest currency unit (e.g., LKR / USD in cents = amount * 100)
    const amountInCents = Math.round(amount * 100)

    try {
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: user.id,
          userEmail: user.email || '',
          ...metadata,
        },
      })

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    } catch (stripeErr: any) {
      // Fallback: If LKR is not supported by the Stripe account region, try USD
      if (currency.toLowerCase() === 'lkr' && stripeErr.message?.includes('currency')) {
        console.warn('LKR currency error from Stripe, retrying with USD conversion fallback...')
        const usdAmount = Math.max(1, Math.round((amount / 300) * 100)) // Rough LKR to USD conversion for test mode
        const paymentIntent = await stripe.paymentIntents.create({
          amount: usdAmount,
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            userId: user.id,
            userEmail: user.email || '',
            originalLkrAmount: amount.toString(),
            ...metadata,
          },
        })

        return NextResponse.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        })
      }
      throw stripeErr
    }
  } catch (error: any) {
    console.error('Error creating Stripe payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
