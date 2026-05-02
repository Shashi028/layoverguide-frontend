'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from './components/Navbar'

export default function Home() {
  const router = useRouter()
  const [airports, setAirports] = useState([])
  const [selectedAirport, setSelectedAirport] = useState('')
  const [minHours, setMinHours] = useState(1)
  const [maxHours, setMaxHours] = useState(24)
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/airports`)
      .then(res => res.json())
      .then(data => setAirports(data))
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
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">

          <h2 className="text-5xl font-bold mb-4 leading-tight whitespace-nowrap">
            Make the most of your layover
          </h2>

          <p className="text-blue-100 text-lg mb-6 max-w-xl mx-auto">
            Search real layover itineraries — filtered by airport and duration.
            <br />
            Never waste a layover again.
          </p>

          {/* Trust banner */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 mb-8 max-w-lg mx-auto">
            <p className="text-white font-medium text-base">
              Real experiences from real travellers
            </p>
            <p className="text-blue-100 text-sm mt-1">
              Every itinerary is submitted by someone who actually did it — not AI-generated, not sponsored.
            </p>
          </div>

          {/* Search box */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 text-left shadow-2xl">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Airport
              </label>
              <select
                value={selectedAirport}
                onChange={e => setSelectedAirport(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an airport...</option>
                {airports.map((airport: any) => (
                  <option key={airport.airport_id} value={airport.airport_id}>
                    {airport.airport_name} ({airport.iata_code}) — {airport.city}, {airport.country}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 mb-5">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min hours
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={minHours}
                  onChange={e => setMinHours(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max hours
                </label>
                <input
                  type="number"
                  min={1}
                  max={48}
                  value={maxHours}
                  onChange={e => setMaxHours(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={!selectedAirport || loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
            >
              {loading ? 'Searching...' : 'Search Itineraries'}
            </button>
          </div>
        </div>
      </div>

      {/* How it works */}
      {!searched && (
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-10">
            How it works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                🔍
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Search your airport</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Enter your layover airport and how many hours you have. We'll find matching real itineraries.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                📖
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Read real experiences</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                See exactly what other travellers did — transport taken, places visited, time it took.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                ✍️
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Share your own</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Had a great layover? Share your itinerary and help thousands of future travellers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500">Finding itineraries...</p>
          </div>
        )}

        {!loading && searched && itineraries.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏝️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No itineraries found</h3>
            <p className="text-gray-500 mb-6">
              No one has shared a layover here yet for that duration.
            </p>
            <button
              onClick={() => router.push('/submit')}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700 font-medium"
            >
              Be the first to share one ✈️
            </button>
          </div>
        )}

        {!loading && itineraries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                {itineraries.length} itinerar{itineraries.length === 1 ? 'y' : 'ies'} found
              </h3>
              <span className="text-sm text-gray-400">Click to view details</span>
            </div>
            <div className="grid gap-4">
              {itineraries.map((item: any) => (
                <div
                  key={item.itinerary_id}
                  onClick={() => router.push(`/itinerary/${item.itinerary_id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Layover duration
                      </p>
                      <p className="text-xl font-bold text-gray-800">
                        {Math.floor(item.layover_duration_mins / 60)}h {item.layover_duration_mins % 60}m
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.user_rating && (
                        <div className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                          ★ {item.user_rating}/10
                        </div>
                      )}
                      <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-lg">→</span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2 leading-relaxed">
                      {item.notes}
                    </p>
                  )}

                  <div className="flex gap-2 mt-3 flex-wrap">
                    {item.time_to_exit_mins && (
                      <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                        🚶 Exit: {item.time_to_exit_mins} mins
                      </span>
                    )}
                    {item.arrival_terminal && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        Arrives T{item.arrival_terminal}
                      </span>
                    )}
                    {item.departure_terminal && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
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

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xl">✈️</span>
          <span className="font-bold text-blue-600">LayoverGuide</span>
        </div>
        <p className="text-gray-400 text-sm mb-3">
          Community-driven layover itineraries for travellers worldwide
        </p>
        <div className="flex justify-center gap-6 text-sm text-gray-400">
          <button onClick={() => router.push('/submit')} className="hover:text-blue-600">
            Share an itinerary
          </button>
          <span>·</span>
          <button onClick={() => router.push('/')} className="hover:text-blue-600">
            Explore airports
          </button>
        </div>
      </footer>
    </main>
  )
}