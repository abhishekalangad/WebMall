import type { Metadata } from 'next'
import { CreditCard, ShieldCheck, Lock, Smartphone } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Payment Methods | WebMall',
    description: 'Learn about our secure payment options and processing.',
}

export default function PaymentPage() {
    const paymentMethods = [
        {
            icon: CreditCard,
            title: 'Credit & Debit Cards',
            description: 'We accept Visa, Mastercard, American Express, and Discover.',
            features: ['Instant processing', '3D Secure authentication', 'No extra fees']
        },
        {
            icon: Smartphone,
            title: 'Digital Wallets',
            description: 'Pay quickly with your preferred digital wallet.',
            features: ['Apple Pay', 'Google Pay', 'One-click checkout']
        },
        {
            icon: ShieldCheck,
            title: 'Bank Transfer',
            description: 'Direct bank transfers for larger orders.',
            features: ['Secure processing', '2-3 business days', 'Email confirmation']
        },
        {
            icon: Lock,
            title: 'Cash on Delivery',
            description: 'Pay when you receive your order (Sri Lanka only).',
            features: ['No prepayment needed', 'Inspect before paying', 'LKR only']
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 md:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-4">
                        Payment Methods
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        We offer multiple secure payment options to make your shopping experience convenient and safe.
                    </p>
                </div>

                {/* Payment Methods Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
                    {paymentMethods.map((method, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 hover:shadow-xl transition-all"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-gray-100 rounded-xl">
                                    <method.icon className="h-6 w-6 md:h-8 md:w-8 text-gray-700" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{method.title}</h3>
                                    <p className="text-gray-600 text-sm md:text-base">{method.description}</p>
                                </div>
                            </div>
                            <ul className="space-y-2 ml-16">
                                {method.features.map((feature, featureIdx) => (
                                    <li key={featureIdx} className="flex items-center gap-2 text-gray-600 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Security Info */}
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-gray-100">
                    <div className="text-center mb-8">
                        <Lock className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                            Your Security is Our Priority
                        </h2>
                        <p className="text-gray-600">
                            All transactions are encrypted and processed through secure payment gateways.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                                <ShieldCheck className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">SSL Encryption</h3>
                            <p className="text-sm text-gray-600">
                                Industry-standard 256-bit SSL encryption protects your data.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                                <Lock className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">PCI Compliant</h3>
                            <p className="text-sm text-gray-600">
                                We meet all Payment Card Industry security standards.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                                <CreditCard className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Fraud Protection</h3>
                            <p className="text-sm text-gray-600">
                                Advanced fraud detection monitors all transactions 24/7.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-12 bg-gray-50 rounded-2xl p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">When will I be charged?</h3>
                            <p className="text-gray-600 text-sm">
                                Your payment method will be charged immediately upon order confirmation, except for Cash on Delivery orders.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Is my payment information stored?</h3>
                            <p className="text-gray-600 text-sm">
                                No, we do not store your full credit card information. All payment processing is handled securely by our payment partners.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">What if my payment fails?</h3>
                            <p className="text-gray-600 text-sm">
                                If your payment fails, please verify your card details and try again. Contact your bank if the problem persists. You can also try a different payment method.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
