/**
 * Clear Supabase Session Script
 * 
 * Run this in your browser console if you encounter persistent
 * "Failed to fetch" errors related to Supabase auth.
 * 
 * This will clear any stale or invalid session data from localStorage.
 */

// Clear all Supabase-related localStorage items
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
        console.log('Clearing:', key)
        localStorage.removeItem(key)
    }
})

console.log('✅ Supabase session data cleared! Please refresh the page.')
