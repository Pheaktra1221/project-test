import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

export const useAppStore = defineStore('app', {
  state: () => ({
    apiBaseUrl: (() => {
      const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
      if (base) return base.endsWith('/api') ? base : base + '/api'
      const url = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
      if (url) return url.endsWith('/api') ? url : url + '/api'
      return '/api'
    })(),
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
      let backendUrl = (this.apiBaseUrl || '').replace(/\/$/, '')
      if (!backendUrl) {
        backendUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_DEFAULT || 'https://evident-coreen-tra-2a78039b.koyeb.app/api').replace(/\/$/, '')
      }
      if (backendUrl.endsWith('/api')) backendUrl = backendUrl.slice(0, -4)
      const socket = io(backendUrl, { path: '/socket.io', transports: ['websocket', 'polling'], withCredentials: true })
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
