<template>
  <div class="container p-2 mx-auto font-sans sm:p-4">
    <!-- Header Section -->
    <div class="p-4 mb-8 bg-white border border-gray-100 shadow-xl rounded-2xl sm:p-6">
      <div class="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-xl font-bold text-gray-800 sm:text-2xl">បញ្ចូលពិន្ទុ</h1>
        
        <div class="flex flex-wrap gap-2">
           <!-- Sync Status Indicator -->
           <div v-if="saveStatus" class="flex items-center px-4 py-2 text-sm font-medium shadow-sm rounded-xl"
             :class="{
               'bg-yellow-50 text-yellow-700 border border-yellow-100': saveStatus === 'saving',
               'bg-green-50 text-green-700 border border-green-100': saveStatus === 'saved',
               'bg-red-50 text-red-700 border border-red-100': saveStatus === 'error'
             }">
             <span v-if="saveStatus === 'saving'" class="mr-2 animate-spin">⟳</span>
             {{ saveStatusText }}
           </div>

           <!-- Print Button -->
           <button 
             v-if="viewMode === 'grid'"
             @click="openPrintPreview"
             class="flex items-center justify-center px-5 py-2.5 text-white transition-all duration-200 shadow-md rounded-xl bg-linear-to-r from-indigo-500 to-indigo-600 hover:shadow-lg hover:-translate-y-0.5"
           >
             <span class="mr-2">🖨️</span> បោះពុម្ព
           </button>

           <!-- Back Button (when in grid view) -->
           <button 
             v-if="viewMode === 'grid'"
             @click="viewMode = 'cards'; selectedExamType = ''"
             class="flex items-center justify-center w-full px-5 py-2.5 text-gray-700 transition-all duration-200 bg-white border border-gray-200 shadow-md rounded-xl sm:w-auto hover:bg-gray-50 hover:shadow-lg hover:-translate-y-0.5"
           >
             ← ត្រឡប់ទៅខែ
           </button>
        </div>
      </div>
      
      <!-- Class & Year Selector -->
      <div class="flex flex-col gap-4 mb-6 sm:flex-row">
        <div class="w-full sm:w-1/2">
            <label class="block mb-2 text-sm font-medium text-gray-700">ជ្រើសរើសថ្នាក់</label>
            <select 
            v-model="selectedClassId" 
            @change="onClassChange"
            class="w-full p-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
            <option value="" disabled>ជ្រើសរើសថ្នាក់</option>
            <option v-for="cls in classes" :key="cls.ClassId" :value="cls.ClassId">
                {{ cls.ClassName }} ({{ cls.ClassLetter }})
            </option>
            </select>
        </div>

        <div class="w-full sm:w-1/2">
            <label class="block mb-2 text-sm font-medium text-gray-700">ជ្រើសរើសឆ្នាំសិក្សា</label>
            <select 
            v-model="selectedYear" 
            @change="onYearChange"
            class="w-full p-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
            <option v-for="year in years" :key="year" :value="year">
                {{ year }}
            </option>
            </select>
        </div>
      </div>

      <!-- Month/Exam Cards Section -->
      <div v-if="selectedClassId && viewMode === 'cards'" class="animate__animated animate__fadeIn">
        <h2 class="mb-4 text-lg font-semibold text-gray-600">ជ្រើសរើសខែ / ការប្រឡង</h2>
        
        <div class="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <!-- Months -->
          <div 
            v-for="month in months" 
            :key="month.en"
            @click="selectExamType(month.en)"
            class="flex items-center justify-center p-4 transition-all duration-200 bg-white border border-gray-100 shadow-md cursor-pointer sm:p-6 rounded-2xl hover:shadow-xl hover:border-indigo-200 hover:bg-linear-to-r hover:from-indigo-50 hover:to-purple-50 group hover:-translate-y-1"
          >
            <div class="text-center">
              <span class="block text-base font-medium text-gray-700 sm:text-lg group-hover:text-indigo-700">{{ month.km }}</span>
            </div>
          </div>
          
          <!-- Semesters -->
          <div 
            v-for="sem in semesters" 
            :key="sem.en"
            @click="selectExamType(sem.en)"
            class="flex items-center justify-center p-4 transition-all duration-200 border border-indigo-100 shadow-md cursor-pointer bg-indigo-50 sm:p-6 rounded-2xl hover:shadow-xl hover:border-indigo-300 hover:bg-linear-to-r hover:from-indigo-100 hover:to-purple-100 group hover:-translate-y-1"
          >
            <div class="text-center">
              <span class="block text-base font-bold text-indigo-700 sm:text-lg group-hover:text-indigo-900">{{ sem.km }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grid Section -->
    <div v-if="viewMode === 'grid' && gridData.students.length > 0" class="overflow-hidden bg-white border border-gray-100 shadow-xl rounded-2xl animate__animated animate__fadeInUp">
      <div class="p-4 border-b border-gray-100 bg-gray-50/50">
        <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h3 class="text-lg font-bold text-gray-800">
            {{ getClassName(selectedClassId) }} - <span class="text-indigo-600">{{ getExamLabel(selectedExamType) }}</span>
            </h3>

            <!-- Filters & Search -->
            <div class="flex flex-col gap-2 sm:flex-row">
                <!-- Subject Filter -->
                <select 
                    v-model="subjectFilter" 
                    class="p-2.5 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                    <option value="">គ្រប់មុខវិជ្ជា</option>
                    <option v-for="sub in gridData.subjects" :key="sub.SubjectID" :value="sub.SubjectID">
                        {{ sub.SubjectName }}
                    </option>
                </select>

                <!-- Search Input -->
                <div class="relative">
                    <input 
                        v-model="searchQuery"
                        type="text"
                        placeholder="ស្វែងរកឈ្មោះ..."
                        class="w-full p-2.5 pl-9 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <span class="absolute text-gray-400 left-3 top-3">🔍</span>
                </div>
            </div>
        </div>
      </div>
      
      <div class="px-4 pb-4 space-y-4 md:hidden">
        <div v-for="(student, index) in filteredStudents" :key="student.StudentID" class="p-4 bg-white border border-gray-100 shadow-md rounded-2xl">
          <div class="flex items-center justify-between mb-3">
            <div>
              <div class="text-sm text-gray-500">ល.រ {{ index + 1 }}</div>
              <div class="text-base font-semibold text-gray-800">{{ student.StudentLastname }} {{ student.StudentFirstname }}</div>
              <div class="text-xs text-gray-500">{{ student.StudentSex === 'M' ? 'ប្រុស' : 'ស្រី' }}</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-500">សរុប</div>
              <div class="text-lg font-bold text-indigo-700">{{ calculateTotal(student.StudentID) }}</div>
              <div class="text-xs text-gray-500">មធ្យម</div>
              <div class="text-sm font-semibold text-purple-700">{{ calculateAverage(student.StudentID) }}</div>
            </div>
          </div>

          <div class="space-y-3">
            <div v-for="sub in filteredSubjects" :key="sub.SubjectID" class="flex items-start justify-between gap-3 p-2 border border-gray-100 rounded-xl">
              <div class="text-sm font-medium text-gray-700">{{ sub.SubjectName }}</div>
              <div class="flex flex-col items-end gap-1">
                <input
                  type="number"
                  :value="getScore(student.StudentID, sub.SubjectID)"
                  @input="handleScoreInput(student.StudentID, sub.SubjectID, $event.target.value)"
                  class="w-24 px-3 py-2 text-center border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  :class="{'border-red-300 text-red-600 font-semibold': hasValidationError(student.StudentID, sub.SubjectID)}"
                  placeholder="-"
                />
                <div v-if="hasValidationError(student.StudentID, sub.SubjectID)" class="text-[10px] font-semibold text-red-500">
                  0-100
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3">
            <label class="block mb-1 text-xs font-semibold text-gray-600">ផ្សេងៗ</label>
            <input
              type="text"
              :value="getRemark(student.StudentID)"
              @change="saveRemark(student.StudentID, $event.target.value)"
              class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="..."
            />
          </div>
        </div>
      </div>

      <div class="hidden px-4 -mx-4 overflow-x-auto sm:mx-0 sm:px-0 md:block">
        <table class="w-full text-xs border-collapse sm:text-sm">
          <thead>
            <tr class="text-sm font-bold text-gray-700 border-b-2 border-indigo-100 bg-linear-to-r from-indigo-50 to-purple-50">
              <th class="p-2 text-left border-r border-gray-200 min-w-11.25 whitespace-nowrap sm:p-4">ល.រ</th>
              <th class="p-2 text-left border-r border-gray-200 min-w-35 whitespace-nowrap sm:min-w-45 sm:p-4">ឈ្មោះ</th>
              <th class="p-2 text-center border-r border-gray-200 min-w-12.5 whitespace-nowrap sm:min-w-17.5 sm:p-4">ភេទ</th>
              
              <!-- Dynamic Subjects -->
              <th 
                v-for="sub in filteredSubjects" 
                :key="sub.SubjectID"
                class="p-2 text-center border-r border-gray-200 min-w-20 whitespace-nowrap sm:min-w-27.5 sm:p-4"
              >
                {{ sub.SubjectName }}
              </th>
              
              <th class="p-2 text-center border-r border-gray-200 min-w-17.5 whitespace-nowrap sm:min-w-22.5 sm:p-4">សរុប</th>
              <th class="p-2 text-center border-r border-gray-200 min-w-22.5 whitespace-nowrap sm:min-w-27.5 sm:p-4">មធ្យមភាគ</th>
              <th class="p-2 text-center min-w-32.5 whitespace-nowrap sm:min-w-40 sm:p-4">ផ្សេងៗ</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(student, index) in filteredStudents" 
              :key="student.StudentID"
              class="transition-all duration-200 border-b border-gray-100 hover:bg-linear-to-r hover:from-indigo-50 hover:to-purple-50"
            >
              <td class="p-2 text-center border-r border-gray-200 sm:p-4">{{ index + 1 }}</td>
              <td class="p-2 font-medium border-r border-gray-200 whitespace-nowrap sm:p-4">
                {{ student.StudentLastname }} {{ student.StudentFirstname }}
              </td>
              <td class="p-2 text-center border-r border-gray-200 sm:p-4">{{ student.StudentSex === 'M' ? 'ប្រុស' : 'ស្រី' }}</td>

              <!-- Subject Scores -->
              <td 
                v-for="sub in filteredSubjects" 
                :key="sub.SubjectID"
                class="relative p-0 border-r border-gray-200"
                :class="{'bg-red-50': hasValidationError(student.StudentID, sub.SubjectID)}"
              >
                <input 
                  type="number" 
                  :value="getScore(student.StudentID, sub.SubjectID)"
                  @input="handleScoreInput(student.StudentID, sub.SubjectID, $event.target.value)"
                  class="w-full h-full p-2 text-center transition-colors bg-transparent focus:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:p-3"
                  :class="{'text-red-600 font-bold': hasValidationError(student.StudentID, sub.SubjectID)}"
                  placeholder="-"
                />
                <!-- Validation Tooltip -->
                <div v-if="hasValidationError(student.StudentID, sub.SubjectID)" class="absolute z-10 px-2 py-1 text-xs text-white -translate-x-1/2 bg-red-500 rounded -top-8 left-1/2 whitespace-nowrap">
                    ពិន្ទុមិនត្រឹមត្រូវ (0-100)
                </div>
              </td>

              <!-- Calculations -->
              <td class="p-2 font-bold text-center text-gray-700 border-r border-gray-200 sm:p-4">
                {{ calculateTotal(student.StudentID) }}
              </td>
              <td class="p-2 font-bold text-center text-gray-700 border-r border-gray-200 sm:p-4">
                {{ calculateAverage(student.StudentID) }}
              </td>

              <!-- Remarks -->
              <td class="p-0">
                <input 
                  type="text"
                  :value="getRemark(student.StudentID)"
                  @change="saveRemark(student.StudentID, $event.target.value)"
                  class="w-full h-full p-2 transition-colors bg-transparent focus:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:p-3"
                  placeholder="..."
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="viewMode === 'grid' && !loading" class="p-12 text-center text-gray-500 bg-white border border-gray-100 shadow-xl rounded-2xl">
      <p class="text-xl">រកមិនឃើញសិស្សសម្រាប់ថ្នាក់នេះទេ។</p>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div class="p-6 bg-white rounded-lg shadow-xl">
        <div class="w-8 h-8 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <p>កំពុងដំណើរការ...</p>
      </div>
    </div>

    <!-- Print Preview Modal -->
    <div v-if="showPrintModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border-2 border-gray-200">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-linear-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
                <h3 class="text-2xl font-bold text-gray-800">កម្រាស់បោះពុម្ព (Print Preview)</h3>
                <button @click="showPrintModal = false" class="text-2xl text-gray-500 transition-colors hover:text-red-500">✕</button>
            </div>
            
            <!-- Modal Body (Printable Area) -->
            <div class="flex-1 p-8 overflow-auto bg-gray-100">
                <div id="print-area" class="bg-white p-8 mx-auto shadow-sm max-w-[210mm] min-h-[297mm]">
                    <div class="mb-6 text-center">
                        <h1 class="text-2xl font-bold font-moul">ព្រះរាជាណាចក្រកម្ពុជា</h1>
                        <h2 class="text-xl font-bold font-moul">ជាតិ សាសនា ព្រះមហាក្សត្រ</h2>
                        <div class="my-4 text-lg font-bold font-moul">តារាងពិន្ទុសិស្ស</div>
                        <div class="flex justify-between mt-6 font-bold">
                            <div>ថ្នាក់ទី: {{ getClassName(selectedClassId) }}</div>
                            <div>{{ getExamLabel(selectedExamType) }}</div>
                        </div>
                    </div>

                    <table class="w-full border border-collapse border-black">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="p-2 border border-black">ល.រ</th>
                                <th class="p-2 border border-black">ឈ្មោះ</th>
                                <th class="p-2 border border-black">ភេទ</th>
                                <th v-for="sub in filteredSubjects" :key="sub.SubjectID" class="p-2 border border-black">
                                    {{ sub.SubjectName }}
                                </th>
                                <th class="p-2 border border-black">សរុប</th>
                                <th class="p-2 border border-black">មធ្យម</th>
                                <th class="p-2 border border-black">ចំណាត់ថ្នាក់</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(student, index) in filteredStudents" :key="student.StudentID">
                                <td class="p-2 text-center border border-black">{{ index + 1 }}</td>
                                <td class="p-2 border border-black">{{ student.StudentLastname }} {{ student.StudentFirstname }}</td>
                                <td class="p-2 text-center border border-black">{{ student.StudentSex === 'M' ? 'ប្រុស' : 'ស្រី' }}</td>
                                <td v-for="sub in filteredSubjects" :key="sub.SubjectID" class="p-2 text-center border border-black">
                                    {{ getScore(student.StudentID, sub.SubjectID) || '-' }}
                                </td>
                                <td class="p-2 font-bold text-center border border-black">{{ calculateTotal(student.StudentID) }}</td>
                                <td class="p-2 font-bold text-center border border-black">{{ calculateAverage(student.StudentID) }}</td>
                                <td class="p-2 text-center border border-black">{{ calculateRank(student.StudentID) }}</td>
                            </tr>
                        </tbody>
                    </table>

                     <div class="flex justify-between mt-12 text-sm">
                        <div class="text-center">
                            <p>បានឃើញ និងឯកភាព</p>
                            <p class="mt-2 font-bold">នាយកសាលា</p>
                        </div>
                        <div class="text-center">
                            <p>ថ្ងៃទី...... ខែ...... ឆ្នាំ......</p>
                            <p class="mt-2 font-bold">គ្រូបន្ទុកថ្នាក់</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex justify-end gap-3 p-6 border-t-2 border-gray-200 bg-linear-to-r from-indigo-50 to-purple-50 rounded-b-2xl">
                <button @click="showPrintModal = false" class="px-6 py-2.5 font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm transition-all">
                    បិទ
                </button>
                <button @click="printNow" class="px-6 py-2.5 font-semibold text-white bg-linear-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                    🖨️ បោះពុម្ពឥឡូវនេះ
                </button>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive } from 'vue';
