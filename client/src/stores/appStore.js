import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

export const useAppStore = defineStore('app', {
  state: () => ({
    apiBaseUrl: import.meta.env.VITE_API_URL || '/api',
    user: null,
    authorized: false,
    socket: null,
    socketConnected: false,
    refreshTokens: {
      students: 0,
      teachers: 0,
      classes: 0,
      scores: 0,
    }
  }),
  actions: {
    setUser(u) {
      this.user = u
    },
    setAuthorized(v) {
      this.authorized = !!v
    },
    connectSocket() {
      if (this.socket) return
      const backendUrl = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')
      const socket = io(backendUrl, { path: '/socket.io' })
      this.socket = socket
      socket.on('connect', () => {
        this.socketConnected = true
      })
      socket.on('disconnect', () => {
        this.socketConnected = false
      })
      socket.on('data_refresh', (payload) => {
        const resource = payload?.resource || 'all'
        this.triggerRefresh(resource)
      })
    },
    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.socketConnected = false
      }
    },
    triggerRefresh(resource) {
      const now = Date.now()
      if (resource === 'all') {
        this.refreshTokens.students = now
        this.refreshTokens.teachers = now
        this.refreshTokens.classes = now
        this.refreshTokens.scores = now
      } else if (this.refreshTokens[resource] !== undefined) {
        this.refreshTokens[resource] = now
      }
    }
  },
})
