'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function VerificationOverlay() {
    const [isOpen, setIsOpen] = useState(false)
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
    const [message, setMessage] = useState('Verifying your email...')
    const searchParams = useSearchParams()
    const router = useRouter()
    const { refreshUser } = useAuth()

    useEffect(() => {
        // Check for 'code' which indicates a PKCE flow return from Supabase
        const code = searchParams.get('code')
        const type = searchParams.get('type') // 'signup' or 'recovery'
        const error = searchParams.get('error_description')

        if (error) {
            setIsOpen(true)
            setStatus('error')
            setMessage(decodeURIComponent(error))
            return
        }

        if (code) {
            setIsOpen(true)
            handleVerification(code)
        }
    }, [searchParams])

    const handleVerification = async (code: string) => {
        try {
            // Supabase Auth Listener usually handles the exchange automatically if configured correctly,
            // but explicit exchange ensures we catch it.
            // However, usually we just wait for the session to become active.

            // We will perform a manual exchange if needed, or just wait for the AuthContext to pick it up.
            // Since Next.js Auth Builders handle this in route handlers usually, but we are client-side here.

            const { data, error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) throw error

            setStatus('success')
            setMessage('Email verified successfully! You are now logged in.')
            await refreshUser()

            // Close after 3 seconds
            setTimeout(() => {
                setIsOpen(false)
                // Clean URL
                router.replace('/')
            }, 3000)

        } catch (error: any) {
            console.error('Verification error:', error)
            setStatus('error')
            setMessage(error.message || 'Failed to verify email.')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-xl border-pink-100 shadow-2xl">
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">

                    {status === 'verifying' && (
                        <>
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 bg-white rounded-full"></div>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 animate-pulse">Verifying...</h2>
                            <p className="text-gray-500">Please wait while we confirm your email.</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-300">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
                            <p className="text-gray-600">{message}</p>
                            <div className="w-full bg-gray-100 rounded-full h-1 mt-4">
                                <div className="bg-green-500 h-1 rounded-full animate-[width_3s_ease-in-out_forwards]" style={{ width: '100%' }}></div>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-2">
                                <XCircle className="w-10 h-10 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
                            <p className="text-red-500">{message}</p>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="mt-4 text-sm text-gray-500 hover:text-gray-900 underline"
                            >
                                Close
                            </button>
                        </>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    )
}
