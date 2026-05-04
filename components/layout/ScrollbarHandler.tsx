'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function ScrollbarHandler() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Scroll to top on every route / query-string change
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }, [pathname, searchParams])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const threshold = 50 // pixels from right edge
            const distanceContent = window.innerWidth - e.clientX

            if (distanceContent < threshold) {
                document.documentElement.classList.add('scroll-active')
            } else {
                document.documentElement.classList.remove('scroll-active')
            }
        }

        const handleScroll = () => {
            document.documentElement.classList.add('scroll-active')
            // Remove after 1.5s of no scroll
            clearTimeout((window as any)._scrollTimeout)
                ; (window as any)._scrollTimeout = setTimeout(() => {
                    document.documentElement.classList.remove('scroll-active')
                }, 1500)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('scroll', handleScroll, { passive: true })

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    return null
}
