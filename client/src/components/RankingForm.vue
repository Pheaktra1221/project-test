<template>
  <div class="container relative min-h-screen p-4 mx-auto font-sans">
    <!-- Debug Banner -->
    <div v-if="error" class="p-4 mb-4 text-red-700 bg-red-100 border-l-4 border-red-500" role="alert">
      <p class="font-bold">Error</p>
      <p>{{ error }}</p>
    </div>

    <!-- Header Section -->
    <div class="p-4 mb-8 bg-white border border-gray-100 shadow-xl rounded-2xl sm:p-6">
      <h1 class="mb-6 text-2xl font-bold text-gray-800">ចំណាត់ថ្នាក់សិស្ស (Student Rankings)</h1>
      
      <!-- Filters -->
      <div class="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Class Selector -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-700">ថ្នាក់</label>
          <select 
            v-model="selectedClassId" 
            @change="loadRankings"
            class="w-full p-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="" disabled>ជ្រើសរើសថ្នាក់</option>
            <option v-for="cls in classes" :key="cls.ClassId" :value="cls.ClassId">
              {{ cls.ClassName }} {{ cls.ClassLetter }}
            </option>
          </select>
        </div>

        <!-- Subject Selector -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-700">មុខវិជ្ជា</label>
          <select 
            v-model="selectedSubjectId" 
            @change="loadRankings"
            class="w-full p-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option v-for="sub in subjects" :key="sub.SubjectId" :value="sub.SubjectId">
              {{ sub.SubjectName }}
            </option>
          </select>
        </div>

        <!-- Month Selector -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-700">ខែ</label>
          <select 
            v-model="selectedMonth" 
            @change="loadRankings"
            class="w-full p-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option v-for="month in months" :key="month.en" :value="month.en">
              {{ month.km }}
            </option>
          </select>
        </div>

        <!-- Year Selector -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-700">ឆ្នាំ</label>
          <select 
            v-model="selectedYear" 
            @change="loadRankings"
            class="w-full p-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option v-for="year in years" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <!-- Gender Filter -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-700">ភេទ</label>
          <select 
            v-model="selectedGender" 
            class="w-full p-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">ទាំងអស់</option>
            <option value="M">ប្រុស</option>
            <option value="F">ស្រី</option>
          </select>
        </div>

        <!-- Score Range Filter -->
        <div>
          <label class="block mb-2 text-sm font-medium text-gray-700">កម្រិតពិន្ទុ (Average)</label>
          <select 
            v-model="selectedScoreRange" 
            class="w-full p-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">ទាំងអស់</option>
            <option value="90-100">90 - 100 (ល្អប្រសើរ)</option>
            <option value="80-90">80 - < 90 (ល្អណាស់)</option>
            <option value="70-80">70 - < 80 (ល្អ)</option>
            <option value="60-70">60 - < 70 (ល្អបង្គួរ)</option>
            <option value="50-60">50 - < 60 (មធ្យម)</option>
            <option value="0-50">< 50 (ខ្សោយ)</option>
          </select>
        </div>

        <!-- Search Input -->
        <div class="col-span-1 sm:col-span-2 lg:col-span-4">
            <div class="relative">
                <input 
                    v-model="searchQuery"
                    type="text"
                    placeholder="ស្វែងរកឈ្មោះសិស្ស..."
                    class="w-full p-3 pl-10 transition-all border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span class="absolute text-gray-500 left-3 top-3.5">
                    <i class="fas fa-search"></i>
                </span>
            </div>
        </div>
      </div>

      <!-- Advanced Options -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="showChart" class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500">
                <span class="text-gray-700">បង្ហាញក្រាហ្វិក (Charts)</span>
            </label>
        </div>
        
        <div class="flex gap-2">
            <button @click="exportToExcel" class="px-5 py-2.5 text-white transition-all duration-200 shadow-md rounded-xl bg-linear-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                <span>📊</span> Excel
            </button>
            <button @click="exportToPDF" class="px-5 py-2.5 text-white transition-all duration-200 shadow-md rounded-xl bg-linear-to-r from-red-500 to-red-600 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                <span>📄</span> PDF
            </button>
        </div>
      </div>

      <!-- Chart Section -->
      <div v-if="showChart && rankings.length > 0" class="p-6 mb-6 bg-white border border-gray-100 shadow-inner rounded-xl">
        <Bar :data="chartData" :options="chartOptions" class="max-h-75" />
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button 
          @click="loadRankings"
          class="flex items-center justify-center px-6 py-3 text-white transition-all duration-200 shadow-md rounded-xl bg-linear-to-r from-indigo-500 to-indigo-600 hover:shadow-lg hover:-translate-y-0.5"
        >
          <span class="mr-2">⟳</span>
          បង្ហាញចំណាត់ថ្នាក់
        </button>
        
        <button 
          @click="openPrintPreview"
          class="flex items-center justify-center px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <span class="mr-2">🖨️</span>
          បោះពុម្ព
        </button>
      </div>
    </div>

    <!-- Rankings Table (Desktop) -->
    <div v-if="rankings.length > 0" class="hidden overflow-hidden bg-white border border-gray-100 shadow-xl md:block rounded-2xl">
      <div class="p-4 border-b border-gray-100 bg-gray-50/50">
        <h3 class="text-lg font-bold text-gray-800 font-moul">
          ចំណាត់ថ្នាក់សិស្សថ្នាក់ទី {{ getClassName(selectedClassId) }} - {{ getMonthKhmer(selectedMonth) }} {{ selectedYear }}
        </h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="text-sm font-bold text-gray-700 border-b-2 border-indigo-100 bg-linear-to-r from-indigo-50 to-purple-50 font-moul">
              <th class="p-4 text-center border-r border-gray-200">ល.រ</th>
              <th class="p-4 text-left border-r border-gray-200">ឈ្មោះសិស្ស</th>
              
              <!-- Dynamic Subject Columns -->
              <th 
                v-for="subject in visibleSubjects" 
                :key="subject.SubjectName"
                class="p-4 text-center border-r border-gray-200 min-w-20"
              >
                {{ subject.SubjectName }}
              </th>
              
              <th class="p-4 text-center border-r border-gray-200">ពិន្ទុសរុប</th>
              <th class="p-4 text-center border-r border-gray-200">មធ្យមភាគ</th>
              <th class="p-4 text-center">ចំណាត់ថ្នាក់</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(student, index) in sortedRankings" 
              :key="student.StudentID"
              :class="['border-b border-gray-100 transition-all duration-200 hover:bg-linear-to-r hover:from-indigo-50 hover:to-purple-50', getRowClass(index + 1)]"
            >
              <td class="p-4 font-bold text-center border-r border-gray-200">
                {{ convertToKhmer((index + 1).toString()) }}
              </td>
              <td class="p-4 font-medium border-r border-gray-200 font-battambang">
                {{ student.Name }}
              </td>
              
              <!-- Subject Scores -->
              <td 
                v-for="subject in visibleSubjects" 
                :key="subject.SubjectName"
                class="p-4 text-center border-r border-gray-200"
              >
                {{ formatScore(getSubjectScore(student, subject.SubjectName)) }}
              </td>
              
              <td class="p-4 font-bold text-center text-blue-600 border-r border-gray-200">
                {{ convertToKhmer(student.Total.toString()) }}
              </td>
              <td class="p-4 font-bold text-center text-green-600 border-r border-gray-200">
                {{ convertToKhmer(student.Average.toString()) }}
              </td>
              <td class="p-4 font-bold text-center">
                <span :class="['inline-flex items-center justify-center w-8 h-8 text-white rounded-full shadow-sm', getRankColor(index + 1)]">
                  {{ convertToKhmer(student.Rank.toString()) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Rankings Cards (Mobile) -->
    <div v-if="rankings.length > 0" class="space-y-4 md:hidden">
        <div class="p-4 mb-4 border-l-4 border-indigo-500 shadow-md bg-linear-to-r from-indigo-50 to-purple-50 rounded-xl">
             <h3 class="text-lg font-bold leading-relaxed text-indigo-800 font-moul">
              ចំណាត់ថ្នាក់សិស្សថ្នាក់ទី {{ getClassName(selectedClassId) }} <br> 
              {{ getMonthKhmer(selectedMonth) }} {{ selectedYear }}
            </h3>
        </div>

        <div v-for="(student, index) in sortedRankings" :key="student.StudentID" 
            class="relative overflow-hidden transition-transform bg-white border border-gray-100 shadow-lg rounded-2xl hover:-translate-y-1">
            
            <!-- Rank Badge -->
            <div class="absolute top-0 right-0 p-3">
                 <span :class="['inline-flex items-center justify-center w-10 h-10 text-white font-bold rounded-full shadow-lg text-lg', getRankColor(index + 1)]">
                  {{ convertToKhmer(student.Rank.toString()) }}
                </span>
            </div>

            <div class="p-5">
                <div class="pr-12 mb-4">
                    <h4 class="text-xl font-bold text-gray-800 font-battambang">{{ student.Name }}</h4>
                    <p class="mt-1 text-sm text-gray-500">ភេទ: {{ student.StudentSex === 'M' ? 'ប្រុស' : 'ស្រី' }}</p>
                </div>

                <div class="grid grid-cols-2 gap-4 p-3 mb-4 border border-gray-100 bg-gray-50 rounded-xl">
                    <div class="text-center">
                        <p class="mb-1 text-xs text-gray-500">ពិន្ទុសរុប</p>
                        <p class="text-lg font-bold text-indigo-600">{{ convertToKhmer(student.Total.toString()) }}</p>
                    </div>
                    <div class="text-center border-l border-gray-200">
                        <p class="mb-1 text-xs text-gray-500">មធ្យមភាគ</p>
                        <p class="text-lg font-bold text-emerald-600">{{ convertToKhmer(student.Average.toString()) }}</p>
                    </div>
                </div>

                <!-- Accordion for Subject Details -->
                <details class="group">
                    <summary class="flex items-center justify-between p-3 text-sm font-medium text-indigo-700 list-none transition-colors cursor-pointer bg-indigo-50 rounded-xl hover:bg-indigo-100">
                        <span>ពិន្ទុតាមមុខវិជ្ជា</span>
                        <span class="transition group-open:rotate-180">
                            <i class="fas fa-chevron-down"></i>
                        </span>
                    </summary>
                    <div class="grid grid-cols-2 px-2 mt-3 text-sm text-gray-600 gap-x-4 gap-y-2">
                         <div v-for="subject in visibleSubjects" :key="subject.SubjectName" class="flex justify-between py-1 border-b border-gray-100 last:border-0">
                            <span class="text-gray-500">{{ subject.SubjectName }}</span>
                            <span class="font-bold text-gray-800">{{ formatScore(getSubjectScore(student, subject.SubjectName)) }}</span>
                        </div>
                    </div>
                </details>
            </div>
        </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="loading" class="p-12 text-center bg-white border border-gray-100 shadow-xl rounded-2xl">
      <div class="w-8 h-8 mx-auto mb-4 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      <p class="text-gray-600">កំពុងដំណើរការ...</p>
    </div>
    
    <div v-else class="p-12 text-center text-gray-500 bg-white border border-gray-100 shadow-xl rounded-2xl">
      <p class="text-xl">ជ្រើសរើសថ្នាក់ និងខែ ដើម្បីមើលចំណាត់ថ្នាក់</p>
    </div>

    <!-- Hidden Area for PDF Generation -->
    <div id="pdf-hidden-area" class="fixed top-0 -left-2499.75 w-[210mm] min-h-[297mm] bg-white p-8 text-black font-battambang">
        <div class="mb-6 text-center">
            <h1 class="text-2xl font-bold font-moul">ព្រះរាជាណាចក្រកម្ពុជា</h1>
            <h2 class="text-xl font-bold font-moul">ជាតិ សាសនា ព្រះមហាក្សត្រ</h2>
            <div class="my-4 text-lg font-bold font-moul">
                {{ printTemplate === 'detailed' ? 'របាយការណ៍លទ្ធផលសិក្សាប្រចាំខែ' : 'តារាងចំណាត់ថ្នាក់សិស្ស' }}
            </div>
            <div class="flex justify-between mt-6 text-lg font-bold">
                <div>ថ្នាក់ទី: {{ getClassName(selectedClassId) }}</div>
                <div>{{ getMonthKhmer(selectedMonth) }} {{ selectedYear }}</div>
            </div>
        </div>

        <table class="w-full text-sm border border-collapse border-black">
            <thead>
                <tr class="bg-gray-100">
                    <th class="p-2 font-bold border border-black">ល.រ</th>
                    <th class="p-2 font-bold border border-black">ឈ្មោះសិស្ស</th>
                    <th class="p-2 font-bold border border-black">ភេទ</th>
                    <th v-for="subject in visibleSubjects" :key="subject.SubjectName" class="p-2 font-bold border border-black">
                        {{ subject.SubjectName }}
                    </th>
                    <th class="p-2 font-bold border border-black">សរុប</th>
                    <th class="p-2 font-bold border border-black">មធ្យម</th>
                    <th class="p-2 font-bold border border-black">ចំណាត់ថ្នាក់</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(student, index) in sortedRankings" :key="student.StudentID">
                    <td class="p-2 text-center border border-black">{{ convertToKhmer((index + 1).toString()) }}</td>
                    <td class="p-2 border border-black">{{ student.Name }}</td>
                    <td class="p-2 text-center border border-black">{{ student.StudentSex === 'M' ? 'ប្រុស' : 'ស្រី' }}</td>
                    <td v-for="subject in visibleSubjects" :key="subject.SubjectName" class="p-2 text-center border border-black">
                        {{ formatScore(getSubjectScore(student, subject.SubjectName)) }}
                    </td>
                    <td class="p-2 font-bold text-center border border-black">{{ convertToKhmer(student.Total.toString()) }}</td>
                    <td class="p-2 font-bold text-center border border-black">{{ convertToKhmer(student.Average.toString()) }}</td>
                    <td class="p-2 text-center border border-black">{{ convertToKhmer(student.Rank.toString()) }}</td>
                </tr>
            </tbody>
        </table>

        <div class="flex justify-between mt-12 text-base font-bold">
            <div class="text-center">
                <p>បានឃើញ និងឯកភាព</p>
                <p class="mt-4">នាយកសាលា</p>
            </div>
            <div class="text-center">
                <p>ថ្ងៃទី...... ខែ...... ឆ្នាំ......</p>
                <p class="mt-4">គ្រូបន្ទុកថ្នាក់</p>
            </div>
        </div>
    </div>

    <!-- Print Preview Modal -->
    <div v-if="showPrintModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border-2 border-gray-200">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-linear-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
                <div class="flex items-center gap-4">
                    <h3 class="text-2xl font-bold text-gray-800">កម្រាស់បោះពុម្ព (Print Preview)</h3>
                    <select v-model="printTemplate" class="p-2.5 text-sm font-medium border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
                        <option value="simple">តារាងសាមញ្ញ (Simple List)</option>
                        <option value="detailed">របាយការណ៍លម្អិត (Detailed Report)</option>
                    </select>
                </div>
                <button @click="showPrintModal = false" class="text-2xl text-gray-500 transition-colors hover:text-red-500">✕</button>
            </div>
            
            <!-- Modal Body (Printable Area) -->
            <div class="flex-1 p-8 overflow-auto bg-gray-100">
                <div id="print-area" class="bg-white p-8 mx-auto shadow-sm max-w-[210mm] min-h-[297mm]">
                    <div class="mb-6 text-center">
                        <h1 class="text-2xl font-bold font-moul">ព្រះរាជាណាចក្រកម្ពុជា</h1>
                        <h2 class="text-xl font-bold font-moul">ជាតិ សាសនា ព្រះមហាក្សត្រ</h2>
                        <div class="my-4 text-lg font-bold font-moul">
                            {{ printTemplate === 'detailed' ? 'របាយការណ៍លទ្ធផលសិក្សាប្រចាំខែ' : 'តារាងចំណាត់ថ្នាក់សិស្ស' }}
                        </div>
                        <div class="flex justify-between mt-6 font-bold">
                            <div>ថ្នាក់ទី: {{ getClassName(selectedClassId) }}</div>
                            <div>{{ getMonthKhmer(selectedMonth) }} {{ selectedYear }}</div>
                        </div>
                    </div>

                    <table class="w-full border border-collapse border-black">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="p-2 border border-black">ល.រ</th>
                                <th class="p-2 border border-black">ឈ្មោះសិស្ស</th>
                                <th class="p-2 border border-black">ភេទ</th>
                                <th v-for="subject in visibleSubjects" :key="subject.SubjectName" class="p-2 border border-black">
                                    {{ subject.SubjectName }}
                                </th>
                                <th class="p-2 border border-black">សរុប</th>
                                <th class="p-2 border border-black">មធ្យម</th>
                                <th class="p-2 border border-black">ចំណាត់ថ្នាក់</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(student, index) in sortedRankings" :key="student.StudentID">
                                <td class="p-2 text-center border border-black">{{ convertToKhmer((index + 1).toString()) }}</td>
                                <td class="p-2 border border-black">{{ student.Name }}</td>
                                <td class="p-2 text-center border border-black">{{ student.StudentSex === 'M' ? 'ប្រុស' : 'ស្រី' }}</td>
                                <td v-for="subject in visibleSubjects" :key="subject.SubjectName" class="p-2 text-center border border-black">
                                    {{ formatScore(getSubjectScore(student, subject.SubjectName)) }}
                                </td>
                                <td class="p-2 font-bold text-center border border-black">{{ convertToKhmer(student.Total.toString()) }}</td>
                                <td class="p-2 font-bold text-center border border-black">{{ convertToKhmer(student.Average.toString()) }}</td>
                                <td class="p-2 text-center border border-black">{{ convertToKhmer(student.Rank.toString()) }}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div v-if="printTemplate === 'detailed'" class="flex justify-between mt-12 text-sm">
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
import { ref, onMounted, onUnmounted, watch, computed, onErrorCaptured } from 'vue';
import { io } from 'socket.io-client';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const API_BASE_URL = '/api';

console.log('RankingForm setup started');

// Auth Helper
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Socket
const socket = ref(null);
const error = ref(null);

onErrorCaptured((err, instance, info) => {
  console.error('RankingForm Error Captured:', err, info);
  error.value = `Component Error: ${err.message}`;
  return false; // Stop propagation
});

// State
const classes = ref([]);
const subjects = ref([]);
const rankings = ref([]);
const loading = ref(false);

// Selections
const selectedClassId = ref('');
const selectedSubjectId = ref(-1); // -1 for "All Subjects"
const selectedMonth = ref('');
const selectedYear = ref('');
const selectedGender = ref('all');
const selectedScoreRange = ref('all');
const searchQuery = ref('');
const years = ref([]);

// UI State
const showChart = ref(false);
const showPrintModal = ref(false);
const printTemplate = ref('simple');

// Chart Config
const chartData = ref({ labels: [], datasets: [] });
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'លទ្ធផលសិក្សាសិស្ស (Student Performance)' }
    }
};

