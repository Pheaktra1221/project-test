import axios from 'axios'

const raw = import.meta.env.VITE_API_URL || ''
const base = (() => {
  const cleaned = raw.replace(/\/$/, '')
  if (!cleaned) return '/api'
  return cleaned.endsWith('/api') ? cleaned : cleaned + '/api'
})()

const instance = axios.create({ baseURL: base })

export async function login(credentials) {
  try {
    const res = await instance.post('/auth/login', credentials)
    return res.data
  } catch {
    const res = await instance.post('/login', credentials)
    return res.data
  }
}

export function setAuthToken(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }
}
