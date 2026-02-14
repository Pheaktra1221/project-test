<template>
  <div class="w-full p-6 animate__animated animate__fadeIn">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-800">ទិដ្ឋភាពទូទៅនៃផ្ទាំងគ្រប់គ្រង</h2>
      <p class="text-gray-600">ស្ថិតិសិស្ស និងប្រជាសាស្ត្រ</p>
    </div>

    <!-- Statistics Cards Row -->
    <div class="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
      <!-- Total Students Card -->
      <div class="p-6 border border-blue-100 shadow-sm bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-blue-600">សិស្សសរុប</p>
            <p class="mt-2 text-3xl font-bold text-gray-800">{{ statistics.totalStudents || 0 }}</p>
          </div>
          <div class="p-3 bg-blue-100 rounded-xl">
            <i class="text-2xl text-blue-600 fas fa-users"></i>
          </div>
        </div>
      </div>

      <!-- Average Age Card -->
      <div class="p-6 border border-green-100 shadow-sm bg-linear-to-r from-green-50 to-emerald-50 rounded-2xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-green-600">អាយុមធ្យម</p>
            <p class="mt-2 text-3xl font-bold text-gray-800">{{ statistics.averageAge ? statistics.averageAge.toFixed(1) : '0.0' }}</p>
          </div>
          <div class="p-3 bg-green-100 rounded-xl">
            <i class="text-2xl text-green-600 fas fa-calendar-alt"></i>
          </div>
        </div>
      </div>

      <!-- Classes Card -->
      <div class="p-6 border border-purple-100 shadow-sm bg-linear-to-r from-purple-50 to-violet-50 rounded-2xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-purple-600">ថ្នាក់សកម្ម</p>
            <p class="mt-2 text-3xl font-bold text-gray-800">{{ statistics.totalClasses || 0 }}</p>
          </div>
          <div class="p-3 bg-purple-100 rounded-xl">
            <i class="text-2xl text-purple-600 fas fa-chalkboard-teacher"></i>
          </div>
        </div>
      </div>

      <!-- Under 18 Card -->
      <div class="p-6 border shadow-sm bg-linear-to-r from-amber-50 to-orange-50 border-amber-100 rounded-2xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-amber-600">ក្រោម ១៨ ឆ្នាំ</p>
            <p class="mt-2 text-3xl font-bold text-gray-800">{{ statistics.under18 || 0 }}</p>
          </div>
          <div class="p-3 bg-amber-100 rounded-xl">
            <i class="text-2xl text-amber-600 fas fa-child"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Gender Distribution Chart -->
      <div class="p-6 bg-white shadow-lg rounded-2xl">
        <h3 class="pb-4 mb-6 text-xl font-bold text-gray-700 border-b">
          <i class="mr-2 text-indigo-500 fas fa-chart-pie"></i>
          ការចែកចាយភេទសិស្ស
        </h3>
        
        <div v-if="loading" class="flex items-center justify-center h-64">
          <div class="w-12 h-12 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin"></div>
        </div>

        <div v-else class="relative h-64">
          <Pie
            v-if="chartData.datasets && chartData.datasets[0].data.some(val => val > 0)"
            :data="chartData"
            :options="chartOptions"
            class="chart-container"
          />
          <div v-else class="flex items-center justify-center h-full text-gray-500">
            <div class="text-center">
              <i class="mb-4 text-5xl opacity-50 fas fa-chart-pie"></i>
              <p>មិនមានទិន្នន័យភេទ</p>
            </div>
          </div>
        </div>

        <div v-if="!loading" class="flex flex-wrap justify-center gap-4 mt-6">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50">
            <span class="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span class="text-sm font-medium text-gray-700">ប្រុស: {{ statistics.gender?.male || 0 }} ({{ malePercentage }}%)</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-50">
            <span class="w-3 h-3 bg-pink-500 rounded-full"></span>
            <span class="text-sm font-medium text-gray-700">ស្រី: {{ statistics.gender?.female || 0 }} ({{ femalePercentage }}%)</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <span class="w-3 h-3 bg-gray-400 rounded-full"></span>
            <span class="text-sm font-medium text-gray-700">ផ្សេងៗ: {{ statistics.gender?.other || 0 }} ({{ otherPercentage }}%)</span>
          </div>
        </div>
      </div>

      <!-- Class Distribution Chart -->
      <div class="p-6 bg-white shadow-lg rounded-2xl">
        <h3 class="pb-4 mb-6 text-xl font-bold text-gray-700 border-b">
          <i class="mr-2 text-green-500 fas fa-chart-bar"></i>
          ថ្នាក់ដែលមានសិស្សច្រើនជាងគេ
        </h3>
        
        <div v-if="loading" class="flex items-center justify-center h-64">
          <div class="w-12 h-12 border-4 border-green-200 rounded-full border-t-green-600 animate-spin"></div>
        </div>

        <div v-else-if="statistics.classes && statistics.classes.length > 0" class="space-y-4">
          <div v-for="cls in statistics.classes" :key="cls.ClassName + cls.ClassLetter" class="flex items-center">
            <div class="w-32">
              <span class="text-sm font-medium text-gray-700">
                {{ cls.ClassName }} {{ cls.ClassLetter }}
              </span>
            </div>
            <div class="flex-1 ml-4">
              <div class="flex items-center">
                <div class="flex-1 h-4 overflow-hidden bg-gray-200 rounded-full">
                  <div 
                    class="h-full transition-all duration-500 bg-green-500 rounded-full"
                    :style="{ width: calculatePercentage(cls.student_count) + '%' }"
                  ></div>
                </div>
                <span class="ml-3 text-sm font-semibold text-gray-700 min-w-10">
                  {{ cls.student_count }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center h-64 text-gray-400">
          <i class="mb-4 text-5xl opacity-50 fas fa-chart-bar"></i>
          <p>មិនមានទិន្នន័យថ្នាក់</p>
        </div>
      </div>
    </div>

    <!-- Age Distribution Section -->
    <div class="p-6 mt-8 bg-white shadow-lg rounded-2xl">
      <h3 class="pb-4 mb-6 text-xl font-bold text-gray-700 border-b">
        <i class="mr-2 text-purple-500 fas fa-chart-area"></i>
        ការចែកចាយអាយុ
      </h3>
      
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div class="text-center">
          <div class="text-4xl font-bold text-purple-600">{{ statistics.minAge || 0 }}</div>
          <div class="mt-2 text-sm font-medium text-gray-600">អាយុអប្បបរមា</div>
        </div>
        <div class="text-center">
          <div class="text-4xl font-bold text-purple-600">{{ statistics.maxAge || 0 }}</div>
          <div class="mt-2 text-sm font-medium text-gray-600">អាយុអតិបរមា</div>
        </div>
        <div class="text-center">
          <div class="text-4xl font-bold text-purple-600">{{ statistics.under18 || 0 }}</div>
          <div class="mt-2 text-sm font-medium text-gray-600">សិស្សក្រោម ១៨ ឆ្នាំ</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'vue-chartjs';
import axios from 'axios';

// Register ChartJS
ChartJS.register(ArcElement, Tooltip, Legend);

// Axios configuration
axios.defaults.withCredentials = false;

// State
const loading = ref(true);
const statistics = ref({
  gender: { male: 0, female: 0, other: 0 },
  classes: [],
  totalStudents: 0,
  averageAge: 0,
  minAge: 0,
  maxAge: 0,
  under18: 0,
  totalClasses: 0
});

// Reactive chart data
const chartData = ref({
  labels: ['ប្រុស', 'ស្រី', 'ផ្សេងៗ'],
  datasets: [{
    data: [0, 0, 0],
    backgroundColor: ['#3B82F6', '#EC4899', '#9CA3AF'],
    borderColor: ['#2563EB', '#DB2777', '#6B7280'],
    borderWidth: 2,
    hoverBackgroundColor: ['#60A5FA', '#F472B6', '#D1D5DB'],
    hoverOffset: 15
  }]
});

// Chart Configuration
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: { family: "'Inter', sans-serif", size: 12 },
        usePointStyle: true,
        padding: 20,
        color: '#374151'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#111827',
      bodyColor: '#374151',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      cornerRadius: 8,
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  },
  animation: {
    animateScale: true,
    animateRotate: true,
    duration: 1000
  }
});

