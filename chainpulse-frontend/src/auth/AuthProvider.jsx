import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
})

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const getUserWithTimeout = async (timeoutMs = 5000) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Auth validation timed out')), timeoutMs)
    })
    return Promise.race([supabase.auth.getUser(), timeoutPromise])
  }

  const resolveValidSession = async (nextSession) => {
    if (!nextSession) {
      setSession(null)
      setLoading(false)
      return
    }

    try {
      // Validate against Supabase auth API so deleted users cannot stay logged in via stale local storage.
      const userResponse = await getUserWithTimeout()
      const userData = userResponse?.data
      const userError = userResponse?.error

      if (userError || !userData?.user) {
        setSession(null)
        setLoading(false)
        // Fire-and-forget cleanup. Do not block UI transition on network issues.
        supabase.auth.signOut()
        return
      }

      setSession(nextSession)
      setLoading(false)
    } catch {
      setSession(null)
      setLoading(false)
      supabase.auth.signOut()
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!isMounted) return
      if (!error) {
        await resolveValidSession(data.session)
        return
      }
      setSession(null)
      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      await resolveValidSession(nextSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
