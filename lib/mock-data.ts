// Mock data for testing admin features
export interface MockProduct {
  id: string
  name: string
  slug: string
  description: string
  price: number
  currency: string
  categoryId: string
  status: 'active' | 'inactive'
  stock: number
  createdAt: string
  updatedAt: string
  category: { id: string; name: string }
  images: Array<{ url: string; alt?: string; position: number }>
  variants: Array<{ id: string; sku: string; name: string; stock: number }>
}

export interface MockCategory {
  id: string; name: string; slug: string; description?: string; image?: string; createdAt: string;
}

export interface MockOrder {
  id: string
  user: { id: string; name?: string; email: string; phone?: string }
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  paymentMethod: string
  shippingAddress: any
  notes?: string
  createdAt: string
  updatedAt: string
  items: Array<{ id: string; product: { id: string; name: string }; quantity: number; price: number; total: number }>
}

export interface MockSiteSettings {
  id: string
  storeName: string
  tagline?: string
  description?: string
  logoUrl?: string
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  shippingBaseRate: number
  freeShippingThreshold: number
  updatedAt: string
}

export interface MockCoupon {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  expiryDate: string
  usageLimit: number
  timesUsed: number
  minimumOrder: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

let mockSiteSettings: MockSiteSettings = {
  id: 'default',
  storeName: 'WebMall',
  tagline: 'Sri Lankan Fashion Accessories',
  description: 'Your premier destination for Sri Lankan fashion accessories.',
  logoUrl: '',
  contactEmail: 'webmalll.lk@gmail.com',
  contactPhone: '+94 778973708',
  contactAddress: 'Colombo, Sri Lanka',
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  shippingBaseRate: 500,
  freeShippingThreshold: 10000,
  updatedAt: new Date().toISOString()
}

let mockCategories: MockCategory[] = [
  {
    id: '1',
    name: 'Jewelry',
    slug: 'jewelry',
    description: 'Beautiful jewelry pieces',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Bags',
    slug: 'bags',
    description: 'Stylish bags and purses',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Fashion accessories',
    createdAt: new Date().toISOString()
  }
]

let mockProducts: MockProduct[] = [
  {
    id: '1',
    name: 'Gold Necklace',
    slug: 'gold-necklace',
    description: 'Elegant gold necklace with intricate design',
    price: 25000,
    currency: 'LKR',
    categoryId: '1',
    status: 'active',
    stock: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: '1', name: 'Jewelry' },
    images: [{ url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', alt: 'Gold necklace', position: 0 }],
    variants: []
  },
  {
    id: '2',
    name: 'Leather Handbag',
    slug: 'leather-handbag',
    description: 'Premium quality leather handbag',
    price: 18000,
    currency: 'LKR',
    categoryId: '2',
    status: 'active',
    stock: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: '2', name: 'Bags' },
    images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', alt: 'Leather handbag', position: 0 }],
    variants: []
  }
]

let mockOrders: MockOrder[] = [
  {
    id: '1',
    user: { id: '2', name: 'John Doe', email: 'john@example.com', phone: '+94123456789' },
    orderNumber: 'ORD-20231201-001',
    status: 'pending',
    totalAmount: 25000,
    currency: 'LKR',
    paymentMethod: 'cod',
    shippingAddress: { address: '123 Main St', city: 'Colombo', postalCode: '01000', country: 'Sri Lanka' },
    notes: 'Handle with care',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: '1', product: { id: '1', name: 'Gold Necklace' }, quantity: 1, price: 25000, total: 25000 }
    ]
  },
  {
    id: '2',
    user: { id: '3', name: 'Jane Smith', email: 'jane@example.com' },
    orderNumber: 'ORD-20231202-001',
    status: 'shipped',
    totalAmount: 18000,
    currency: 'LKR',
    paymentMethod: 'cod',
    shippingAddress: { address: '456 Oak Ave', city: 'Kandy', postalCode: '02000', country: 'Sri Lanka' },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { id: '2', product: { id: '2', name: 'Leather Handbag' }, quantity: 1, price: 18000, total: 18000 }
    ]
  }
]

export function getMockCategories(): MockCategory[] {
  return mockCategories
}

export function getMockProducts(): MockProduct[] {
  return mockProducts
}

export function getMockOrders(): MockOrder[] {
  return mockOrders
}

export function addMockCategory(category: Omit<MockCategory, 'id' | 'createdAt'>): MockCategory {
  const newCategory: MockCategory = {
    ...category,
    id: String(mockCategories.length + 1),
    createdAt: new Date().toISOString()
  }
  mockCategories.push(newCategory)
  return newCategory
}

