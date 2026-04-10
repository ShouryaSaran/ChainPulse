import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { COUNTRY_OPTIONS } from '../constants/countries'

const roleOptions = [
  'Logistics Manager',
  'Supply Chain Analyst',
  'Operations Lead',
  'Other',
]

const CompleteProfilePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, loading } = useAuth()

  const metadata = session?.user?.user_metadata || {}

  const [form, setForm] = useState({
    fullName: metadata.full_name || session?.user?.user_metadata?.name || '',
    companyName: metadata.company_name || '',
    role: metadata.role || '',
    country: metadata.country || '',
    password: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { replace: true })
    }
  }, [loading, session, navigate])

  const canSubmit = useMemo(() => {
    return (
      form.fullName.trim() &&
      form.companyName.trim() &&
      form.role.trim() &&
      form.country.trim() &&
      form.password.trim() &&
      form.password === form.confirmPassword
    )
  }, [form])

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: form.password,
      data: {
        full_name: form.fullName,
        company_name: form.companyName,
        role: form.role,
        country: form.country,
        profile_completed: true,
      },
    })

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    navigate(location.state?.from || '/dashboard', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6 py-10 text-on-surface">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1326] via-[#08122a] to-[#0b1326]" />
      <div className="absolute left-[-6%] top-[-8%] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-8%] right-[-4%] h-96 w-96 rounded-full bg-tertiary/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-outline-variant/15 bg-surface-container-low/90 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-primary">ChainPulse</p>
          <h1 className="mt-3 text-3xl font-headline font-extrabold text-white">Complete your profile</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            Google signed you in, but we still need the operational details before you enter the dashboard. Add your role, country, company, and set a password for email login.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 ml-1 block text-xs font-label uppercase tracking-wider text-on-surface-variant" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              required
              value={form.fullName}
              onChange={handleChange('fullName')}
              className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3.5 text-white outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 ml-1 block text-xs font-label uppercase tracking-wider text-on-surface-variant" htmlFor="companyName">Company Name</label>
            <input
              id="companyName"
              type="text"
              required
              value={form.companyName}
              onChange={handleChange('companyName')}
              className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3.5 text-white outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 ml-1 block text-xs font-label uppercase tracking-wider text-on-surface-variant" htmlFor="role">Role</label>
            <select
              id="role"
              required
              value={form.role}
              onChange={handleChange('role')}
              className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3.5 text-white outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>Select your role</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 ml-1 block text-xs font-label uppercase tracking-wider text-on-surface-variant" htmlFor="country">Country</label>
            <select
              id="country"
              required
              value={form.country}
              onChange={handleChange('country')}
              className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3.5 text-white outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>Select your country</option>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 ml-1 block text-xs font-label uppercase tracking-wider text-on-surface-variant" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange('password')}
              className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3.5 text-white outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 ml-1 block text-xs font-label uppercase tracking-wider text-on-surface-variant" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3.5 text-white outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-container py-3.5 text-base font-headline font-bold text-on-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40 disabled:opacity-60"
            >
              {saving ? 'Saving profile...' : 'Finish Setup'}
            </button>
          </div>
        </form>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-500/35 bg-red-950/20 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default CompleteProfilePage