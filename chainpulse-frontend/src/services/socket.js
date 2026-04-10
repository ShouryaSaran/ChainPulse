import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:8000'

let socket = null
let connectionStatus = 'disconnected'
const statusListeners = new Set()

const emitStatus = (status) => {
  connectionStatus = status
  statusListeners.forEach((listener) => listener(status))
}

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    socket.on('connect', () => {
      emitStatus('connected')
    })

    socket.on('disconnect', () => {
      emitStatus('disconnected')
    })

    socket.on('connect_error', (error) => {
      emitStatus('disconnected')
    })

    emitStatus(socket.connected ? 'connected' : 'connecting')
  }
  return socket
}

export const getSocket = () => socket || initSocket()

export const getSocketStatus = () => connectionStatus

export const onSocketStatus = (callback) => {
  statusListeners.add(callback)
  callback(connectionStatus)
  return () => statusListeners.delete(callback)
}

// Event: Shipment position updates (every 5 seconds)
export const onShipmentUpdate = (callback) => {
  const s = getSocket()
  s.on('shipment_update', callback)
  return () => s.off('shipment_update', callback)
}

// Event: Risk assessment updates (every 15 seconds)
export const onRiskAssessment = (callback) => {
  const s = getSocket()
  s.on('risk_assessment', callback)
  return () => s.off('risk_assessment', callback)
}

// Event: New disruptions detected (every 30 seconds, random)
export const onNewDisruption = (callback) => {
  const s = getSocket()
  s.on('new_disruption', callback)
  return () => s.off('new_disruption', callback)
}

export const onDisruptionCleared = (callback) => {
  const s = getSocket()
  s.on('disruption_cleared', callback)
  return () => s.off('disruption_cleared', callback)
}

// Event: Alerts for risk threshold crossing
export const onAlert = (callback) => {
  const s = getSocket()
  s.on('alert', callback)
  return () => s.off('alert', callback)
}

// Legacy event handlers for backward compatibility
export const onDisruptionAlert = (callback) => {
  const s = getSocket()
  s.on('disruption_alert', callback)
  return () => s.off('disruption_alert', callback)
}

export const emitShipmentTracking = (data) => {
  getSocket().emit('tracking_update', data)
}

export default {
  initSocket,
  getSocket,
  getSocketStatus,
  onSocketStatus,
  onShipmentUpdate,
  onRiskAssessment,
  onNewDisruption,
  onDisruptionCleared,
  onAlert,
  onDisruptionAlert,
  emitShipmentTracking
}
