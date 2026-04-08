import axios from 'axios'

const API_BASE = ''

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

export const shipmentAPI = {
  getAll: () => api.get('/api/shipments'),
  getByTrackingId: (trackingId) => api.get(`/api/shipments/${trackingId}`),
  create: (shipment) => api.post('/api/shipments', shipment),
  createShipment: (shipment) => api.post('/api/shipments', shipment),
  updateStatus: (trackingId, data) => api.put(`/api/shipments/${trackingId}/status`, data),
  delete: (trackingId) => api.delete(`/api/shipments/${trackingId}`),
  getRoute: (trackingId) => api.get(`/api/shipments/${trackingId}/route`),
}

export const predictionAPI = {
  assess: (trackingId) => api.post('/api/predictions/assess', { shipment_id: trackingId }),
  getDashboardStats: () => api.get('/api/predictions/dashboard-stats'),
}

export const disruptionAPI = {
  simulate: (payload) => api.post('/api/disruptions/simulate', payload),
}

export const alertAPI = {
  getAll: () => api.get('/api/alerts'),
}

export const healthCheck = () => api.get('/health')

export default api
