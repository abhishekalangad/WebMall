'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingBag,
  Heart,
  Share2,
  Star,
  Truck,
  Shield,
  RotateCcw,
  ArrowLeft,
  Plus,
  Minus,
  Check
} from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'

// Mock product data - in a real app, this would come from an API
const mockProducts = [
  {
    id: '1',
    slug: 'pearl-gold-earrings',
    name: 'Pearl & Gold Earrings',
    price: 3500,
    currency: 'LKR',
    originalPrice: 4200,
    discount: 17,
    rating: 4.8,
    reviewCount: 127,
    description: 'Elegant pearl and gold earrings crafted with premium materials. Perfect for special occasions and everyday wear. Features genuine pearls and 18k gold plating.',
    longDescription: 'These stunning pearl and gold earrings are the perfect blend of classic elegance and modern sophistication. Each piece is carefully handcrafted using genuine freshwater pearls and premium 18k gold plating. The design features a timeless aesthetic that complements any outfit, from casual daywear to formal evening attire. The earrings are lightweight and comfortable for all-day wear, making them an ideal choice for both special occasions and everyday elegance.',
    images: [
      { url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: 'Pearl earrings front view' },
      { url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: 'Pearl earrings side view' },
      { url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: 'Pearl earrings detail' },
      { url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: 'Pearl earrings packaging' }
    ],
    category: { name: 'Jewelry', slug: 'jewelry' },
    inStock: true,
    stockCount: 15,
    features: [
      'Genuine freshwater pearls',
      '18k gold plating',
      'Hypoallergenic materials',
      'Handcrafted design',
      'Gift box included'
    ],
    specifications: {
      'Material': 'Pearl, Gold',
      'Color': 'White, Gold',
      'Size': 'Medium',
      'Weight': '5g',
      'Care': 'Store in dry place, avoid chemicals'
    },
    shipping: {
      free: true,
      estimatedDays: '2-3 business days',
      returnPolicy: '30 days'
    }
  },
  {
    id: '2',
    slug: 'leather-crossbody-bag',
    name: 'Leather Crossbody Bag',
    price: 8900,
    currency: 'LKR',
    originalPrice: 12000,
    discount: 26,
    rating: 4.9,
    reviewCount: 89,
    description: 'Premium leather crossbody bag with multiple compartments. Perfect for daily use with a sophisticated design.',
    longDescription: 'This premium leather crossbody bag combines functionality with style. Made from genuine leather, it features multiple compartments for organized storage, adjustable strap, and secure closures. The timeless design ensures it never goes out of style.',
    images: [
      { url: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg', alt: 'Leather bag front view' },
      { url: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg', alt: 'Leather bag side view' },
      { url: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg', alt: 'Leather bag interior' }
    ],
    category: { name: 'Bags', slug: 'bags' },
    inStock: true,
    stockCount: 8,
    features: [
      'Genuine leather',
      'Multiple compartments',
      'Adjustable strap',
      'Secure closures',
      'Lined interior'
    ],
    specifications: {
      'Material': 'Genuine Leather',
      'Color': 'Brown',
      'Dimensions': '25cm x 18cm x 8cm',
      'Weight': '450g',
      'Care': 'Leather conditioner recommended'
    },
    shipping: {
      free: true,
      estimatedDays: '2-3 business days',
      returnPolicy: '30 days'
    }
  }
]


export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  const { user } = useAuth()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()
  const [product, setProduct] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        console.log('[Product Detail] Fetching product:', params.slug)
        const response = await fetch(`/api/products/${params.slug}`)

        if (response.ok) {
          const data = await response.json()
          console.log('[Product Detail] Product data:', data)

          // Transform API data to match expected format
          const transformedProduct = {
            id: data.id,
            slug: data.slug,
            name: data.name,
            price: data.price,
            currency: data.currency || 'LKR',
            originalPrice: null, // Can be added to API later
            discount: 0,
            rating: 4.5, // Default rating, can be added to API later
            reviewCount: 0,
            description: data.description,
            longDescription: data.description, // Use same description for now
            images: data.images && data.images.length > 0
              ? data.images.map((img: any) => ({ url: img.url, alt: img.alt || data.name }))
              : [{ url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: data.name }],
            category: data.category || { name: 'Uncategorized', slug: 'uncategorized' },
            inStock: data.status === 'active' && data.stock > 0,
            stockCount: data.stock || 0,
            features: [
              `Category: ${data.category?.name || 'General'}`,
              `Stock: ${data.stock || 0} units available`,
              'Premium quality',
              'Fast delivery',
              'Secure payment'
            ],
            specifications: {
              'Product ID': data.id,
              'Category': data.category?.name || 'General',
              'Status': data.status,
              'Stock': `${data.stock || 0} units`,
              'Currency': data.currency || 'LKR'
            },
            shipping: {
              free: data.price >= 2000,
              estimatedDays: '2-3 business days',
              returnPolicy: '30 days'
            }
          }

          setProduct(transformedProduct)
        } else {
          console.error('[Product Detail] Product not found')
          setProduct(null)
        }
      } catch (error) {
        console.error('[Product Detail] Error fetching product:', error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchProduct()
    }
  }, [params.slug])

  const handleAddToCart = () => {
    if (!user) {
      router.push('/login?redirect=/products/' + product.slug)
      return
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.images[0]?.url,
      slug: product.slug
    })
  }

  const handleWishlist = () => {
    if (!user) {
      router.push('/login?redirect=/products/' + product.slug)
      return
    }

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist({
        productId: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        image: product.images[0]?.url,
        slug: product.slug,
        category: product.category.name
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-gray-700">Products</Link>
          <span>/</span>
          <Link href={`/products?category=${product.category.slug}`} className="hover:text-gray-700">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
              <Image
                src={product.images[selectedImage]?.url}
                alt={product.images[selectedImage]?.alt || product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((image: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-pink-500' : 'border-gray-200'
                    }`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || product.name}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Stock */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                {product.category.name}
              </Badge>
              <div className="flex items-center space-x-2">
                {product.inStock ? (
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">In Stock ({product.stockCount})</span>
                  </div>
                ) : (
                  <span className="text-red-600 text-sm font-medium">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Title & Rating */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-gray-900">
                {product.currency} {product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {product.currency} {product.originalPrice.toLocaleString()}
                  </span>
                  <Badge className="bg-red-100 text-red-700">
                    {product.discount}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">{product.description}</p>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    disabled={quantity >= product.stockCount}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold py-3"
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={handleWishlist}
                  className={`px-4 ${isInWishlist(product.id) ? 'text-red-500 border-red-500' : ''}`}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="outline" className="px-4">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Shipping Info */}
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center space-x-4">
                <Truck className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    {product.shipping.free ? 'Free Shipping' : 'Shipping Available'}
                  </p>
                  <p className="text-sm text-green-600">
                    Estimated delivery: {product.shipping.estimatedDays}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['Description', 'Specifications', 'Shipping & Returns'].map((tab) => (
                <button
                  key={tab}
                  className="py-4 px-1 border-b-2 border-pink-500 text-pink-600 font-medium text-sm"
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Description</h3>
              <p className="text-gray-600 leading-relaxed mb-6">{product.longDescription}</p>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-600">{value as string}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Shipping & Returns</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start space-x-3">
                  <Truck className="h-6 w-6 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Free Shipping</h4>
                    <p className="text-sm text-gray-600">On orders over LKR 2,000</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Secure Payment</h4>
                    <p className="text-sm text-gray-600">Your payment information is safe</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RotateCcw className="h-6 w-6 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Easy Returns</h4>
                    <p className="text-sm text-gray-600">{product.shipping.returnPolicy} day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