export function updateMockCategory(id: string, updates: Partial<MockCategory>): MockCategory | null {
  const index = mockCategories.findIndex(c => c.id === id)
  if (index === -1) return null

  mockCategories[index] = { ...mockCategories[index], ...updates }
  return mockCategories[index]
}

export function deleteMockCategory(id: string): boolean {
  const index = mockCategories.findIndex(c => c.id === id)
  if (index === -1) return false

  mockCategories.splice(index, 1)
  return true
}

export function addMockProduct(product: Omit<MockProduct, 'id' | 'createdAt' | 'updatedAt'>): MockProduct {
  const newProduct: MockProduct = {
    ...product,
    id: String(mockProducts.length + 1),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  mockProducts.push(newProduct)
  return newProduct
}

export function updateMockProduct(id: string, updates: Partial<MockProduct>): MockProduct | null {
  const index = mockProducts.findIndex(p => p.id === id)
  if (index === -1) return null

  mockProducts[index] = {
    ...mockProducts[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  return mockProducts[index]
}

export function deleteMockProduct(id: string): boolean {
  const index = mockProducts.findIndex(p => p.id === id)
  if (index === -1) return false

  mockProducts.splice(index, 1)
  return true
}

export function updateMockOrderStatus(id: string, status: string): MockOrder | null {
  const index = mockOrders.findIndex(o => o.id === id)
  if (index === -1) return null

  mockOrders[index] = {
    ...mockOrders[index],
    status,
    updatedAt: new Date().toISOString()
  }
  return mockOrders[index]
}

export function getMockSiteSettings(): MockSiteSettings {
  console.log('[MockData] Getting site settings:', {
    contactEmail: mockSiteSettings.contactEmail,
    contactPhone: mockSiteSettings.contactPhone,
    contactAddress: mockSiteSettings.contactAddress
  })
  return mockSiteSettings
}

export function updateMockSiteSettings(updates: Partial<MockSiteSettings>): MockSiteSettings {
  console.log('[MockData] Updating site settings with:', {
    contactEmail: updates.contactEmail,
    contactPhone: updates.contactPhone,
    contactAddress: updates.contactAddress
  })
  mockSiteSettings = {
    ...mockSiteSettings,
    ...updates,
    updatedAt: new Date().toISOString()
  }
  console.log('[MockData] Site settings after update:', {
    contactEmail: mockSiteSettings.contactEmail,
    contactPhone: mockSiteSettings.contactPhone,
    contactAddress: mockSiteSettings.contactAddress
  })
  return mockSiteSettings
}

// Mock Coupons
let mockCoupons: MockCoupon[] = [
  {
    id: '1',
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    usageLimit: 100,
    timesUsed: 15,
    minimumOrder: 1000,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    code: 'SAVE500',
    discountType: 'fixed',
    discountValue: 500,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    usageLimit: 50,
    timesUsed: 8,
    minimumOrder: 5000,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    code: 'EXPIRED20',
    discountType: 'percentage',
    discountValue: 20,
    expiryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago (expired)
    usageLimit: 10,
    timesUsed: 10,
    minimumOrder: 2000,
    status: 'inactive',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export function getMockCoupons(): MockCoupon[] {
  return mockCoupons
}

export function getMockCouponByCode(code: string): MockCoupon | null {
  return mockCoupons.find(c => c.code.toUpperCase() === code.toUpperCase()) || null
}

export function addMockCoupon(coupon: Omit<MockCoupon, 'id' | 'createdAt' | 'updatedAt' | 'timesUsed'>): MockCoupon {
  const newCoupon: MockCoupon = {
    ...coupon,
    id: String(mockCoupons.length + 1),
    timesUsed: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  mockCoupons.push(newCoupon)
  return newCoupon
}

export function updateMockCoupon(id: string, updates: Partial<MockCoupon>): MockCoupon | null {
  const index = mockCoupons.findIndex(c => c.id === id)
  if (index === -1) return null

  mockCoupons[index] = {
    ...mockCoupons[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  return mockCoupons[index]
}

export function deleteMockCoupon(id: string): boolean {
  const index = mockCoupons.findIndex(c => c.id === id)
  if (index === -1) return false

  mockCoupons.splice(index, 1)
  return true
}

export function incrementCouponUsage(id: string): MockCoupon | null {
  const index = mockCoupons.findIndex(c => c.id === id)
  if (index === -1) return null

  mockCoupons[index].timesUsed += 1
  mockCoupons[index].updatedAt = new Date().toISOString()
  return mockCoupons[index]
}