import { useAppStore } from '../stores/appStore';
import { API_BASE_URL } from '../utils/helpers';

const appStore = useAppStore();

// State
const classes = ref([]);
const selectedClassId = ref('');
const selectedExamType = ref('');
const selectedYear = ref(new Date().getFullYear());
const years = computed(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => current - 5 + i);
});
const loading = ref(false);
const viewMode = ref('cards'); // 'cards' | 'grid'
const searchQuery = ref('');
const subjectFilter = ref('');
const showPrintModal = ref(false);
const saveStatus = ref(''); // 'saved', 'saving', 'error'
const saveStatusText = computed(() => {
    if (saveStatus.value === 'saving') return 'កំពុងរក្សាទុក...';
    if (saveStatus.value === 'saved') return 'បានរក្សាទុក';
    if (saveStatus.value === 'error') return 'បរាជ័យ';
    return '';
});

const gridData = ref({
  students: [],
  subjects: [],
  scores: [], // Array of objects from DB
  remarks: [] // Array of objects from DB
});

const validationErrors = reactive(new Set()); // Set of "studentId-subjectId" strings

const months = [
  { en: 'January', km: 'មករា' },
  { en: 'February', km: 'កុម្ភៈ' },
  { en: 'March', km: 'មីនា' },
  { en: 'April', km: 'មេសា' },
  { en: 'May', km: 'ឧសភា' },
  { en: 'June', km: 'មិថុនា' },
  { en: 'July', km: 'កក្កដា' },
  { en: 'August', km: 'សីហា' },
  { en: 'September', km: 'កញ្ញា' },
  { en: 'October', km: 'តុលា' },
  { en: 'November', km: 'វិច្ឆិកា' },
  { en: 'December', km: 'ធ្នូ' }
];

