'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { signIn, signUp } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const handleLogin = async (data: LoginForm) => {
    setLoading(true)
    setError(null)
    try {
      await signIn(data.email, data.password)
      onClose()
      loginForm.reset()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (data: RegisterForm) => {
    setLoading(true)
    setError(null)
    try {
      await signUp(data.email, data.password, data.name)
      onClose()
      registerForm.reset()
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md mx-4">
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-playfair text-gray-900 mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600">
            {mode === 'login' 
              ? 'Sign in to your account to continue shopping' 
              : 'Join WebMall and discover beautiful accessories'
            }
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...loginForm.register('email')}
                className="mt-1"
                placeholder="Enter your email"
              />
              {loginForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...loginForm.register('password')}
                className="mt-1"
                placeholder="Enter your password"
              />
              {loginForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold" disabled={loading}>
              {loading ? 'Please wait...' : 'Sign In'}
            </Button>
            
            {/* Demo Login Buttons */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 text-center mb-3">Demo Accounts:</p>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    loginForm.setValue('email', 'admin@webmall.lk')
                    loginForm.setValue('password', 'password123')
                  }}
                >
                  Fill Admin Login
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    loginForm.setValue('email', 'customer@webmall.lk')
                    loginForm.setValue('password', 'password123')
                  }}
                >
                  Fill Customer Login
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...registerForm.register('name')}
                className="mt-1"
                placeholder="Enter your full name"
              />
              {registerForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...registerForm.register('email')}
                className="mt-1"
                placeholder="Enter your email"
              />
              {registerForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...registerForm.register('password')}
                className="mt-1"
                placeholder="Enter your password"
              />
              {registerForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...registerForm.register('confirmPassword')}
                className="mt-1"
                placeholder="Confirm your password"
              />
              {registerForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {registerForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold" disabled={loading}>
              {loading ? 'Please wait...' : 'Create Account'}
            </Button>
            
            {/* Demo Account Creation */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 text-center mb-3">Demo Registration:</p>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    registerForm.setValue('name', 'Admin User')
                    registerForm.setValue('email', 'admin@webmall.lk')
                    registerForm.setValue('password', 'password123')
                    registerForm.setValue('confirmPassword', 'password123')
                  }}
                >
                  Fill Admin Registration
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    registerForm.setValue('name', 'Customer User')
                    registerForm.setValue('email', 'customer@webmall.lk')
                    registerForm.setValue('password', 'password123')
                    registerForm.setValue('confirmPassword', 'password123')
                  }}
                >
                  Fill Customer Registration
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-pink-500 hover:text-pink-600 font-semibold"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </Modal>
  )
}