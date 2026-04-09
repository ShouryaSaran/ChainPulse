import React, { useState, useEffect } from 'react'
import { Package, AlertTriangle, RefreshCw, Zap, TrendingUp } from 'lucide-react'
import { predictionAPI } from '../../services/api'

const StatCard = ({ icon: Icon, label, value, subvalue, color, delay = 0 }) => {
  return (
    <div className="bg-dark-card border border-gray-700/50 rounded-lg p-4 hover:border-gray-600/80 transition-all animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-dark-muted text-xs font-semibold uppercase tracking-wide">{label}</p>
        <Icon className={`text-${color}`} size={20} />
      </div>
      <p className="text-3xl font-bold text-dark-text mb-1">{value}</p>
      {subvalue && <p className="text-xs text-dark-muted">{subvalue}</p>}
    </div>
  )
}

const StatsBar = ({ ownerEmail }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await predictionAPI.getDashboardStats(ownerEmail)
        setStats(response.data)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [ownerEmail])

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-dark-card p-4 rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  const atRiskPercent = stats.total_shipments > 0 ? ((stats.at_risk / stats.total_shipments) * 100).toFixed(0) : 0
  const riskColor = stats.avg_risk_score < 0.33 ? 'accent-green' : stats.avg_risk_score < 0.66 ? 'accent-amber' : 'accent-red'

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
      <StatCard
        icon={Package}
        label="Total Shipments"
        value={stats.total_shipments}
        color="accent-blue"
        delay={0}
      />

      <StatCard
        icon={AlertTriangle}
        label="At Risk"
        value={stats.at_risk}
        subvalue={`${atRiskPercent}% of total`}
        color="accent-red"
        delay={80}
      />

      <StatCard
        icon={RefreshCw}
        label="Rerouted Today"
        value={stats.rerouted_today}
        color="accent-green"
        delay={160}
      />

      <StatCard
        icon={TrendingUp}
        label="Avg Risk Score"
        value={`${(stats.avg_risk_score * 100).toFixed(0)}%`}
        color={riskColor}
        delay={240}
      />

      <StatCard
        icon={Zap}
        label="Active Disruptions"
        value={stats.disruptions_active}
        color="accent-amber"
        delay={320}
      />
    </div>
  )
}

export default StatsBar
