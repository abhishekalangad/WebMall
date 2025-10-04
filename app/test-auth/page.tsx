'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { mockSignIn, mockGetCurrentUser } from '@/lib/mock-auth'

export default function TestAuthPage() {
  const [result, setResult] = useState<string>('')
  const [user, setUser] = useState<any>(null)

  const testLogin = async () => {
    try {
      setResult('Testing login...')
      const loginResult = await mockSignIn('customer@webmall.lk', 'password123')
      setResult(`Login successful: ${JSON.stringify(loginResult)}`)
      
      // Test getting current user
      const currentUser = mockGetCurrentUser()
      setUser(currentUser)
    } catch (error: any) {
      setResult(`Login failed: ${error.message}`)
    }
  }

  const testGetUser = () => {
    const currentUser = mockGetCurrentUser()
    setUser(currentUser)
    setResult(`Current user: ${JSON.stringify(currentUser)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Test Page</h1>
        
        <div className="space-y-4">
          <Button onClick={testLogin}>Test Login</Button>
          <Button onClick={testGetUser} variant="outline">Get Current User</Button>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded">{result}</pre>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Current User:</h2>
            <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(user, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