// Months
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

// Computed
const visibleSubjects = computed(() => {
  if (selectedSubjectId.value === -1) {
    // Return all subjects for the class's grade level
    return subjects.value.filter(s => s.SubjectId !== -1);
  }
  // Return only selected subject
  const sub = subjects.value.find(s => s.SubjectId === selectedSubjectId.value);
  return sub ? [sub] : [];
});

const sortedRankings = computed(() => {
  let filtered = rankings.value;
  
  if (selectedGender.value !== 'all') {
    filtered = filtered.filter(s => s.StudentSex === selectedGender.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(s => 
        s.Name.toLowerCase().includes(query) || 
        s.StudentID.toString().includes(query)
    );
  }

  if (selectedScoreRange.value !== 'all') {
    filtered = filtered.filter(s => {
        const avg = parseFloat(s.Average);
        switch (selectedScoreRange.value) {
            case '90-100': return avg >= 90;
            case '80-90': return avg >= 80 && avg < 90;
            case '70-80': return avg >= 70 && avg < 80;
            case '60-70': return avg >= 60 && avg < 70;
            case '50-60': return avg >= 50 && avg < 60;
            case '0-50': return avg < 50;
            default: return true;
        }
    });
  }

  return [...filtered].sort((a, b) => b.Average - a.Average);
});

// Watchers
watch(sortedRankings, () => {
    updateChartData();
});

const updateChartData = () => {
    const topStudents = sortedRankings.value.slice(0, 10); // Top 10
    
    chartData.value = {
        labels: topStudents.map(s => s.Name),
        datasets: [
            {
                label: 'មធ្យមភាគ (Average)',
                backgroundColor: '#3B82F6',
                data: topStudents.map(s => s.Average)
            }
        ]
    };
};

// Initialize
// (Merged into single onMounted below)

// Methods
const initializeYears = () => {
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 5; i++) {
    years.value.push(i.toString());
  }
};

