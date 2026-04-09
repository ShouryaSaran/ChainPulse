import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-bg text-dark-text">
        <div className="rounded-xl border border-gray-700/60 bg-dark-card px-5 py-3 text-sm text-dark-muted">
          Restoring session...
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export default ProtectedRoute
