'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // If already logged in, redirect to home
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/')
    })

    // Listen for login success
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-blue-600 mb-4 block mx-auto"
          >
            ← Back to search
          </button>
          <h1 className="text-3xl font-bold text-blue-600 mb-2">LayoverGuide</h1>
          <p className="text-gray-500">Sign in to share your layover itineraries</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/`}
          />
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          By signing in you agree to share your layover experiences with the community.
        </p>

      </div>
    </main>
  )
}