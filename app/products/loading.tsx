import { Loader2 } from 'lucide-react'

export default function ProductsLoading() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-background">
            <div className="relative">
                <div className="absolute inset-0 bg-pink-200 rounded-full blur-2xl opacity-20 animate-pulse" />
                <Loader2 className="h-12 w-12 animate-spin text-pink-500 relative z-10" />
            </div>
            <p className="mt-4 text-muted-foreground font-medium animate-pulse">
                Loading products...
            </p>
        </div>
    )
}
