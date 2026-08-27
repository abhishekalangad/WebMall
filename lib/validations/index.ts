import { z } from 'zod'

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().positive('Quantity must be positive'),
})

export const shippingAddressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(8, 'Phone number is too short'),
  address: z.string().min(5, 'Address is too short'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  district: z.string().min(1, 'District is required'),
})

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(['cod', 'cash', 'card']).default('cod'),
  notes: z.string().optional().nullable(),
  couponCode: z.string().optional().nullable(),
})

export const cartItemActionSchema = z.object({
  action: z.enum(['add', 'update', 'remove']),
  productId: z.string().optional().nullable(),
  variantId: z.string().optional().nullable(),
  variantName: z.string().optional().nullable(),
  variantAttributes: z.record(z.string(), z.string()).optional().nullable(),
  quantity: z.number().int().min(0).default(1),
  itemId: z.string().optional().nullable(),
})

export const syncCartSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional().nullable(),
    variantName: z.string().optional().nullable(),
    variantAttributes: z.record(z.string(), z.string()).optional().nullable(),
    quantity: z.number().int().positive(),
  }))
})

export const couponValidateSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  cartTotal: z.number().optional()
})

export const createCouponSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive('Discount value must be positive'),
  expiryDate: z.string().optional().nullable(),
  usageLimit: z.number().int().positive().default(100),
  minimumOrder: z.number().min(0).default(0),
  status: z.enum(['active', 'inactive']).default('active'),
  usageType: z.enum(['one_per_user', 'unlimited', 'user_specific']).default('unlimited'),
  maxUsesPerUser: z.number().int().positive().default(1)
})

export const reviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable()
})

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(5, 'Message must be at least 5 characters')
})
