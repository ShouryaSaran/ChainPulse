import React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const formatReason = (reason) => {
  if (!reason) return 'N/A'
  return reason.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

const formatPct = (value) => `${(Number(value || 0) * 100).toFixed(0)}%`

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2)
  }
  return String(value)
}

const RiskAssessmentModal = ({ data, onClose }) => {
  if (!data) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-700/80 bg-dark-card p-6 text-dark-text shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Risk Assessment</h3>
            <p className="text-sm text-dark-muted">Shipment {data.assessment?.tracking_id || data.shipment?.tracking_id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-dark-muted transition-colors hover:bg-white/5 hover:text-dark-text"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-700/50 bg-dark-bg/70 px-4 py-4">
            <p className="text-[11px] uppercase tracking-wide text-dark-muted">Risk Score</p>
            <p className="mt-1 text-2xl font-bold">{formatPct(data.assessment?.risk_score)}</p>
          </div>
          <div className="rounded-xl border border-gray-700/50 bg-dark-bg/70 px-4 py-4">
            <p className="text-[11px] uppercase tracking-wide text-dark-muted">Risk Level</p>
            <p className="mt-1 text-2xl font-bold capitalize">{data.assessment?.risk_level || 'unknown'}</p>
          </div>
          <div className="rounded-xl border border-gray-700/50 bg-dark-bg/70 px-4 py-4">
            <p className="text-[11px] uppercase tracking-wide text-dark-muted">Reroute</p>
            <p className={`mt-1 text-2xl font-bold ${data.assessment?.should_reroute ? 'text-accent-red' : 'text-accent-green'}`}>
              {data.assessment?.should_reroute ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-cyan-900/40 bg-cyan-950/15 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Model Transparency</p>
          <p className="mt-1 text-xs text-dark-muted">Decision Score = 70% Operational + 30% Calibrated Model</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-700/50 bg-dark-bg/70 px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-dark-muted">Operational Signal</p>
              <p className="mt-1 text-lg font-bold">{formatPct(data.assessment?.live_score)}</p>
            </div>
            <div className="rounded-lg border border-gray-700/50 bg-dark-bg/70 px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-dark-muted">Calibrated Model</p>
              <p className="mt-1 text-lg font-bold">{data.assessment?.model_score == null ? 'N/A' : formatPct(data.assessment?.model_score)}</p>
            </div>
            <div className="rounded-lg border border-gray-700/50 bg-dark-bg/70 px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-dark-muted">Displayed From</p>
              <p className="mt-1 text-lg font-bold capitalize">{data.assessment?.score_source || 'live'}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-dark-muted">
            Raw Model Probability: {data.assessment?.model_raw_score == null ? 'N/A' : formatPct(data.assessment?.model_raw_score)}
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-gray-700/50 bg-dark-bg/70 p-4">
          <p className="text-xs uppercase tracking-wide text-dark-muted">Shipment Details</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-dark-muted">Route</p>
              <p className="mt-1 text-sm font-semibold">{formatValue(data.shipment?.origin)} &rarr; {formatValue(data.shipment?.destination)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-dark-muted">Cargo</p>
              <p className="mt-1 text-sm font-semibold">{formatReason(data.shipment?.cargo_type)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-dark-muted">Status</p>
              <p className="mt-1 text-sm font-semibold capitalize">{formatReason(data.shipment?.status)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-dark-muted">ETA</p>
              <p className="mt-1 text-sm font-semibold">{data.shipment?.eta ? new Date(data.shipment.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-gray-700/50 bg-dark-bg/70 p-4">
          <p className="text-xs uppercase tracking-wide text-dark-muted">Assessment Summary</p>
          <p className="mt-1 text-sm text-dark-text">
            {data.assessment?.recommendation || 'No recommendation available.'}
          </p>
          <p className="mt-2 text-sm text-dark-muted">
            Reroute Recommended: {data.assessment?.should_reroute ? 'Yes' : 'No'}
          </p>
        </div>

        <div className="mb-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-dark-muted">Detected Issues</p>
          {data.assessment?.factors?.length ? (
            <div className="space-y-3">
              {data.assessment.factors.map((factor, idx) => (
                <div key={`${factor.type}-${idx}`} className="rounded-xl border border-gray-700/50 bg-dark-bg/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold capitalize">{formatReason(factor.type)}</p>
                    <p className="text-xs text-dark-muted">Impact {formatPct(factor.impact)}</p>
                  </div>
                  <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-700/40">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400" style={{ width: formatPct(factor.impact) }} />
                  </div>
                  <p className="text-sm text-dark-muted">{factor.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-gray-700/50 bg-dark-bg/70 p-4 text-sm text-dark-muted">
              No specific risk factors were returned for this assessment.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-blue">AI Recommendation</p>
          <p className="mt-2 text-sm leading-6">{data.assessment?.recommendation || 'No recommendation available.'}</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default RiskAssessmentModal
