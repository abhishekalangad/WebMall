import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white">
            <div className="relative">
                <div className="absolute inset-0 bg-pink-200 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <Loader2 className="h-12 w-12 animate-spin text-pink-500 relative z-10" />
            </div>
            <p className="mt-4 text-gray-500 font-medium animate-pulse">
                Loading WebMall...
            </p>
        </div>
    )
}