const semesters = [
  { en: 'Semester 1', km: 'ឆមាសទី ១' },
  { en: 'Semester 2', km: 'ឆមាសទី ២' }
];

const canLoad = computed(() => selectedClassId.value && selectedExamType.value);

// Utility: Khmer Number Conversion
const convertKhmerToLatin = (str) => {
    if (!str) return '';
    return str.toString().replace(/[០-៩]/g, d => '០១២៣៤៥៦៧៨៩'.indexOf(d));
};

// Computed: Filtered Data
const filteredSubjects = computed(() => {
    if (!subjectFilter.value) return gridData.value.subjects;
    return gridData.value.subjects.filter(s => s.SubjectID === subjectFilter.value);
});

const filteredStudents = computed(() => {
    if (!searchQuery.value) return gridData.value.students;
    const query = convertKhmerToLatin(searchQuery.value).toLowerCase();
    
    return gridData.value.students.filter(s => {
        const fullName = `${s.StudentLastname} ${s.StudentFirstname}`.toLowerCase();
        const id = s.StudentID.toString();
        return fullName.includes(query) || id.includes(query);
    });
});

// API Helper
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };
  
  const res = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  return res.json();
};

// Initialization
onMounted(async () => {
  try {
    const res = await fetchWithAuth('/class'); 
    if (res.success) {
      classes.value = res.data;
    }
  } catch (e) {
    console.error('Failed to load classes', e);
  }
});