const loadClasses = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/class`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      classes.value = data.data;
    } else {
        throw new Error(data.message || 'Failed to load classes');
    }
  } catch (err) {
    console.error('Failed to load classes:', err);
    error.value = 'Failed to load classes: ' + err.message;
  }
};

const loadSubjects = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/subjects`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) {
      // Add "All Subjects" option
      subjects.value = [{ SubjectId: -1, SubjectName: 'មុខវិជ្ជាទាំងអស់' }, ...data.data];
      selectedSubjectId.value = -1;
    }
  } catch (err) {
    console.error('Failed to load subjects:', err);
    // Don't block the UI for subjects failure, just log it
  }
};

const loadRankings = async () => {
  if (!selectedClassId.value || !selectedMonth.value || !selectedYear.value) {
    alert('សូមជ្រើសរើសថ្នាក់ ខែ និងឆ្នាំ');
    return;
  }

  loading.value = true;
  rankings.value = [];
  
  const cacheKey = `rankings_${selectedClassId.value}_${selectedMonth.value}_${selectedYear.value}_${selectedSubjectId.value}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
      try {
          rankings.value = JSON.parse(cached);
      } catch (e) {
          console.error('Cache parse error', e);
      }
  }

  try {
    const examType = `${selectedMonth.value}-${selectedYear.value}`;
    const params = new URLSearchParams({
      classId: selectedClassId.value,
      examType: examType,
      subjectId: selectedSubjectId.value ? selectedSubjectId.value.toString() : ''
    });

    const res = await fetch(`${API_BASE_URL}/rankings?${params}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      rankings.value = data.data;
      localStorage.setItem(cacheKey, JSON.stringify(data.data));
    }
  } catch (error) {
    console.error('Failed to load rankings:', error);
    if (!cached) {
        alert('បរាជ័យក្នុងការទាញយកទិន្នន័យ។ សូមព្យាយាមម្តងទៀត។');
    }
  } finally {
    loading.value = false;
  }
};

