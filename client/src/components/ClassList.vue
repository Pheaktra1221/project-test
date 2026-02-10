<template>
  <div class="container p-2 mx-auto pt-28 md:pt-20 lg:pt-12">
    <!-- Toast notifications -->
    <div class="fixed flex flex-col gap-2 z-100 top-4 right-4 print:hidden">
      <div
        v-for="n in notifications"
        :key="n.id"
        :class="[
          'px-5 py-3 rounded-xl shadow-2xl text-white flex items-center gap-3 transform transition-all duration-300',
          n.type === 'error'
            ? 'bg-red-500'
            : n.type === 'success'
              ? 'bg-green-500'
              : 'bg-indigo-500',
          notificationAnimation[n.id] || 'translate-x-0',
        ]"
      >
        <div class="flex items-center gap-2">
          <span v-if="n.type === 'success'" class="text-lg">✅</span>
          <span v-else-if="n.type === 'error'" class="text-lg">❌</span>
          <span v-else class="text-lg">ℹ️</span>
          <div class="text-sm font-medium">{{ n.message }}</div>
        </div>
        <button
          @click="closeNotification(n.id)"
          class="ml-2 text-white transition-opacity opacity-80 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Header Section -->
    <div
      class="p-6 mb-8 border border-gray-200 shadow-lg bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl print:hidden"
    >
      <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div class="text-center md:text-left">
          <h1 class="text-3xl font-bold text-gray-800 moul-regular">
            {{ classInfo.ClassName || "កំពុងផ្ទុក..." }}
          </h1>
          <p class="mt-2 text-gray-600">
            បញ្ជីឈ្មោះសិស្សទាំងអស់ក្នុងថ្នាក់
            <span
              v-if="classInfo.classNumber"
              class="font-bold text-indigo-600"
            >
              ទី {{ classInfo.classNumber }}{{ classInfo.ClassLetter }}
            </span>
          </p>
          <div class="flex flex-wrap items-center gap-4 mt-3">
            <span
              class="px-3 py-1 text-sm font-semibold text-white bg-blue-500 rounded-full"
            >
              សិស្សសរុប: {{ studentCount }}
            </span>
            <span
              v-if="classInfo.TeacherFullName"
              class="px-3 py-1 text-sm font-semibold text-white bg-green-500 rounded-full"
            >
              គ្រូបន្ទប់: {{ classInfo.TeacherFullName }}
            </span>
            <span
              class="px-3 py-1 text-sm font-semibold text-white bg-purple-500 rounded-full"
            >
              លេខកូដថ្នាក់: {{ classId }}
            </span>
          </div>

          <!-- Teacher Information Card -->
          <div
            v-if="classInfo.TeacherFullName"
            class="flex items-center gap-3 p-3 mt-4 bg-white border border-gray-200 shadow-sm rounded-xl"
          >
            <div
              v-if="classInfo.TeacherPicPreview"
              class="w-12 h-12 overflow-hidden border-2 border-indigo-200 rounded-full shadow-md"
            >
              <img
                :src="classInfo.TeacherPicPreview"
                :alt="classInfo.TeacherFullName"
                class="object-cover w-full h-full"
              />
            </div>
            <div
              v-else
              class="flex items-center justify-center w-12 h-12 text-lg font-bold text-white bg-blue-500 border-2 border-white rounded-full shadow-md"
            >
              {{ classInfo.TeacherFirstName?.charAt(0) || "គ" }}
            </div>
            <div class="flex-1">
              <div class="font-semibold text-gray-800">
                {{ classInfo.TeacherFullName }}
              </div>
              <div class="text-xs text-gray-600">
                <span v-if="classInfo.Diploma" class="mr-2"
                  >សញ្ញាបត្រ: {{ classInfo.Diploma }}</span
                >
                <span>ចូលស្តាប់: {{ formatDate(classInfo.JoinDate) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col gap-2 sm:flex-row">
          <button
            @click="goBack"
            class="px-6 py-3 text-white bg-gray-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span class="text-lg">←</span>
            ត្រឡប់ក្រោយ
          </button>
          <button
            @click="exportToExcel"
            class="px-6 py-3 text-white bg-green-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span class="text-lg">📊</span>
            នាំចេញ Excel
          </button>
          <button
            @click="printStudentList"
            class="px-6 py-3 text-white bg-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span class="text-lg">🖨️</span>
            បោះពុម្ព
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Filter Section -->
    <div
      class="p-4 mb-6 bg-white border border-gray-100 shadow-xl rounded-2xl print:hidden"
    >
      <div class="grid grid-cols-1 gap-3 mb-4 md:grid-cols-4">
        <input
          v-model="searchText"
          type="text"
          placeholder="ស្វែងរកសិស្សដោយឈ្មោះ លេខកូដ ឬទូរស័ព្ទ..."
          class="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 font-medium"
          @keyup.enter="searchStudents"
        />
        <select
          v-model="filterGender"
          class="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 font-medium"
        >
          <option value="">ជ្រើសរើសភេទ</option>
          <option value="ប្រុស">ប្រុស</option>
          <option value="ស្រី">ស្រី</option>
          <option value="ផ្សេងៗ">ផ្សេងៗ</option>
        </select>
        <button
          @click="searchStudents"
          class="w-full md:w-auto px-6 py-3.5 bg-indigo-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span class="text-lg">🔍</span>
          ស្វែងរក
        </button>
        <button
          @click="resetFilters"
          class="w-full md:w-auto px-6 py-3.5 bg-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span class="text-lg">🔄</span>
          សម្អាត
        </button>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 gap-4 mt-6 md:grid-cols-4 print:hidden">
        <div class="p-4 border border-blue-100 bg-blue-50 rounded-xl">
          <div class="text-sm font-semibold text-blue-700">សិស្សសរុប</div>
          <div class="text-3xl font-bold text-blue-900">{{ studentCount }}</div>
        </div>
        <div class="p-4 border border-green-100 bg-green-50 rounded-xl">
          <div class="text-sm font-semibold text-green-700">សិស្សប្រុស</div>
          <div class="text-3xl font-bold text-green-900">{{ maleCount }}</div>
        </div>
        <div class="p-4 border border-pink-100 bg-pink-50 rounded-xl">
          <div class="text-sm font-semibold text-pink-700">សិស្សស្រី</div>
          <div class="text-3xl font-bold text-pink-900">{{ femaleCount }}</div>
        </div>
        <div class="p-4 border border-purple-100 bg-purple-50 rounded-xl">
          <div class="text-sm font-semibold text-purple-700">អាយុមធ្យម</div>
          <div class="text-3xl font-bold text-purple-900">
            {{ averageAge.toFixed(1) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-12 text-center print:hidden">
      <div
        class="inline-block w-16 h-16 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin"
      ></div>
      <p class="mt-4 font-medium text-gray-600">កំពុងផ្ទុកទិន្នន័យសិស្ស...</p>
    </div>

    <!-- Students Table Area -->
    <div v-else>
      <!-- Students Table Container -->
      <div
        class="overflow-hidden bg-white border border-gray-100 shadow-xl rounded-2xl print:hidden"
      >
        <div v-if="students.length === 0" class="p-12 text-center">
          <div class="mb-4 text-6xl">👨‍🎓</div>
          <p class="text-lg font-medium text-gray-600">
            មិនមានសិស្សក្នុងថ្នាក់នេះទេ
          </p>
          <p class="mt-2 text-gray-500">សូមបន្ថែមសិស្សថ្មីទៅក្នុងថ្នាក់នេះ</p>
        </div>

        <div v-else>
          <!-- Mobile Cards (visible on small screens) -->
          <div class="block px-2 space-y-3 md:hidden">
            <div
              v-for="(student, index) in students"
              :key="student.StudentID"
              class="p-3 bg-white border border-gray-100 shadow-sm student-card rounded-xl"
            >
              <div class="flex items-start gap-3">
                <div class="w-12 overflow-hidden rounded-md h-14">
                  <img
                    v-if="getStudentPicture(student)"
                    :src="getStudentPicture(student)"
                    :alt="student.StudentFirstname"
                    class="object-cover w-full h-full"
                  />
                  <div
                    v-else
                    :class="[
                      'flex items-center justify-center w-12 h-14 font-bold text-white',
                      student.StudentSex === 'M' ? 'bg-blue-500' : student.StudentSex === 'F' ? 'bg-pink-500' : 'bg-gray-500',
                    ]"
                  >
                    {{ student.StudentFirstname?.charAt(0) || '?' }}
                  </div>
                </div>

                <div class="flex-1">
                  <div class="font-bold text-gray-800">{{ student.StudentFirstname }} {{ student.StudentLastname }}</div>
                  <div class="text-xs text-gray-500">លេខកូដ: {{ student.StudentID }}</div>
                  <div class="mt-1 text-xs text-gray-600">{{ student.GenderKhmer || student.StudentSex }} • {{ formatDate(student.StudentBirthdate) }}</div>
                  <div class="mt-2 text-xs text-gray-600">ឪពុក: {{ student.StudentFathername || 'មិនមាន' }} • ម្តាយ: {{ student.StudentMothername || 'មិនមាន' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop Table (hidden on small screens) -->
          <div class="hidden overflow-x-auto md:block">
            <table
              class="w-full text-sm"
            >
              <thead
                class="border-b-2 border-indigo-100 bg-indigo-50"
              >
                <tr>
                  <th
                    class="w-12 px-4 py-3 font-bold text-center text-gray-700 whitespace-nowrap"
                  >
                    ល.រ
                  </th>
                  <th
                    class="w-20 px-4 py-3 font-bold text-center text-gray-700 whitespace-nowrap"
                  >
                    រូបភាព
                  </th>
                  <th
                    class="w-32 px-4 py-3 font-bold text-center text-gray-700 whitespace-nowrap"
                  >
                    ឈ្មោះសិស្ស
                  </th>
                  <th
                    class="w-20 px-4 py-3 font-bold text-center text-gray-700 whitespace-nowrap"
                  >
                    ភេទ
                  </th>
                  <th
                    class="w-24 px-4 py-3 font-bold text-center text-gray-700 whitespace-nowrap"
                  >
                    ថ្ងៃខែឆ្នាំកំណើត
                  </th>
                  <th
                    class="w-40 px-4 py-3 font-bold text-center text-gray-700 whitespace-nowrap"
                  >
                    ទីកន្លែងកំណើត
                  </th>
                  <th
                    class="w-40 px-4 py-3 font-bold text-center text-gray-700 whitespace-nowrap"
                  >
                    ទីលំនៅបច្ចុប្បន្ន
                  </th>
                  <th
                    class="w-32 px-4 py-3 font-bold text-center text-gray-700 whitespace-nowrap"
                  >
                    ឈ្មោះឪពុក
                  </th>
                  <th
                    class="w-40 px-4 py-3 font-bold text-center text-gray-700 whitespace-nowrap"
                  >
                    ព័ត៌មានឪពុក
                  </th>
                  <th
                    class="w-32 px-4 py-3 font-bold text-center text-gray-700 whitespace-nowrap"
                  >
                    ឈ្មោះម្តាយ
                  </th>
                  <th
                    class="w-40 px-4 py-3 font-bold text-center text-gray-700 whitespace-nowrap"
                  >
                    ព័ត៌មានម្តាយ
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(student, index) in students"
                  :key="student.StudentID"
                  class="transition-all duration-200 border-b border-gray-100 hover:bg-indigo-50"
                >
                  <!-- Serial Number -->
                  <td
                    class="px-4 py-3 font-semibold text-center text-gray-600 whitespace-nowrap"
                  >
                    {{ toKhmerNumber(index + 1) }}
                  </td>

                  <!-- Picture -->
                  <td
                    class="px-4 py-3 whitespace-nowrap"
                  >
                    <div class="flex items-center justify-center">
                      <div
                        v-if="getStudentPicture(student)"
                        class="w-16 h-20 overflow-hidden border border-gray-300"
                      >
                        <img
                          :src="getStudentPicture(student)"
                          :alt="student.StudentFirstname"
                          class="object-cover w-full h-full"
                          @load="handleImageLoad"
                          @error="handleImageError"
                        />
                      </div>
                      <div
                        v-else
                        :class="[
                          'flex items-center justify-center w-16 h-20 font-bold text-white',
                          student.StudentSex === 'M'
                            ? 'bg-blue-500'
                            : student.StudentSex === 'F'
                              ? 'bg-pink-500'
                              : 'bg-gray-500',
                        ]"
                      >
                        {{ student.StudentFirstname?.charAt(0) || "?" }}
                      </div>
                    </div>
                  </td>

                  <!-- Student Name -->
                  <td
                    class="px-4 py-3"
                  >
                    <div class="text-center">
                      <div
                        class="font-bold text-gray-800"
                      >
                        {{ student.StudentFirstname }}
                        {{ student.StudentLastname }}
                      </div>
                      <div class="text-xs text-gray-500">
                        លេខកូដ: {{ student.StudentID }}
                      </div>
                    </div>
                  </td>

                  <!-- Gender -->
                  <td
                    class="px-4 py-3 text-center whitespace-nowrap"
                  >
                    <span class="font-medium text-gray-800">
                      {{ student.GenderKhmer || student.StudentSex }}
                    </span>
                  </td>

                  <!-- Birthdate -->
                  <td
                    class="px-4 py-3 text-center whitespace-nowrap"
                  >
                    <div class="font-medium text-gray-800">
                      {{ formatDate(student.StudentBirthdate) }}
                    </div>
                    <div class="text-xs text-gray-600">
                      អាយុ:
                      {{
                        student.StudentAge ||
                        calculateAge(student.StudentBirthdate)
                      }}
                      ឆ្នាំ
                    </div>
                  </td>

                  <!-- Birth Place -->
                  <td
                    class="px-4 py-3 text-sm text-gray-700"
                  >
                    <div class="space-y-1">
                      <div class="font-medium">
                        {{ student.StudentBirthvillage || "" }}
                      </div>
                      <div class="text-gray-600">
                        {{ student.StudentBirthcommune || "" }}
                      </div>
                      <div class="text-gray-600">
                        {{ student.StudentBirthdistrict || "" }}
                      </div>
                      <div class="text-gray-600">
                        {{ student.StudentBirthProvince || "" }}
                      </div>
                    </div>
                  </td>

                  <!-- Current Address -->
                  <td
                    class="px-4 py-3 text-sm text-gray-700"
                  >
                    <div class="space-y-1">
                      <div class="font-medium">
                        {{ student.StudentCurrentvillage || "" }}
                      </div>
                      <div class="text-gray-600">
                        {{ student.StudentCurrentcommune || "" }}
                      </div>
                      <div class="text-gray-600">
                        {{ student.StudentCurrentdistrict || "" }}
                      </div>
                      <div class="text-gray-600">
                        {{ student.Studentcurrentprovince || "" }}
                      </div>
                    </div>
                  </td>

                  <!-- Father Name -->
                  <td
                    class="px-4 py-3 text-center whitespace-nowrap"
                  >
                    <div class="font-medium text-gray-800">
                      {{ student.StudentFathername || "មិនមាន" }}
                    </div>
                  </td>

                  <!-- Father Information -->
                  <td
                    class="px-4 py-3 text-sm text-gray-700"
                  >
                    <div class="space-y-1">
                      <div class="font-medium">
                        ទូរស័ព្ទ:
                        {{
                          toKhmerNumber(student.StudentFathernumber || "មិនមាន")
                        }}
                      </div>
                      <div class="text-gray-600">
                        មុខរបរ: {{ student.StudentFatherjob || "មិនមាន" }}
                      </div>
                    </div>
                  </td>

                  <!-- Mother Name -->
                  <td
                    class="px-4 py-3 text-center whitespace-nowrap"
                  >
                    <div class="font-medium text-gray-800">
                      {{ student.StudentMothername || "មិនមាន" }}
                    </div>
                  </td>

                  <!-- Mother Information -->
                  <td
                    class="px-4 py-3 text-sm text-gray-700"
                  >
                    <div class="space-y-1">
                      <div class="font-medium">
                        ទូរស័ព្ទ:
                        {{
                          toKhmerNumber(student.StudentMothernumber || "មិនមាន")
                        }}
                      </div>
                      <div class="text-gray-600">
                        មុខរបរ: {{ student.StudentMotherJob || "មិនមាន" }}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div
            v-if="students.length > 0"
            class="flex flex-col items-center justify-between gap-4 px-6 py-5 border-t-2 border-gray-100 bg-indigo-50 sm:flex-row print:hidden"
          >
            <div class="text-sm font-medium text-gray-700">
              បង្ហាញ
              <span class="font-bold text-indigo-600">{{
                (currentPage - 1) * pageSize + 1
              }}</span>
              ដល់
              <span class="font-bold text-indigo-600">{{
                Math.min(currentPage * pageSize, totalStudents)
              }}</span>
              នៃ
              <span class="font-bold text-indigo-600">{{ totalStudents }}</span>
              សិស្ស
            </div>
            <div class="flex gap-2">
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="px-4 py-3 bg-indigo-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                ◀ មុន
              </button>
              <span
                class="px-4 py-3 font-bold text-indigo-600 bg-white border-2 border-indigo-200 rounded-xl flex items-center"
                >{{ currentPage }} /
                {{ Math.ceil(totalStudents / pageSize) }}</span
              >
              <button
                @click="nextPage"
                :disabled="currentPage >= Math.ceil(totalStudents / pageSize)"
                class="px-4 py-3 bg-indigo-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                បន្ទាប់ ▶
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- PRINT/PDF FORM ONLY - Hidden in view, visible only when printing -->
      <div class="hidden print:block print-form-container">
        <!-- Official Header -->
        <div class="mb-2 text-center">
          <div class="khmer-header">ព្រះរាជាណាចក្រកម្ពុជា</div>
          <div class="khmer-header">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
        </div>

        <!-- Ministry and School Info -->
        <div class="mb-2 text-center">
          <div class="ministry">មន្ទីរអប់រំយុវជននិងកីឡា</div>
          <div class="school-name">វិទ្យាល័យ {{ classInfo.SchoolName }}</div>
        </div>

        <!-- Class Info -->
        <div class="mb-4 text-center">
          <div class="class-info">
            បញ្ជីឈ្មោះសិស្សថ្នាក់ទី {{ classInfo.classNumber || "___"
            }}{{ classInfo.ClassLetter || "___" }}
          </div>
          <div class="academic-year">ឆ្នាំសិក្សា: {{ academicYear }}</div>
        </div>

        <!-- Print Summary Statistics -->
        <div class="grid grid-cols-3 gap-4 mb-4 print-summary">
          <div class="print-stat">
            <div class="print-stat-label">សិស្សសរុប:</div>
            <div class="print-stat-value">{{ studentCount }} នាក់</div>
          </div>
          <div class="print-stat">
            <div class="print-stat-label">សិស្សប្រុស:</div>
            <div class="print-stat-value">{{ maleCount }} នាក់</div>
          </div>
          <div class="print-stat">
            <div class="print-stat-label">សិស្សស្រី:</div>
            <div class="print-stat-value">{{ femaleCount }} នាក់</div>
          </div>
        </div>

        <!-- Students Table for Print - FULL DATA with pictures -->
        <table class="print-table">
          <thead>
            <tr>
              <th class="col-no">ល.រ</th>
              <th class="col-picture">រូបភាព</th>
              <th class="col-name">ឈ្មោះសិស្ស</th>
              <th class="col-gender">ភេទ</th>
              <th class="col-birthdate">ថ្ងៃខែឆ្នាំកំណើត</th>
              <th class="col-birthplace">ទីកន្លែងកំណើត</th>
              <th class="col-address">ទីលំនៅបច្ចុប្បន្ន</th>
              <th class="col-father">ឈ្មោះឪពុក</th>
              <th class="col-father-info">ព័ត៌មានឪពុក</th>
              <th class="col-mother">ឈ្មោះម្តាយ</th>
              <th class="col-mother-info">ព័ត៌មានម្តាយ</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(student, index) in students"
              :key="student.StudentID + '-print'"
            >
              <!-- Serial Number -->
              <td class="col-no">{{ toKhmerNumber(index + 1) }}</td>
              
              <!-- Picture -->
              <td class="col-picture">
                <div class="print-photo-container">
                  <img
                    v-if="getStudentPicture(student)"
                    :src="getStudentPicture(student)"
                    :alt="student.StudentFirstname"
                    class="print-photo"
                    @error="handlePrintImageError"
                  />
                  <div
                    v-else
                    :class="[
                      'print-photo-fallback',
                      student.StudentSex === 'M' ? 'male-fallback' : student.StudentSex === 'F' ? 'female-fallback' : 'other-fallback',
                    ]"
                  >
                    {{ student.StudentFirstname?.charAt(0) || "?" }}
                  </div>
                </div>
              </td>
              
              <!-- Student Name -->
              <td class="col-name">
                <div class="student-name">
                  {{ student.StudentFirstname }} {{ student.StudentLastname }}
                </div>
                <div class="student-id">
                  លេខកូដ: {{ student.StudentID }}
                </div>
              </td>
              
              <!-- Gender -->
              <td class="col-gender">
                {{ student.GenderKhmer || student.StudentSex }}
              </td>
              
              <!-- Birthdate -->
              <td class="col-birthdate">
                <div>{{ formatDate(student.StudentBirthdate) }}</div>
                <div class="student-age">
                  អាយុ: {{ student.StudentAge || calculateAge(student.StudentBirthdate) }} ឆ្នាំ
                </div>
              </td>
              
              <!-- Birth Place -->
              <td class="col-birthplace">
                <div class="address-line">{{ student.StudentBirthvillage || "" }}</div>
                <div class="address-line">{{ student.StudentBirthcommune || "" }}</div>
                <div class="address-line">{{ student.StudentBirthdistrict || "" }}</div>
                <div class="address-line">{{ student.StudentBirthProvince || "" }}</div>
              </td>
              
              <!-- Current Address -->
              <td class="col-address">
                <div class="address-line">{{ student.StudentCurrentvillage || "" }}</div>
                <div class="address-line">{{ student.StudentCurrentcommune || "" }}</div>
                <div class="address-line">{{ student.StudentCurrentdistrict || "" }}</div>
                <div class="address-line">{{ student.Studentcurrentprovince || "" }}</div>
              </td>
              
              <!-- Father Name -->
              <td class="col-father">
                {{ student.StudentFathername || "មិនមាន" }}
              </td>
              
              <!-- Father Information -->
              <td class="col-father-info">
                <div class="parent-info">
                  <span class="info-label">ទូរស័ព្ទ:</span>
                  <span class="info-value">{{ toKhmerNumber(student.StudentFathernumber || "មិនមាន") }}</span>
                </div>
                <div class="parent-info">
                  <span class="info-label">មុខរបរ:</span>
                  <span class="info-value">{{ student.StudentFatherjob || "មិនមាន" }}</span>
                </div>
              </td>
              
              <!-- Mother Name -->
              <td class="col-mother">
                {{ student.StudentMothername || "មិនមាន" }}
              </td>
              
              <!-- Mother Information -->
              <td class="col-mother-info">
                <div class="parent-info">
                  <span class="info-label">ទូរស័ព្ទ:</span>
                  <span class="info-value">{{ toKhmerNumber(student.StudentMothernumber || "មិនមាន") }}</span>
                </div>
                <div class="parent-info">
                  <span class="info-label">មុខរបរ:</span>
                  <span class="info-value">{{ student.StudentMotherJob || "មិនមាន" }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Signatures Section -->
        <div class="signatures">
          <div class="signature-column">
            <div class="signature-label">បានឃើញ និងឯកភាព</div>
            <div class="signature-date">
              ថ្ងៃ..............ខែ..........ឆ្នាំ...........
            </div>
            <div class="signature-title">នាយកសាលា</div>
            <div class="signature-space"></div>
            <div class="signature-name">{{ classInfo.PrincipalName || "&nbsp;" }}</div>
          </div>

          <div class="signature-column">
            <div class="signature-label">&nbsp;</div>
            <div class="signature-date">
              ថ្ងៃ..............ខែ..........ឆ្នាំ...........
            </div>
            <div class="signature-title">អ្នកធ្វើតារាង</div>
            <div class="signature-space"></div>
            <div class="signature-name">{{ classInfo.TeacherFullName || "&nbsp;" }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { onMounted, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "../stores/appStore";

// Configure axios
// axios.defaults.baseURL is already set in main.js


// Router and Route
const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

// Get class ID from route params
let classId = route.params.id;

// Refs
const students = ref([]);
const classInfo = ref({});
const loading = ref(false);
const searchText = ref("");
const filterGender = ref("");
const currentPage = ref(1);
const pageSize = ref(20);
const totalStudents = ref(0);
const notifications = ref([]);
const notificationAnimation = ref({});

// Academic year
const academicYear = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  return `${year}-${year + 1}`;
});

// Computed properties
const studentCount = computed(() => students.value.length);
const maleCount = computed(
  () => students.value.filter((s) => s.StudentSex === "M").length,
);
const femaleCount = computed(
  () => students.value.filter((s) => s.StudentSex === "F").length,
);
const averageAge = computed(() => {
  if (students.value.length === 0) return 0;
  const totalAge = students.value.reduce((sum, student) => {
    return sum + (student.StudentAge || calculateAge(student.StudentBirthdate));
  }, 0);
  return totalAge / students.value.length;
});

// Methods
const showNotification = (message, type = "info") => {
  const id = Date.now();
  notifications.value.push({ id, message, type });

  notificationAnimation.value[id] = "translate-x-0";

  setTimeout(() => {
    closeNotification(id);
  }, 5000);
};

const closeNotification = (id) => {
  notificationAnimation.value[id] = "translate-x-full opacity-0";

  setTimeout(() => {
    notifications.value = notifications.value.filter((n) => n.id !== id);
    delete notificationAnimation.value[id];
  }, 300);
};

const toKhmerNumber = (input) => {
  if (input === undefined || input === null || input === "មិនមាន") return input;

  const str = String(input);
  const khmerNumerals = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

  return str.replace(/\d/g, (digit) => khmerNumerals[digit]);
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${toKhmerNumber(day)}/${toKhmerNumber(month)}/${toKhmerNumber(year)}`;
  } catch {
    return dateString;
  }
};

const calculateAge = (birthDate) => {
  if (!birthDate) return 0;
  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  } catch {
    return 0;
  }
};

const getStudentPicture = (student) => {
  if (!student) return null;

  // First check if there's already a preview
  if (student.StudentPicturePreview) {
    return student.StudentPicturePreview;
  }

  // Then check if there's a StudentPicture URL
  if (student.StudentPicture) {
    return getDrivePreview(student.StudentPicture);
  }

  // Check all possible picture fields
  const possiblePicFields = [
    "photo",
    "image",
    "profile_picture",
    "picture",
    "Photo",
    "Image",
    "ProfilePicture",
    "StudentPic",
    "StudentImage",
  ];
  
  for (const field of possiblePicFields) {
    if (student[field]) {
      return getDrivePreview(student[field]);
    }
  }

  return null;
};

const getDrivePreview = (url) => {
  if (!url) return null;

  try {
    // Check if it's a Google Drive URL
    if (url.includes("drive.google.com")) {
      let fileId = null;

      // Handle different Google Drive URL formats
      if (url.includes("/file/d/")) {
        fileId = url.split("/file/d/")[1].split("/")[0];
      } else if (url.includes("id=")) {
        fileId = url.split("id=")[1].split("&")[0];
      } else if (url.includes("/open?id=")) {
        fileId = url.split("/open?id=")[1];
      }

      if (fileId) {
        // Use larger size for print
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w300-h400`;
      }
    }

    return url;
  } catch (error) {
    console.error("Error processing Drive URL:", error);
    return url;
  }
};

const handleImageLoad = (event) => {
  console.log("Image loaded successfully");
};

const handleImageError = (event) => {
  console.log("Image failed to load, using fallback");
  event.target.style.display = "none";

  const parent = event.target.parentElement;
  if (parent) {
    const fallback = document.createElement("div");
    fallback.className =
      "flex items-center justify-center w-full h-full bg-gray-300 text-gray-600";
    fallback.textContent = "No Image";
    parent.appendChild(fallback);
  }
};

const handlePrintImageError = (event) => {
  event.target.style.display = "none";
  const container = event.target.parentElement;
  
  if (container && event.target.nextElementSibling) {
    event.target.nextElementSibling.style.display = "flex";
  }
};

const fetchClassInfo = async () => {
  try {
    const response = await axios.get(`/class/${classId}`);
    if (response.data && response.data.success) {
      classInfo.value = response.data.data;
      if (classInfo.value.ClassName) {
        const match = classInfo.value.ClassName.match(/(\d+)/);
        classInfo.value.classNumber = match ? parseInt(match[1]) : null;
      }

      if (classInfo.value.TeacherPic && !classInfo.value.TeacherPicPreview) {
        classInfo.value.TeacherPicPreview = getDrivePreview(
          classInfo.value.TeacherPic,
        );
      }
    }
  } catch (error) {
    console.error("Error fetching class info:", error);
    showNotification("មិនអាចទាញយកព័ត៌មានថ្នាក់បានទេ", "error");
  }
};

const fetchStudents = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`/class/${classId}/students`, {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchText.value,
        gender: filterGender.value,
      },
    });

    if (response.data && response.data.success) {
      students.value = response.data.data.students || [];
      totalStudents.value =
        response.data.data.pagination?.total || students.value.length;

      // Process all student data including pictures
      students.value.forEach((student) => {
        // Process gender for Khmer display
        if (student.StudentSex === "M") {
          student.GenderKhmer = "ប្រុស";
        } else if (student.StudentSex === "F") {
          student.GenderKhmer = "ស្រី";
        } else {
          student.GenderKhmer = "ផ្សេងៗ";
        }

        // Ensure StudentPicturePreview is set
        if (!student.StudentPicturePreview) {
          student.StudentPicturePreview = getStudentPicture(student);
        }
      });
    } else {
      students.value = [];
      totalStudents.value = 0;
    }
  } catch (error) {
    console.error("Error fetching students:", error);
    showNotification("មិនអាចទាញយកទិន្នន័យសិស្សបានទេ", "error");
    students.value = [];
    totalStudents.value = 0;
  } finally {
    loading.value = false;
  }
};

