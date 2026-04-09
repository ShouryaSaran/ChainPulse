import React, { useEffect, useState } from 'react'
import { ArrowRight, Calendar, Zap } from 'lucide-react'
import { predictionAPI } from '../../services/api'

const ShipmentCard = ({ shipment, onSelect, isSelected, index = 0, ownerEmail }) => {
  const [assessing, setAssessing] = useState(false)
  const [barReady, setBarReady] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setBarReady(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const getRiskColor = (score) => {
    if (score < 0.33) return 'bg-accent-green'
    if (score < 0.66) return 'bg-accent-amber'
    return 'bg-accent-red'
  }

  const getRiskTextColor = (score) => {
    if (score < 0.33) return 'text-accent-green'
    if (score < 0.66) return 'text-accent-amber'
    return 'text-accent-red'
  }

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-900/30 text-accent-green'
      case 'in_transit':
        return 'bg-blue-900/30 text-accent-blue'
      case 'delayed':
        return 'bg-red-900/30 text-accent-red'
      case 'at_risk':
        return 'bg-amber-900/30 text-accent-amber'
      default:
        return 'bg-gray-700/30 text-dark-muted'
    }
  }

  const getCargoTypeColor = (type) => {
    const types = {
      electronics: 'bg-blue-900/30 text-accent-blue',
      perishable: 'bg-green-900/30 text-accent-green',
      hazmat: 'bg-red-900/30 text-accent-red',
      general: 'bg-gray-700/30 text-dark-muted',
    }
    return types[type] || 'bg-gray-700/30 text-dark-muted'
  }

  const handleAssessRisk = async (e) => {
    e.stopPropagation()
    setAssessing(true)
    try {
      await predictionAPI.assess(shipment.tracking_id, ownerEmail)
      // Risk assessment completed
    } catch (err) {
      console.error('Failed to assess risk:', err)
    } finally {
      setAssessing(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      onClick={onSelect}
      style={{ animationDelay: `${index * 70}ms` }}
      className={`p-4 rounded-lg border cursor-pointer transition-all animate-fade-in-up ${
        isSelected
          ? 'border-accent-blue bg-blue-900/20 shadow-lg shadow-blue-950/20'
          : 'border-gray-700/50 hover:border-gray-600/80 hover:bg-dark-bg/50'
      }`}
    >
      {/* Header: Tracking ID & Status */}
      <div className="flex items-start justify-between mb-3">
        <p className="font-mono text-sm font-semibold text-accent-blue">{shipment.tracking_id}</p>
        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${getStatusBadgeClasses(shipment.status)}`}>
          {shipment.status.replace('_', ' ')}
        </span>
      </div>

      {/* Route: Origin → Destination */}
      <div className="flex items-center gap-2 mb-3 text-sm text-dark-text">
        <span>{shipment.origin}</span>
        <ArrowRight size={16} className="text-dark-muted flex-shrink-0" />
        <span>{shipment.destination}</span>
      </div>

      {/* Cargo Type Badge & ETA */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getCargoTypeColor(shipment.cargo_type)}`}>
          {shipment.cargo_type}
        </span>
        <div className="flex items-center gap-1 text-xs text-dark-muted">
          <Calendar size={14} />
          <span>{formatDate(shipment.eta)}</span>
        </div>
      </div>

      {/* Risk Score Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-dark-muted">Risk Score</span>
          <span className={`text-xs font-semibold ${getRiskTextColor(shipment.risk_score)}`}>
            {(shipment.risk_score * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700/30 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${getRiskColor(shipment.risk_score)}`}
            style={{ width: barReady ? `${shipment.risk_score * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Assess Risk Button */}
      <button
        onClick={handleAssessRisk}
        disabled={assessing}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-900/30 text-accent-blue rounded-lg text-xs font-semibold hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap size={14} />
        {assessing ? 'Assessing...' : 'Assess Risk'}
      </button>
    </div>
  )
}

export default ShipmentCard