const getClassName = (classId) => {
  const cls = classes.value.find(c => c.ClassId === classId);
  if (!cls) return '';
  
  // Extract grade level (e.g., "7A" -> "7")
  const match = cls.ClassName.match(/\d+/);
  return match ? match[0] : cls.ClassName;
};

const getMonthKhmer = (englishMonth) => {
  const month = months.find(m => m.en === englishMonth);
  return month ? month.km : englishMonth;
};

const convertToKhmer = (input) => {
  if (!input) return '';
  const kh = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return input.toString().replace(/[0-9]/g, (match) => kh[parseInt(match)]);
};

const formatScore = (score) => {
  if (score === null || score === undefined) return '-';
  return convertToKhmer(score.toString());
};

const getSubjectScore = (student, subjectName) => {
  return student[subjectName] || null;
};

const getRowClass = (rank) => {
  if (rank === 1) return 'bg-yellow-50';
  if (rank === 2) return 'bg-blue-50';
  if (rank === 3) return 'bg-green-50';
  return '';
};

const getRankColor = (rank) => {
  if (rank === 1) return 'bg-yellow-500';
  if (rank === 2) return 'bg-gray-400';
  if (rank === 3) return 'bg-orange-600';
  return 'bg-blue-600';
};

const openPrintPreview = () => {
    if (rankings.value.length === 0) {
        alert('សូមផ្ទុកទិន្នន័យជាមុនសិន');
        return;
    }
    showPrintModal.value = true;
};

