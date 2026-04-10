import React, { useState, useEffect } from 'react'
import { Clock3, BadgeCheck, Siren, XCircle } from 'lucide-react'
import ShipmentMap from './components/Map/ShipmentMap'
import StatsBar from './components/Dashboard/StatsBar'
import DisruptionFeed from './components/Dashboard/DisruptionFeed'
import ShipmentList from './components/Shipments/ShipmentList'
import RiskAssessmentModal from './components/Shipments/RiskAssessmentModal'
import AlertPanel from './components/Alerts/AlertPanel'
import ToastStack from './components/Alerts/ToastStack'
import DisruptionSimulator from './components/Simulator/DisruptionSimulator'
import { useShipments } from './hooks/useShipments'
import { shipmentAPI } from './services/api'
import { disruptionAPI } from './services/api'
import { predictionAPI } from './services/api'
import { useAuth } from './auth/AuthProvider'
import { 
  initSocket, 
  onSocketStatus,
  onShipmentUpdate, 
  onRiskAssessment, 
  onNewDisruption, 
  onDisruptionCleared,
  onAlert 
} from './services/socket'

const initialAlerts = [
  {
    id: 'seed-1',
    type: 'high_risk',
    tracking_id: 'CP-123456',
    message: 'Storm warning along route',
    severity: 'high',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    is_read: false,
  },
  {
    id: 'seed-2',
    type: 'shipment_update',
    tracking_id: 'CP-789012',
    message: 'Port congestion detected',
    severity: 'medium',
    timestamp: new Date(Date.now() - 18 * 60 * 1000),
    is_read: false,
  },
]

