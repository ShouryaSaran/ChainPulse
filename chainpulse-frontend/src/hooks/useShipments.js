import { useState, useEffect } from 'react'
import { shipmentAPI } from '../services/api'

export const useShipments = (ownerEmail) => {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchShipments = async () => {
      if (!ownerEmail) {
        setShipments([])
        setError(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await shipmentAPI.getAll(ownerEmail)
        setShipments(response.data)
        setError(null)
      } catch (err) {
        setError(err.message)
        console.error('Failed to fetch shipments:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchShipments()
    // Refresh every 30 seconds
    const interval = setInterval(fetchShipments, 30000)
    return () => clearInterval(interval)
  }, [ownerEmail])

  const updateShipmentStatus = async (trackingId, data) => {
    try {
      const response = await shipmentAPI.updateStatus(trackingId, data, ownerEmail)
      setShipments(shipments.map(s => s.tracking_id === trackingId ? response.data : s))
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return { shipments, loading, error, updateShipmentStatus }
}
