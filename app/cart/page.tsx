import { Metadata } from 'next'
import { CartView } from './CartView'

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review the items in your cart and proceed to checkout. Free shipping available across Sri Lanka.',
}

export default function CartPage() {
  return <CartView />
}