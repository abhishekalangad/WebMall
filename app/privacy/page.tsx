import React from 'react'
import { Shield, Lock, Eye, FileText } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Our commitment to protecting your privacy at WebMall.',
}

export default function PrivacyPolicyPage() {
    const lastUpdated = 'December 27, 2025'

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gray-900 px-8 py-12 text-center">
                    <Shield className="w-16 h-16 text-pink-300 mx-auto mb-4" />
                    <h1 className="text-4xl font-playfair font-bold text-white mb-2">Privacy Policy</h1>
                    <p className="text-gray-400">Last Updated: {lastUpdated}</p>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 prose prose-pink max-w-none text-gray-600">
                    <p className="text-lg leading-relaxed mb-8">
                        At WebMall, we are committed to protecting your privacy. This Privacy Policy explains how your
                        personal information is collected, used, and shared when you visit or make a purchase from
                        WebMall.lk.
                    </p>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <Eye className="w-6 h-6 mr-2 text-pink-500" />
                            Information We Collect
                        </h2>
                        <p className="mb-4">
                            When you visit the site, we automatically collect certain information about your device, including information
                            about your web browser, IP address, time zone, and some of the cookies that are installed on your device.
                        </p>
                        <p>
                            Additionally, when you make a purchase or attempt to make a purchase through the site, we collect certain
                            information from you, including your name, billing address, shipping address, payment information,
                            email address, and phone number.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <FileText className="w-6 h-6 mr-2 text-pink-500" />
                            How We Use Your Information
                        </h2>
                        <p className="mb-4">
                            We use the Order Information that we collect generally to fulfill any orders placed through the site
                            (including processing your payment information, arranging for shipping, and providing you with invoices
                            and/or order confirmations). Additionally, we use this Order Information to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Communicate with you;</li>
                            <li>Screen our orders for potential risk or fraud; and</li>
                            <li>Provide you with information or advertising relating to our products or services.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <Lock className="w-6 h-6 mr-2 text-pink-500" />
                            Data Retention
                        </h2>
                        <p>
                            When you place an order through the site, we will maintain your Order Information for our records
                            unless and until you ask us to delete this information.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes</h2>
                        <p>
                            We may update this privacy policy from time to time in order to reflect, for example, changes to our
                            practices or for other operational, legal or regulatory reasons.
                        </p>
                    </section>

                    <div className="border-t pt-8 mt-12 text-center text-gray-400 text-sm">
                        If you have questions about our privacy practices, please contact us at
                        <a href="mailto:webmalll.ik@gmail.com" className="text-pink-600 font-bold ml-1">webmalll.ik@gmail.com</a>
                    </div>
                </div>
            </div>
        </div>
    )
}
