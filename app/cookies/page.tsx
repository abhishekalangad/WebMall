import type { Metadata } from 'next'
import { Cookie, ShieldCheck, Eye, Settings } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Cookie Policy | WebMall',
    description: 'Learn about how WebMall uses cookies and similar technologies.',
}

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <Cookie className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-4">
                        Cookie Policy
                    </h1>
                    <p className="text-lg text-gray-600">
                        Last updated: January 1, 2025
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-gray-100 prose prose-gray max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
                        <p className="text-gray-600">
                            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Settings className="h-6 w-6" />
                            How We Use Cookies
                        </h2>
                        <p className="text-gray-600 mb-4">
                            WebMall uses cookies for several purposes:
                        </p>
                        <ul className="space-y-2 text-gray-600">
                            <li><strong>Essential Cookies:</strong> Required for the website to function properly (e.g., shopping cart, login sessions)</li>
                            <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our website</li>
                            <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
                            <li><strong>Targeting Cookies:</strong> Deliver relevant advertisements and track campaign performance</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Types of Cookies We Use</h2>

                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-bold text-gray-900 mb-2">Session Cookies</h3>
                                <p className="text-gray-600 text-sm">
                                    Temporary cookies that expire when you close your browser. These help us track your movements through our website during a single browsing session.
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-bold text-gray-900 mb-2">Persistent Cookies</h3>
                                <p className="text-gray-600 text-sm">
                                    Remain on your device until they expire or you delete them. These help us remember your preferences and provide a personalized experience.
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-bold text-gray-900 mb-2">Third-Party Cookies</h3>
                                <p className="text-gray-600 text-sm">
                                    Set by third-party services we use (e.g., analytics providers, payment processors) to help us improve our services.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6" />
                            Managing Your Cookies
                        </h2>
                        <p className="text-gray-600 mb-4">
                            You can control and manage cookies in various ways:
                        </p>
                        <ul className="space-y-2 text-gray-600">
                            <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or accept cookies through settings</li>
                            <li><strong>Cookie Preferences:</strong> Use our cookie consent banner to customize your preferences</li>
                            <li><strong>Opt-Out Tools:</strong> Use third-party opt-out tools for advertising cookies</li>
                        </ul>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
                            <p className="text-sm text-gray-700">
                                <strong>Please note:</strong> If you disable cookies, some features of our website may not function properly.
                            </p>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies We Use</h2>
                        <div className="overflow-x-auto">
                            <table className="table-auto w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Cookie Name</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Purpose</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-4 py-3 text-gray-700">session_id</td>
                                        <td className="px-4 py-3 text-gray-600">Maintains your login session</td>
                                        <td className="px-4 py-3 text-gray-600">Session</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-gray-700">cart_id</td>
                                        <td className="px-4 py-3 text-gray-600">Stores your shopping cart items</td>
                                        <td className="px-4 py-3 text-gray-600">30 days</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-gray-700">preferences</td>
                                        <td className="px-4 py-3 text-gray-600">Remembers your site preferences</td>
                                        <td className="px-4 py-3 text-gray-600">1 year</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-gray-700">analytics_id</td>
                                        <td className="px-4 py-3 text-gray-600">Tracks website usage and performance</td>
                                        <td className="px-4 py-3 text-gray-600">2 years</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
                        <p className="text-gray-600">
                            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                        <p className="text-gray-600">
                            If you have any questions about our use of cookies, please contact us at:
                        </p>
                        <div className="bg-gray-50 rounded-xl p-4 mt-4">
                            <p className="text-gray-700">
                                <strong>Email:</strong> <a href="mailto:webmalll.ik@gmail.com" className="text-gray-900 hover:underline">webmalll.ik@gmail.com</a><br />
                                <strong>Phone:</strong> <a href="tel:+94778973708" className="text-gray-900 hover:underline">+94 778973708</a>
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