const onClassChange = () => {
  viewMode.value = 'cards';
  selectedExamType.value = '';
  gridData.value = { students: [], subjects: [], scores: [], remarks: [] };
};

const onYearChange = () => {
  viewMode.value = 'cards';
  selectedExamType.value = '';
  gridData.value = { students: [], subjects: [], scores: [], remarks: [] };
};

const selectExamType = (type) => {
  selectedExamType.value = `${type}-${selectedYear.value}`;
  loadGrid();
};

const getClassName = (id) => {
  const cls = classes.value.find(c => c.ClassId === id);
  return cls ? `${cls.ClassName} (${cls.ClassLetter})` : id;
};

const getExamLabel = (type) => {
  if (!type) return '';
  // Split base type and year (e.g., "January-2026")
  // Handle case where type might not have year (legacy?)
  const parts = type.split('-');
  const base = parts[0];
  const year = parts.length > 1 ? parts[parts.length - 1] : '';

  const month = months.find(m => m.en === base);
  if (month) return `${month.km} ${year}`;
  
  const sem = semesters.find(s => s.en === base);
  if (sem) return `${sem.km} ${year}`;
  
  return type;
};

// Grid Loading
const loadGrid = async () => {
  if (!canLoad.value) return;
  
  loading.value = true;
  saveStatus.value = '';

  // Cache Key
  const cacheKey = `score_grid_${selectedClassId.value}_${selectedExamType.value}`;
  
  // Try loading from cache first (for speed)
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
      try {
          gridData.value = JSON.parse(cached);
          viewMode.value = 'grid';
      } catch (e) {
          console.error('Cache parse error', e);
      }
  }

  try {
    const params = new URLSearchParams({
      classId: selectedClassId.value,
      examType: selectedExamType.value
    });
    
    const res = await fetchWithAuth(`/scores/grid?${params}`);
    if (res.success) {
      gridData.value = res.data;
      viewMode.value = 'grid';
      // Update Cache
      localStorage.setItem(cacheKey, JSON.stringify(res.data));
    }
  } catch (e) {
    console.error('Failed to load grid', e);
    if (!cached) {
        alert('បរាជ័យក្នុងការទាញយកទិន្នន័យ។ សូមព្យាយាមម្តងទៀត។');
    } else {
        // If cached exists but fetch failed, maybe show a warning?
        console.warn('Using cached data due to network error');
    }
  } finally {
    loading.value = false;
  }
};

