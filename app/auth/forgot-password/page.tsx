'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { resetPasswordForEmail } from '@/lib/auth'
import { ArrowLeft, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // The redirect URL should be absolute. 
            // We will assume the site is running on the origin.
            const redirectUrl = `${window.location.origin}/auth/reset-password`

            await resetPasswordForEmail(email, redirectUrl)
            setSubmitted(true)
            toast({
                title: "Reset link sent",
                description: "Check your email for the password reset link.",
            })
        } catch (error: any) {
            setError(error.message || 'Failed to send reset email')
            toast({
                title: "Error",
                description: error.message || "Failed to send reset email",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 flex items-center justify-center px-4">
            <Card className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-8 w-8 text-pink-500" />
                    </div>
                    <h1 className="text-2xl font-bold font-playfair text-gray-900 mb-2">
                        Forgot Password?
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {submitted ? (
                    <div className="text-center space-y-6">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                            <p className="font-semibold mb-1">Check your inbox!</p>
                            <p>We have sent a password reset link to <span className="font-bold">{email}</span></p>
                        </div>
                        <p className="text-xs text-gray-500">
                            Did not receive the email? Check your spam folder or try again.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setSubmitted(false)}
                            className="w-full"
                        >
                            Try different email
                        </Button>
                        <div className="mt-4">
                            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back to Login
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1"
                                placeholder="Enter your registered email"
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold" disabled={loading}>
                            {loading ? 'Sending Link...' : 'Send Reset Link'}
                        </Button>

                        <div className="text-center">
                            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </Card>
        </div>
    )
}
