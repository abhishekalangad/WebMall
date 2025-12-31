import type { Metadata } from 'next'
import Link from 'next/link'
import { Package, RefreshCcw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Returns & Exchanges | WebMall',
    description: 'Learn about our hassle-free return and exchange policy.',
}

export default function ReturnsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-4">
                        Returns & Exchanges
                    </h1>
                    <p className="text-lg text-gray-600">
                        We want you to love your purchase. If you're not completely satisfied, we're here to help.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
                        <Clock className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                        <div className="font-bold text-2xl text-gray-900 mb-1">30 Days</div>
                        <div className="text-sm text-gray-600">Return Window</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
                        <RefreshCcw className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                        <div className="font-bold text-2xl text-gray-900 mb-1">Free</div>
                        <div className="text-sm text-gray-600">Exchange Shipping</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
                        <Package className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                        <div className="font-bold text-2xl text-gray-900 mb-1">Easy</div>
                        <div className="text-sm text-gray-600">Return Process</div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-gray-100 space-y-8">
                    {/* Return Policy */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            Return Policy
                        </h2>
                        <div className="prose prose-gray max-w-none text-gray-600 space-y-4">
                            <p>
                                We offer a <strong>30-day return policy</strong> for most items. If you're not satisfied with your purchase, you can return it within 30 days of delivery for a full refund.
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Items must be unused and in original condition with all tags attached</li>
                                <li>Original packaging must be included</li>
                                <li>Proof of purchase (receipt or order confirmation) required</li>
                                <li>Refunds will be processed to the original payment method within 5-7 business days</li>
                            </ul>
                        </div>
                    </section>

                    {/* Exchange Process */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <RefreshCcw className="h-6 w-6 text-blue-600" />
                            How to Exchange an Item
                        </h2>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">1</div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Contact Us</h3>
                                    <p className="text-gray-600">Email us at <a href="mailto:webmalll.ik@gmail.com" className=" text-gray-900 hover:underline">webmalll.ik@gmail.com</a> with your order number and exchange request.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">2</div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Pack Your Item</h3>
                                    <p className="text-gray-600">Securely package the item with all original tags and packaging.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">3</div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Ship It Back</h3>
                                    <p className="text-gray-600">Use the prepaid shipping label we'll email you. Exchanges ship free!</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">4</div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Receive Your Exchange</h3>
                                    <p className="text-gray-600">We'll ship your replacement item within 2-3 business days of receiving your return.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Non-Returnable Items */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <XCircle className="h-6 w-6 text-red-600" />
                            Non-Returnable Items
                        </h2>
                        <div className="text-gray-600 space-y-2">
                            <p>The following items cannot be returned or exchanged:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Personalized or custom-made items</li>
                                <li>Items on final sale (marked as "Final Sale")</li>
                                <li>Gift cards</li>
                                <li>Downloadable products or digital items</li>
                            </ul>
                        </div>
                    </section>

                    {/* Damaged or Defective */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-yellow-600" />
                            Damaged or Defective Items
                        </h2>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                            <p className="text-gray-700">
                                If you receive a damaged or defective item, please contact us immediately at{' '}
                                <a href="mailto:webmalll.ik@gmail.com" className="font-semibold text-gray-900 hover:underline">
                                    webmalll.ik@gmail.com
                                </a>{' '}
                                with photos of the damage. We'll arrange a free replacement or full refund right away.
                            </p>
                        </div>
                    </section>

                    {/* CTA */}
                    <div className="bg-gray-50 rounded-xl p-6 md:p-8 text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Need Help With a Return?</h3>
                        <p className="text-gray-600 mb-6">Our customer service team is here to assist you.</p>
                        <Link
                            href="/contact"
                            className="inline-block bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                        >
                            Contact Support
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
