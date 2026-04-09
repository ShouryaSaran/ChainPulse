import axios from 'axios'

const API_BASE = ''

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

const ownerParams = (ownerEmail) => (ownerEmail ? { params: { owner_email: ownerEmail } } : undefined)

export const shipmentAPI = {
  getAll: (ownerEmail) => api.get('/api/shipments', ownerParams(ownerEmail)),
  getByTrackingId: (trackingId, ownerEmail) => api.get(`/api/shipments/${trackingId}`, ownerParams(ownerEmail)),
  create: (shipment, ownerEmail) => api.post('/api/shipments', { ...shipment, owner_email: ownerEmail }),
  createShipment: (shipment, ownerEmail) => api.post('/api/shipments', { ...shipment, owner_email: ownerEmail }),
  updateStatus: (trackingId, data, ownerEmail) => api.put(`/api/shipments/${trackingId}/status`, data, ownerParams(ownerEmail)),
  delete: (trackingId, ownerEmail) => api.delete(`/api/shipments/${trackingId}`, ownerParams(ownerEmail)),
  getRoute: (trackingId, ownerEmail) => api.get(`/api/shipments/${trackingId}/route`, ownerParams(ownerEmail)),
}

export const predictionAPI = {
  assess: (trackingId, ownerEmail) => api.post('/api/predictions/assess', { shipment_id: trackingId }, ownerParams(ownerEmail)),
  getDashboardStats: (ownerEmail) => api.get('/api/predictions/dashboard-stats', ownerParams(ownerEmail)),
}

export const disruptionAPI = {
  simulate: (payload) => api.post('/api/disruptions/simulate', payload),
}

export const alertAPI = {
  getAll: () => api.get('/api/alerts'),
}

export const healthCheck = () => api.get('/health')

export default api
