'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, Mail, Clock, RefreshCw, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

function WaitingApprovalContent() {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUser } = useAuth()

  const email = searchParams.get('email') || user?.email || 'your email'

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCheckStatus = async () => {
    setIsChecking(true)
    try {
      await refreshUser()
      // If user is now verified, redirect to home
      if (user?.email_verified) {
        router.push('/?message=Account verified successfully!')
      }
    } catch (error) {
      console.error('Error checking status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-playfair text-gray-900 mb-2">
              Waiting for Email Confirmation
            </h1>
            <p className="text-gray-600 text-lg">
              Please check your email and click the confirmation link
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border-2 border-blue-200">
            <div className="flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Check Your Email</h2>
            </div>

            <p className="text-gray-600 mb-6">
              We've sent a verification link to <strong className="text-blue-600">{email}</strong>
            </p>

            <div className="bg-white rounded-lg p-6 mb-6 border border-blue-200">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                <span className="font-semibold text-gray-800">Next Steps:</span>
              </div>
              <ul className="text-left text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">1.</span>
                  Check your email inbox (and spam folder)
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">2.</span>
                  Click the verification link in the email
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">3.</span>
                  Your account will be activated automatically
                </li>
              </ul>
            </div>

            {/* Timer */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">Time elapsed:</span>
              </div>
              <div className="text-2xl font-mono font-bold text-blue-600">
                {formatTime(timeElapsed)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking Status...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Verification Status
                </>
              )}
            </Button>

            <div className="flex gap-3">
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you didn't receive the email or are having trouble, please contact our support team.
            </p>
            <div className="text-sm text-gray-500">
              <p>📧 support@webmall.com</p>
              <p>📞 +94 11 234 5678</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function WaitingApprovalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-300 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <WaitingApprovalContent />
    </Suspense>
  )
}
