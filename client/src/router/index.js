import { createRouter, createWebHistory } from 'vue-router'
import StudentForm from '../components/StudentForm.vue'
import Dashboard from '../components/Dashboard.vue'
import LoginForm from '../components/LoginForm.vue'
import Class from '../components/Class.vue'
import ClassList from '../components/ClassList.vue'
import Attendance from '../components/Attendance.vue'
import ScoreEntry from '../components/ScoreEntry.vue'
import RankingForm from '../components/RankingForm.vue'
import Profile from '../components/Profile.vue'
import Settings from '../components/Settings.vue'
import Calendar from '../components/Calendar.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginForm
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, roles: ['all'] }
  },
  {
    path: '/students',
    name: 'Students',
    component: StudentForm,
    meta: { requiresAuth: true, roles: ['admin', 'teacher'] }
  },
  {
    path  : '/class',
    name  : 'Class',
    component : Class,
    meta  : { requiresAuth: true, roles: ['admin', 'teacher'] }
  },
  {
    path  : '/ClassList',
    name  : 'ClassListAll',
    component : ClassList,
    meta  : { requiresAuth: true, roles: ['admin', 'teacher'] }
  },
  {
    path: '/class/:id',
    name: 'ClassList',
    component: () => import('../components/ClassList.vue'),
    props: true,
    meta: { requiresAuth: true, roles: ['admin', 'teacher'] }
  },
  {
    path : '/teacher',
    name : 'Teacher',
    component : () => import('../components/Teacher.vue'),
    meta : { requiresAuth: true, roles: ['admin'] }
  },
  {
    path : '/attendance',
    name : 'Attendance',
    component : Attendance,
    meta : { requiresAuth: true, roles: ['admin', 'teacher', 'classrep'] }
  },
  {
    path : '/grades',
    name : 'Grades',
    component : ScoreEntry,
    meta : { requiresAuth: true, roles: ['admin', 'teacher'] }
  },
  {
    path : '/ranking',
    name : 'RankingForm',
    component : RankingForm,
    meta : { requiresAuth: true, roles: ['admin', 'teacher'] }
  },
  {
    path : '/calendar',
    name : 'Calendar',
    component : Calendar,
    meta : { requiresAuth: true, roles: ['admin', 'teacher'] }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true, roles: ['admin', 'teacher'] }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true, roles: ['admin'] }
  }
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// check if login
router.beforeEach((to, from, next) => {
  const userStr = localStorage.getItem('user')
  let user = null
  let isAuthenticated = false

  if (userStr && userStr !== 'null') {
    try {
      user = JSON.parse(userStr)
      // Fix for nested user object (consistent with App.vue)
      if (user && user.user) user = user.user
      isAuthenticated = true
    } catch (e) {
      console.error('Error parsing user in router', e)
      isAuthenticated = false
    }
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } 
  else if (to.path === '/login' && isAuthenticated) {
    next('/')
  } 
  else {
    // Role check
    if (to.meta.roles && isAuthenticated && user) {
      const userRole = user.role ? user.role.toLowerCase() : 'student'
      const allowedRoles = to.meta.roles
      
      if (!allowedRoles.includes('all') && !allowedRoles.includes(userRole)) {
        // If user is restricted from this route, redirect to dashboard
        if (to.path !== '/') {
           next('/')
           return
        }
      }
    }
    next()
  }
})
export default router