watch(
  () => appStore.refreshTokens.scores,
  () => {
    if (selectedClassId.value && selectedExamType.value) {
      loadGrid();
    }
  },
);

watch(
  () => appStore.refreshTokens.students,
  () => {
    if (selectedClassId.value && selectedExamType.value) {
      loadGrid();
    }
  },
);

// Data Helpers
const getScore = (studentId, subjectId) => {
  const record = gridData.value.scores.find(
    s => s.StudentId === studentId && s.SubjectId === subjectId
  );
  return record ? record.Score : '';
};

const getRemark = (studentId) => {
  const record = gridData.value.remarks.find(
    r => r.StudentId === studentId
  );
  return record ? record.Remarks : '';
};

// Validation Helper
const hasValidationError = (studentId, subjectId) => {
    return validationErrors.has(`${studentId}-${subjectId}`);
};

// Debounce Helper
const debounceMap = new Map();
const debouncedSave = (key, fn, delay = 1000) => {
    if (debounceMap.has(key)) {
        clearTimeout(debounceMap.get(key));
    }
    const timeout = setTimeout(() => {
        fn();
        debounceMap.delete(key);
    }, delay);
    debounceMap.set(key, timeout);
};

// Saving Logic
const normalizeScore = (val) => {
  if (!val && val !== 0) return null;
  return val; 
};

