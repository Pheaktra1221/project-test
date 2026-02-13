<template>
  <div class="container p-2 mx-auto">
    <div class="p-2 mb-8 bg-white border border-gray-100 shadow-xl rounded-2xl">
      <div class="flex items-center justify-between px-4 py-3 rounded-2xl bg-linear-to-r from-indigo-50 to-purple-50">
        <div>
          <h2 class="text-xl font-bold text-indigo-700">ការកំណត់ប្រព័ន្ធ</h2>
          <p class="text-sm text-gray-600">មុខងារសេវាកម្មសំខាន់ៗ</p>
        </div>
      </div>

      <div class="grid gap-6 p-4 md:grid-cols-2">
        <div class="p-6 bg-white border border-gray-100 shadow-md rounded-2xl">
          <h3 class="mb-2 text-lg font-semibold text-gray-800">ស្ថានភាពម៉ាស៊ីនមេ</h3>
          <p class="mb-4 text-sm text-gray-600">ពិនិត្យការតភ្ជាប់ទៅម៉ាស៊ីនមេ</p>
          <div v-if="statusMessage" :class="[
            'px-4 py-3 text-sm border rounded-xl mb-4',
            statusType === 'success' ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50'
          ]">
            {{ statusMessage }}
          </div>
          <button
            @click="checkServer"
            :disabled="checking"
            class="px-6 py-2.5 font-semibold text-white bg-linear-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="checking">កំពុងពិនិត្យ...</span>
            <span v-else>ពិនិត្យការតភ្ជាប់</span>
          </button>
        </div>

        <div class="p-6 bg-white border border-gray-100 shadow-md rounded-2xl">
          <h3 class="mb-2 text-lg font-semibold text-gray-800">ប្រព័ន្ធមូលដ្ឋាន</h3>
          <p class="mb-4 text-sm text-gray-600">សម្អាតទិន្នន័យក្នុងកម្មវិធី</p>
          <div class="flex flex-wrap gap-3">
            <button
              @click="clearCache"
              class="px-6 py-2.5 font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm transition-all"
            >
              សម្អាតទិន្នន័យ
            </button>
            <button
              @click="reloadPage"
              class="px-6 py-2.5 font-semibold text-white bg-linear-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              ផ្ទុកឡើងវិញ
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = (() => {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  if (base) return base.endsWith('/api') ? base : base + '/api'
  const url = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  if (url) return url.endsWith('/api') ? url : url + '/api'
  return '/api'
})()
const router = useRouter()

const checking = ref(false)
const statusMessage = ref('')
const statusType = ref('success')

const checkServer = async () => {
  checking.value = true
  statusMessage.value = ''
  try {
    const res = await fetch(`${API_BASE_URL}/health`)
    const data = await res.json()
    if (res.ok && (data.status || data.message || data.success)) {
      statusType.value = 'success'
      statusMessage.value = 'ម៉ាស៊ីនមេដំណើរការបានជោគជ័យ'
    } else {
      statusType.value = 'error'
      statusMessage.value = 'មិនអាចតភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ'
    }
  } catch (e) {
    statusType.value = 'error'
    statusMessage.value = 'មិនអាចតភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ'
  } finally {
    checking.value = false
  }
}

const clearCache = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  localStorage.removeItem('rememberedUsername')
  router.push('/login')
}

const reloadPage = () => {
  window.location.reload()
}
</script>
