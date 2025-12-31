import type { Metadata } from 'next'
import ContactView from './ContactView'

export const metadata: Metadata = {
    title: 'Contact Us | WebMall',
    description: 'Get in touch with WebMall. We are here to help with your questions and concerns.',
}

export default function ContactPage() {
    return <ContactView />
}
