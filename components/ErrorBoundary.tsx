'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)

        // You can log to an error reporting service here
        // Example: logErrorToService(error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 flex items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>

                        <h1 className="text-2xl font-bold font-playfair text-gray-900 mb-2">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-gray-600 mb-6">
                            We're sorry for the inconvenience. An unexpected error occurred while loading this page.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                                <p className="text-sm font-mono text-red-800 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={this.handleReset}
                                className="bg-gradient-to-r from-pink-300 to-yellow-300 hover:from-pink-400 hover:to-yellow-400 text-gray-900 font-semibold"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reload Page
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => window.location.href = '/'}
                            >
                                Go to Homepage
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