const handleScoreInput = (studentId, subjectId, rawValue) => {
    const key = `${studentId}-${subjectId}`;
    
    // 1. Validation
    const numVal = parseFloat(rawValue);
    if (rawValue !== '' && (isNaN(numVal) || numVal < 0 || numVal > 100)) {
        validationErrors.add(key);
    } else {
        validationErrors.delete(key);
    }

    // 2. Optimistic UI Update
    const score = normalizeScore(rawValue);
    let record = gridData.value.scores.find(
        s => s.StudentId === studentId && s.SubjectId === subjectId
    );
    
    if (record) {
        record.Score = score;
    } else if (score !== null) { // Don't create record for empty input
        gridData.value.scores.push({ StudentId: studentId, SubjectId: subjectId, Score: score });
    }

    // 3. Auto-save (if valid)
    if (!validationErrors.has(key)) {
        saveStatus.value = 'saving';
        debouncedSave(key, () => saveScoreToApi(studentId, subjectId, score));
    }
};

const saveScoreToApi = async (studentId, subjectId, score) => {
  try {
    await fetchWithAuth('/scores/score', {
      method: 'POST',
      body: JSON.stringify({
        studentId,
        subjectId,
        examType: selectedExamType.value,
        score
      })
    });
    
    // Check if there are other pending saves
    if (debounceMap.size === 0) {
        saveStatus.value = 'saved';
        setTimeout(() => { if(saveStatus.value === 'saved') saveStatus.value = ''; }, 2000);
    }

    // Update Cache on success
    const cacheKey = `score_grid_${selectedClassId.value}_${selectedExamType.value}`;
    localStorage.setItem(cacheKey, JSON.stringify(gridData.value));

  } catch (e) {
    console.error('Failed to save score', e);
    saveStatus.value = 'error';
  }
};

