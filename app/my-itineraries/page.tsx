'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import Navbar from '../components/Navbar'

export default function MyItinerariesPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [myItineraries, setMyItineraries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSessionAndData() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }
      setSession(session)

      const { data, error } = await supabase
        .from('itineraries')
        .select(`
          *,
          airports (
            airport_name,
            iata_code,
            city
          )
        `)
        .eq('user_id', session.user.id) // <-- Double check if this should be 'user_id' or 'profile_id' based on your DB!
        .order('submission_date', { ascending: false })

      if (error) {
        console.error("Error fetching itineraries:", error.message)
      } else {
        setMyItineraries(data || [])
      }
      setLoading(false)
    }

    loadSessionAndData()
  }, [router])

  async function handleDelete(itineraryId: string) {
    const confirmDelete = window.confirm("Are you sure you want to delete this itinerary? This cannot be undone.")
    if (!confirmDelete) return

    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('itinerary_id', itineraryId) 

    if (error) {
      alert("Failed to delete itinerary: " + error.message)
    } else {
      setMyItineraries(prev => prev.filter(item => item.itinerary_id !== itineraryId))
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Loading your itineraries...</div>
    </div>
  )

  return (
    <>
      {/* Render the Navbar at the top of the page */}
      <Navbar /> 
      
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Itineraries</h1>
            <button 
              onClick={() => router.push('/submit')}
              className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700"
            >
              + Add New
            </button>
          </div>

          {myItineraries.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No itineraries yet</h3>
              <p className="text-gray-500 mb-6">You haven't shared any layover guides. Help the community by adding your first one!</p>
            </div>
          ) : (
            <div className="grid gap-5">
              {myItineraries.map((itinerary) => (
                <div key={itinerary.itinerary_id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col gap-4">
      
                  {/* Top Section: Header & Actions */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-xl text-gray-900">
                          {itinerary.airports?.iata_code}
                        </span>
                        <span className="text-gray-500 font-medium">— {itinerary.airports?.city}</span>
                      </div>
          
                      {/* Minimalist Metadata Badges */}
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                          ⏱️ {Math.floor(itinerary.layover_duration_mins / 60)}h {itinerary.layover_duration_mins % 60}m
                        </span>
                        {itinerary.user_rating && (
                          <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-md font-medium">
                            ⭐ {itinerary.user_rating}/10
                          </span>
                        )}
                        {itinerary.exit_transport_mode && (
                          <span className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-md font-medium capitalize border border-gray-100">
                            🚕 {itinerary.exit_transport_mode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link 
                        href={`/itinerary/${itinerary.itinerary_id}`}
                        className="px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                      >
                        View
                      </Link>
                      <button 
                        onClick={() => handleDelete(itinerary.itinerary_id)}
                        className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Bottom Section: Context & Timestamp */}
                  {(itinerary.notes || itinerary.submission_date) && (
                    <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                      {itinerary.notes && (
                        <p className="text-gray-600 text-sm italic line-clamp-2">
                          "{itinerary.notes}"
                        </p>
                      )}
                      {itinerary.submission_date && (
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                          Submitted • {new Date(itinerary.submission_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}