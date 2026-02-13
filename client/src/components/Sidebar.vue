<script>
import { ref, computed, toRefs, watch } from 'vue'
import { imagePreview } from '../utils/helpers'

export default {
  inheritAttrs: false,
  props: {
    activePage: {
      type: String,
      default: 'dashboard'
    },
    isOpen: {
      type: Boolean,
      default: false
    },
    collapsed: {
      type: Boolean,
      default: false
    },
    user: {
      type: Object,
      default: () => ({ username: 'User', role: 'Admin' })
    }
  },
  emits: ['navigate', 'toggleCollapse', 'close', 'viewProfile'],
  setup(props, { emit }) {
    const { activePage, isOpen, collapsed, user } = toRefs(props)
    const API_BASE_URL = (() => {
      const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
      if (base) return base.endsWith('/api') ? base : base + '/api'
      const url = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
      if (url) return url.endsWith('/api') ? url : url + '/api'
      return '/api'
    })()
    const imageError = ref(false)

    const handleNavigation = (pageId) => {
      emit('navigate', pageId)
      emit('close')
    }

    const allMenuItems = [
      { id: 'dashboard', label: 'ផ្ទាំងគ្រប់គ្រង', icon: 'fas fa-tachometer-alt', badge: null, roles: ['all'] },
      { id: 'students', label: 'សិស្ស', icon: 'fas fa-user-graduate', badge: '12', roles: ['admin', 'teacher'] },
      { id: 'teacher', label: 'គ្រូបង្រៀន', icon: 'fas fa-chalkboard-teacher', badge: null, roles: ['admin'] },
      { id: 'class', label: 'ថ្នាក់រៀន', icon: 'fas fa-school', badge: '5', roles: ['admin', 'teacher'] },
      { id: 'attendance', label: 'វត្តមាន', icon: 'fas fa-clipboard-check', badge: null, roles: ['admin', 'teacher', 'classrep'] },
      { id: 'grades', label: 'ពិន្ទុ & របាយការណ៍', icon: 'fas fa-chart-bar', badge: '3', roles: ['admin', 'teacher'] },
      { id: 'calendar', label: 'ប្រតិទិន', icon: 'fas fa-calendar-alt', badge: null, roles: ['admin', 'teacher'] },
      { id: 'ranking', label: 'ចំណាត់ថ្នាក់', icon: 'fas fa-comments', badge: '5', roles: ['admin', 'teacher'] },
      { id: 'settings', label: 'ការកំណត់', icon: 'fas fa-cog', badge: null, roles: ['admin'] },
    ]

    const userRole = computed(() => user.value?.role?.toLowerCase() || 'student')

    const menuItems = computed(() => {
      const role = userRole.value
      
      return allMenuItems.filter(item => {
        if (item.roles.includes('all')) return true
        return item.roles.includes(role)
      })
    })

    const userName = computed(() => {
      return user.value?.username || 'User Name'
    })

    const userInitial = computed(() => {
      return userName.value.charAt(0).toUpperCase()
    })

    const userAvatar = computed(() => {
      if (imageError.value) return ''
      const raw = user.value?.Photo || 
                  user.value?.profilePic || 
                  user.value?.photoUrl || 
                  user.value?.PhotoUrl || 
                  user.value?.photoPath || 
                  user.value?.PhotoPath
      return imagePreview(raw)
    })

    const handleImageError = () => {
      imageError.value = true
    }

    watch(
      () => [
        user.value?.Photo,
        user.value?.profilePic,
        user.value?.photoUrl,
        user.value?.PhotoUrl,
        user.value?.photoPath,
        user.value?.PhotoPath
      ],
      () => {
        imageError.value = false
      },
      { deep: true }
    )

    const canViewProfile = computed(() => ['admin', 'teacher'].includes(userRole.value))

    return { activePage, isOpen, collapsed, user, handleNavigation, menuItems, userName, userInitial, userAvatar, handleImageError, canViewProfile }
  }
}
</script>

