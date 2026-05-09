'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Navbar from '../components/Navbar'

export default function ProfilePage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // States for Display Name
  const [isEditingName, setIsEditingName] = useState(false)
  const [displayName, setDisplayName] = useState('')
  
  // States for Username
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  
  // States for Password
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  
  // Global form states
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }
      setSession(session)

      // Use .maybeSingle() instead of .single() so it doesn't throw an error if 0 rows are found
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('profile_id', session.user.id)
        .maybeSingle()
    
    if (error) console.log("Read Error:", error.message)

      if (!data) {
        // SELF-HEALING: If the DB trigger failed, create the profile right now
        const fallbackUsername = session?.user?.email?.split('@')[0] || 'traveler'
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ 
            profile_id: session.user.id, 
            username: fallbackUsername,
            display_name: fallbackUsername // Give them a default display name too
          }])
          .select()
          .single()
        
        if (insertError) console.log("Insert Error:", insertError.message)

        if (newProfile) {
          setProfile(newProfile)
          setDisplayName(newProfile.display_name || '')
          setUsername(newProfile.username || '')
        }
      } else {
        // Profile exists normally
        setProfile(data)
        setDisplayName(data.display_name || '')
        setUsername(data.username || '')
      }
      setLoading(false)
    }

    loadProfile()
  }, [router])

  // --- 1. DISPLAY NAME LOGIC ---
  async function handleUpdateDisplayName(e: React.FormEvent) {
    e.preventDefault()
    setUpdating(true)
    setMessage({ type: '', text: '' })

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('profile_id', session.user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Display name updated!' })
      setProfile({ ...profile, display_name: displayName })
      setIsEditingName(false)
    }
    setUpdating(false)
  }

  // --- 2. USERNAME LOGIC (WITH UNIQUENESS CHECK) ---
    async function handleUpdateUsername(e: React.FormEvent) {
    e.preventDefault()
    setUpdating(true)
    setMessage({ type: '', text: '' })
    setUsernameError('')

    const cleanUsername = username.toLowerCase().trim()

    // NEW: Strict Regex Validation
    // ^[a-z0-9_]+$ means: start to finish, ONLY lowercase letters, numbers, and underscores allowed.
    const isValidFormat = /^[a-z0-9_]+$/.test(cleanUsername)
    
  if (!isValidFormat) {
      setUsernameError('Username can only contain letters, numbers, and underscores (no spaces or emojis).')
      setUpdating(false)
      return
    }

    // Check if username is already taken by someone else
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('profile_id')
      .eq('username', cleanUsername)
      .single()

    if (existingUser && existingUser.profile_id !== session.user.id) {
      setUsernameError('That username is already taken. Please choose another.')
      setUpdating(false)
      return
    }

    // If clear, update it
    const { error } = await supabase
      .from('profiles')
      .update({ username: cleanUsername })
      .eq('profile_id', session.user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Username updated!' })
      setProfile({ ...profile, username: cleanUsername })
      setIsEditingUsername(false)
    }
    setUpdating(false)
  }

  // --- 3. PASSWORD LOGIC ---
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setUpdating(true)
    setMessage({ type: '', text: '' })

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      setUpdating(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Password successfully updated!' })
      setIsEditingPassword(false)
      setNewPassword('')
    }
    setUpdating(false)
  }

  // --- 4. DELETE ACCOUNT LOGIC ---
  function handleDeleteAccount() {
    const confirmed = window.confirm("WARNING: This will permanently delete your account and all your itineraries. Are you absolutely sure?")
    if (confirmed) {
      alert("Note for Developer: Safely deleting an auth user requires setting up a secure PostgreSQL RPC function on the backend to bypass RLS policies. This UI is ready for when that is built!")
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Loading profile...</div>
    </div>
  )

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 p-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

          {/* Global Status Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            
            {/* PUBLIC PROFILE SECTION */}
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Public Profile</h2>
              <div className="space-y-6">
                
                {/* Display Name */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                    {!isEditingName && (
                      <button onClick={() => setIsEditingName(true)} className="text-sm text-blue-600 hover:underline">Edit</button>
                    )}
                  </div>
                  {isEditingName ? (
                    <form onSubmit={handleUpdateDisplayName} className="flex gap-2">
                      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="flex-1 border rounded-lg px-3 py-2" placeholder="e.g. SoloTraveler99" />
                      <button type="submit" disabled={updating} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
                      <button type="button" onClick={() => { setIsEditingName(false); setDisplayName(profile?.display_name || ''); }} className="bg-gray-100 px-4 py-2 rounded-lg">Cancel</button>
                    </form>
                  ) : (
                    <div className="p-3 border rounded-lg text-gray-800">{profile?.display_name || <span className="text-gray-400 italic">None set</span>}</div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">This name appears on your itinerary submissions.</p>
                </div>

                {/* Username */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    {!isEditingUsername && (
                      <button onClick={() => setIsEditingUsername(true)} className="text-sm text-blue-600 hover:underline">Edit</button>
                    )}
                  </div>
                  {isEditingUsername ? (
                    <form onSubmit={handleUpdateUsername} className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-2.5 text-gray-400">@</span>
                          <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} className="w-full border rounded-lg pl-8 pr-3 py-2" placeholder="username" />
                        </div>
                        <button type="submit" disabled={updating} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
                        <button type="button" onClick={() => { setIsEditingUsername(false); setUsername(profile?.username || ''); setUsernameError(''); }} className="bg-gray-100 px-4 py-2 rounded-lg">Cancel</button>
                      </div>
                      {usernameError && <p className="text-sm text-red-600">{usernameError}</p>}
                    </form>
                  ) : (
                    <div className="p-3 border rounded-lg text-gray-800">@{profile?.username}</div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Must be unique. No spaces allowed.</p>
                </div>

              </div>
            </div>

            {/* SECURITY & LOGIN SECTION */}
            <div className="p-8 border-t border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Security & Login</h2>
              <div className="space-y-6">
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="p-3 border bg-gray-100 rounded-lg text-gray-600">{session.user.email}</div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    {!isEditingPassword && (
                      <button onClick={() => setIsEditingPassword(true)} className="text-sm text-blue-600 hover:underline">Change Password</button>
                    )}
                  </div>
                  {isEditingPassword ? (
                    <form onSubmit={handleUpdatePassword} className="flex gap-2">
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="flex-1 border rounded-lg px-3 py-2" placeholder="New password (min. 6 characters)" />
                      <button type="submit" disabled={updating} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Update</button>
                      <button type="button" onClick={() => setIsEditingPassword(false)} className="bg-gray-100 px-4 py-2 rounded-lg">Cancel</button>
                    </form>
                  ) : (
                    <div className="p-3 border rounded-lg text-gray-800">••••••••</div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="bg-red-50 rounded-xl border border-red-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-red-700 mb-2">Danger Zone</h2>
            <p className="text-sm text-red-600 mb-4">Once you delete your account, there is no going back. All of your itineraries, upvotes, and profile data will be permanently erased.</p>
            <button 
              onClick={handleDeleteAccount}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Delete My Account
            </button>
          </div>

        </div>
      </main>
    </>
  )
}