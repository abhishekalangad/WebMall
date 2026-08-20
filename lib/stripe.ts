import Stripe from 'stripe'

// Fallback to placeholder key during static build analysis so Next.js build passes without error
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_build_placeholder'

export const stripe = new Stripe(stripeSecretKey, {
  typescript: true,
})