watch(
  () => appStore.refreshTokens.students,
  () => {
    fetchStudents();
  },
);

watch(
  () => appStore.refreshTokens.classes,
  () => {
    fetchClassInfo();
  },
);

const searchStudents = () => {
  currentPage.value = 1;
  fetchStudents();
};

const resetFilters = () => {
  searchText.value = "";
  filterGender.value = "";
  currentPage.value = 1;
  fetchStudents();
  showNotification("បានសម្អាតការស្វែងរក", "success");
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchStudents();
  }
};

const nextPage = () => {
  const totalPages = Math.ceil(totalStudents.value / pageSize.value);
  if (currentPage.value < totalPages) {
    currentPage.value++;
    fetchStudents();
  }
};

const goBack = () => {
  router.go(-1);
};

const exportToExcel = async () => {
  try {
    const response = await axios.get(`/api/class/${classId}/export/excel`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `សិស្ស_${classInfo.value.ClassName}${classInfo.value.ClassLetter}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();

    showNotification("ទិន្នន័យត្រូវបាននាំចេញដោយជោគជ័យ!", "success");
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    showNotification("មិនអាចនាំចេញទិន្នន័យបានទេ", "error");
  }
};

const printStudentList = () => {
  window.print();
};

// Watch for route changes
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      classId = newId;
      fetchClassInfo();
      fetchStudents();
    }
  },
);

// Lifecycle
onMounted(() => {
  if (classId) {
    fetchClassInfo();
    fetchStudents();
  } else {
    showNotification("រកមិនឃើញលេខកូដថ្នាក់", "error");
    setTimeout(() => router.go(-1), 2000);
  }
});
</script>

<style>
/* Import fonts */
@import url("https://fonts.googleapis.com/css2?family=Moul&family=Hanuman:wght@300;400;700&display=swap");

/* Screen styles - normal viewing */
.container {
  max-width: 100%;
}

.moul-regular {
  font-family: "Moul", cursive;
}

.Moul {
  font-family: "Moul", cursive;
}

.center {
  text-align: center;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #6366f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4f46e5;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .container {
    padding: 0.5rem !important;
  }

  .text-3xl {
    font-size: 1.5rem !important;
  }

  .grid-cols-1 {
    grid-template-columns: 1fr !important;
  }
}

/* PRINT STYLES ONLY - These only apply when printing */
@media print {
  /* Hide all screen elements */
  .print\:hidden {
    display: none !important;
  }
  
  /* Show print form */
  .print-form-container {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    font-family: "Hanuman", serif !important;
    font-size: 8pt !important;
    line-height: 1.1 !important;
    background: white !important;
    color: black !important;
  }

  /* Page settings for A4 Landscape */
  @page {
    size: A4 landscape;
    margin: 10mm;
  }

  /* Print header styles */
  .khmer-header {
    font-family: "Moul", cursive !important;
    font-size: 11pt !important;
    font-weight: bold !important;
    margin-bottom: 2px !important;
    line-height: 1 !important;
  }

  .ministry {
    font-family: "Moul", cursive !important;
    font-size: 9pt !important;
    font-weight: bold !important;
    margin: 3px 0 !important;
  }

  .school-name {
    font-size: 9pt !important;
    font-weight: bold !important;
    margin: 3px 0 !important;
  }

  .class-info {
    font-family: "Moul", cursive !important;
    font-size: 10pt !important;
    font-weight: bold !important;
    margin: 6px 0 !important;
    text-decoration: underline !important;
  }

  .academic-year {
    font-size: 8pt !important;
    margin: 3px 0 !important;
  }

  /* Print summary styles */
  .print-summary {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 10px !important;
    margin-bottom: 10px !important;
    border: 1px solid black !important;
    padding: 5px !important;
  }

  .print-stat {
    text-align: center !important;
    border: 1px solid black !important;
    padding: 3px !important;
  }

  .print-stat-label {
    font-weight: bold !important;
    font-size: 8pt !important;
  }

  .print-stat-value {
    font-size: 9pt !important;
  }

  /* Print table styles for full data */
  .print-table {
    width: 100% !important;
    border-collapse: collapse !important;
    border: 1px solid black !important;
    font-size: 7pt !important;
    margin-top: 10px !important;
    margin-bottom: 15px !important;
    page-break-inside: auto !important;
  }

  .print-table th,
  .print-table td {
    border: 1px solid black !important;
    padding: 3px 2px !important;
    text-align: center !important;
    vertical-align: middle !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
  }

  .print-table th {
    background-color: #f0f0f0 !important;
    font-weight: bold !important;
    font-family: "Moul", cursive !important;
    font-size: 8pt !important;
    padding: 4px 2px !important;
  }

  /* Column widths for print table with all data */
  .col-no { width: 25px !important; }
  .col-picture { width: 45px !important; }
  .col-name { width: 80px !important; }
  .col-gender { width: 35px !important; }
  .col-birthdate { width: 60px !important; }
  .col-birthplace { width: 80px !important; }
  .col-address { width: 80px !important; }
  .col-father { width: 70px !important; }
  .col-father-info { width: 80px !important; }
  .col-mother { width: 70px !important; }
  .col-mother-info { width: 80px !important; }

  /* Picture styles for print */
  .print-photo-container {
    width: 40px !important;
    height: 50px !important;
    margin: 0 auto !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .print-photo {
    max-width: 100% !important;
    max-height: 100% !important;
    object-fit: contain !important;
    display: block !important;
  }

  .print-photo-fallback {
    width: 40px !important;
    height: 50px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-weight: bold !important;
    font-size: 16pt !important;
    color: white !important;
  }

  .male-fallback {
    background-color: #dbeafe !important;
    color: #1e40af !important;
  }

  .female-fallback {
    background-color: #fce7f3 !important;
    color: #9d174d !important;
  }

  .other-fallback {
    background-color: #f3f4f6 !important;
    color: #374151 !important;
  }

  /* Text styles for print table */
  .student-name {
    font-weight: bold !important;
    font-size: 8pt !important;
    margin-bottom: 2px !important;
  }

  .student-id {
    font-size: 7pt !important;
    color: #666 !important;
  }

  .student-age {
    font-size: 7pt !important;
    color: #666 !important;
    margin-top: 2px !important;
  }

  .address-line {
    font-size: 7pt !important;
    line-height: 1.1 !important;
    margin: 1px 0 !important;
  }

  .parent-info {
    margin: 2px 0 !important;
    font-size: 7pt !important;
    line-height: 1.1 !important;
  }

  .info-label {
    font-weight: bold !important;
  }

  .info-value {
    margin-left: 3px !important;
  }

  /* Signatures section */
  .signatures {
    display: flex !important;
    justify-content: space-between !important;
    margin-top: 30px !important;
    padding-top: 15px !important;
    border-top: 1px solid black !important;
    width: 100% !important;
  }

  .signature-column {
    width: 45% !important;
    text-align: center !important;
  }

  .signature-label {
    font-weight: bold !important;
    margin-bottom: 8px !important;
    font-size: 8pt !important;
  }

  .signature-date {
    margin-bottom: 10px !important;
    font-size: 8pt !important;
    border-bottom: 1px dotted black !important;
    padding-bottom: 3px !important;
  }

  .signature-title {
    font-weight: bold !important;
    margin-bottom: 20px !important;
    font-size: 9pt !important;
    text-decoration: underline !important;
  }

  .signature-space {
    height: 40px !important;
    margin-bottom: 8px !important;
  }

  .signature-name {
    font-weight: bold !important;
    border-top: 1px solid black !important;
    padding-top: 3px !important;
    font-size: 9pt !important;
  }

  /* Remove all shadows, rounded corners for print */
  * {
    box-shadow: none !important;
    text-shadow: none !important;
    border-radius: 0 !important;
  }

  /* Ensure proper page breaks */
  .print-table tr {
    page-break-inside: avoid !important;
  }

  /* Make sure text is black for print */
  .text-gray-800,
  .text-gray-700,
  .text-gray-600,
  .text-indigo-600,
  .text-blue-900,
  .text-green-900,
  .text-pink-900,
  .text-purple-900 {
    color: black !important;
  }

  /* Force clear black borders for print */
  .print-table,
  .print-table thead,
  .print-table tbody,
  .print-table tr,
  .print-table th,
  .print-table td {
    border: 1px solid black !important;
    background-color: transparent !important;
  }
}
</style>