<template>
  <transition 
    enter-active-class="animate__animated animate__fadeIn"
    leave-active-class="animate__animated animate__fadeOut"
  >
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
      @click="$emit('close')"
    ></div>
  </transition>

  <aside
    v-bind="$attrs"
    :class="[
      'fixed top-0 left-0 z-50 flex flex-col h-screen transition-transform duration-500 ease-in-out bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-2xl',
      isOpen ? 'translate-x-0' : '-translate-x-full', 
      collapsed ? 'w-20' : 'w-64'
    ]"
    :style="{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }"
  >
    <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
      <div class="flex items-center gap-3 overflow-hidden whitespace-nowrap">
        <button 
          @click="$emit('toggleCollapse')" 
          class="p-2 text-gray-600 transition-all duration-300 rounded-xl hover:bg-gray-100 hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300 group"
          :title="collapsed ? 'Expand' : 'Collapse'"
        >
          <i v-if="!collapsed" class="fas fa-chevron-left text-lg group-hover:-translate-x-0.5 transition-transform"></i>
          <i v-else class="fas fa-chevron-right text-lg group-hover:translate-x-0.5 transition-transform"></i>
        </button>
        
        <transition
          enter-active-class="animate__animated animate__fadeInLeft"
          leave-active-class="animate__animated animate__fadeOutLeft"
        >
          <span 
            v-if="!collapsed"
            class="text-lg font-bold tracking-tight text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text"
          >
            <i class="mr-2 fas fa-graduation-cap"></i>
            School App
          </span>
        </transition>
      </div>
      
      <button 
        v-if="!collapsed"
        @click="$emit('close')"
        class="p-2 transition-all duration-300 rounded-lg hover:bg-red-50 hover:text-red-600 hover:scale-110"
        title="Close Menu"
      >
        <i class="text-lg fas fa-times"></i>
      </button>
    </div>

    <nav class="flex-1 py-4 overflow-x-hidden overflow-y-auto">
      <transition
        enter-active-class="animate__animated animate__fadeIn"
        leave-active-class="animate__animated animate__fadeOut"
      >
        <div v-if="!collapsed" class="px-4 mb-4">
          <div class="flex items-center px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            <i class="mr-2 text-xs fas fa-bars"></i>
            ម៉ឺនុយ
          </div>
        </div>
      </transition>
      
      <ul class="px-2 space-y-1">
        <li v-for="item in menuItems" :key="item.id">
          <button
            @click="handleNavigation(item.id)"
            class="relative flex items-center w-full p-3 overflow-hidden transition-all duration-300 rounded-xl group"
            :class="[
              activePage === item.id 
                ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 border-l-4 border-indigo-600 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent hover:border-indigo-300 hover:shadow-sm'
            ]"
          >
            <div v-if="activePage === item.id" class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"></div>
            
            <span class="relative flex items-center justify-center w-6 h-6 text-lg transition-all duration-300 shrink-0 group-hover:scale-110">
              <i :class="item.icon"></i>
            </span>
            
            <transition
              enter-active-class="animate__animated animate__fadeInLeft"
              leave-active-class="animate__animated animate__fadeOutLeft"
            >
              <span 
                v-if="!collapsed"
                class="relative ml-3 font-medium transition-all duration-300 origin-left whitespace-nowrap"
              >
                {{ item.label }}
                <span v-if="item.badge" class="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-600 rounded-full">
                  {{ item.badge }}
                </span>
              </span>
            </transition>

            <transition
              enter-active-class="animate__animated animate__fadeIn"
              leave-active-class="animate__animated animate__fadeOut"
            >
              <div 
                v-if="collapsed"
                class="absolute z-50 px-3 py-2 ml-3 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-xl opacity-0 pointer-events-none left-full whitespace-nowrap group-hover:opacity-100"
              >
                {{ item.label }}
                <div class="absolute w-2 h-2 transform rotate-45 -translate-y-1/2 bg-gray-900 top-1/2 -left-1"></div>
              </div>
            </transition>
            
            <div v-if="activePage === item.id && collapsed" class="absolute w-2 h-2 bg-indigo-600 rounded-full right-2 animate-pulse"></div>
          </button>
        </li>
      </ul>

      <transition
        enter-active-class="animate__animated animate__fadeIn"
        leave-active-class="animate__animated animate__fadeOut"
      >
        <div v-if="!collapsed" class="px-2 mt-8">
          <div class="px-4 mb-2">
            <div class="flex items-center px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              <i class="mr-2 text-xs fas fa-life-ring"></i>
              ជំនួយ
            </div>
          </div>
          <ul class="px-2 space-y-1">
            <li>
              <a href="#" class="flex items-center p-3 text-gray-600 transition-all duration-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 group">
                <i class="text-gray-400 transition-colors fas fa-question-circle group-hover:text-blue-500"></i>
                <span class="ml-3 font-medium">មជ្ឈមណ្ឌលជំនួយ</span>
              </a>
            </li>
            <li>
              <a href="#" class="flex items-center p-3 text-gray-600 transition-all duration-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 group">
                <i class="text-gray-400 transition-colors fas fa-book group-hover:text-green-500"></i>
                <span class="ml-3 font-medium">ឯកសារ</span>
              </a>
            </li>
          </ul>
        </div>
      </transition>
    </nav>

    <div class="p-4 border-t border-gray-200 bg-linear-to-r from-white to-gray-50">
      <div class="flex items-center gap-3 animate__animated animate__fadeInUp">
        <div class="relative">
          <div class="flex items-center justify-center w-10 h-10 overflow-hidden font-bold text-white rounded-full shadow-md bg-linear-to-r from-indigo-500 to-purple-600">
            <img
              v-if="userAvatar"
              :src="userAvatar"
              alt="Profile"
              class="object-cover w-full h-full"
              @error="handleImageError"
            />
            <span v-else>
              {{ userInitial }}
            </span>
          </div>
          <div class="absolute w-3 h-3 bg-green-500 border-2 border-white rounded-full -bottom-1 -right-1"></div>
        </div>
        
        <transition
          enter-active-class="animate__animated animate__fadeInRight"
          leave-active-class="animate__animated animate__fadeOutRight"
        >
          <div v-if="!collapsed" class="overflow-hidden">
            <p class="text-sm font-semibold text-gray-800 truncate">{{ userName }}</p>
            <p class="flex items-center gap-1 text-xs text-gray-500">
              <i class="fas fa-circle text-[6px] text-green-500"></i>
              អនឡាញ
            </p>
            <button v-if="canViewProfile" @click="$emit('viewProfile')" class="flex items-center gap-1 mt-1 text-xs text-indigo-600 transition-colors hover:text-indigo-800">
              មើលប្រវត្តិរូប <i class="fas fa-external-link-alt text-[10px]"></i>
            </button>
          </div>
        </transition>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* Custom smooth transitions */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* Custom scrollbar */
nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

nav::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Glow effect for active items */
.border-indigo-600 {
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.1);
}
</style>
