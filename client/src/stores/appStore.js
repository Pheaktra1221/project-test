import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { SOCKET_BASE_URL, API_BASE_URL } from '../utils/helpers'

export const useAppStore = defineStore('app', {
  state: () => ({
    apiBaseUrl: API_BASE_URL,
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
      // Force websocket transport and disable polling to avoid CORS issues
      const socket = io(SOCKET_BASE_URL, { 
        path: '/socket.io', 
        transports: ['websocket'],
        upgrade: false,
        rememberUpgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 20000
      })
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
