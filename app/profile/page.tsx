import { Metadata } from 'next'
import { ProfileView } from './ProfileView'

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Manage your WebMall account, view orders, update your addresses, and track your loyalty points.',
}

export default function ProfilePage() {
  return <ProfileView />
}
