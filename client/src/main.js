import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import App from './App.vue'
import router from './router/index.js'

// Global axios default base URL for all components
// Ensure the API base always includes the "/api" prefix even if VITE_API_URL
// is set to a host (e.g. "http://localhost:3001"). This avoids requests
// being sent to e.g. "http://localhost:3001/statistics/..." instead of
// "http://localhost:3001/api/statistics/...".
const rawApiUrl = import.meta.env.VITE_API_URL || '';
const normalizedBase = rawApiUrl.replace(/\/$/, '');
axios.defaults.baseURL = normalizedBase.endsWith('/api') ? normalizedBase : (normalizedBase ? normalizedBase + '/api' : '/api');

// If a token was previously stored (user already logged in), set axios Authorization header
const existingToken = localStorage.getItem('token');
if (existingToken) {
	axios.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
}

const app = createApp(App)

// Pinia
const pinia = createPinia()
app.use(pinia)

// Use router
app.use(router)

app.mount('#app')
