'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, CreditCard, MapPin, Package, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSiteConfig } from '@/contexts/SiteConfigContext'
import { supabase } from '@/lib/supabase'

export default function CheckoutPage() {
  const { settings } = useSiteConfig()
  const { items: cartItems, totalPrice: cartTotalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const isBuyNow = searchParams.get('buyNow') === 'true'

  const [buyNowItem, setBuyNowItem] = useState<any>(null)

  useEffect(() => {
    if (isBuyNow) {
      const saved = localStorage.getItem('buyNowItem')
      if (saved) {
        try {
          setBuyNowItem(JSON.parse(saved))
        } catch (e) {
          console.error("Failed to parse buyNowItem", e)
        }
      }
    }
  }, [isBuyNow])

  const items = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      return [buyNowItem]
    }
    return cartItems
  }, [isBuyNow, buyNowItem, cartItems])

  const totalPrice = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      return buyNowItem.price * buyNowItem.quantity
    }
    return cartTotalPrice
  }, [isBuyNow, buyNowItem, cartTotalPrice])

  // Calculate shipping cost based on settings
  const freeShippingThreshold = settings?.freeShippingThreshold || 5000
  const shippingBaseRate = settings?.shippingBaseRate || 350

  const isFreeShipping = totalPrice >= freeShippingThreshold
  const shippingCost = isFreeShipping ? 0 : shippingBaseRate

  const [loading, setLoading] = useState(false)
  const [orderComplete, setOrderComplete] = useState<any>(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    district: '',
    paymentMethod: '',
    notes: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setCouponLoading(true)
    setCouponError('')

    try {
      // Get auth token
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setCouponError('You must be logged in to use coupons')
        return
      }

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderTotal: totalPrice
        })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setAppliedCoupon(data)
        setCouponError('')
      } else {
        setCouponError(data.error || 'Invalid coupon code')
        setAppliedCoupon(null)
      }
    } catch (error) {
      setCouponError('Failed to apply coupon')
      setAppliedCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const subtotal = totalPrice
  const discount = appliedCoupon?.discountAmount || 0
  const rawFinalTotal = (appliedCoupon?.finalTotal || totalPrice) + shippingCost
  const finalTotal = Math.floor(rawFinalTotal)
  const roundOffAmount = finalTotal - rawFinalTotal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('Please log in to place an order')
      }

      // Call the orders API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity
          })),
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            district: formData.district,
            phone: formData.phone
          },
          paymentMethod: formData.paymentMethod,
          notes: formData.notes || null,
          couponCode: appliedCoupon?.coupon?.code || null,
          discountAmount: discount
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to place order')
      }

      const order = await response.json()

      // Handle post-order cleanup
      if (isBuyNow) {
        localStorage.removeItem('buyNowItem')
      } else {
        clearCart()
      }

      setOrderComplete(order) // Pass full order object
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert(error.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center bg-card border-border shadow-lg">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-playfair font-bold text-foreground mb-4">
            Order Confirmed!
          </h1>
          <p className="text-xl font-bold text-primary mb-2">
            Order #: {orderComplete.orderNumber}
          </p>
          <p className="text-muted-foreground mb-8">
            Thank you for your purchase. Your order has been received and will be processed within 1-2 business days.
          </p>
          <div className="space-y-3">
            <Link href="/products">
              <Button className="w-full bg-foreground text-background font-semibold hover:bg-muted-foreground transition-colors">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full border-border hover:bg-muted">
                Back to Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center bg-card border-border shadow-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-playfair font-bold text-foreground mb-4">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Add some beautiful accessories to your cart before checking out.
          </p>
          <Link href="/products">
            <Button className="w-full bg-foreground text-background font-semibold hover:bg-muted-foreground transition-colors px-8">
              Start Shopping
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/cart">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Button>
          </Link>
          <h1 className="text-4xl font-playfair font-bold text-foreground">
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <Card className="p-6 bg-card border-border shadow-sm">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-foreground">
                  <MapPin className="h-6 w-6" />
                  Shipping Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-muted-foreground">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      className="bg-background border-border focus:border-foreground focus:ring-foreground mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-muted-foreground">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      className="bg-background border-border focus:border-foreground focus:ring-foreground mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="bg-background border-border focus:border-foreground focus:ring-foreground mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-muted-foreground">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                      className="bg-background border-border focus:border-foreground focus:ring-foreground mt-1.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address" className="text-muted-foreground">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                      className="bg-background border-border focus:border-foreground focus:ring-foreground mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-muted-foreground">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                      className="bg-background border-border focus:border-foreground focus:ring-foreground mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode" className="text-muted-foreground">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      required
                      className="bg-background border-border focus:border-foreground focus:ring-foreground mt-1.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="district" className="text-muted-foreground">District</Label>
                    <Select value={formData.district} onValueChange={(value) => handleInputChange('district', value)}>
                      <SelectTrigger className="mt-1.5 bg-background border-border">
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="colombo">Colombo</SelectItem>
                        <SelectItem value="gampaha">Gampaha</SelectItem>
                        <SelectItem value="kalutara">Kalutara</SelectItem>
                        <SelectItem value="kandy">Kandy</SelectItem>
                        <SelectItem value="matale">Matale</SelectItem>
                        <SelectItem value="galle">Galle</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Payment Method */}
              <Card className="p-6 bg-card border-border shadow-sm">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-foreground">
                  <CreditCard className="h-6 w-6" />
                  Payment Method
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 border border-border rounded-lg bg-background hover:border-foreground transition-colors cursor-pointer">
                    <input
                      type="radio"
                      id="cash"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === 'cash'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      className="w-4 h-4 text-primary bg-background border-border focus:ring-primary focus:ring-offset-background"
                    />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer font-medium text-foreground">
                      Cash on Delivery (COD)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border border-border rounded-lg bg-background hover:border-foreground transition-colors cursor-pointer">
                    <input
                      type="radio"
                      id="card"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      className="w-4 h-4 text-primary bg-background border-border focus:ring-primary focus:ring-offset-background"
                    />
                    <Label htmlFor="card" className="flex-1 cursor-pointer font-medium text-foreground">
                      Credit/Debit Card
                    </Label>
                  </div>
                </div>
              </Card>

              {/* Order Notes */}
              <Card className="p-6 bg-card border-border shadow-sm">
                <div>
                  <Label htmlFor="notes" className="text-muted-foreground">Order Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    className="w-full mt-1.5 p-3 border border-border rounded-lg resize-none bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-foreground placeholder-muted-foreground/50 transition-all custom-scrollbar"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any special instructions for your order..."
                  />
                </div>
              </Card>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8 bg-card border-border shadow-sm">
              <h2 className="text-2xl font-semibold mb-6 text-foreground">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId || 'default'}`} className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-muted rounded-md overflow-hidden shrink-0 border border-border">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.png';
                          }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                      <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-foreground shrink-0">
                      {(item.price * item.quantity).toLocaleString('en-LK')} LKR
                    </p>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Have a coupon?
                </h3>
                {!appliedCoupon ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 bg-background border-border"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        variant="outline"
                        className="border-border hover:bg-muted"
                      >
                        {couponLoading ? 'Applying...' : 'Apply'}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-500">{couponError}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-500">{appliedCoupon.coupon.code}</p>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-400">
                          {appliedCoupon.coupon.discountType === 'percentage'
                            ? `${appliedCoupon.coupon.discountValue}% off`
                            : `LKR ${appliedCoupon.coupon.discountValue} off`}
                        </p>
                      </div>
                      <Button
                        onClick={handleRemoveCoupon}
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-500 dark:hover:text-emerald-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 mt-2 space-y-2">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="text-foreground font-medium">{subtotal.toLocaleString('en-LK')} LKR</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Shipping:</span>
                  <span className="text-foreground font-medium">{isFreeShipping ? <span className="text-emerald-500 font-bold tracking-widest uppercase">FREE</span> : `${shippingCost.toLocaleString('en-LK')} LKR`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-500">
                    <span>Discount:</span>
                    <span className="font-medium">-{discount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LKR</span>
                  </div>
                )}
                {roundOffAmount !== 0 && (
                  <div className="flex justify-between items-center text-muted-foreground text-sm">
                    <span>Round-off:</span>
                    <span>{roundOffAmount > 0 ? '+' : ''}{roundOffAmount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LKR</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
                  <span className="text-lg font-bold text-foreground uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-black text-foreground">
                    {finalTotal.toLocaleString('en-LK')} LKR
                  </span>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.paymentMethod}
                  className="w-full mt-6 bg-foreground text-background hover:bg-muted-foreground transition-colors font-semibold py-6 text-lg"
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
