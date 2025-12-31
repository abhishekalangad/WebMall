import type { Metadata } from 'next'
import ContactMessagesView from './ContactMessagesView'

export const metadata: Metadata = {
    title: 'Contact Messages | Admin',
    description: 'Manage contact form submissions',
}

export default function ContactMessagesPage() {
    return <ContactMessagesView />
}
