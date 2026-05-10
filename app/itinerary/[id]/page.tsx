'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Navbar from '../../components/Navbar'

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/itineraries/${id}`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); return null }
        return res.json()
      })
      .then(data => {
        if (data) {
          setItinerary(data)
          setUpvoteCount(data.upvotes?.[0]?.count ?? 0)
        }
        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [id])

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
    if (!session) { router.push('/login'); return }
    const token = session.access_token
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/itineraries/${id}/upvote`,
      { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
    )
    const data = await res.json()
    setHasUpvoted(data.upvoted)
    setUpvoteCount(prev => data.upvoted ? prev + 1 : prev - 1)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500">Loading itinerary...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-32 flex-col gap-4">
        <div className="text-5xl">🔍</div>
        <p className="text-gray-700 font-medium text-xl">Itinerary not found</p>
        <p className="text-gray-400 text-sm">This itinerary may have been removed.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-2 bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700 font-medium"
        >
          Back to search
        </button>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-blue-200 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors"
          >
            ← Back to results
          </button>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-200 text-sm uppercase tracking-wide mb-1">
                Layover duration
              </p>
              <div className="flex items-center gap-4">
                <p className="text-4xl font-bold">
                  {Math.floor(itinerary.layover_duration_mins / 60)}h {itinerary.layover_duration_mins % 60}m
                </p>
                
                {/* NEW: Price Tier Indicator */}
                {itinerary.price_tier && (
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-lg tracking-widest font-bold">
                    <span className="text-green-400">{'$'.repeat(itinerary.price_tier)}</span>
                    <span className="text-white/30">{'$'.repeat(4 - itinerary.price_tier)}</span>
                  </div>
                )}
              </div>
            </div>

            {itinerary.user_rating && (
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-center">
                <div className="text-2xl font-bold">{itinerary.user_rating}/10</div>
                <div className="text-blue-200 text-xs">rating</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Key info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* NEW: Display Time of Day */}
          {itinerary.time_of_day && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl mb-1">
                {itinerary.time_of_day === 'Morning' && '🌅'}
                {itinerary.time_of_day === 'Afternoon' && '☀️'}
                {itinerary.time_of_day === 'Evening' && '🌆'}
                {itinerary.time_of_day === 'Overnight' && '🌙'}
              </p>
              <p className="text-lg font-bold text-gray-800">{itinerary.time_of_day}</p>
              <p className="text-xs text-gray-400">layover vibe</p>
            </div>
          )}
          {itinerary.time_to_exit_mins && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl mb-1">🚶</p>
              <p className="text-lg font-bold text-gray-800">{itinerary.time_to_exit_mins}m</p>
              <p className="text-xs text-gray-400">to exit airport</p>
            </div>
          )}
          {itinerary.arrival_terminal && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl mb-1">🛬</p>
              <p className="text-lg font-bold text-gray-800">T{itinerary.arrival_terminal}</p>
              <p className="text-xs text-gray-400">arrival terminal</p>
            </div>
          )}
          {itinerary.departure_terminal && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl mb-1">🛫</p>
              <p className="text-lg font-bold text-gray-800">T{itinerary.departure_terminal}</p>
              <p className="text-xs text-gray-400">departure terminal</p>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl mb-1">📅</p>
            <p className="text-sm font-bold text-gray-800">
              {new Date(itinerary.submission_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
            </p>
            <p className="text-xs text-gray-400">submitted</p>
          </div>
        </div>

        {/* Notes */}
        {itinerary.notes && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              📝 Traveller notes
            </h3>
            <p className="text-gray-600 leading-relaxed">{itinerary.notes}</p>
          </div>
        )}
        {itinerary.itinerary_tags && itinerary.itinerary_tags.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-3">🏷️ Tags</h3>
            <div className="flex flex-wrap gap-2">
              {itinerary.itinerary_tags.map((t: any) => (
                <span key={t.tag_id} className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                  {t.tags.name.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Upvote */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">Was this helpful?</p>
            <p className="text-sm text-gray-400 mt-0.5">
              {upvoteCount} {upvoteCount === 1 ? 'person' : 'people'} found this helpful
            </p>
          </div>
          <button
            onClick={handleUpvote}
            className={`px-6 py-2.5 rounded-full font-medium transition-all text-sm ${
              hasUpvoted
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            {hasUpvoted ? '▲ Upvoted' : '▲ Upvote'}
          </button>
        </div>

        {/* Share CTA */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 text-center">
          <p className="font-semibold text-gray-800 mb-1">Had a layover at this airport?</p>
          <p className="text-gray-500 text-sm mb-4">Share your experience and help other travellers.</p>
          <button
            onClick={() => router.push('/submit')}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700 font-medium text-sm"
          >
            Share your itinerary
          </button>
        </div>

      </div>
    </main>
  )
}