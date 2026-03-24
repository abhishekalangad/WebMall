'use client'

import React from 'react'
import { Truck, Package, Clock, ShieldCheck, MapPin } from 'lucide-react'

export default function ShippingInfoPage() {
    const deliveryTime = '3-5 Working Days'
    const shippingFee = 'LKR 500'

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-card border-b border-border px-8 py-12 text-center">
                    <Truck className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <h1 className="text-4xl font-playfair font-bold text-foreground mb-2">Shipping Information</h1>
                    <p className="text-muted-foreground">Reliable delivery across Sri Lanka</p>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 prose prose-blue max-w-none text-muted-foreground">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div className="flex items-start space-x-4 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-500 mt-1" />
                            <div>
                                <h3 className="font-bold text-foreground">Delivery Time</h3>
                                <p className="text-sm font-medium">{deliveryTime} islandwide.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4 p-6 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                            <Package className="w-8 h-8 text-pink-600 dark:text-pink-500 mt-1" />
                            <div>
                                <h3 className="font-bold text-foreground">Shipping Fee</h3>
                                <p className="text-sm font-medium">Flat rate of {shippingFee}.</p>
                            </div>
                        </div>
                    </div>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center">
                            <MapPin className="w-6 h-6 mr-2 text-blue-500" />
                            Islandwide Delivery
                        </h2>
                        <p className="mb-4">
                            We deliver to all major cities and rural areas across Sri Lanka. Our delivery partners are
                            reputable courier services that ensure your package arrives safely and on time.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center">
                            <ShieldCheck className="w-6 h-6 mr-2 text-blue-500" />
                            Packaging & Handling
                        </h2>
                        <p className="mb-4">
                            All jewelry and accessories are carefully inspected and wrapped in protective packaging
                            to prevent damage during transit. Luxury items come with their respective brand boxes.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-foreground mb-4">Tracking Your Order</h2>
                        <p>
                            Once your order has been dispatched, you will receive an email and SMS with your tracking
                            number. You can track your order status directly on our courier partner's portal.
                        </p>
                    </section>

                    <div className="p-8 bg-muted border-border rounded-2xl text-center border overflow-hidden">
                        <h3 className="font-bold text-foreground mb-2">Notice for Festive Seasons</h3>
                        <p className="text-sm">
                            During peak holiday seasons (Avurudu, Christmas, etc.), delivery might take slightly longer
                            due to courier backlogs. We appreciate your patience.
                        </p>
                    </div>

                    <div className="border-t border-border pt-8 mt-12 text-center text-muted-foreground text-sm">
                        For shipping support, contact us at
                        <a href="mailto:webmalll.ik@gmail.com" className="text-blue-600 dark:text-blue-500 font-bold ml-1">webmalll.ik@gmail.com</a>
                    </div>
                </div>
            </div>
        </div>
    )
}
