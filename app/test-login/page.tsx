'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { mockSignIn, mockGetCurrentUser } from '@/lib/mock-auth'

export default function TestLoginPage() {
  const { user, refreshUser } = useAuth()
  const [result, setResult] = useState<string>('')

  const testLogin = async () => {
    try {
      setResult('Testing login...')
      const loginResult = await mockSignIn('customer@webmall.lk', 'password123')
      setResult(`Login successful: ${JSON.stringify(loginResult)}`)
      
      // Force refresh auth context
      await refreshUser()
      setResult(prev => prev + '\nAuth context refreshed')
    } catch (error: any) {
      setResult(`Login failed: ${error.message}`)
    }
  }

  const testGetUser = () => {
    const currentUser = mockGetCurrentUser()
    setResult(`Current user from mock: ${JSON.stringify(currentUser)}`)
  }

  const testRefresh = async () => {
    setResult('Refreshing auth context...')
    await refreshUser()
    setResult('Auth context refreshed')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Login Test Page</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Auth State:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify({ user, hasUser: !!user }, null, 2)}
          </pre>
        </div>
        
        <div className="space-y-4">
          <Button onClick={testLogin}>Test Login</Button>
          <Button onClick={testGetUser} variant="outline">Get Current User</Button>
          <Button onClick={testRefresh} variant="outline">Refresh Auth Context</Button>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{result}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
