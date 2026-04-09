import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Completing sign-in...')

  useEffect(() => {
    let isMounted = true

    const finalizeAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const authError = params.get('error')
      const authErrorDescription = params.get('error_description')

      if (authError) {
        if (isMounted) {
          const description = authErrorDescription ? decodeURIComponent(authErrorDescription) : 'Google sign-in failed.'
          navigate('/login', { replace: true, state: { oauthError: description } })
        }
        return
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          if (isMounted) {
            navigate('/login', { replace: true, state: { oauthError: error.message } })
          }
          return
        }
      }

      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        if (isMounted) {
          navigate('/login', {
            replace: true,
            state: { oauthError: error?.message || 'Unable to restore your session. Please try again.' },
          })
        }
        return
      }

      if (isMounted) {
        setMessage('Sign-in successful. Redirecting...')
        navigate('/dashboard', { replace: true })
      }
    }

    finalizeAuth()

    return () => {
      isMounted = false
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg px-6 text-dark-text">
      <div className="rounded-xl border border-gray-700/60 bg-dark-card px-6 py-4 text-center text-sm text-dark-muted">
        {message}
      </div>
    </div>
  )
}

export default AuthCallbackPage
