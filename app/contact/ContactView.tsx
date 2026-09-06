'use client'

import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Send, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext' // Import useAuth
import type { ContactFormData } from '@/types/contact'

export default function ContactView() {
    const { toast } = useToast()
    const { user } = useAuth() // Get user from auth context
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [formData, setFormData] = useState<ContactFormData>({
        name: '',
        email: '',
        subject: '',
        message: ''
    })

    const [siteSettings, setSiteSettings] = useState<any>(null)

    // Fetch site config on mount
    useEffect(() => {
        fetch('/api/site/config')
            .then(res => res.json())
            .then(data => {
                if (data?.settings) {
                    setSiteSettings(data.settings)
                }
            })
            .catch(err => console.error('Failed to fetch site config', err))
    }, [])

    // Pre-fill form if user is logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || prev.name,
                email: user.email || prev.email
            }))
        }
    }, [user])

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    userId: user?.id // Include userId if available
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message')
            }

            setIsSubmitted(true)
            setFormData({ name: '', email: '', subject: '', message: '' })

            toast({
                title: 'Message Sent!',
                description: data.message,
            })

            // Reset submitted state after 5 seconds
            setTimeout(() => setIsSubmitted(false), 5000)
        } catch (error) {
            console.error('Contact form error:', error)
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background transition-colors duration-300 py-12 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-4">
                        Get In Touch
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-card rounded-2xl shadow-xl p-6 md:p-8 border border-border">
                            <h2 className="text-2xl font-bold text-foreground mb-6">Send us a Message</h2>

                            {isSubmitted ? (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
                                        <CheckCircle className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Message Sent!</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Thank you for contacting us. We'll get back to you soon!
                                    </p>
                                    <Button
                                        onClick={() => setIsSubmitted(false)}
                                        variant="outline"
                                        className="rounded-xl border-border"
                                    >
                                        Send Another Message
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-semibold text-muted-foreground mb-2">
                                                Your Name
                                            </label>
                                            <Input
                                                id="name"
                                                name="name"
                                                type="text"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                disabled={isSubmitting}
                                                className="w-full h-12 rounded-xl border-border focus:border-foreground focus:ring-foreground bg-background"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-semibold text-muted-foreground mb-2">
                                                Your Email
                                            </label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                disabled={isSubmitting}
                                                className="w-full h-12 rounded-xl border-border focus:border-foreground focus:ring-foreground bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-semibold text-muted-foreground mb-2">
                                            Subject
                                        </label>
                                        <Input
                                            id="subject"
                                            name="subject"
                                            type="text"
                                            placeholder="How can we help you?"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                            className="w-full h-12 rounded-xl border-border focus:border-foreground focus:ring-foreground bg-background"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-semibold text-muted-foreground mb-2">
                                            Message
                                        </label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            placeholder="Tell us more about your inquiry..."
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                            rows={6}
                                            className="w-full rounded-xl border-border focus:border-foreground focus:ring-foreground bg-background"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full md:w-auto h-12 px-8 bg-foreground hover:bg-muted-foreground text-background rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Send Message
                                                <Send className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        {/* Email */}
                        {siteSettings?.contactEmail && (
                            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-muted rounded-xl">
                                        <Mail className="h-6 w-6 text-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground mb-1">Email Us</h3>
                                        <a href={`mailto:${siteSettings.contactEmail}`} className="text-muted-foreground hover:text-foreground transition-colors">
                                            {siteSettings.contactEmail}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Phone */}
                        {siteSettings?.contactPhone && (
                            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-muted rounded-xl">
                                        <Phone className="h-6 w-6 text-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground mb-1">Call Us</h3>
                                        <a href={`tel:${siteSettings.contactPhone}`} className="text-muted-foreground hover:text-foreground transition-colors">
                                            {siteSettings.contactPhone}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* WhatsApp */}
                        {(siteSettings?.whatsappNumber || siteSettings?.contactPhone) && (
                            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-green-100 dark:bg-green-950/40 rounded-xl">
                                        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-green-600">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.117 1.535 5.845L.057 23.571a.5.5 0 0 0 .612.612l5.726-1.478A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.93 0-3.738-.518-5.29-1.42l-.378-.222-3.918 1.011 1.011-3.918-.222-.378A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground mb-1">WhatsApp Us</h3>
                                        <a
                                            href={`https://wa.me/${(siteSettings?.whatsappNumber || siteSettings?.contactPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(siteSettings?.whatsappMessage || 'Hi')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-700 font-semibold transition-colors flex items-center gap-1"
                                        >
                                            Chat on WhatsApp →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Location */}
                        {siteSettings?.contactAddress && (
                            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-muted rounded-xl">
                                        <MapPin className="h-6 w-6 text-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground mb-1">Visit Us</h3>
                                        <p className="text-muted-foreground">
                                            {siteSettings.contactAddress}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Hours */}
                        <div className="bg-card rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-all">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-muted rounded-xl">
                                    <Clock className="h-6 w-6 text-foreground" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-foreground mb-1">Business Hours</h3>
                                    <p className="text-muted-foreground text-sm">
                                        Monday - Friday: 9:00 AM - 6:00 PM<br />
                                        Saturday: 10:00 AM - 4:00 PM<br />
                                        Sunday: Closed
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
