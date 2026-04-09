import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { COUNTRY_OPTIONS } from '../constants/countries'

const roleOptions = [
  'Logistics Manager',
  'Supply Chain Analyst',
  'Operations Lead',
  'Other',
]

const SignupPage = () => {
  const navigate = useNavigate()
  const { session } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    role: '',
    country: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true })
    }
  }, [session, navigate])

  const canSubmit = useMemo(
    () =>
      form.fullName.trim() &&
      form.companyName.trim() &&
      form.email.trim() &&
      form.role.trim() &&
      form.country.trim() &&
      form.password.trim(),
    [form],
  )

  const onChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: form.fullName,
          company_name: form.companyName,
          country: form.country,
          role: form.role,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, { replace: true })
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface font-body text-on-surface selection:bg-primary-container selection:text-white">
      <header className="sticky top-0 z-50 w-full bg-gradient-to-b from-[#131b2e] to-[#131b2e]/85 px-6 py-6 backdrop-blur-sm md:px-8">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between">
          <div className="text-2xl font-headline font-bold tracking-tighter text-primary">ChainPulse</div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-label text-on-surface-variant">Already have an account?</span>
            <Link to="/login" className="text-sm font-semibold text-primary transition-colors hover:text-white">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex min-h-screen w-full flex-col lg:flex-row">
        <section className="relative hidden w-7/12 items-start justify-center overflow-hidden bg-surface-container-low px-20 pb-20 pt-16 lg:flex">
          <div className="bg-mesh absolute inset-0 opacity-50"></div>
          <div className="relative z-10 w-full max-w-2xl">
            <div className="mb-12">
              <span className="mb-4 inline-block rounded-full bg-tertiary-container px-3 py-1 text-[10px] font-label font-bold uppercase tracking-widest text-on-tertiary-container">
                Live Operational Intel
              </span>
              <h1 className="mb-6 text-5xl font-headline font-extrabold leading-tight text-white">
                Master the world's most <span className="text-primary italic">complex</span> supply chains.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-on-surface-variant">
                Join 450+ global enterprises using ChainPulse to predict disruptions before they happen. Scale your logistics with real-time operational intelligence.
              </p>
            </div>

            <div className="glass-panel flex flex-col gap-6 rounded-xl border border-outline-variant/15 p-8 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-highest">
                    <span className="material-symbols-outlined text-primary">hub</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-white">Global Transit Monitor</h3>
                    <p className="text-xs text-on-surface-variant">Active nodes across 124 regions</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="flex items-center gap-1 text-xs font-bold text-tertiary">
                    <span className="h-2 w-2 rounded-full bg-tertiary"></span>99.9% Uptime
                  </span>
                </div>
              </div>
              <div className="relative h-48 w-full overflow-hidden rounded-lg">
                <img
                  className="h-full w-full object-cover grayscale brightness-50"
                  alt="Futuristic glowing digital map showing global shipping routes"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUMaBWDZVX5fDi77E-uCu_GrbdyWlXkPrcesVyKUV78lXH3I4KK9iBfUnvvhh-qYxmgPqoWKZc6ZjJ61lOReD6D5xTimrgx-ylvXlTey_kMmUY5cRqT_yAxf3nXDkfWr93lHagSTKdlkzfwZ9dEp0jWdd34UVDbepm9Sew-E8KLYsMqB11HrWVXBaVp4uQOeUsEGtuGywebOGUrJBneXFw1EYDg9uHl_ITr4NOwhCUjRF3Opd64c6UdO-obv1qTOtSdKPmQDuGIv0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high to-transparent opacity-60"></div>
                <div className="kinetic-pulse absolute left-1/4 top-1/3 h-3 w-3 rounded-full bg-primary"></div>
                <div className="kinetic-pulse absolute left-1/2 top-2/3 h-3 w-3 rounded-full bg-tertiary"></div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex w-full items-start justify-center overflow-y-auto bg-gradient-to-b from-[#0b1326] via-[#08122a] to-[#0b1326] px-6 pb-16 pt-6 lg:w-5/12 lg:px-16 lg:pt-10">
          <div className="flex w-full max-w-[420px] flex-col pb-10 pt-2 lg:py-8">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="mb-3 text-4xl font-headline font-extrabold tracking-tight text-white">Start Your Free Trial</h2>
              <p className="text-sm font-label tracking-wide text-on-surface-variant">Enter your details to begin your 14-day premium trial.</p>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex items-center justify-center gap-3 rounded-xl border border-outline-variant/10 bg-surface-container-high px-6 py-3.5 text-sm font-semibold text-on-surface transition-all duration-300 hover:bg-surface-bright disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="relative mb-8 text-center">
              <hr className="border-outline-variant/20" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0a142d] px-4 text-[10px] font-label uppercase tracking-[0.2em] text-outline">
                or sign up with email
              </span>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="mb-2 ml-1 block text-xs font-label uppercase tracking-wider text-on-surface-variant" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={form.fullName}
                  onChange={onChange('fullName')}
                  className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3.5 text-white placeholder:text-outline/50 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-2 ml-1 block text-xs font-label uppercase tracking-wider text-on-surface-variant" htmlFor="email">Work Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={form.email}
                  onChange={onChange('email')}
                  className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3.5 text-white placeholder:text-outline/50 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-2 ml-1 block text-xs font-label uppercase tracking-wider text-on-surface-variant" htmlFor="companyName">Company Name</label>
                <input
                  id="companyName"
                  type="text"
                  placeholder="Acme Logistics"
                  required
                  value={form.companyName}
                  onChange={onChange('companyName')}
                  className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3.5 text-white placeholder:text-outline/50 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-2 ml-1 block text-xs font-label uppercase tracking-wider text-on-surface-variant" htmlFor="role">Roles</label>
                <select
                  id="role"
                  required
                  value={form.role}
                  onChange={onChange('role')}
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
                  onChange={onChange('country')}
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
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    minLength={8}
                    required
                    value={form.password}
                    onChange={onChange('password')}
                    className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3.5 text-white placeholder:text-outline/50 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-primary"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <p className="mt-2 px-1 text-[10px] text-outline">Must be at least 12 characters with one symbol.</p>
              </div>
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-primary to-primary-container py-3.5 text-base font-headline font-bold text-on-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40 disabled:opacity-60"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {error && (
              <p className="mt-5 rounded-lg border border-red-500/35 bg-red-950/20 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}

            <p className="mt-6 text-center text-xs leading-relaxed text-on-surface-variant">
              By clicking Create Account, you agree to our <a className="text-primary hover:underline" href="#">Terms of Service</a> and <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
            </p>

            <div className="mt-auto pt-12">
              <div className="flex items-center justify-center gap-8 grayscale opacity-40 transition-all duration-500 hover:opacity-80 hover:grayscale-0">
                <div className="flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-3xl">verified_user</span>
                  <span className="text-[10px] font-label font-bold uppercase tracking-tighter">SOC2 Type II</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-3xl">security</span>
                  <span className="text-[10px] font-label font-bold uppercase tracking-tighter">GDPR Ready</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-3xl">encrypted</span>
                  <span className="text-[10px] font-label font-bold uppercase tracking-tighter">AES-256</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="pointer-events-none fixed bottom-[-10%] right-[-5%] -z-10 h-[40vw] w-[40vw] rounded-full bg-primary/5 blur-[120px]"></div>
      <div className="pointer-events-none fixed left-[-5%] top-[10%] -z-10 h-[30vw] w-[30vw] rounded-full bg-tertiary/5 blur-[100px]"></div>
    </div>
  )
}

export default SignupPage
