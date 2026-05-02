'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Navbar from '../components/Navbar'

export default function SubmitPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [airports, setAirports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [airportId, setAirportId] = useState('')
  const [timeToExit, setTimeToExit] = useState('')
  const [layoverHours, setLayoverHours] = useState('')
  const [layoverMins, setLayoverMins] = useState('')
  const [arrivalTerminal, setArrivalTerminal] = useState('')
  const [departureTerminal, setDepartureTerminal] = useState('')
  const [userRating, setUserRating] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        setSession(session)
      }
    })

    // Load airports for dropdown
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/airports`)
      .then(res => res.json())
      .then(data => setAirports(data))
  }, [])

  async function handleSubmit(e: any) {
    e.preventDefault()
    setError('')

    // Calculate total minutes behind the scenes
    const totalLayoverMins = (Number(layoverHours) || 0) * 60 + (Number(layoverMins) || 0)

    // Client-side validation
    if (!airportId) {
      setError('Please select an airport.')
      return
    }
    if (totalLayoverMins <= 0) {
      setError('Layover duration must be greater than 0.')
      return
    }
    if (timeToExit && Number(timeToExit) >= totalLayoverMins) {
      setError('Time to exit cannot exceed total layover duration.')
      return
    }
    if (userRating && (Number(userRating) < 1 || Number(userRating) > 10)) {
      setError('Rating must be between 1 and 10.')
      return
    }

    setLoading(true)

    const token = session?.access_token

    // Build the payload exactly how FastAPI expects it
    const body: any = {
      airport_id: airportId,
      layover_duration_mins: totalLayoverMins,
    }
    if (timeToExit) body.time_to_exit_mins = Number(timeToExit)
    if (arrivalTerminal) body.arrival_terminal = arrivalTerminal
    if (departureTerminal) body.departure_terminal = departureTerminal
    if (userRating) body.user_rating = Number(userRating)
    if (notes) body.notes = notes

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/itineraries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    setLoading(false)

    if (res.ok) {
      setSuccess(true)
    } else {
      const data = await res.json()
      setError(data.detail || 'Something went wrong. Please try again.')
    }
  }

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md">
        <div className="text-4xl mb-4">✈️</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Itinerary submitted!</h2>
        <p className="text-gray-500 mb-6">Thanks for helping fellow travellers.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700"
          >
            Back to search
          </button>
          <button
            onClick={() => { 
              setSuccess(false); 
              setAirportId(''); 
              setLayoverHours(''); 
              setLayoverMins(''); 
              setTimeToExit(''); 
              setNotes(''); 
              setUserRating(''); 
            }}
            className="border border-gray-300 text-gray-600 px-6 py-2 rounded-full hover:bg-gray-50"
          >
            Submit another
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Share your layover itinerary</h2>
        <p className="text-gray-500 mb-8">Help other travellers make the most of their time.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Airport <span className="text-red-500">*</span>
            </label>
            <select
              value={airportId}
              onChange={e => setAirportId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an airport...</option>
              {airports.map((airport: any) => (
                <option key={airport.airport_id} value={airport.airport_id}>
                  {airport.airport_name} ({airport.iata_code}) — {airport.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time to exit airport (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={timeToExit}
              onChange={e => setTimeToExit(e.target.value)}
              placeholder="e.g. 30"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total layover duration <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  value={layoverHours}
                  onChange={e => setLayoverHours(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2 text-gray-500 text-sm pointer-events-none">hrs</span>
              </div>
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={layoverMins}
                  onChange={e => setLayoverMins(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2 text-gray-500 text-sm pointer-events-none">mins</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arrival terminal
              </label>
              <input
                type="text"
                value={arrivalTerminal}
                onChange={e => setArrivalTerminal(e.target.value)}
                placeholder="e.g. 1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure terminal
              </label>
              <input
                type="text"
                value={departureTerminal}
                onChange={e => setDepartureTerminal(e.target.value)}
                placeholder="e.g. 2"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating (1–10)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={userRating}
              onChange={e => setUserRating(e.target.value)}
              placeholder="How would you rate this layover experience?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes & tips
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="What did you do? Any tips for other travellers?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit itinerary'}
          </button>

        </form>
      </div>
    </main>
  )
}