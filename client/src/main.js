import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import App from './App.vue'
import router from './router/index.js'
import { API_BASE_URL } from './utils/helpers.js'

// Global axios default base URL for all components
axios.defaults.baseURL = API_BASE_URL;

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
