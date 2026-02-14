<template>
  <div class="container max-w-full p-2 mx-auto overflow-x-hidden sm:p-4">
    <div class="p-3 mb-6 bg-white border border-gray-100 shadow-xl rounded-2xl sm:p-6 sm:mb-8">
      <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-3 rounded-2xl bg-linear-to-r from-indigo-50 to-purple-50 sm:px-4">
        <div class="min-w-0">
          <h2 class="text-xl font-bold text-indigo-700">ប្រវត្តិរូបអ្នកប្រើប្រាស់</h2>
          <p class="text-sm text-gray-600">កែប្រែព័ត៌មានផ្ទាល់ខ្លួន</p>
        </div>
      </div>

      <div class="grid gap-4 p-3 sm:p-4 md:grid-cols-3">
        <div class="flex flex-col items-center gap-4 p-4 bg-white border border-gray-100 shadow-md rounded-2xl sm:p-6">
          <div class="relative w-24 h-24 overflow-hidden border-4 border-white shadow-lg rounded-full bg-indigo-50 sm:w-32 sm:h-32">
            <img
              v-if="profileImage"
              :src="profileImage"
              alt="Profile"
              class="object-cover w-full h-full"
              @error="handleImageError"
            />
            <div v-else class="flex items-center justify-center w-full h-full text-2xl font-bold text-indigo-600 sm:text-3xl">
              {{ userInitials }}
            </div>
          </div>
          <div class="text-center">
            <p class="text-lg font-semibold text-gray-800 break-words">{{ form.username || profile.username || 'User' }}</p>
            <p class="text-sm text-gray-500">{{ roleLabel }}</p>
          </div>
          <div class="w-full text-sm text-gray-600">
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <span>កាលបរិច្ឆេទបង្កើត</span>
              <span class="font-semibold text-gray-800">{{ formattedDate }}</span>
            </div>
          </div>
        </div>

        <div class="min-w-0 md:col-span-2">
          <form @submit.prevent="saveProfile" class="p-4 bg-white border border-gray-100 shadow-md rounded-2xl space-y-5 sm:p-6">
            <div v-if="errorMessage" class="px-4 py-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
              {{ errorMessage }}
            </div>
            <div v-if="successMessage" class="px-4 py-3 text-sm text-green-700 border border-green-200 rounded-xl bg-green-50">
              {{ successMessage }}
            </div>

            <div>
              <label class="block mb-2 text-sm font-semibold text-gray-700">ឈ្មោះអ្នកប្រើប្រាស់</label>
              <input
                v-model="form.username"
                type="text"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="បញ្ចូលឈ្មោះអ្នកប្រើប្រាស់"
              />
            </div>

            <div>
              <label class="block mb-2 text-sm font-semibold text-gray-700">តំណរភ្ជាប់រូបភាព (Google Drive)</label>
              <input
                v-model="form.photoUrl"
                type="text"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://drive.google.com/..."
              />
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="block mb-2 text-sm font-semibold text-gray-700">ពាក្យសម្ងាត់ថ្មី</label>
                <input
                  v-model="form.password"
                  type="password"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី"
                />
              </div>
              <div>
                <label class="block mb-2 text-sm font-semibold text-gray-700">បញ្ជាក់ពាក្យសម្ងាត់</label>
                <input
                  v-model="form.confirmPassword"
                  type="password"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="បញ្ជាក់ពាក្យសម្ងាត់"
                />
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                @click="resetForm"
                class="w-full px-6 py-2.5 font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm transition-all sm:w-auto"
              >
                ស្ដារឡើងវិញ
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="w-full px-6 py-2.5 font-semibold text-white bg-linear-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
              >
                <span v-if="saving">កំពុងរក្សាទុក...</span>
                <span v-else>រក្សាទុក</span>
              </button>
            </div>
          </form>

          <div v-if="isAdmin" class="p-4 mt-6 bg-white border border-gray-100 shadow-md rounded-2xl space-y-5 sm:p-6">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="min-w-0">
                <h3 class="text-lg font-semibold text-gray-800">គ្រប់គ្រងអ្នកប្រើប្រាស់</h3>
                <p class="text-sm text-gray-600">បន្ថែម និងមើលស្ថានភាពអ្នកប្រើប្រាស់</p>
              </div>
              <button
                type="button"
                @click="loadUsers"
                class="w-full px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 sm:w-auto"
              >
                ផ្ទុកបញ្ជី
              </button>
            </div>

            <form @submit.prevent="createUser" class="grid gap-4 md:grid-cols-3">
              <div class="md:col-span-1">
                <label class="block mb-2 text-sm font-semibold text-gray-700">ឈ្មោះអ្នកប្រើប្រាស់ថ្មី</label>
                <input
                  v-model="newUser.username"
                  type="text"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="username"
                />
              </div>
              <div class="md:col-span-1">
                <label class="block mb-2 text-sm font-semibold text-gray-700">ពាក្យសម្ងាត់</label>
                <input
                  v-model="newUser.password"
                  type="password"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="password"
                />
              </div>
              <div class="md:col-span-1">
                <label class="block mb-2 text-sm font-semibold text-gray-700">តួនាទី</label>
                <select
                  v-model="newUser.role"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option v-for="r in roles" :key="r.value" :value="r.value">
                    {{ r.label }}
                  </option>
                </select>
              </div>
              <div class="md:col-span-3 flex justify-end gap-3">
                <button
                  type="submit"
                  :disabled="creatingUser"
                  class="px-6 py-2.5 font-semibold text-white bg-linear-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span v-if="creatingUser">កំពុងបង្កើត...</span>
                  <span v-else>បង្កើតអ្នកប្រើ</span>
                </button>
              </div>
            </form>

            <div v-if="usersError" class="px-4 py-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
              {{ usersError }}
            </div>

            <div class="overflow-x-auto border border-gray-100 rounded-2xl">
              <div v-if="usersLoading" class="p-6 text-sm text-gray-600">កំពុងផ្ទុកបញ្ជី...</div>
              <table v-else class="w-full text-sm">
                <thead class="border-b-2 border-indigo-100 bg-indigo-50">
                  <tr>
                    <th class="px-4 py-3 font-bold text-left text-gray-700">ឈ្មោះ</th>
                    <th class="px-4 py-3 font-bold text-left text-gray-700">តួនាទី</th>
                    <th class="px-4 py-3 font-bold text-left text-gray-700">ស្ថានភាព</th>
                    <th class="px-4 py-3 font-bold text-left text-gray-700">ថ្ងៃបង្កើត</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in users" :key="u.id" class="border-b border-gray-100">
                    <td class="px-4 py-3 font-semibold text-gray-800">{{ u.username }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700">
                        {{ roleLabelFor(u.role) }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span :class="[
                        'px-2 py-1 text-xs font-semibold rounded-lg',
                        u.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      ]">
                        {{ u.isOnline ? 'Online' : 'Offline' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-gray-600">{{ formatDate(u.createDate) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { API_BASE_URL, imagePreview } from '../utils/helpers'

const profile = ref({
  id: '',
  username: '',
  role: '',
  createDate: '',
  photoUrl: '',
  photoPath: ''
})

const form = ref({
  username: '',
  photoUrl: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const imageError = ref(false)
const users = ref([])
const usersLoading = ref(false)
const usersError = ref('')
const creatingUser = ref(false)

const roles = [
  { value: 'admin', label: 'អ្នកគ្រប់គ្រង' },
  { value: 'teacher', label: 'គ្រូ' },
  { value: 'classrep', label: 'ប្រធានថ្នាក់' },
  { value: 'student', label: 'សិស្ស' }
]

const newUser = ref({
  username: '',
  password: '',
  role: 'teacher'
})

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}


const profileImage = computed(() => {
  if (imageError.value) return ''
  const raw = form.value.photoUrl || profile.value.photoUrl || profile.value.photoPath || ''
  return imagePreview(raw)
})

const userInitials = computed(() => {
  const base = form.value.username || profile.value.username || 'U'
  return String(base).charAt(0).toUpperCase()
})

const roleLabel = computed(() => {
  const role = String(profile.value.role || '').toLowerCase()
  if (role === 'admin') return 'អ្នកគ្រប់គ្រង'
  if (role === 'teacher') return 'គ្រូ'
  if (role === 'classrep') return 'ប្រធានថ្នាក់'
  if (role === 'student') return 'សិស្ស'
  return 'អ្នកប្រើប្រាស់'
})

const isAdmin = computed(() => String(profile.value.role || '').toLowerCase() === 'admin')

const roleLabelFor = (role) => {
  const r = String(role || '').toLowerCase()
  const match = roles.find((item) => item.value === r)
  return match ? match.label : 'អ្នកប្រើប្រាស់'
}

const formattedDate = computed(() => {
  if (!profile.value.createDate) return ''
  const date = new Date(profile.value.createDate)
  return date.toLocaleDateString('km-KH')
})

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleDateString('km-KH')
}

const handleImageError = () => {
  imageError.value = true
}

const resetForm = () => {
  form.value.username = profile.value.username || ''
  form.value.photoUrl = profile.value.photoUrl || profile.value.photoPath || ''
  form.value.password = ''
  form.value.confirmPassword = ''
  errorMessage.value = ''
  successMessage.value = ''
  imageError.value = false
}

const loadProfile = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders()
    })
    const data = await res.json()
    if (!data.success) {
      throw new Error(data.message || 'Failed to load profile')
    }
    profile.value = {
      id: data.data?.id || '',
      username: data.data?.username || '',
      role: data.data?.role || '',
      createDate: data.data?.createDate || '',
      photoUrl: data.data?.photoUrl || '',
      photoPath: data.data?.photoPath || ''
    }
    resetForm()
    if (String(profile.value.role || '').toLowerCase() === 'admin') {
      await loadUsers()
    }
  } catch (err) {
    errorMessage.value = err.message || 'កំហុសក្នុងការទាញយកព័ត៌មាន'
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  usersLoading.value = true
  usersError.value = ''
  try {
    const res = await fetch(`${API_BASE_URL}/auth/users`, {
      headers: getAuthHeaders()
    })
    const data = await res.json()
    if (!data.success) {
      throw new Error(data.message || 'Failed to load users')
    }
    users.value = Array.isArray(data.data) ? data.data : []
  } catch (err) {
    usersError.value = err.message || 'កំហុសក្នុងការទាញយកបញ្ជី'
  } finally {
    usersLoading.value = false
  }
}

