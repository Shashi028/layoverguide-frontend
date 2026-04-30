'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function ItineraryDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [itinerary, setItinerary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(0)

  useEffect(() => {
    // Get session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Fetch itinerary
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/itineraries/${id}`)
      .then(res => {
        if (res.status === 404) {
          setNotFound(true)
          return null
        }
        return res.json()
      })
      .then(data => {
        if (data) {
          setItinerary(data)
          // Extract upvote count from nested structure
          const count = data.upvotes?.[0]?.count ?? 0
          setUpvoteCount(count)
        }
        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [id])

  // Check if current user has upvoted
  useEffect(() => {
    if (!session || !id) return
    supabase
      .from('upvotes')
      .select('*')
      .eq('itinerary_id', id)
      .eq('user_id', session.user.id)
      .then(({ data }) => {
        setHasUpvoted((data ?? []).length > 0)
      })
  }, [session, id])

  async function handleUpvote() {
    if (!session) {
      router.push('/login')
      return
    }

    const token = session.access_token
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/itineraries/${id}/upvote`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    const data = await res.json()
    setHasUpvoted(data.upvoted)
    setUpvoteCount(prev => data.upvoted ? prev + 1 : prev - 1)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading itinerary...</p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
      <p className="text-gray-700 font-medium">Itinerary not found.</p>
      <button onClick={() => router.push('/')} className="text-blue-600 hover:underline">
        Back to search
      </button>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1
          onClick={() => router.push('/')}
          className="text-xl font-bold text-blue-600 cursor-pointer"
        >
          LayoverGuide
        </h1>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-500 hover:text-blue-600"
        >
          ← Back to search
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Layover duration</p>
              <p className="text-3xl font-bold text-gray-800">
                {(itinerary.layover_duration_mins / 60).toFixed(1)} hours
              </p>
            </div>
            {itinerary.user_rating && (
              <div className="bg-blue-50 text-blue-700 text-lg font-bold px-4 py-2 rounded-full">
                ★ {itinerary.user_rating}/10
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {itinerary.time_to_exit_mins && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Time to exit airport</p>
                <p className="font-medium text-gray-800">{itinerary.time_to_exit_mins} mins</p>
              </div>
            )}
            {itinerary.arrival_terminal && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Arrival terminal</p>
                <p className="font-medium text-gray-800">Terminal {itinerary.arrival_terminal}</p>
              </div>
            )}
            {itinerary.departure_terminal && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Departure terminal</p>
                <p className="font-medium text-gray-800">Terminal {itinerary.departure_terminal}</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Submitted</p>
              <p className="font-medium text-gray-800">
                {new Date(itinerary.submission_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {itinerary.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-gray-700 leading-relaxed">{itinerary.notes}</p>
            </div>
          )}
        </div>

        {/* Upvote */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Was this itinerary helpful?</p>
            <p className="text-sm text-gray-500">
              {upvoteCount} {upvoteCount === 1 ? 'person' : 'people'} found this helpful
            </p>
          </div>
          <button
            onClick={handleUpvote}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              hasUpvoted
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            {hasUpvoted ? '▲ Upvoted' : '▲ Upvote'}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400">
          Itinerary ID: {itinerary.itinerary_id}
        </div>

      </div>
    </main>
  )
}