function App({ onLogout }) {
  const { user } = useAuth()
  const ownerEmail = user?.email ?? null
  const { shipments: apiShipments, loading } = useShipments(ownerEmail)
  
  // Local state for real-time updates
  const [shipments, setShipments] = useState([])
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [routes, setRoutes] = useState(null)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false)
  const [mapPickMode, setMapPickMode] = useState(false)
  const [socketStatus, setSocketStatus] = useState('connecting')
  const [utcTime, setUtcTime] = useState(() => new Date().toUTCString().replace(' GMT', ' UTC'))
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)
  const [loadingVisible, setLoadingVisible] = useState(true)
  const [loadingStep, setLoadingStep] = useState(0)
  const [simulatorLocation, setSimulatorLocation] = useState({
    label: 'Singapore',
    lat: 1.3521,
    lon: 103.8198,
  })
  const [disruptions, setDisruptions] = useState([
    {
      id: 1,
      type: 'weather',
      severity: 'high',
      location: 'Singapore Strait',
      lat: 1.35,
      lon: 103.82,
      description: 'Heavy storm warning in effect',
      affected_radius_km: 150,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      id: 2,
      type: 'port_closure',
      severity: 'medium',
      location: 'Port of Rotterdam',
      lat: 51.92,
      lon: 4.48,
      description: 'Congestion alert',
      affected_radius_km: 80,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000)
    },
    {
      id: 3,
      type: 'flood',
      severity: 'high',
      location: 'Hong Kong Region',
      lat: 22.32,
      lon: 114.17,
      description: 'Flooding reported in region',
      affected_radius_km: 200,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 18 * 60 * 60 * 1000)
    }
  ])
  const [alerts, setAlerts] = useState(initialAlerts)
  const [toasts, setToasts] = useState([])
  const [activeSimulation, setActiveSimulation] = useState(null)
  const [activeAffectedShipments, setActiveAffectedShipments] = useState([])
  const [isCancellingDisruption, setIsCancellingDisruption] = useState(false)
  const [assessmentModalData, setAssessmentModalData] = useState(null)

  const createDemoDetourRoutes = (currentRoutes) => {
    if (!currentRoutes || currentRoutes.length === 0) {
      return currentRoutes
    }

    return currentRoutes.map((route, routeIndex) => {
      if (!route?.waypoints) return route

      const waypoints = route.waypoints.map((waypoint, waypointIndex, array) => {
        const [lat, lon] = waypoint
        const progress = array.length > 1 ? waypointIndex / (array.length - 1) : 0
        const bend = Math.sin(progress * Math.PI) * (routeIndex === 0 ? 0.9 : 0.5)
        return [lat + bend, lon + bend * 0.75]
      })

      return { ...route, waypoints }
    })
  }

  const selectShipmentByTrackingId = (trackingId) => {
    const shipment = shipments.find((item) => item.tracking_id === trackingId)
    if (shipment) {
      setSelectedShipment(shipment)
    }
  }

  const markAlertRead = (alertId) => {
    setAlerts((currentAlerts) =>
      currentAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, is_read: true } : alert,
      ),
    )
  }

  const clearAlerts = () => {
    setAlerts([])
  }

  const removeToast = (toastId) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId))
  }

  const pushToast = (toast) => {
    setToasts((currentToasts) => {
      const nextToasts = [toast, ...currentToasts.filter((item) => item.id !== toast.id)]
      return nextToasts.slice(0, 3)
    })
  }

  const addAlert = (data) => {
    const newAlert = {
      id: data.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: data.type || 'alert',
      tracking_id: data.tracking_id,
      message: data.message || 'Alert received',
      severity: data.severity || (data.type === 'high_risk' ? 'critical' : 'medium'),
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      is_read: false,
    }

    setAlerts((currentAlerts) => [newAlert, ...currentAlerts])
    pushToast(newAlert)
  }

  const formatUtcTime = (date) => date.toUTCString().replace(' GMT', ' UTC')

  const ChainPulseLogo = ({ className = 'h-8 w-8' }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="navLogoGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <path
        d="M18 24c0-4.4 3.6-8 8-8h6v6h-6a2 2 0 0 0 0 4h8v-4h6v4h8a2 2 0 0 0 0-4h-6v-6h6c4.4 0 8 3.6 8 8s-3.6 8-8 8h-6v-6h6a2 2 0 0 0 0-4h-8v4h-6v-4h-8a2 2 0 0 0 0 4h6v6h-6c-4.4 0-8-3.6-8-8Z"
        fill="url(#navLogoGradient)"
      />
      <path
        d="M16 42h8l5-10 5 16 4-8h10"
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  const LoadingScreen = () => {
    const loadingSteps = [
      'Connecting to data feeds...',
      'Initializing ML model...',
      'Loading shipments...',
    ]

    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-dark-bg px-6 transition-opacity duration-300 ${
          loadingVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-full max-w-md rounded-3xl border border-gray-700/60 bg-dark-card/90 p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col items-center text-center">
            <div className="animate-logo-in mb-4 flex items-center gap-3">
              <ChainPulseLogo className="h-14 w-14" />
              <div className="text-left">
                <p className="text-xs uppercase tracking-[0.35em] text-accent-blue">ChainPulse</p>
                <h2 className="text-2xl font-bold text-dark-text">Supply Chain Intelligence</h2>
              </div>
            </div>

            <div className="mb-5 w-full overflow-hidden rounded-full bg-white/5 p-1">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-accent-blue via-cyan-400 to-accent-green transition-all duration-500"
                style={{ width: `${(loadingStep + 1) * (100 / loadingSteps.length)}%` }}
              />
            </div>

            <div className="space-y-2 text-left">
              {loadingSteps.map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                    index === loadingStep
                      ? 'bg-white/6 text-dark-text'
                      : 'text-dark-muted opacity-60'
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      index === loadingStep ? 'bg-accent-green animate-pulse' : 'bg-gray-600'
                    }`}
                  />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleTriggerSuccess = (responseData) => {
    if (responseData?.disruption) {
      setActiveSimulation(responseData.disruption)
      setActiveAffectedShipments(responseData.affected_shipments || [])
    }

    const firstAffectedTrackingId = responseData?.affected_shipments?.[0]?.tracking_id
    if (!firstAffectedTrackingId) return

    const affectedShipment = shipments.find((shipment) => shipment.tracking_id === firstAffectedTrackingId)
    if (affectedShipment) {
      setSelectedShipment(affectedShipment)
    }
  }

  const handleMapClickForSimulator = (location) => {
    if (!mapPickMode) return
    setSimulatorLocation({
      label: 'Map Selected Location',
      lat: location.lat,
      lon: location.lon,
    })
  }

  const handleDemoReroute = () => {
    setRoutes((currentRoutes) => createDemoDetourRoutes(currentRoutes))
  }

  const handleDeleteShipment = (trackingId) => {
    setShipments((prev) => prev.filter((shipment) => shipment.tracking_id !== trackingId))
    setActiveAffectedShipments((prev) => prev.filter((shipment) => shipment.tracking_id !== trackingId))

    setSelectedShipment((prev) => {
      if (!prev || prev.tracking_id !== trackingId) return prev
      setRoutes(null)
      return null
    })

    setAssessmentModalData((prev) => {
      if (!prev) return prev
      const modalTrackingId = prev.assessment?.tracking_id || prev.shipment?.tracking_id
      return modalTrackingId === trackingId ? null : prev
    })
  }

  const openRiskAssessmentForTrackingId = async (trackingId) => {
    if (!trackingId) return

    const shipment = shipments.find((item) => item.tracking_id === trackingId)
    if (shipment) {
      setSelectedShipment(shipment)
    }

    try {
      const response = await predictionAPI.assess(trackingId, ownerEmail)
      setAssessmentModalData({
        shipment: shipment || { tracking_id: trackingId },
        assessment: response.data,
      })
    } catch (error) {
      console.error('Failed to assess risk from disruption panel:', error)
    }
  }

  const applyShipmentRestores = (restoredShipments) => {
    if (!restoredShipments?.length) return

    setShipments((prevShipments) =>
      prevShipments.map((shipment) => {
        const restored = restoredShipments.find((item) => item.id === shipment.id)
        if (!restored) return shipment
        return {
          ...shipment,
          status: restored.status,
          risk_score: restored.risk_score,
          current_lat: restored.current_lat,
          current_lon: restored.current_lon,
        }
      }),
    )

    setSelectedShipment((prevSelected) => {
      if (!prevSelected) return prevSelected
      const restored = restoredShipments.find((item) => item.id === prevSelected.id)
      if (!restored) return prevSelected
      return {
        ...prevSelected,
        status: restored.status,
        risk_score: restored.risk_score,
        current_lat: restored.current_lat,
        current_lon: restored.current_lon,
      }
    })
  }

  const handleCancelSimulation = async () => {
    if (!activeSimulation?.id || isCancellingDisruption) return

    setIsCancellingDisruption(true)
    try {
      const response = await disruptionAPI.cancel(activeSimulation.id)
      const restoredShipments = response?.data?.restored_shipments || []
      applyShipmentRestores(restoredShipments)

      setDisruptions((prev) => prev.filter((item) => item.id !== activeSimulation.id))
      setActiveSimulation(null)
      setActiveAffectedShipments([])
    } catch (error) {
      console.error('Failed to cancel disruption:', error)
    } finally {
      setIsCancellingDisruption(false)
    }
  }

  // Initialize socket connection
  useEffect(() => {
    initSocket()
  }, [])

  useEffect(() => {
    const unsubscribe = onSocketStatus((status) => {
      setSocketStatus(status)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setUtcTime(formatUtcTime(new Date()))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const loadingTimer = window.setTimeout(() => {
      setLoadingVisible(false)
      window.setTimeout(() => setShowLoadingScreen(false), 300)
    }, 2500)

    const stepTimer = window.setInterval(() => {
      setLoadingStep((current) => (current + 1) % 3)
    }, 750)

    return () => {
      window.clearTimeout(loadingTimer)
      window.clearInterval(stepTimer)
    }
  }, [])

  // Sync API shipments to local state
  useEffect(() => {
    setShipments(apiShipments ?? [])
    setSelectedShipment((currentSelected) =>
      apiShipments?.some((shipment) => shipment.id === currentSelected?.id) ? currentSelected : null,
    )
  }, [apiShipments])

  // Listen for shipment position updates
  useEffect(() => {
    const unsubscribe = onShipmentUpdate((data) => {
      setShipments(prevShipments =>
        prevShipments.map(shipment =>
          shipment.id === data.id
            ? {
                ...shipment,
                current_lat: data.current_lat,
                current_lon: data.current_lon,
                risk_score: data.risk_score,
                status: data.status
              }
            : shipment
        )
      )
      
      // Update selected shipment if it was updated
      if (selectedShipment?.id === data.id) {
        setSelectedShipment(prev => ({
          ...prev,
          current_lat: data.current_lat,
          current_lon: data.current_lon,
          risk_score: data.risk_score,
          status: data.status
        }))
      }
    })

    return unsubscribe
  }, [selectedShipment])

  // Listen for risk assessments
  useEffect(() => {
    const unsubscribe = onRiskAssessment((data) => {
      setShipments(prevShipments =>
        prevShipments.map(shipment =>
          shipment.tracking_id === data.tracking_id
            ? { ...shipment, risk_score: data.risk_score }
            : shipment
        )
      )

      // Update selected shipment if it was updated
      if (selectedShipment?.tracking_id === data.tracking_id) {
        setSelectedShipment(prev => ({ ...prev, risk_score: data.risk_score }))
      }
    })

    return unsubscribe
  }, [selectedShipment])

  // Listen for new disruptions
  useEffect(() => {
    const unsubscribe = onNewDisruption((data) => {
      const newDisruption = {
        id: data.id,
        type: data.type,
        severity: data.severity,
        location: data.location,
        lat: data.lat,
        lon: data.lon,
        affected_radius_km: data.affected_radius_km,
        description: data.description,
        created_at: new Date(data.created_at),
        expires_at: new Date(data.expires_at)
      }

      setDisruptions(prev => [newDisruption, ...prev])
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = onDisruptionCleared((data) => {
      setDisruptions((prev) => prev.filter((item) => item.id !== data.id))
      setActiveSimulation((prev) => (prev?.id === data.id ? null : prev))
      setActiveAffectedShipments((prev) => {
        if (activeSimulation?.id !== data.id) return prev
        return []
      })
    })

    return unsubscribe
  }, [activeSimulation?.id])

  // Listen for alerts
  useEffect(() => {
    const unsubscribe = onAlert((data) => {
      addAlert(data)
    })

    return unsubscribe
  }, [])

  // Fetch routes for selected shipment
  useEffect(() => {
    if (selectedShipment) {
      const fetchRoute = async () => {
        try {
          const response = await shipmentAPI.getRoute(selectedShipment.tracking_id, ownerEmail)
          setRoutes([
            { waypoints: response.data.current_route },
            ...response.data.alternate_routes.map(route => ({
              waypoints: route
            }))
          ])
        } catch (err) {
          console.error('Failed to fetch route:', err)
        }
      }
      fetchRoute()
    }
  }, [selectedShipment, ownerEmail])

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {showLoadingScreen && <LoadingScreen />}

      <header className="fixed left-0 right-0 top-0 z-40 border-b border-gray-700/50 bg-dark-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="animate-logo-in flex items-center gap-3">
              <ChainPulseLogo />
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-accent-blue">ChainPulse</p>
                <p className="text-sm text-dark-muted">Supply Chain Intelligence</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 rounded-full border border-gray-700/50 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-dark-text">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  socketStatus === 'connected'
                    ? 'bg-accent-green animate-pulse'
                    : socketStatus === 'disconnected'
                      ? 'bg-accent-red'
                      : 'bg-accent-amber animate-pulse'
                }`}
              />
              <span>LIVE</span>
            </div>

            <div className="hidden rounded-full border border-gray-700/50 bg-white/5 px-3 py-1.5 text-xs text-dark-muted sm:flex items-center gap-2">
              <Clock3 size={14} />
              <span>{utcTime}</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/30 px-3 py-1.5 text-xs font-semibold text-amber-200">
              <BadgeCheck size={14} />
              <span>Hackathon Demo</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-gray-700/70 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-dark-text transition hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1800px] grid-cols-1 gap-4 px-4 pb-4 pt-20 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <section className="space-y-4 min-w-0">
          <StatsBar ownerEmail={ownerEmail} />

          {activeSimulation && (
            <div className="animate-fade-in-up rounded-lg border border-red-500/30 bg-red-950/20 p-4" style={{ animationDelay: '40ms' }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Siren size={18} className="text-accent-red" />
                  <div>
                    <p className="text-sm font-semibold text-dark-text">Affected Shipments</p>
                    <p className="text-xs text-dark-muted">
                      {activeSimulation.location} • {activeSimulation.severity} • {activeAffectedShipments.length} affected
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelSimulation}
                  disabled={isCancellingDisruption}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-950/50 disabled:opacity-60"
                >
                  <XCircle size={14} />
                  {isCancellingDisruption ? 'Cancelling...' : 'Cancel Disruption'}
                </button>
              </div>

              {activeAffectedShipments.length ? (
                <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                  {activeAffectedShipments.map((shipment) => (
                    <button
                      key={shipment.id}
                      type="button"
                      onClick={() => openRiskAssessmentForTrackingId(shipment.tracking_id)}
                      className="w-full rounded-lg border border-gray-700/50 bg-dark-bg/70 px-3 py-2 text-left transition-colors hover:bg-dark-bg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-accent-blue">{shipment.tracking_id}</span>
                        <span className="text-xs text-accent-red">{(Number(shipment.risk_score || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <p className="mt-1 text-xs capitalize text-dark-muted">Status: {shipment.status.replace('_', ' ')}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-dark-muted">No shipments are currently impacted by this disruption.</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="h-[64vh] min-h-[520px] animate-fade-in-up" style={{ animationDelay: '80ms' }}>
              <ShipmentMap
                shipments={shipments}
                selectedShipment={selectedShipment}
                onShipmentSelect={setSelectedShipment}
                routes={selectedShipment ? routes : null}
                disruptions={disruptions}
                onMapClick={mapPickMode ? handleMapClickForSimulator : undefined}
              />
            </div>

            <div className="h-36 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
              <DisruptionFeed
                shipments={shipments}
                disruptions={disruptions}
                selectedShipment={selectedShipment}
              />
            </div>
          </div>
        </section>

        <aside className="space-y-6 min-w-0 xl:sticky xl:top-20 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto">
          <div className="rounded-lg border border-gray-700/50 bg-dark-card p-4">
            <button
              type="button"
              onClick={() => setIsSimulatorOpen(true)}
              className="w-full rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-950/50"
            >
              🎬 Open Disruption Simulator
            </button>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <ShipmentList
              shipments={shipments}
              loading={loading}
              onSelectShipment={setSelectedShipment}
              selectedShipment={selectedShipment}
              ownerEmail={ownerEmail}
              onDeleteShipment={handleDeleteShipment}
            />
          </div>

          <div className="min-h-52 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            <AlertPanel
              alerts={alerts}
              onClearAll={clearAlerts}
              onMarkRead={markAlertRead}
              onSelectShipment={selectShipmentByTrackingId}
            />
          </div>
        </aside>
      </main>

      <DisruptionSimulator
        isOpen={isSimulatorOpen}
        onClose={() => {
          setIsSimulatorOpen(false)
          setMapPickMode(false)
        }}
        mapPickMode={mapPickMode}
        onMapPickModeChange={setMapPickMode}
        selectedLocation={simulatorLocation}
        onLocationPick={setSimulatorLocation}
        onTriggered={handleTriggerSuccess}
        onDemoReroute={handleDemoReroute}
        activeSimulation={activeSimulation}
        activeAffectedShipments={activeAffectedShipments}
        onCancelDisruption={handleCancelSimulation}
        isCancellingDisruption={isCancellingDisruption}
      />

      <RiskAssessmentModal
        data={assessmentModalData}
        onClose={() => setAssessmentModalData(null)}
      />

      <ToastStack toasts={toasts} onDismiss={removeToast} />
    </div>
  )
}

export default App
