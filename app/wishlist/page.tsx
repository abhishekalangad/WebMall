import { Metadata } from 'next'
import { WishlistView } from './WishlistView'

export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'View and manage your favorite fashion accessories. Save items for later and keep track of pieces you love.',
}

export default function WishlistPage() {
  return <WishlistView />
}