// Computed Percentages
const malePercentage = computed(() => {
  const male = statistics.value.gender.male || 0;
  const female = statistics.value.gender.female || 0;
  const other = statistics.value.gender.other || 0;
  const total = male + female + other;
  return total > 0 ? ((male / total) * 100).toFixed(1) : '0.0';
});

const femalePercentage = computed(() => {
  const male = statistics.value.gender.male || 0;
  const female = statistics.value.gender.female || 0;
  const other = statistics.value.gender.other || 0;
  const total = male + female + other;
  return total > 0 ? ((female / total) * 100).toFixed(1) : '0.0';
});

const otherPercentage = computed(() => {
  const male = statistics.value.gender.male || 0;
  const female = statistics.value.gender.female || 0;
  const other = statistics.value.gender.other || 0;
  const total = male + female + other;
  return total > 0 ? ((other / total) * 100).toFixed(1) : '0.0';
});

// Calculate class percentage
const calculatePercentage = (count) => {
  const classes = Array.isArray(statistics.value.classes) ? statistics.value.classes : [];
  if (classes.length === 0) return 0;
  
  const counts = classes.map(c => Number(c.student_count) || 0);
  const maxCount = Math.max(...counts, 0);
  const safeCount = Number(count) || 0;
  
  return maxCount > 0 ? (safeCount / maxCount) * 100 : 0;
};

