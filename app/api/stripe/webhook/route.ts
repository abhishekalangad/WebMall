import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured.')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe signature header' }, { status: 400 })
  }

  let event: any
  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // 🔒 IDEMPOTENCY CHECK: Check if Stripe event was already processed
  const existingWebhook = await prisma.webhookEvent.findUnique({
    where: {
      provider_eventId: {
        provider: 'stripe',
        eventId: event.id
      }
    }
  })

  if (existingWebhook && existingWebhook.status === 'processed') {
    return NextResponse.json({ received: true, idempotent: true })
  }

  // Record initial receipt of webhook event
  await prisma.webhookEvent.upsert({
    where: {
      provider_eventId: {
        provider: 'stripe',
        eventId: event.id
      }
    },
    create: {
      provider: 'stripe',
      eventId: event.id,
      eventType: event.type,
      status: 'processing'
    },
    update: {
      status: 'processing'
    }
  })

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const orderId = paymentIntent.metadata?.orderId

        if (orderId) {
          const order = await prisma.order.findUnique({ where: { id: orderId } })

          if (!order) {
            throw new Error(`Order ${orderId} not found for payment intent ${paymentIntent.id}`)
          }

          // 🔒 RECONCILIATION: Verify Stripe amount & currency match database order exactly
          const expectedAmountCents = Math.round(parseFloat(order.totalAmount.toString()) * 100)
          const receivedAmountCents = paymentIntent.amount
          const expectedCurrency = (order.currency || 'LKR').toLowerCase()
          const receivedCurrency = (paymentIntent.currency || '').toLowerCase()

          if (receivedAmountCents !== expectedAmountCents || receivedCurrency !== expectedCurrency) {
            const mismatchError = `Payment reconciliation failed for order ${orderId}: Expected ${expectedAmountCents} ${expectedCurrency}, got ${receivedAmountCents} ${receivedCurrency}`
            console.error(mismatchError)

            await prisma.webhookEvent.update({
              where: { provider_eventId: { provider: 'stripe', eventId: event.id } },
              data: { status: 'failed', errorMessage: mismatchError, processedAt: new Date() }
            })

            return NextResponse.json({ error: mismatchError }, { status: 400 })
          }

          // Idempotently update order status
          await prisma.order.updateMany({
            where: {
              id: orderId,
              status: 'pending'
            },
            data: {
              status: 'confirmed'
            }
          })
        }
        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const orderId = paymentIntent.metadata?.orderId

        if (orderId) {
          await prisma.order.updateMany({
            where: { id: orderId, status: 'pending' },
            data: { status: 'cancelled' }
          })
        }
        break
      }
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    // Mark webhook event as successfully processed
    await prisma.webhookEvent.update({
      where: {
        provider_eventId: {
          provider: 'stripe',
          eventId: event.id
        }
      },
      data: {
        status: 'processed',
        processedAt: new Date()
      }
    })

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing Stripe webhook:', error)

    await prisma.webhookEvent.update({
      where: {
        provider_eventId: {
          provider: 'stripe',
          eventId: event.id
        }
      },
      data: {
        status: 'failed',
        errorMessage: error.message || 'Webhook processing error',
        processedAt: new Date()
      }
    })

    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }
}
