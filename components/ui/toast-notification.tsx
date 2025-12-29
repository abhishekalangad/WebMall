'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ToastNotificationProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export function ToastNotification({ 
  message, 
  type = 'success', 
  duration = 3000, 
  onClose 
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-green-50 border-green-200 text-green-800'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <X className="h-5 w-5 text-red-500" />
      case 'info':
        return <div className="h-5 w-5 bg-blue-500 rounded-full" />
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />
    }
  }

  if (!isVisible) return null

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm ${getTypeStyles()}`}>
        {getIcon()}
        <span className="flex-1 text-sm font-medium">{message}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-6 w-6 p-0 hover:bg-transparent"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
