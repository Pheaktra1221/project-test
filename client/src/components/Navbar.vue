<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { io } from 'socket.io-client'
import { useAppStore } from '../stores/appStore'
import { useRouter } from 'vue-router'
import logo from '../assets/vue.svg'
import { imagePreview, formatTime } from '../utils/helpers'

const props = defineProps({
  user: { type: Object, default: null }
})

defineEmits(['logout', 'toggleSidebar'])

const showDropdown = ref(false)
const showNotifications = ref(false)
const notificationsRef = ref(null)
const dropdownRef = ref(null)
const socket = ref(null)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showNotifications.value) showNotifications.value = false
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showDropdown.value) showDropdown.value = false
}

const notifications = ref([])
const messageTitle = ref('')
const messageBody = ref('')
const sendingMessage = ref(false)
const messageError = ref('')

const unreadNotifications = computed(() => {
  return notifications.value.length
})

const router = useRouter()

const openProfile = () => {
  showDropdown.value = false
  router.push('/profile')
}

const openSettings = () => {
  showDropdown.value = false
  router.push('/settings')
}

const imageError = ref(false)
const API_BASE_URL = (() => {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  if (base) return base
  const url = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  if (url) return url.endsWith('/api') ? url : url + '/api'
  return '/api'
})()
const token = () => localStorage.getItem('token')

const userRole = computed(() => props.user?.role?.toLowerCase() || 'student')

watch(() => props.user, () => {
  imageError.value = false
}, { deep: true })

const avatarUrl = computed(() => {
  if (imageError.value) return ''
  const raw = props.user?.Photo || 
              props.user?.profilePic || 
              props.user?.photoUrl || 
              props.user?.PhotoUrl || 
              props.user?.photoPath || 
              props.user?.PhotoPath
  return imagePreview(raw)
})

const handleImageError = () => {
  imageError.value = true
}

const loadNotifications = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${token()}`
      }
    })
    const data = await res.json()
    if (data && data.success && Array.isArray(data.data)) {
      notifications.value = data.data
    }
  } catch (e) {}
}

const sendBroadcast = async () => {
  if (!messageTitle.value.trim() || !messageBody.value.trim()) {
    messageError.value = 'សូមបំពេញចំណងជើង និងសារ'
    return
  }
  sendingMessage.value = true
  messageError.value = ''
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/broadcast`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: messageTitle.value.trim(),
        message: messageBody.value.trim(),
        type: 'info'
      })
    })
    const data = await res.json()
    if (data && data.success && data.data) {
      notifications.value = [data.data, ...notifications.value]
      messageTitle.value = ''
      messageBody.value = ''
    } else {
      messageError.value = data?.message || 'ផ្ញើសារបរាជ័យ'
    }
  } catch (e) {
    messageError.value = 'ផ្ញើសារបរាជ័យ'
  } finally {
    sendingMessage.value = false
  }
}

