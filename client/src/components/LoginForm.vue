<template>
  <div class="flex items-center justify-center min-h-screen p-4 bg-linear-to-br from-indigo-500 via-purple-500 to-purple-700">
    <div class="w-full max-w-md p-6 bg-white shadow-lg rounded-xl animate-fade-in">
      <h1 class="mb-8 text-3xl font-bold text-center text-gray-800">ចូលប្រព័ន្ធ</h1>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="username" class="block mb-2 text-sm font-medium text-gray-700">ឈ្មោះអ្នកប្រើប្រាស់</label>
          <input
            id="username"
            v-model="credentials.username"
            type="text"
            placeholder="បញ្ចូលឈ្មោះអ្នកប្រើប្រាស់"
            class="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-30"
            required
          />
        </div>

        <div>
          <label for="password" class="block mb-2 text-sm font-medium text-gray-700">ពាក្យសម្ងាត់</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            placeholder="បញ្ចូលពាក្យសម្ងាត់"
            class="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-30"
            required
          />
        </div>

        <div class="flex items-center mb-2">
          <input
            id="rememberMe"
            type="checkbox"
            v-model="rememberMe"
            class="w-4 h-4 mr-2 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label for="rememberMe" class="text-sm text-gray-700 select-none">ចងចាំខ្ញុំ</label>
        </div>
        <button type="submit" class="w-full px-6 py-3 bg-linear-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed" :disabled="isLoading">
          {{ isLoading ? 'កំពុងចូល...' : 'ចូល' }}
        </button>
      </form>

      <!-- Error Message -->
      <div v-if="errorMessage" class="px-4 py-3 mt-4 text-sm text-red-600 border-l-4 border-red-600 rounded-lg bg-red-50">
        {{ errorMessage }}
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="px-4 py-3 mt-4 text-sm text-green-600 border-l-4 border-green-600 rounded-lg bg-green-50">
        {{ successMessage }}
      </div>

      
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { login, setAuthToken } from '../api/auth.js';

const credentials = ref({
  username: '',
  password: '',
});
const rememberMe = ref(false);

const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);


// Use Vite environment variable if provided; otherwise use relative `/api` so
// the app continues to work if host/port change (dev server proxy or reverse
// proxy can route requests to the backend).
const API_BASE_URL = axios.defaults.baseURL || '/api'

const handleLogin = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!credentials.value.username || !credentials.value.password) {
    errorMessage.value = 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់';
    return;
  }

  isLoading.value = true;

  try {
    const data = await login(credentials.value);

    if (data.success) {
      successMessage.value = 'ចូលប្រព័ន្ធជោគជ័យ!';
      // Store user info and token in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('token', data.token);
        setAuthToken(data.token);
      }
      
      // Remember Me logic
      if (rememberMe.value) {
        localStorage.setItem('rememberedUsername', credentials.value.username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }
      
      // Emit event to parent with user and token
      emit('login-success', { user: data.user, token: data.token });
      
      // Reset form, but keep rememberedUsername if checked
      if (!rememberMe.value) {
        credentials.value = { username: '', password: '' };
      } else {
        credentials.value.password = '';
      }
    } else {
      errorMessage.value = data.message || 'ការចូលបរាជ័យ';
    }
  } catch (error) {
    errorMessage.value = 'កំហុសការតភ្ជាប់: ' + error.message;
    console.error('Login error:', error);
  } finally {
    isLoading.value = false;
  }
};

// On mount, pre-fill username if remembered
onMounted(() => {
  const remembered = localStorage.getItem('rememberedUsername');
  if (remembered) {
    credentials.value.username = remembered;
    rememberMe.value = true;
  }
});

// Registration removed: app only provides login functionality now.

const emit = defineEmits(['login-success']);

defineProps({
  appTitle: {
    type: String,
    default: 'ប្រព័ន្ធគ្រប់គ្រងសាលារៀន',
  },
});
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