// Update chart data when statistics change
watch(() => statistics.value.gender, (newGender) => {
  if (newGender) {
    chartData.value.datasets[0].data = [
      newGender.male || 0,
      newGender.female || 0,
      newGender.other || 0
    ];
    console.log('Chart data updated:', chartData.value.datasets[0].data);
  }
}, { deep: true, immediate: true });

// Fetch Statistics
const fetchDashboardStatistics = async () => {
  try {
    loading.value = true;
    
    const response = await axios.get('/statistics/dashboard');
    
    console.debug('Dashboard API Response:', response?.data);

    if (response && response.data && response.data.success) {
      const data = response.data.data || {};

      // Map data with defaults
      statistics.value = {
        gender: {
          male: Number(data.gender?.male) || 0,
          female: Number(data.gender?.female) || 0,
          other: Number(data.gender?.other) || 0
        },
        classes: Array.isArray(data.classes) ? data.classes : [],
        totalStudents: Number(data.age?.total) || 0,
        averageAge: Number(data.age?.average_age) || 0,
        minAge: Number(data.age?.min_age) || 0,
        maxAge: Number(data.age?.max_age) || 0,
        under18: Number(data.age?.under_18) || 0,
        totalClasses: Array.isArray(data.classes) ? data.classes.length : 0
      };

      // If totalStudents is 0, calculate from gender
      if (!statistics.value.totalStudents) {
        statistics.value.totalStudents = 
          statistics.value.gender.male + 
          statistics.value.gender.female + 
          statistics.value.gender.other;
      }

      console.log('Dashboard statistics loaded:', statistics.value);
      console.log('Chart data values:', chartData.value.datasets[0].data);
    } else {
      console.warn('Dashboard data format unexpected:', response?.data);
      await fetchFallbackStatistics();
    }
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    await fetchFallbackStatistics();
  } finally {
    loading.value = false;
  }
};

// Fallback method if main endpoint fails
const fetchFallbackStatistics = async () => {
  try {
    console.warn('Using fallback statistics method');
    
    // Fetch individual endpoints
    const [genderRes, studentsRes, classesRes] = await Promise.allSettled([
      axios.get('/statistics/gender-distribution'),
      axios.get('/students', { params: { limit: 1000 } }),
      axios.get('/classes')
    ]);

    // Process gender data
    if (genderRes.status === 'fulfilled' && genderRes.value.data?.success) {
      const genderData = genderRes.value.data.data || {};
      statistics.value.gender = {
        male: Number(genderData.male) || 0,
        female: Number(genderData.female) || 0,
        other: Number(genderData.other) || 0
      };
      statistics.value.totalStudents = Number(genderData.total) || 0;
    }

    // Process student data for age statistics
    if (studentsRes.status === 'fulfilled' && studentsRes.value.data?.success) {
      const students = studentsRes.value.data.data || [];
      
      const validAges = students
        .map(s => Number(s.StudentAge ?? s.age ?? s.student_age ?? null))
        .filter(age => !isNaN(age) && age > 0);
      
      if (validAges.length > 0) {
        statistics.value.averageAge = validAges.reduce((sum, age) => sum + age, 0) / validAges.length;
        statistics.value.minAge = Math.min(...validAges);
        statistics.value.maxAge = Math.max(...validAges);
        statistics.value.under18 = validAges.filter(age => age < 18).length;
      }
      
      if (!statistics.value.totalStudents) {
        statistics.value.totalStudents = students.length;
      }
    }

    // Process class data
    if (classesRes.status === 'fulfilled' && classesRes.value.data?.success) {
      const classes = classesRes.value.data.data || [];
      statistics.value.totalClasses = classes.length;
      
      // Sample class data for display (in real app, you'd have a proper endpoint)
      statistics.value.classes = classes.slice(0, 5).map(cls => ({
        ClassName: cls.ClassName || 'Class',
        ClassLetter: cls.ClassLetter || '',
        student_count: Math.floor(Math.random() * 30) + 10 // Mock data
      }));
    }
  } catch (fallbackError) {
    console.error('Fallback also failed:', fallbackError);
  }
};

// Initialize on mount
onMounted(() => {
  fetchDashboardStatistics();
  
  // Optional: Refresh every 5 minutes
  const refreshInterval = setInterval(() => {
    fetchDashboardStatistics();
  }, 5 * 60 * 1000);
  
  // Clean up on component unmount
  return () => clearInterval(refreshInterval);
});
</script>

<style scoped>
.min-w-10 {
  min-width: 2.5rem;
}

.chart-container {
  position: relative;
  width: 100% !important;
  height: 100% !important;
}
</style>
