'use client'

import { useEffect } from 'react'

export function ScrollbarHandler() {
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
