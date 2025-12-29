'use client'

import React from 'react'
import { FileText, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'

export default function TermsOfServicePage() {
    const lastUpdated = 'December 27, 2025'

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gray-900 px-8 py-12 text-center">
                    <FileText className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
                    <h1 className="text-4xl font-playfair font-bold text-white mb-2">Terms of Service</h1>
                    <p className="text-gray-400">Last Updated: {lastUpdated}</p>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 prose prose-yellow max-w-none text-gray-600">
                    <p className="text-lg leading-relaxed mb-8">
                        Welcome to WebMall. By accessing and using our website, you agree to comply with and be bound by
                        the following terms and conditions.
                    </p>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <CheckCircle className="w-6 h-6 mr-2 text-yellow-500" />
                            1. Acceptance of Terms
                        </h2>
                        <p>
                            By purchasing from WebMall.lk, you confirm that you have read and agree to all terms provided.
                            These terms apply to all visitors, users and others who access or use the Service.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <AlertCircle className="w-6 h-6 mr-2 text-yellow-500" />
                            2. Product Accuracy
                        </h2>
                        <p>
                            We attempt to be as accurate as possible with product descriptions and images. However, we do
                            not warrant that product descriptions or other content is accurate, complete, reliable, current,
                            or error-free.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <HelpCircle className="w-6 h-6 mr-2 text-yellow-500" />
                            3. Pricing and Payments
                        </h2>
                        <p className="mb-4">
                            All prices are listed in LKR. We reserve the right to change prices at any time without notice.
                            Payments are processed securely. In the event of an error in pricing, we reserve the right to
                            cancel orders before shipment.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Intellectual Property</h2>
                        <p>
                            All content on this site, including images, design, and text, is the property of WebMall or its
                            content providers and is protected by copyright laws.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
                        <p>
                            WebMall shall not be liable for any special or consequential damages that result from the use
                            of, or the inability to use, the materials on this site or the performance of the products.
                        </p>
                    </section>

                    <div className="border-t pt-8 mt-12 text-center text-gray-400 text-sm">
                        For further inquiries, contact us at
                        <a href="mailto:webmalll.ik@gmail.com" className="text-yellow-600 font-bold ml-1">webmalll.ik@gmail.com</a>
                    </div>
                </div>
            </div>
        </div>
    )
}
