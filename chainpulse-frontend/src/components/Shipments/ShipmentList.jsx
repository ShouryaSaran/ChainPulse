import React, { useState } from 'react'
import ShipmentCard from './ShipmentCard'
import { Calendar, Search, Plus, X } from 'lucide-react'
import { shipmentAPI } from '../../services/api'

// Mock coordinates for common locations
const locationCoords = {
  'shanghai': { lat: 31.2304, lon: 121.4737 },
  'rotterdam': { lat: 51.9225, lon: 4.4792 },
  'singapore': { lat: 1.3521, lon: 103.8198 },
  'los angeles': { lat: 34.0522, lon: -118.2437 },
  'hong kong': { lat: 22.3193, lon: 114.1694 },
  'hamburg': { lat: 53.5511, lon: 9.9937 },
  'dubai': { lat: 25.2048, lon: 55.2708 },
  'new york': { lat: 40.7128, lon: -74.0060 },
  'sydney': { lat: -33.8688, lon: 151.2093 },
}

const getCoords = (city) => {
  const key = city.trim().toLowerCase()
  return locationCoords[key] || null
}

const supportedCities = Object.keys(locationCoords)
  .map((city) => city[0].toUpperCase() + city.slice(1))
  .join(', ')

const AddShipmentModal = ({ isOpen, onClose, onSuccess, ownerEmail }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departure_date: new Date().toISOString().split('T')[0],
    cargo_type: 'electronics',
    status: 'in_transit',
  })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setFormError('')
    try {
      const originCoords = getCoords(formData.origin)
      const destCoords = getCoords(formData.destination)

      if (!originCoords || !destCoords) {
        setFormError(`Invalid origin or destination. Supported cities: ${supportedCities}.`)
        return
      }

      if (formData.origin.trim().toLowerCase() === formData.destination.trim().toLowerCase()) {
        setFormError('Origin and destination must be different cities.')
        return
      }
      
      const payload = {
        origin: formData.origin,
        destination: formData.destination,
        origin_lat: originCoords.lat,
        origin_lon: originCoords.lon,
        dest_lat: destCoords.lat,
        dest_lon: destCoords.lon,
        cargo_type: formData.cargo_type,
        status: formData.status,
        current_lat: originCoords.lat,
        current_lon: originCoords.lon,
        risk_score: 0.1,
        route_distance_km: 5000,
        departure_date: new Date(formData.departure_date).toISOString(),
      }
      
      await shipmentAPI.createShipment(payload, ownerEmail)
      setFormData({
        origin: '',
        destination: '',
        departure_date: new Date().toISOString().split('T')[0],
        cargo_type: 'electronics',
        status: 'in_transit',
      })
      onClose()
      onSuccess?.()
    } catch (err) {
      const detail = err?.response?.data?.detail
      setFormError(Array.isArray(detail) ? detail.join(' ') : detail || 'Failed to create shipment.')
      console.error('Failed to create shipment:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-card rounded-lg p-6 w-96 border border-gray-700/50 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dark-text">New Shipment</h2>
          <button
            onClick={onClose}
            className="text-dark-muted hover:text-dark-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark-muted mb-1.5">Origin</label>
              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                placeholder="e.g., Shanghai"
                required
                className="w-full bg-dark-bg border border-gray-700/50 rounded px-3 py-2 text-dark-text text-sm focus:outline-none focus:border-accent-blue"
              />
              <p className="mt-1 text-[11px] text-dark-muted">Supported: Shanghai, Rotterdam, Singapore, Los Angeles, Hong Kong, Hamburg, Dubai, New York, Sydney</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-muted mb-1.5">Destination</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g., Rotterdam"
                required
                className="w-full bg-dark-bg border border-gray-700/50 rounded px-3 py-2 text-dark-text text-sm focus:outline-none focus:border-accent-blue"
              />
              <p className="mt-1 text-[11px] text-dark-muted">Supported: Shanghai, Rotterdam, Singapore, Los Angeles, Hong Kong, Hamburg, Dubai, New York, Sydney</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-muted mb-1.5">Departure Date</label>
            <div className="relative">
              <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
              <input
                type="date"
                name="departure_date"
                value={formData.departure_date}
                onChange={handleChange}
                required
                className="w-full rounded border border-gray-700/50 bg-dark-bg py-2 pl-9 pr-3 text-sm text-dark-text focus:border-accent-blue focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-muted mb-1.5">Cargo Type</label>
            <select
              name="cargo_type"
              value={formData.cargo_type}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-gray-700/50 rounded px-3 py-2 text-dark-text text-sm focus:outline-none focus:border-accent-blue"
            >
              <option value="electronics">Electronics</option>
              <option value="perishable">Perishable</option>
              <option value="hazmat">Hazmat</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-muted mb-1.5">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-gray-700/50 rounded px-3 py-2 text-dark-text text-sm focus:outline-none focus:border-accent-blue"
            >
              <option value="in_transit">In Transit</option>
              <option value="delayed">Delayed</option>
              <option value="at_risk">At Risk</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-700/50 text-dark-text hover:bg-gray-700/20 transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-accent-blue text-dark-text hover:bg-blue-600 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>

          {formError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">
              {formError}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  )
}

const ShipmentList = ({ shipments, loading, onSelectShipment, selectedShipment, ownerEmail }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredShipments = shipments.filter(s =>
    s.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.destination.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddSuccess = () => {
    // Trigger refresh if needed
  }

  return (
    <div className="flex flex-col h-full bg-dark-card rounded-lg animate-fade-in">
      {/* Header with Title and Count */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark-text">Active Shipments</h2>
          <span className="px-2.5 py-1 rounded-full bg-blue-900/30 text-accent-blue text-xs font-semibold">
            {shipments.length}
          </span>
        </div>
        <div className="flex items-center space-x-2 bg-dark-bg rounded px-3 py-2">
          <Search size={16} className="text-dark-muted" />
          <input
            type="text"
            placeholder="Search by ID, origin, destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-dark-text text-sm outline-none w-full placeholder-dark-muted"
          />
        </div>
      </div>

      {/* Shipment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center text-dark-muted py-8">Loading shipments...</div>
        ) : filteredShipments.length === 0 ? (
          <div className="text-center text-dark-muted py-8">No shipments found</div>
        ) : (
          filteredShipments.map((shipment, index) => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              index={index}
              onSelect={() => onSelectShipment(shipment)}
              isSelected={selectedShipment?.id === shipment.id}
              ownerEmail={ownerEmail}
            />
          ))
        )}
      </div>

      {/* Add Shipment Button */}
      <div className="p-4 border-t border-gray-700/50">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-accent-blue text-dark-text py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Shipment</span>
        </button>
      </div>

      {/* Add Shipment Modal */}
      <AddShipmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        ownerEmail={ownerEmail}
      />
    </div>
  )
}

export default ShipmentList
