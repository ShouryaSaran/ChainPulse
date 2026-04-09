import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import App from './App.jsx'
import LandingPage from './LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import AuthCallbackPage from './pages/AuthCallbackPage.jsx'
import { AuthProvider } from './auth/AuthProvider.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import { supabase } from './supabaseClient.js'
import './index.css'

const DashboardScreen = () => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return <App onLogout={handleLogout} />
}

const HashPathBridge = () => {
  const navigate = useNavigate()

  useEffect(() => {
    if (window.location.hash === '#/app') {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  return null
}

const AppRoutes = () => {
  const navigate = useNavigate()

  return (
    <>
      <HashPathBridge />
      <Routes>
        <Route path="/" element={<LandingPage onLaunchDemo={() => navigate('/dashboard')} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

const Root = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
