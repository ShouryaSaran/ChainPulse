import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X, MapPin, Flame, RotateCcw, AlertTriangle, Zap } from 'lucide-react'
import { disruptionAPI } from '../../services/api'

const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical']

const PORT_CITIES = [
  { label: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { label: 'Rotterdam', lat: 51.9244, lon: 4.4777 },
  { label: 'Shanghai', lat: 31.2304, lon: 121.4737 },
  { label: 'Los Angeles', lat: 33.7405, lon: -118.2728 },
  { label: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
  { label: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { label: 'Hamburg', lat: 53.5511, lon: 9.9937 },
  { label: 'Busan', lat: 35.1796, lon: 129.0756 },
  { label: 'Santos', lat: -23.9540, lon: -46.3336 },
  { label: 'Mumbai', lat: 19.0760, lon: 72.8777 },
]

const DISRUPTION_TYPES = [
  { label: 'Weather Storm', value: 'weather_storm' },
  { label: 'Port Strike', value: 'port_strike' },
  { label: 'Road Closure', value: 'road_closure' },
  { label: 'Earthquake', value: 'earthquake' },
]

const severityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const DisruptionSimulator = ({
  isOpen,
  onClose,
  mapPickMode,
  onMapPickModeChange,
  selectedLocation,
  onLocationPick,
  onTriggered,
  onDemoReroute,
  activeSimulation,
  activeAffectedShipments,
  onCancelDisruption,
  isCancellingDisruption,
}) => {
  const [form, setForm] = useState({
    disruption_type: 'weather_storm',
    severity: 'medium',
    location: PORT_CITIES[0].label,
    lat: PORT_CITIES[0].lat,
    lon: PORT_CITIES[0].lon,
    affected_radius_km: 200,
    duration_hours: 12,
  })
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [demoRunning, setDemoRunning] = useState(false)
  const demoTimersRef = useRef([])

  useEffect(() => {
    if (selectedLocation?.label) {
      setForm((current) => ({
        ...current,
        location: selectedLocation.label,
        lat: selectedLocation.lat,
        lon: selectedLocation.lon,
      }))
    }
  }, [selectedLocation])

  useEffect(() => {
    if (!isOpen) {
      setDemoRunning(false)
      setStatusMessage('')
      onMapPickModeChange?.(false)
    }
  }, [isOpen, onMapPickModeChange])

  useEffect(() => {
    return () => {
      demoTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      demoTimersRef.current = []
    }
  }, [])

  const currentSeverityIndex = useMemo(
    () => Math.max(0, SEVERITY_LEVELS.indexOf(form.severity)),
    [form.severity],
  )

  const setLocationFromCity = (cityLabel) => {
    const city = PORT_CITIES.find((item) => item.label === cityLabel) || PORT_CITIES[0]
    setForm((current) => ({
      ...current,
      location: city.label,
      lat: city.lat,
      lon: city.lon,
    }))
    onLocationPick?.({ label: city.label, lat: city.lat, lon: city.lon })
  }

  const handleMapMode = (enabled) => {
    onMapPickModeChange?.(enabled)
    setStatusMessage(enabled ? 'Click the map to set the disruption location.' : '')
  }

  const handleMapSelection = (location) => {
    setForm((current) => ({
      ...current,
      location: 'Map Selected Location',
      lat: location.lat,
      lon: location.lon,
    }))
    onLocationPick?.({ label: 'Map Selected Location', lat: location.lat, lon: location.lon })
    setStatusMessage(`Location set from map: ${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`)
  }

  const triggerDisruption = async (override = {}) => {
    setIsSubmitting(true)
    setStatusMessage('Triggering disruption...')
    try {
      const payload = {
        ...form,
        ...override,
      }
      const response = await disruptionAPI.simulate(payload)
      const message = response.data?.message || 'Disruption triggered!'
      setStatusMessage(message)
      onTriggered?.(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to simulate disruption:', error)
      setStatusMessage('Simulation failed. Check backend connection.')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const runDemoSequence = async () => {
    if (demoRunning) return
    setDemoRunning(true)

    const stormPayload = {
      disruption_type: 'weather_storm',
      severity: 'critical',
      location: 'North Pacific',
      lat: 35.0,
      lon: -160.0,
      affected_radius_km: 900,
      duration_hours: 18,
    }

    setForm(stormPayload)
    onMapPickModeChange?.(false)
    onLocationPick?.({ label: stormPayload.location, lat: stormPayload.lat, lon: stormPayload.lon })
    setStatusMessage('Demo mode started: storm building in the Pacific...')

    demoTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    demoTimersRef.current = []

    await triggerDisruption(stormPayload)

    demoTimersRef.current.push(window.setTimeout(() => {
      setStatusMessage('3 shipments have moved to at_risk...')
    }, 2000))

    demoTimersRef.current.push(window.setTimeout(() => {
      setStatusMessage('AI recommends rerouting around the disruption.')
    }, 4000))

    demoTimersRef.current.push(window.setTimeout(() => {
      onDemoReroute?.()
      setStatusMessage('Shipments rerouted to alternate paths on the map.')
    }, 6000))

    demoTimersRef.current.push(window.setTimeout(() => {
      setStatusMessage('Disruption avoided! Estimated delay prevented: 4.2 days')
      setDemoRunning(false)
    }, 8000))
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Close disruption simulator overlay"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-gray-700/60 bg-dark-card shadow-2xl shadow-black/30 transform transition-transform duration-300 ease-out translate-x-0">
        <div className="flex items-center justify-between border-b border-gray-700/50 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-dark-text">Disruption Simulator</h2>
            <p className="text-xs text-dark-muted">Hackathon judge controls</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-dark-muted transition-colors hover:bg-white/5 hover:text-dark-text"
          >
            <X size={18} />
          </button>
        </div>

        <div className="h-[calc(100%-65px)] overflow-y-auto px-5 py-4 space-y-5">
          <div className="rounded-xl border border-gray-700/50 bg-dark-bg/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-dark-text">Simulation Mode</p>
                <p className="text-xs text-dark-muted">Use the controls below to inject disruption scenarios.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-dark-muted">
                <Flame size={14} className="text-accent-amber" />
                <span>{demoRunning ? 'Demo running' : 'Ready'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-dark-muted">Disruption Type</label>
              <select
                value={form.disruption_type}
                onChange={(event) => setForm((current) => ({ ...current, disruption_type: event.target.value }))}
                className="w-full rounded-lg border border-gray-700/60 bg-dark-bg px-3 py-2 text-sm text-dark-text outline-none transition-colors focus:border-accent-blue"
              >
                {DISRUPTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wide text-dark-muted">Severity</label>
                <span className="text-xs text-dark-text">{severityLabels[form.severity]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={currentSeverityIndex}
                onChange={(event) => setForm((current) => ({ ...current, severity: SEVERITY_LEVELS[Number(event.target.value)] }))}
                className="w-full accent-accent-blue"
              />
              <div className="mt-2 flex justify-between text-[11px] text-dark-muted">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Critical</span>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-gray-700/50 bg-dark-bg/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-dark-muted">Location Picker</label>
                  <p className="text-[11px] text-dark-muted">Choose a port city or capture coordinates from the map.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleMapMode(!mapPickMode)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    mapPickMode ? 'bg-accent-blue text-dark-text' : 'bg-white/5 text-dark-muted hover:text-dark-text'
                  }`}
                >
                  <MapPin size={14} className="inline-block mr-1" />
                  {mapPickMode ? 'Map picking on' : 'Use map click'}
                </button>
              </div>

              <select
                value={form.location === 'Map Selected Location' ? '' : form.location}
                onChange={(event) => setLocationFromCity(event.target.value)}
                className="w-full rounded-lg border border-gray-700/60 bg-dark-bg px-3 py-2 text-sm text-dark-text outline-none transition-colors focus:border-accent-blue"
              >
                {PORT_CITIES.map((city) => (
                  <option key={city.label} value={city.label}>{city.label}</option>
                ))}
              </select>

              <div className="rounded-lg border border-gray-700/60 bg-black/20 px-3 py-2 text-xs text-dark-muted">
                <span className="text-dark-text">Selected:</span>{' '}
                {selectedLocation?.label || form.location} ({form.lat.toFixed(2)}, {form.lon.toFixed(2)})
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wide text-dark-muted">Affected Radius</label>
                <span className="text-xs text-dark-text">{form.affected_radius_km} km</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="10"
                value={form.affected_radius_km}
                onChange={(event) => setForm((current) => ({ ...current, affected_radius_km: Number(event.target.value) }))}
                className="w-full accent-accent-blue"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wide text-dark-muted">Duration</label>
                <span className="text-xs text-dark-text">{form.duration_hours} hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="72"
                step="1"
                value={form.duration_hours}
                onChange={(event) => setForm((current) => ({ ...current, duration_hours: Number(event.target.value) }))}
                className="w-full accent-accent-blue"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => triggerDisruption()}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-red to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Zap size={18} />
              <span>{isSubmitting ? 'Triggering...' : 'Trigger Disruption'}</span>
            </button>

            <button
              type="button"
              onClick={runDemoSequence}
              disabled={demoRunning}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-700/60 bg-white/5 px-4 py-3 text-sm font-semibold text-dark-text transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <AlertTriangle size={18} className="text-accent-amber" />
              <span>{demoRunning ? 'Demo Running...' : '🎬 Demo Mode'}</span>
            </button>

            <button
              type="button"
              onClick={onCancelDisruption}
              disabled={!activeSimulation || isCancellingDisruption}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/20 px-4 py-3 text-sm font-semibold text-red-200 transition-colors hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={18} />
              <span>
                {isCancellingDisruption
                  ? 'Cancelling disruption...'
                  : activeSimulation
                    ? `Cancel Active Disruption (${activeAffectedShipments?.length || 0})`
                    : 'No Active Disruption'}
              </span>
            </button>
          </div>

          <div className="rounded-xl border border-gray-700/50 bg-dark-bg/70 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-dark-muted">Status</p>
            <p className="mt-2 text-dark-text leading-relaxed">{statusMessage || 'Ready to launch a disruption scenario.'}</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default DisruptionSimulator