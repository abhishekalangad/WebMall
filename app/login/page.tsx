'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { signIn } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, User } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setSuccessMessage(message)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      await signIn(email, password)
      await refreshUser()
      
      // Redirect after successful login
      window.location.href = email.includes('admin') ? '/admin' : '/products'
    } catch (error: any) {
      setError(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-playfair text-gray-900 mb-2">
            WebMall Login
          </h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✅ {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              placeholder="Enter your password"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold" disabled={loading}>
            {loading ? 'Please wait...' : 'Sign In'}
          </Button>
        </form>

        {/* Demo Access Buttons */}
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-500 text-center mb-4">Quick Demo Access:</p>
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={() => {
                setEmail('admin@webmall.lk')
                setPassword('password123')
              }}
            >
              <Shield className="h-4 w-4" />
              Admin Access
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={() => {
                setEmail('customer@webmall.lk')
                setPassword('password123')
              }}
            >
              <User className="h-4 w-4" />
              Customer Access
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="flex justify-center space-x-4">
            <Link href="/register" className="text-pink-500 hover:text-pink-600 font-semibold">
              Create Account
            </Link>
            <Link href="/" className="text-gray-500 hover:text-gray-600">
              Back to Home
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