const saveRemark = async (studentId, value) => {
  let record = gridData.value.remarks.find(r => r.StudentId === studentId);
  if (record) {
    record.Remarks = value;
  } else if (value) {
    gridData.value.remarks.push({ StudentId: studentId, Remarks: value });
  }

  try {
    await fetchWithAuth('/scores/remark', {
      method: 'POST',
      body: JSON.stringify({
        studentId,
        examType: selectedExamType.value,
        remarks: value
      })
    });
  } catch (e) {
    console.error('Failed to save remark', e);
  }
};

// Calculations
const calculateTotal = (studentId) => {
  const studentScores = gridData.value.scores.filter(s => s.StudentId === studentId);
  if (studentScores.length === 0) return 0;
  
  return studentScores.reduce((sum, s) => {
    const val = parseFloat(s.Score);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
};

const calculateAverage = (studentId) => {
  const studentScores = gridData.value.scores.filter(s => s.StudentId === studentId && s.Score !== null && s.Score !== undefined && s.Score !== '');
  if (studentScores.length === 0) return 0;
  
  const total = calculateTotal(studentId);
  return (total / studentScores.length).toFixed(2);
};

const calculateRank = (studentId) => {
    const avg = parseFloat(calculateAverage(studentId));
    if (avg === 0) return '-';

    // Get all students averages
    const averages = gridData.value.students.map(s => {
        return {
            id: s.StudentID,
            avg: parseFloat(calculateAverage(s.StudentID))
        };
    }).sort((a, b) => b.avg - a.avg);

    const rank = averages.findIndex(x => x.id === studentId) + 1;
    return rank;
};

// Print Logic
const openPrintPreview = () => {
    showPrintModal.value = true;
};

const printNow = () => {
    const printContent = document.getElementById('print-area').innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Create a temporary print window or replace body content
    // Replacing body is risky for SPA state, so let's use a hidden iframe or print styles
    // A simpler way for modern browsers:
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Score Sheet</title>');
    // Add Tailwind CDN or styles
    printWindow.document.write('<script src="https://cdn.tailwindcss.com"><\/script>');
    // Add custom font styles
    printWindow.document.write(`
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Moul&family=Battambang:wght@400;700&display=swap');
            body { font-family: 'Battambang', sans-serif; }
            .font-moul { font-family: 'Moul', cursive; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 8px; text-align: center; }
            th { background-color: #f3f4f6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for styles to load
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 1000);
};


</script>

<style scoped>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
