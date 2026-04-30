'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function Home() {
  const router = useRouter()
  const [airports, setAirports] = useState([])
  const [selectedAirport, setSelectedAirport] = useState('')
  const [minHours, setMinHours] = useState(1)
  const [maxHours, setMaxHours] = useState(24)
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [session, setSession] = useState<any>(null)

  
  useEffect(() => {
    // Load airports
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/airports`)
        .then(res => res.json())
        .then(data => setAirports(data))

    // Check current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
      })

    // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
      })

      return () => subscription.unsubscribe()
  }, [])
  

  async function handleSearch() {
    if (!selectedAirport) return
    setLoading(true)
    setSearched(true)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/itineraries?airport_id=${selectedAirport}&min_hrs=${minHours}&max_hrs=${maxHours}`
    )
    const data = await res.json()
    setItineraries(data)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">LayoverGuide</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => router.push('/submit')}
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            Share Itinerary
          </button>
          {session ? (
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                setSession(null)
              }}
              className="text-sm bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700"
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-blue-600 text-white py-16 px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">Make the most of your layover</h2>
        <p className="text-blue-100 text-lg mb-8">
          Real itineraries from real travellers — searchable by airport and layover duration
        </p>

        {/* Search box */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 text-left shadow-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Airport</label>
            <select
              value={selectedAirport}
              onChange={e => setSelectedAirport(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an airport...</option>
              {airports.map((airport: any) => (
                <option key={airport.airport_id} value={airport.airport_id}>
                  {airport.airport_name} ({airport.iata_code}) — {airport.city}, {airport.country}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min hours</label>
              <input
                type="number"
                min={1}
                max={24}
                value={minHours}
                onChange={e => setMinHours(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Max hours</label>
              <input
                type="number"
                min={1}
                max={48}
                value={maxHours}
                onChange={e => setMaxHours(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={!selectedAirport || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search Itineraries'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {loading && (
          <div className="text-center text-gray-500 py-10">Loading itineraries...</div>
        )}

        {!loading && searched && itineraries.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            No itineraries found for this airport and duration. Be the first to share one!
          </div>
        )}

        {!loading && itineraries.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              {itineraries.length} itiner{itineraries.length === 1 ? 'y' : 'aries'} found
            </h3>
            <div className="grid gap-4">
              {itineraries.map((item: any) => (
                <div
                  key={item.itinerary_id}
                  onClick={() => router.push(`/itinerary/${item.itinerary_id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Layover duration
                      </p>
                      <p className="text-lg font-semibold text-gray-800">
                        {(item.layover_duration_mins / 60).toFixed(1)} hours
                      </p>
                    </div>
                    {item.user_rating && (
                      <div className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                        ★ {item.user_rating}/10
                      </div>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">{item.notes}</p>
                  )}
                  <div className="flex gap-3 mt-3">
                    {item.arrival_terminal && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Arrives T{item.arrival_terminal}
                      </span>
                    )}
                    {item.departure_terminal && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        Departs T{item.departure_terminal}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}