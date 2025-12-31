import { Metadata } from 'next'
import { OrdersView } from './OrdersView'

export const metadata: Metadata = {
  title: 'My Orders',
  description: 'Track and manage your orders. View order history, status updates, and shipping details.',
}

export default function OrdersPage() {
  return <OrdersView />
}
