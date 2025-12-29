'use client'

import React from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, Mail, ExternalLink } from 'lucide-react'

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
}

export function VerificationModal({ isOpen, onClose, email }: VerificationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-lg mx-4">
      <div className="p-8">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Account Created Successfully! 🎉
            </h2>
            
            <p className="text-gray-600 mb-6">
              Welcome to WebMall! Your account for <strong>{email}</strong> has been created.
            </p>

            <div className="bg-white rounded-lg p-6 mb-6 border-2 border-dashed border-green-300">
              <div className="flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-blue-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-800">Please Check Your Email</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                We've sent a verification link to <strong>{email}</strong>
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  📧 Click the verification link in your email to activate your account
                </p>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>✨ <strong>Note:</strong> This is a demo, so you can login directly without email verification!</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button 
                onClick={onClose}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold"
              >
                <ExternalLink className="h-4 w-4" />
                Continue to Login
              </Button>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>⏳ You'll be redirected to the approval page in a moment...</p>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  )
}
