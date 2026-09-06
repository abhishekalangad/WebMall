'use client'

import React from 'react'
import { Instagram, ExternalLink, MessageCircle, Share2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InstagramShowcaseProps {
    instagramUrl1?: string
    instagramUrl2?: string
    whatsappNumber?: string
    whatsappMessage?: string
}

export function InstagramShowcase({ instagramUrl1, instagramUrl2, whatsappNumber, whatsappMessage }: InstagramShowcaseProps) {
    if (!instagramUrl1 && !instagramUrl2 && !whatsappNumber) return null

    interface CardItem {
        type: string
        url: string
        title: string
        desc: string
        gradient: string
        iconBg: string
        iconColor: string
        btnClass: string
        btnLabel: string
        ariaLabel: string
    }

    const rawCards: (CardItem | false | undefined | string)[] = [
        instagramUrl1 && {
            type: 'instagram',
            url: instagramUrl1,
            title: 'Main Store',
            desc: 'Shop the main collection and daily updates on Instagram.',
            gradient: 'from-pink-500 via-rose-500 to-purple-600',
            iconBg: 'from-pink-100 to-rose-100',
            iconColor: 'text-pink-600 group-hover:text-pink-700',
            btnClass: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700',
            btnLabel: 'Follow Us',
            ariaLabel: 'Follow WebMall Main Store on Instagram',
        },
        instagramUrl2 && {
            type: 'instagram2',
            url: instagramUrl2,
            title: 'Exclusive Drops',
            desc: 'Limited editions and special releases on Instagram.',
            gradient: 'from-purple-500 via-pink-500 to-rose-500',
            iconBg: 'from-purple-100 to-pink-100',
            iconColor: 'text-purple-600 group-hover:text-purple-700',
            btnClass: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
            btnLabel: 'Follow Us',
            ariaLabel: 'Follow WebMall Exclusive Drops on Instagram',
        },
        whatsappNumber && {
            type: 'whatsapp',
            url: `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage || 'Hi')}`,
            title: 'Chat on WhatsApp',
            desc: 'Message our team directly for instant support and enquiries.',
            gradient: 'from-emerald-400 via-green-500 to-teal-600',
            iconBg: 'from-emerald-100 to-green-100',
            iconColor: 'text-emerald-600 group-hover:text-emerald-700',
            btnClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
            btnLabel: 'Chat Now',
            ariaLabel: 'Chat with WebMall on WhatsApp',
        },
    ]

    const cards: CardItem[] = rawCards.filter((item): item is CardItem => Boolean(item))

    const colsClass =
        cards.length === 1 ? 'grid-cols-1 max-w-md mx-auto'
        : cards.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
        : 'grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto'

    return (
        <section className="py-20 bg-gradient-to-b from-gray-50/80 via-white to-slate-50 overflow-hidden relative border-y border-gray-100/80">
            {/* Ambient Lighting Background */}
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold tracking-wider uppercase mb-5 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                        <span>Community & Support</span>
                    </div>

                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 via-purple-600 to-emerald-500 rounded-2xl p-0.5 shadow-xl hover:scale-105 transition-transform duration-300">
                            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-gray-800">
                                <Share2 className="h-7 w-7 text-gray-800" />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-playfair font-bold text-gray-900 mb-4 tracking-tight">
                        Stay Connected
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Follow our official channels for exclusive collections, updates, or message us directly on WhatsApp for instant assistance.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className={`grid gap-8 md:gap-10 ${colsClass}`}>
                    {cards.map((card) => (
                        <div key={card.type} className="group relative transform hover:-translate-y-1.5 transition-all duration-300">
                            <div className={`absolute -inset-0.5 bg-gradient-to-r ${card.gradient} rounded-2xl blur-md opacity-25 group-hover:opacity-75 transition-opacity duration-300`}></div>
                            <div className="relative bg-white rounded-2xl p-8 shadow-md group-hover:shadow-2xl flex flex-col items-center text-center h-full border border-gray-100 group-hover:border-gray-200 transition-all">
                                <div className={`w-20 h-20 bg-gradient-to-tr ${card.iconBg} rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 shadow-sm group-hover:scale-110`}>
                                    {card.type === 'whatsapp' ? (
                                        <svg viewBox="0 0 24 24" className="h-10 w-10 fill-emerald-600 transition-colors">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.117 1.535 5.845L.057 23.571a.5.5 0 0 0 .612.612l5.726-1.478A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.93 0-3.738-.518-5.29-1.42l-.378-.222-3.918 1.011 1.011-3.918-.222-.378A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                                        </svg>
                                    ) : (
                                        <Instagram className={`h-10 w-10 ${card.iconColor} transition-colors`} />
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-950 transition-colors">{card.title}</h3>
                                <p className="text-sm text-gray-500 mb-6 group-hover:text-gray-600 transition-colors leading-relaxed">{card.desc}</p>
                                <Button className={`w-full ${card.btnClass} text-white font-semibold h-11 rounded-xl shadow-md hover:shadow-xl transition-all duration-300`} asChild>
                                    <a href={card.url} target="_blank" rel="noopener noreferrer" aria-label={card.ariaLabel} className="flex items-center justify-center">
                                        {card.btnLabel}
                                        {card.type === 'whatsapp'
                                            ? <MessageCircle className="ml-2 h-4 w-4" />
                                            : <ExternalLink className="ml-2 h-4 w-4" />
                                        }
                                    </a>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
