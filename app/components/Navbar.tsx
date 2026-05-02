'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Close dropdown on outside click
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
    setDropdownOpen(false)
    router.push('/')
  }

  return (
    <nav className="relative bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      
        {/* Left — Logo */}
        <div
            onClick={() => router.push('/')}
            className="flex items-center gap-2 cursor-pointer"
        >
        <span className="text-2xl">✈️</span>
        <span className="text-xl font-bold text-blue-600">LayoverGuide</span>
        </div>

        {/* Centre — Nav links */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-6">
            <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
            Explore
            </button>
            <button
                onClick={() => router.push('/map')}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
                Map View
            </button>
            <button
                onClick={() => router.push('/submit')}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
                Add Itinerary
            </button>
        </div>

      {/* Right — Auth */}
      <div className="flex items-center gap-3">
        {session ? (
          <div className="relative" ref={dropdownRef}>
            {/* Profile button */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-full transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                {session.user.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden md:block">
                {session.user.email?.split('@')[0]}
              </span>
              <span className="text-xs">{dropdownOpen ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {session.user.email}
                  </p>
                </div>
                <button
                    onClick={() => { router.push('/profile'); setDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  👤 Profile Details
                </button>
                <button
                    onClick={() => { router.push('/bookmarks'); setDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  🔖 My Bookmarks
                </button>
                <button
                    onClick={() => { router.push('/my-itineraries'); setDropdownOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                    ✈️ My Itineraries
                </button>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  )
}