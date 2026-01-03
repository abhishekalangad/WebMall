'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Lock, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [verifying, setVerifying] = useState(true)
    const [sessionValid, setSessionValid] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    useEffect(() => {
        const checkSession = async () => {
            // Check params first
            const hasCode = window.location.search.includes('code=') || window.location.hash.includes('access_token=')
            const hasError = window.location.search.includes('error=')

            if (hasError) {
                setSessionValid(false)
                setVerifying(false)
                return
            }

            // Check if we have an active session
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setSessionValid(true)
                setVerifying(false)
                return
            }

            // If no code and no session, it's definitely invalid
            if (!hasCode) {
                setSessionValid(false)
                setVerifying(false)
                return
            }

            // If not, listen for the event that might fire as the hash is parsed
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'PASSWORD_RECOVERY' || session) {
                    setSessionValid(true)
                    setVerifying(false)
                }
            })

            // Note: If no session is found within 2s, we assume failure (invalid link)
            const timeout = setTimeout(() => {
                setVerifying(false)
                // sessionValid defaults to false
            }, 3000)

            return () => {
                subscription.unsubscribe()
                clearTimeout(timeout)
            }
        }

        checkSession()
    }, [])

    if (verifying) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-pink-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!sessionValid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 flex items-center justify-center px-4">
                <Card className="w-full max-w-md p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold font-playfair text-gray-900 mb-2">
                        Invalid Link
                    </h1>
                    <p className="text-gray-600 mb-6">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Link href="/auth/forgot-password">
                        <Button className="w-full bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold">
                            Request New Link
                        </Button>
                    </Link>
                </Card>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Final check
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            setError("Session expired. Please click the link again.")
            setSessionValid(false)
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setSuccess(true)
            toast({
                title: "Password Updated",
                description: "Your password has been successfully reset.",
            })

            // Redirect after a delay
            setTimeout(() => {
                router.push('/login?message=Password+reset+successful')
            }, 2000)

        } catch (error: any) {
            setError(error.message || 'Failed to update password')
            toast({
                title: "Error",
                description: error.message || "Failed to update password",
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
                        <Lock className="h-8 w-8 text-pink-500" />
                    </div>
                    <h1 className="text-2xl font-bold font-playfair text-gray-900 mb-2">
                        Reset Password
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Please enter your new password below.
                    </p>
                </div>

                {success ? (
                    <div className="text-center space-y-6">
                        <div className="p-6 bg-green-50 border border-green-200 rounded-xl flex flex-col items-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                            <h3 className="text-lg font-bold text-green-800">Password Changed!</h3>
                            <p className="text-sm text-green-600">Redirecting you to login...</p>
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
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1"
                                placeholder="Enter new password"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1"
                                placeholder="Confirm new password"
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold" disabled={loading}>
                            {loading ? 'Updating...' : 'Set New Password'}
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    )
}