const createUser = async () => {
  usersError.value = ''
  if (!newUser.value.username || !newUser.value.password) {
    usersError.value = 'សូមបំពេញឈ្មោះ និងពាក្យសម្ងាត់'
    return
  }
  creatingUser.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/auth/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        username: newUser.value.username,
        password: newUser.value.password,
        role: newUser.value.role
      })
    })
    const data = await res.json()
    if (!data.success) {
      throw new Error(data.message || 'Failed to create user')
    }
    newUser.value.username = ''
    newUser.value.password = ''
    newUser.value.role = 'teacher'
    await loadUsers()
  } catch (err) {
    usersError.value = err.message || 'កំហុសក្នុងការបង្កើតអ្នកប្រើ'
  } finally {
    creatingUser.value = false
  }
}

const saveProfile = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  if (!form.value.username || String(form.value.username).trim() === '') {
    errorMessage.value = 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់'
    return
  }
  if (form.value.password && form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'ពាក្យសម្ងាត់មិនត្រូវគ្នា'
    return
  }

  saving.value = true
  try {
    const payload = {
      username: String(form.value.username).trim(),
      photoUrl: form.value.photoUrl
    }
    if (form.value.password) payload.password = form.value.password

    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!data.success) {
      throw new Error(data.message || 'Failed to update profile')
    }

    profile.value = {
      ...profile.value,
      username: payload.username,
      photoUrl: payload.photoUrl
    }

    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        let user = JSON.parse(userStr)
        if (user && user.user) user = user.user
        user.username = payload.username
        if (payload.photoUrl !== undefined) user.photoUrl = payload.photoUrl
        localStorage.setItem('user', JSON.stringify(user))
      } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: { username: payload.username, photoUrl: payload.photoUrl } }))

    successMessage.value = 'បានរក្សាទុកដោយជោគជ័យ'
    form.value.password = ''
    form.value.confirmPassword = ''
    imageError.value = false
  } catch (err) {
    errorMessage.value = err.message || 'កំហុសក្នុងការរក្សាទុក'
  } finally {
    saving.value = false
  }
}

watch(() => form.value.photoUrl, () => {
  imageError.value = false
})

onMounted(() => {
  loadProfile()
})
</script>
