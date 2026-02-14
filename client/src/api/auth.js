import axios from 'axios'
import { API_BASE_URL } from '../utils/helpers.js'

const instance = axios.create({ baseURL: API_BASE_URL })

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
