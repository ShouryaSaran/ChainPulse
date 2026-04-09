import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const VerifyEmailPage = () => {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const email = params.get('email')

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg px-4 py-10 text-dark-text">
      <div className="w-full max-w-lg rounded-2xl border border-gray-700/70 bg-dark-card/95 p-8 text-center shadow-2xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.3em] text-accent-blue">ChainPulse</p>
        <h1 className="mt-3 text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-dark-muted">
          We sent a verification link{email ? ` to ${email}` : ''}. Verify your account, then continue to login.
        </p>

        <div className="mt-6 rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-4 py-3 text-sm text-cyan-100">
          After verification, you can sign in with Google OAuth or email magic link.
        </div>

        <div className="mt-7 flex flex-col items-center gap-2 text-sm">
          <Link to="/login" className="font-semibold text-accent-blue hover:text-cyan-300">
            Go to Login
          </Link>
          <Link to="/signup" className="text-dark-muted hover:text-dark-text">
            Back to Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage
