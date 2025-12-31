import type { Metadata } from 'next'
import { HelpCircle, Search, Package, CreditCard, RefreshCcw, Truck, Phone, Mail } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'FAQ & Help Center | WebMall',
    description: 'Find answers to frequently asked questions about WebMall.',
}

export default function FAQPage() {
    const categories = [
        {
            title: 'Orders & Shipping',
            icon: Package,
            faqs: [
                {
                    question: 'How can I track my order?',
                    answer: 'You can track your order by logging into your account and viewing the "My Orders" page. You\'ll receive a tracking number via email once your order ships.'
                },
                {
                    question: 'What are the shipping costs?',
                    answer: 'Shipping costs vary based on your location and order size. We offer free shipping on orders over LKR 5,000 within Sri Lanka.'
                },
                {
                    question: 'How long does delivery take?',
                    answer: 'Delivery typically takes 3-5 business days within Colombo and 5-7 business days for other areas in Sri Lanka.'
                }
            ]
        },
        {
            title: 'Returns & Exchanges',
            icon: RefreshCcw,
            faqs: [
                {
                    question: 'What is your return policy?',
                    answer: 'We offer a 30-day return policy for most items. Items must be unused, in original condition, and with all tags attached.'
                },
                {
                    question: 'How do I initiate a return?',
                    answer: 'Contact our customer service team at webmalll.ik@gmail.com with your order number. We\'ll provide you with return instructions and a prepaid shipping label.'
                },
                {
                    question: 'How long do refunds take?',
                    answer: 'Refunds are processed within 5-7 business days after we receive your returned item. The refund will go back to your original payment method.'
                }
            ]
        },
        {
            title: 'Payment & Security',
            icon: CreditCard,
            faqs: [
                {
                    question: 'What payment methods do you accept?',
                    answer: 'We accept Visa, Mastercard, American Express, digital wallets (Apple Pay, Google Pay), bank transfers, and Cash on Delivery for Sri Lankan customers.'
                },
                {
                    question: 'Is my payment information secure?',
                    answer: 'Yes! All transactions are encrypted with 256-bit SSL encryption. We are PCI compliant and do not store your full credit card information.'
                },
                {
                    question: 'Can I change my payment method after ordering?',
                    answer: 'Unfortunately, payment methods cannot be changed after an order is placed. If you need to use a different payment method, please cancel your order and place a new one.'
                }
            ]
        },
        {
            title: 'Account & Profile',
            icon: HelpCircle,
            faqs: [
                {
                    question: 'How do I create an account?',
                    answer: 'Click "Sign In" in the top right corner, then select "Create Account". Fill in your details and you\'re ready to shop!'
                },
                {
                    question: 'I forgot my password. What should I do?',
                    answer: 'Click "Sign In" and then "Forgot Password". Enter your email address and we\'ll send you a password reset link.'
                },
                {
                    question: 'How do I update my account information?',
                    answer: 'Log into your account and go to "My Profile". You can update your name, email, phone number, and address there.'
                }
            ]
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 md:py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-4">
                        Help Center
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                        Find answers to commonly asked questions. Can't find what you're looking for? Contact our support team.
                    </p>

                    {/* Search Box */}
                    <div className="max-w-2xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search for help..."
                                className="w-full px-12 py-4 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* FAQ Categories */}
                <div className="space-y-12">
                    {categories.map((category, catIdx) => (
                        <div key={catIdx}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gray-900 rounded-lg">
                                    <category.icon className="h-6 w-6 text-white" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{category.title}</h2>
                            </div>

                            <div className="space-y-4">
                                {category.faqs.map((faq, faqIdx) => (
                                    <details
                                        key={faqIdx}
                                        className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-lg transition-all"
                                    >
                                        <summary className="px-6 py-4 font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                                            <span className="flex-1">{faq.question}</span>
                                            <svg
                                                className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </summary>
                                        <div className="px-6 pb-4 pt-2 text-gray-600 border-t border-gray-100">
                                            {faq.answer}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="mt-16 bg-gray-900 rounded-2xl p-8 md:p-12 text-center text-white">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Still Need Help?</h2>
                    <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                        Our customer support team is here to assist you. Reach out and we'll get back to you as soon as possible.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg"
                        >
                            <Mail className="h-5 w-5" />
                            Email Us
                        </Link>
                        <a
                            href="tel:+94778973708"
                            className="inline-flex items-center justify-center gap-2 bg-gray-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-700 transition-all border border-gray-700"
                        >
                            <Phone className="h-5 w-5" />
                            Call Us
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