const handleClickOutside = (event) => {
  const target = event.target
  if (showNotifications.value && notificationsRef.value && !notificationsRef.value.contains(target)) {
    showNotifications.value = false
  }
  if (showDropdown.value && dropdownRef.value && !dropdownRef.value.contains(target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadNotifications()
  const appStore = useAppStore()
  appStore.connectSocket()
  socket.value = appStore.socket
  if (socket.value) {
    socket.value.on('broadcast_notification', (payload) => {
      if (payload) notifications.value = [payload, ...notifications.value]
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (socket.value) socket.value.disconnect()
})
</script>

<template>
  <nav class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-md animate__animated animate__fadeInDown">
    <div class="flex items-center justify-between px-4 py-3">
      <div class="flex items-center gap-4">
        <button 
          @click="$emit('toggleSidebar')"
          class="p-2 text-gray-600 transition-all duration-300 rounded-lg hover:bg-gray-100 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300"
          title="Toggle Sidebar"
        >
          <i class="text-lg fas fa-bars"></i>
        </button>
        
        <div class="flex items-center gap-3 animate__animated animate__fadeIn">
          
          <h1 class="text-xl font-semibold text-gray-800 font-moul">ប្រព័ន្ធ​គ្រប់គ្រង​សាលា</h1>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <div ref="notificationsRef" class="relative">
          <button @click="toggleNotifications" class="relative p-2 text-gray-600 transition-all duration-300 rounded-full hover:text-gray-900 hover:bg-gray-100 hover:rotate-12">
            <i class="text-lg fas fa-bell"></i>
            <span v-if="unreadNotifications" class="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full -top-1 -right-1 animate__animated animate__pulse animate__infinite">
              {{ unreadNotifications }}
            </span>
          </button>
          
          <div 
            v-if="showNotifications"
            class="absolute right-0 z-50 py-2 mt-2 bg-white border border-gray-200 shadow-xl w-80 rounded-xl animate__animated animate__fadeIn"
          >
            <div class="px-4 py-2 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800">ការជូនដំណឹង</h3>
            </div>
            <div v-if="userRole === 'admin'" class="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div class="text-xs font-semibold text-gray-600 mb-2">ផ្ញើសារ​ទៅអ្នកទាំងអស់</div>
              <input
                v-model="messageTitle"
                type="text"
                placeholder="ចំណងជើង"
                class="w-full px-3 py-2 mb-2 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <textarea
                v-model="messageBody"
                rows="2"
                placeholder="សរសេរ​សារ..."
                class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              ></textarea>
              <div v-if="messageError" class="mt-2 text-xs text-red-500 font-semibold">{{ messageError }}</div>
              <button
                type="button"
                @click="sendBroadcast"
                :disabled="sendingMessage"
                class="w-full mt-2 px-3 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 disabled:opacity-60"
              >
                {{ sendingMessage ? 'កំពុងផ្ញើ...' : 'ផ្ញើសារ' }}
              </button>
            </div>
            <div class="overflow-y-auto max-h-64">
              <div v-if="notifications.length === 0" class="px-4 py-6 text-sm text-center text-gray-500">
                មិនមានសារទេ
              </div>
              <div v-for="n in notifications" :key="n.id" 
                   class="px-4 py-3 transition-all duration-200 border-b border-gray-100 hover:bg-gray-50 last:border-b-0">
                <div class="flex items-start gap-3">
                  <div :class="['p-2 rounded-full', n.type === 'info' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600']">
                    <i class="fas fa-bell"></i>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-800">{{ n.title }}</p>
                    <p class="mt-1 text-xs text-gray-500">{{ n.message }}</p>
                    <span class="block mt-2 text-xs text-gray-400">{{ formatTime(n.time) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref="dropdownRef" class="relative">
          <button 
            @click="toggleDropdown"
            class="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 animate__animated animate__fadeIn"
          >
            <div class="relative">
              <div class="flex items-center justify-center w-10 h-10 overflow-hidden font-bold text-white rounded-full shadow-md bg-gradient-to-r from-indigo-500 to-purple-600 animate__animated animate__pulse animate__infinite animate__slower">
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt="Profile"
                  class="object-cover w-full h-full"
                  @error="handleImageError"
                />
                <span v-else>
                  {{ user?.username?.charAt(0).toUpperCase() || 'U' }}
                </span>
              </div>
              <div class="absolute w-3 h-3 bg-green-500 border-2 border-white rounded-full -bottom-1 -right-1"></div>
            </div>
            <div class="hidden text-left md:block animate__animated animate__fadeInRight">
              <p class="text-sm font-semibold text-gray-800">{{ user?.username || 'អ្នកប្រើប្រាស់ភ្ញៀវ' }}</p>
              <p class="flex items-center gap-1 text-xs text-gray-500">
                <i class="text-xs fas fa-user-shield"></i>
                {{ user?.role || 'អ្នកគ្រប់គ្រង' }}
              </p>
            </div>
            <i class="text-sm text-gray-500 transition-transform duration-300 fas fa-chevron-down" 
               :class="showDropdown ? 'rotate-180' : ''"></i>
          </button>

          <transition 
            enter-active-class="animate__animated animate__fadeInDown"
            leave-active-class="animate__animated animate__fadeOutUp"
          >
            <div 
              v-if="showDropdown"
              class="absolute right-0 z-50 w-56 py-2 mt-2 overflow-hidden bg-white border border-gray-200 shadow-2xl rounded-xl"
            >
              <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div class="flex items-center justify-center w-10 h-10 overflow-hidden font-bold text-white rounded-full shadow-md bg-gradient-to-r from-indigo-500 to-purple-600">
                  <img
                    v-if="avatarUrl"
                    :src="avatarUrl"
                    alt="Profile"
                    class="object-cover w-full h-full"
                    @error="handleImageError"
                  />
                  <span v-else>
                    {{ user?.username?.charAt(0).toUpperCase() || 'U' }}
                  </span>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-800 truncate">{{ user?.username || 'អ្នកប្រើប្រាស់ភ្ញៀវ' }}</p>
                  <p class="text-xs text-gray-500 truncate">{{ user?.email || 'user@school.com' }}</p>
                </div>
              </div>
              
              <button v-if="userRole !== 'student' && userRole !== 'classrep'" type="button" @click="openProfile" class="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 group">
                <i class="w-5 mr-3 text-gray-400 fas fa-user-circle group-hover:text-indigo-500"></i>
                ប្រវត្តិរូប
              </button>
              <button v-if="userRole === 'admin'" type="button" @click="openSettings" class="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 group">
                <i class="w-5 mr-3 text-gray-400 fas fa-cog group-hover:text-indigo-500"></i>
                ការកំណត់គណនី
              </button>
              <a href="#" class="flex items-center px-4 py-3 text-sm text-gray-700 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 group">
                <i class="w-5 mr-3 text-gray-400 fas fa-question-circle group-hover:text-indigo-500"></i>
                ជំនួយ និងការគាំទ្រ
              </a>
              
              <div class="my-1 border-t border-gray-100"></div>
              
              <button 
                @click="$emit('logout')" 
                class="flex items-center w-full px-4 py-3 text-sm text-red-600 transition-all duration-200 hover:bg-red-50 group"
              >
                <i class="w-5 mr-3 text-red-400 fas fa-sign-out-alt group-hover:text-red-500"></i>
                ចាកចេញ
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Custom animations */
@keyframes slideInDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate__slideInDown {
  animation: slideInDown 0.3s ease-out;
}

/* Use Moul font for title */
.font-moul {
  font-family: 'Moul', system-ui, -apple-system, 'Segoe UI', Roboto, "Helvetica Neue", Arial;
}
</style>
