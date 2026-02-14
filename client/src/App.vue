<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LoginForm from './components/LoginForm.vue'
import Dashboard from './components/Dashboard.vue'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import { useAppStore } from './stores/appStore'
import { API_BASE_URL } from './utils/helpers'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const isLoggedIn = ref(false)
const currentUser = ref(null)
const currentView = ref('dashboard')
const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const presenceInterval = ref(null)

const updateCurrentView = (path) => {
  if (path === '/' || path === '/dashboard') {
    currentView.value = 'dashboard'
  } else {
    // Remove leading slash and use as ID
    const view = path.substring(1)
    if (view) currentView.value = view
  }
}

watch(() => route.path, (newPath) => {
  updateCurrentView(newPath)
})

onMounted(() => {
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    try {
      let parsedUser = JSON.parse(savedUser)
      // Fix for corrupted user data from previous version (nested user object)
      if (parsedUser && parsedUser.user && !parsedUser.username) {
        parsedUser = parsedUser.user
        localStorage.setItem('user', JSON.stringify(parsedUser))
      }
      
      currentUser.value = parsedUser
      isLoggedIn.value = true
      startPresencePing()
      refreshProfileFromServer()
      
      // Update current view based on current path
      updateCurrentView(route.path)

      // If user is logged in but on login route, redirect to dashboard
      if (route.path === '/login') {
        router.push('/')
      }
    } catch (e) {
      console.error('Error parsing saved user:', e)
      localStorage.removeItem('user')
      if (route.path !== '/login') {
        router.push('/login')
      }
    }
  } else {
    // If no user found and not on login route, redirect to login
    if (route.path !== '/login') {
      router.push('/login')
    }
  }
  appStore.connectSocket()
})

const handleProfileUpdated = (event) => {
  const detail = event?.detail || {}
  if (!currentUser.value) currentUser.value = {}
  currentUser.value = { ...currentUser.value, ...detail }
  localStorage.setItem('user', JSON.stringify(currentUser.value))
}

onMounted(() => {
  window.addEventListener('profile-updated', handleProfileUpdated)
})

onUnmounted(() => {
  window.removeEventListener('profile-updated', handleProfileUpdated)
  stopPresencePing()
  appStore.disconnectSocket()
})

const handleLoginSuccess = (data) => {
  currentUser.value = data.user
  isLoggedIn.value = true
  localStorage.setItem('user', JSON.stringify(data.user))
  appStore.connectSocket()
  startPresencePing()
  refreshProfileFromServer()
  router.push('/')
}

const handleLogout = () => {
  currentUser.value = null
  isLoggedIn.value = false
  currentView.value = 'dashboard'
  sidebarOpen.value = false
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  stopPresencePing()
  appStore.disconnectSocket()
  router.push('/login')
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const toggleSidebarCollapse = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const pingPresence = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    await fetch(`${API_BASE_URL}/auth/presence`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).catch(() => fetch(`${API_BASE_URL}/api/auth/presence`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }))
  } catch (e) {}
}

const refreshProfileFromServer = async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    let res = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (res.status === 404) {
      res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    }

    const data = await res.json()
    if (data && data.success && data.data) {
      const merged = { ...(currentUser.value || {}), ...data.data }
      currentUser.value = merged
      localStorage.setItem('user', JSON.stringify(merged))
    }
  } catch (e) {}
}

const startPresencePing = () => {
  if (presenceInterval.value) return
  pingPresence()
  presenceInterval.value = setInterval(pingPresence, 60000)
}

const stopPresencePing = () => {
  if (presenceInterval.value) {
    clearInterval(presenceInterval.value)
    presenceInterval.value = null
  }
}
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Show LoginForm when not logged in -->
    <LoginForm 
      v-if="!isLoggedIn && route.path === '/login'" 
      @login-success="handleLoginSuccess" 
    />
    <div v-else-if="isLoggedIn" class="min-h-screen">
      <Navbar 
        :user="currentUser" 
        @logout="handleLogout" 
        @toggleSidebar="toggleSidebar"
        class="sticky top-0 z-40 print:hidden"
      />

      <div class="relative flex">
        <Sidebar class="print:hidden"
          :active-page="currentView"
          :is-open="sidebarOpen"
          :collapsed="sidebarCollapsed"
          :user="currentUser"
          @navigate="(v) => {
            currentView = v
            router.push(`/${v}`)
          }"
          @toggle-collapse="toggleSidebarCollapse"
          @close="sidebarOpen = false"
          @viewProfile="() => { currentView = 'profile'; router.push('/profile') }"
        />

        <main 
          class="flex-1 transition-all duration-500 lg:p-1"
          :class="[
            !sidebarOpen ? 'lg:ml-0' : (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')
          ]"
        >
          <div class="animate__animated animate__fadeInUp">
            <Dashboard 
              v-if="route.path === '/' || route.path === '/dashboard'"
              :user="currentUser" 
              @logout="handleLogout" 
              @viewStudents="router.push('/students')" 
            />
            <router-view v-else />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}

/* Global animations */
.animate__faster {
  --animate-duration: 0.3s;
}

.animate__slow {
  --animate-duration: 0.8s;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