const printNow = () => {
    const printContent = document.getElementById('print-area').innerHTML;
    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Print Report</title>');
    win.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">');
    win.document.write('<link href="https://fonts.googleapis.com/css2?family=Moul&family=Battambang&display=swap" rel="stylesheet">');
    win.document.write(`
        <style>
            body { font-family: 'Battambang', cursive; }
            .font-moul { font-family: 'Moul', cursive; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 8px; text-align: center; }
            @media print {
                body { 
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact;
                }
            }
        </style>
    `);
    win.document.write('</head><body>');
    win.document.write(printContent);
    win.document.write('</body></html>');
    win.document.close();
    
    // Wait for resources to load
    setTimeout(() => {
        win.print();
        win.close();
    }, 1000);
};

const exportToExcel = () => {
    if (sortedRankings.value.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(sortedRankings.value.map(s => ({
        'ID': s.StudentID,
        'Name': s.Name,
        'Sex': s.StudentSex,
        'Total': s.Total,
        'Average': s.Average,
        'Rank': s.Rank
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rankings");
    XLSX.writeFile(wb, `Rankings_${selectedClassId.value}_${selectedMonth.value}.xlsx`);
};

const exportToPDF = async () => {
    if (sortedRankings.value.length === 0) return;
    
    // Use the hidden PDF area if available, otherwise fallback to simple table
    const element = document.getElementById('pdf-hidden-area');
    
    if (!element) {
        alert('សូមព្យាយាមម្តងទៀត (Element not found)');
        return;
    }

    try {
        loading.value = true;
        
        // Ensure element is visible for capture (it's fixed off-screen but must be rendered)
        // html2canvas works on off-screen elements if they are in the DOM
        
        const canvas = await html2canvas(element, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Rankings_${selectedClassId.value}_${selectedMonth.value}.pdf`);
        
    } catch (error) {
        console.error('PDF Generation Error:', error);
        alert('បរាជ័យក្នុងការបង្កើត PDF');
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
  console.log('RankingForm mounted');
  initializeYears();
  await loadClasses();
  await loadSubjects();

  // Set default month/year
  const now = new Date();
  if (!selectedYear.value) selectedYear.value = now.getFullYear().toString();
  if (!selectedMonth.value) {
      const monthIndex = now.getMonth();
      selectedMonth.value = months[monthIndex].en;
  }

  // Connect to WebSocket
  // Use relative connection to allow Vite proxy to handle it
  // This works for both localhost and network access (e.g. 192.168.x.x)
  socket.value = io({
    withCredentials: true,
    transports: ['websocket', 'polling']
  });

  socket.value.on('connect', () => {
    console.log('Connected to WebSocket server');
  });

  socket.value.on('connect_error', (err) => {
    console.error('WebSocket connection error:', err);
  });

  socket.value.on('ranking_update', (data) => {
    console.log('Received ranking update', data);
    if (selectedClassId.value && selectedMonth.value && selectedYear.value) {
      loadRankings();
    }
  });
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});

// Watch for changes
watch([selectedClassId, selectedMonth, selectedYear], () => {
  if (selectedClassId.value && selectedMonth.value && selectedYear.value) {
    // Auto-load rankings when all required filters are selected
    loadRankings();
  }
});
</script>

<style scoped>
@media print {
  .container {
    margin: 0;
    padding: 0;
  }
  
  .shadow-lg, .rounded-xl {
    box-shadow: none;
    border-radius: 0;
  }
  
  .bg-white {
    background-color: white !important;
  }
  
  .bg-gray-800 {
    background-color: #333 !important;
    color: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .border-gray-200, .border-gray-700 {
    border-color: #000 !important;
  }
  
  /* Hide non-essential elements when printing */
  button, .bg-gray-50, .flex:not(.print-only) {
    display: none !important;
  }
}

/* Print-specific styles */
@media print {
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    border: 1px solid #000;
    padding: 8px;
  }
  
  .text-blue-600, .text-green-600, .text-red-500 {
    color: #000 !important;
  }
  
  .bg-yellow-50, .bg-blue-50, .bg-green-50 {
    background-color: transparent !important;
  }
}
</style>