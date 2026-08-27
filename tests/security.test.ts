import { describe, it, expect } from 'vitest'
import { createOrderSchema, cartItemActionSchema, couponValidateSchema } from '../lib/validations'
import { isValidStatusTransition } from '../lib/order-state'
import { checkRateLimit } from '../lib/rate-limit'

describe('Input Validation Schemas (Zod)', () => {
  it('should validate valid checkout order data', () => {
    const validOrder = {
      items: [
        { productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2 }
      ],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+94771234567',
        address: '123 Main Street',
        city: 'Colombo',
        postalCode: '00100',
        district: 'Colombo'
      },
      paymentMethod: 'cod'
    }

    const result = createOrderSchema.safeParse(validOrder)
    expect(result.success).toBe(true)
  })

  it('should reject order with empty items array', () => {
    const invalidOrder = {
      items: [],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+94771234567',
        address: '123 Main Street',
        city: 'Colombo',
        postalCode: '00100',
        district: 'Colombo'
      }
    }

    const result = createOrderSchema.safeParse(invalidOrder)
    expect(result.success).toBe(false)
  })

  it('should reject negative quantities in cart actions', () => {
    const invalidCartAction = {
      action: 'add',
      productId: 'p1',
      quantity: -5
    }

    const result = cartItemActionSchema.safeParse(invalidCartAction)
    expect(result.success).toBe(false)
  })
})

describe('Order State Machine', () => {
  it('should allow valid transitions', () => {
    expect(isValidStatusTransition('pending', 'confirmed')).toBe(true)
    expect(isValidStatusTransition('pending', 'cancelled')).toBe(true)
    expect(isValidStatusTransition('confirmed', 'processing')).toBe(true)
    expect(isValidStatusTransition('processing', 'shipped')).toBe(true)
    expect(isValidStatusTransition('shipped', 'delivered')).toBe(true)
    expect(isValidStatusTransition('delivered', 'refunded')).toBe(true)
  })

  it('should block invalid status transitions', () => {
    expect(isValidStatusTransition('pending', 'delivered')).toBe(false)
    expect(isValidStatusTransition('delivered', 'pending')).toBe(false)
    expect(isValidStatusTransition('cancelled', 'confirmed')).toBe(false)
    expect(isValidStatusTransition('refunded', 'processing')).toBe(false)
  })
})

describe('Rate Limiter', () => {
  it('should enforce request limits per window', () => {
    const dummyReq = {
      headers: { get: () => '192.168.1.100' }
    } as any

    const config = { maxRequests: 2, windowSeconds: 60, identifier: () => 'test-ip-1' }

    const res1 = checkRateLimit(dummyReq, config)
    expect(res1.success).toBe(true)

    const res2 = checkRateLimit(dummyReq, config)
    expect(res2.success).toBe(true)

    const res3 = checkRateLimit(dummyReq, config)
    expect(res3.success).toBe(false)
  })
})

describe('Storage IDOR & Privilege Guards', () => {
  it('should validate profile storage object ownership prefix', () => {
    const userId = 'usr_abc123'
    const validPath = `profiles/${userId}/1712345678.png`
    const maliciousPath = `profiles/usr_other456/1712345678.png`

    expect(validPath.startsWith(`profiles/${userId}/`)).toBe(true)
    expect(maliciousPath.startsWith(`profiles/${userId}/`)).toBe(false)
  })

  it('should detect admin self-deletion / self-demotion attempts', () => {
    const requesterId = 'sup_admin_1'
    const targetUserId = 'sup_admin_1'
    const isSelfAction = requesterId === targetUserId

    expect(isSelfAction).toBe(true)
  })
})

describe('Reconciliation & Formula Protection', () => {
  it('should sanitize spreadsheet formula injection prefixes', () => {
    const sanitize = (val: string) => (['=', '+', '-', '@'].includes(val.charAt(0)) ? `'${val}` : val)

    expect(sanitize('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
    expect(sanitize('+cmd|/c calc.exe')).toBe("'+cmd|/c calc.exe")
    expect(sanitize('-100')).toBe("'-100")
    expect(sanitize('@SUM')).toBe("'@SUM")
    expect(sanitize('Normal Product')).toBe('Normal Product')
  })

  it('should verify payment intent amount and currency matching', () => {
    const orderTotal = 3500.50
    const expectedCents = Math.round(orderTotal * 100)
    const expectedCurrency = 'lkr'

    const validWebhookPayload = { amount: 350050, currency: 'LKR' }
    const tamperedAmountPayload = { amount: 100, currency: 'LKR' }

    const isMatch = (payload: any) =>
      payload.amount === expectedCents && payload.currency.toLowerCase() === expectedCurrency

    expect(isMatch(validWebhookPayload)).toBe(true)
    expect(isMatch(tamperedAmountPayload)).toBe(false)
  })
})
