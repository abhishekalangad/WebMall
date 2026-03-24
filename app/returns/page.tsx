import type { Metadata } from 'next'
import Link from 'next/link'
import { Package, RefreshCcw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Returns & Exchanges | WebMall',
    description: 'Learn about our hassle-free return and exchange policy.',
}

export default function ReturnsPage() {
    return (
        <div className="min-h-screen bg-background py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-4">
                        Returns & Exchanges
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        We want you to love your purchase. If you're not completely satisfied, we're here to help.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
                    <div className="bg-card rounded-xl shadow-sm p-6 border border-border text-center">
                        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <div className="font-bold text-2xl text-foreground mb-1">30 Days</div>
                        <div className="text-sm text-muted-foreground">Return Window</div>
                    </div>
                    <div className="bg-card rounded-xl shadow-sm p-6 border border-border text-center">
                        <RefreshCcw className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <div className="font-bold text-2xl text-foreground mb-1">Free</div>
                        <div className="text-sm text-muted-foreground">Exchange Shipping</div>
                    </div>
                    <div className="bg-card rounded-xl shadow-sm p-6 border border-border text-center">
                        <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <div className="font-bold text-2xl text-foreground mb-1">Easy</div>
                        <div className="text-sm text-muted-foreground">Return Process</div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-card rounded-2xl shadow-sm p-6 md:p-10 border border-border space-y-8">
                    {/* Return Policy */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <CheckCircle className="h-6 w-6 text-emerald-500" />
                            Return Policy
                        </h2>
                        <div className="prose prose-gray max-w-none text-muted-foreground space-y-4">
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
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <RefreshCcw className="h-6 w-6 text-blue-500" />
                            How to Exchange an Item
                        </h2>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center font-bold border border-border">1</div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Contact Us</h3>
                                    <p className="text-muted-foreground">Email us at <a href="mailto:webmalll.ik@gmail.com" className="text-foreground hover:underline">webmalll.ik@gmail.com</a> with your order number and exchange request.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center font-bold border border-border">2</div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Pack Your Item</h3>
                                    <p className="text-muted-foreground">Securely package the item with all original tags and packaging.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center font-bold border border-border">3</div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Ship It Back</h3>
                                    <p className="text-muted-foreground">Use the prepaid shipping label we'll email you. Exchanges ship free!</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center font-bold border border-border">4</div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Receive Your Exchange</h3>
                                    <p className="text-muted-foreground">We'll ship your replacement item within 2-3 business days of receiving your return.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Non-Returnable Items */}
                    <section>
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <XCircle className="h-6 w-6 text-red-500" />
                            Non-Returnable Items
                        </h2>
                        <div className="text-muted-foreground space-y-2">
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
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-yellow-500" />
                            Damaged or Defective Items
                        </h2>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                            <p className="text-muted-foreground">
                                If you receive a damaged or defective item, please contact us immediately at{' '}
                                <a href="mailto:webmalll.ik@gmail.com" className="font-semibold text-foreground hover:underline">
                                    webmalll.ik@gmail.com
                                </a>{' '}
                                with photos of the damage. We'll arrange a free replacement or full refund right away.
                            </p>
                        </div>
                    </section>

                    {/* CTA */}
                    <div className="bg-muted border border-border rounded-xl p-6 md:p-8 text-center">
                        <h3 className="text-xl font-bold text-foreground mb-3">Need Help With a Return?</h3>
                        <p className="text-muted-foreground mb-6">Our customer service team is here to assist you.</p>
                        <Link
                            href="/contact"
                            className="inline-block bg-foreground text-background px-8 py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md hover:bg-muted-foreground"
                        >
                            Contact Support
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
