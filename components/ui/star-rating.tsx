import { Star } from 'lucide-react'

interface StarRatingProps {
    rating: number
    maxRating?: number
    size?: 'sm' | 'md' | 'lg'
    showNumber?: boolean
    count?: number
}

export function StarRating({
    rating,
    maxRating = 5,
    size = 'md',
    showNumber = true,
    count
}: StarRatingProps) {
    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    }

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    }

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center">
                {[...Array(maxRating)].map((_, index) => {
                    const starValue = index + 1
                    const isFilled = starValue <= Math.floor(rating)
                    const isPartial = starValue === Math.ceil(rating) && rating % 1 !== 0

                    return (
                        <div key={index} className="relative">
                            {isPartial ? (
                                <>
                                    <Star className={`${sizeClasses[size]} text-gray-300 fill-gray-300`} />
                                    <div
                                        className="absolute top-0 left-0 overflow-hidden"
                                        style={{ width: `${(rating % 1) * 100}%` }}
                                    >
                                        <Star className={`${sizeClasses[size]} text-amber-400 fill-amber-400`} />
                                    </div>
                                </>
                            ) : (
                                <Star
                                    className={`${sizeClasses[size]} ${isFilled
                                            ? 'text-amber-400 fill-amber-400'
                                            : 'text-gray-300 fill-gray-300'
                                        }`}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
            {showNumber && (
                <span className={`${textSizeClasses[size]} font-medium text-gray-700`}>
                    {rating.toFixed(1)}
                    {count !== undefined && (
                        <span className="text-gray-500 font-normal ml-1">({count})</span>
                    )}
                </span>
            )}
        </div>
    )
}
