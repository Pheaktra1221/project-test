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

// Global axios 404 fallback interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we get a 404 and haven't tried the /api prefix yet
    if (error.response?.status === 404 && !originalRequest._retry && !originalRequest.url.includes('/api/')) {
      originalRequest._retry = true;
      
      // Construct the fallback URL with /api prefix
      const url = originalRequest.url.startsWith('/') ? originalRequest.url : `/${originalRequest.url}`;
      originalRequest.url = `/api${url}`;
      
      console.warn(`Axios: 404 on ${url}, retrying with /api${url}`);
      return axios(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

const app = createApp(App)

// Pinia
const pinia = createPinia()
app.use(pinia)

// Use router
app.use(router)

app.mount('#app')
