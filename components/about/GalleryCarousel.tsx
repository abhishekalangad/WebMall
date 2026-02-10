'use client'

import React from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react'

export function GalleryCarousel({ images }: { images: string[] }) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' }, [
        Autoplay({ delay: 4000, stopOnInteraction: false }) as any
    ])
    const [validImages, setValidImages] = React.useState<string[]>(images)

    const scrollPrev = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    React.useEffect(() => {
        setValidImages(images)
    }, [images])

    if (!validImages || validImages.length === 0) {
        // Fallback to the original static card
        return (
            <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-pink-200 to-yellow-200 rounded-2xl flex items-center justify-center shadow-inner">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Heart className="h-12 w-12 text-pink-500" />
                        </div>
                        <p className="text-gray-700 font-medium text-lg">Crafting Beautiful Memories</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video bg-gray-100 hover:shadow-3xl transition-shadow duration-300 group">
            <div className="h-full w-full" ref={emblaRef}>
                <div className="flex h-full w-full">
                    {validImages.map((src, index) => (
                        <div className="flex-[0_0_100%] min-w-0 relative h-full w-full" key={`${src}-${index}`}>
                            <img
                                src={src}
                                alt={`About Us Gallery ${index + 1}`}
                                className="w-full h-full object-contain md:object-cover bg-gray-50"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    setValidImages(prev => prev.filter(img => img !== src))
                                }}
                            />
                            <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            {validImages.length > 1 && (
                <>
                    <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 z-10"
                        onClick={scrollPrev}
                        aria-label="Previous Slide"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 z-10"
                        onClick={scrollNext}
                        aria-label="Next Slide"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}
        </div>
    )
}
