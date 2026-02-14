<template>
  <div class="container p-2 mx-auto">
    <!-- Toast notifications -->
    <div class="fixed z-50 flex flex-col gap-1 top-2 right-2">
      <div
        v-for="n in notifications"
        :key="n.id"
        :class="[
          'px-5 py-3 rounded-xl shadow-2xl text-white flex items-center gap-3 transform transition-all duration-300 hover:scale-105',
          n.type === 'error'
            ? 'bg-linear-to-r from-red-500 to-red-600'
            : n.type === 'success'
              ? 'bg-linear-to-r from-green-500 to-emerald-600'
              : 'bg-linear-to-r from-indigo-500 to-purple-600',
        ]"
      >
        <div class="text-sm font-medium">{{ n.message }}</div>
        <button
          @click="closeNotification(n.id)"
          class="ml-2 text-white transition-opacity opacity-80 hover:opacity-100"
        >
          ✕
        </button>
      </div>
      <div
        v-for="task in uploadTasks"
        :key="task.id"
        class="p-4 bg-white border border-gray-100 shadow-xl rounded-xl"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm font-semibold text-gray-700 truncate">
            {{ task.name }}
          </div>
          <div
            class="px-2 py-1 text-xs font-medium text-indigo-600 rounded-full bg-indigo-50"
          >
            {{ task.progress }}%
          </div>
        </div>
        <div class="h-2 overflow-hidden bg-gray-100 rounded-full">
          <div
            :style="{ width: task.progress + '%' }"
            class="h-full transition-all duration-300 rounded-full bg-linear-to-r from-green-400 to-emerald-500"
          ></div>
        </div>
      </div>
    </div>
    <div class="w-full">
      <!-- Search and Controls -->
      <div
        class="p-2 mb-8 bg-white border border-gray-100 shadow-xl rounded-2xl"
      >
        <div class="grid grid-cols-1 gap-2 mb-6 md:grid-cols-4">
          <input
            v-model="searchText"
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះ ឬលេខសំគាល់..."
            class="px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 font-medium"
          />
          <button
            @click="performSearch"
            class="px-6 py-3.5 bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span class="text-lg">🔍</span>
            ស្វែងរក
          </button>
          <button
            @click="clearSearch"
            class="px-6 py-3.5 bg-linear-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span class="text-lg">✕</span>
            សម្អាត
          </button>
          <button
            @click="addNewStudent"
            class="px-6 py-3.5 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span class="text-lg">➕</span>
            សិស្សថ្មី
          </button>
        </div>

        <div class="flex flex-wrap gap-3"> 
          <button
            @click="printStudents"
            class="px-5 py-2.5 text-sm bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
          >
            <span class="text-base">🖨️</span>
            បោះពុម្ព
          </button>
        </div>
      </div>
</div>
      <!-- Students Table -->
      <div
        class="overflow-hidden bg-white border border-gray-100 shadow-xl rounded-2xl"
      >
        <div v-if="loading" class="p-12 text-center">
          <div
            class="inline-block w-16 h-16 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin"
          ></div>
          <p class="mt-4 font-medium text-gray-600">កំពុងផ្ទុកទិន្នន័យសិស្ស...</p>
        </div>

        <div v-else-if="students.length === 0" class="p-12 text-center">
          <div class="mb-4 text-6xl">📭</div>
          <p class="text-lg font-medium text-gray-600">មិនមានទិន្នន័យសិស្ស</p>
        </div>

        <div v-else>
          <div class="block divide-y md:hidden">
            <div v-for="(student, idx) in students" :key="student.StudentID" class="flex flex-col gap-2 py-4 mb-3 border-b shadow last:border-b-0 bg-white/90 rounded-xl">
              <div class="flex items-center gap-3">
                <div v-if="student.StudentPicture" class="w-16 h-16 overflow-hidden border-2 border-indigo-200 shadow-md shrink-0 rounded-xl">
                  <img :src="imagePreview(student.StudentPicture)" alt="thumb" class="object-cover w-full h-full" />
                </div>
                <div v-else class="flex items-center justify-center w-16 h-16 text-3xl text-gray-300 border-2 border-gray-200 shrink-0 rounded-xl">👤</div>
                <div class="flex-1">
                  <div class="font-bold text-indigo-700">{{ student.StudentFirstname }} {{ student.StudentLastname }}</div>
                  <div class="text-xs text-gray-500">លេខសំគាល់: {{ student.StudentID }}</div>
                  <div class="text-xs text-gray-500">ថ្នាក់: {{ convertClassToKhmer(student.ClassName, student.ClassLetter) }}</div>
                  <div class="text-xs text-gray-500">អាយុ: {{ student.StudentAge }} | {{ getSexDisplay(student.StudentSex) }}</div>
                </div>
              </div>
              <div class="flex gap-2 mt-2">
                <button @click.stop="editStudent(student)" class="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 rounded-lg shadow-md bg-linear-to-r from-blue-500 to-blue-600 hover:shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2H7a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2z" />
                  </svg>
                  <span>កែប្រែ</span>
                </button>
                <button @click.stop="openPrintModal(student)" class="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 rounded-lg shadow-md bg-linear-to-r from-green-500 to-emerald-600 hover:shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9v12h12V9M6 9V3h12v6M6 9h12" />
                  </svg>
                  <span>បោះពុម្ព</span>
                </button>
                <button @click.stop="deleteStudent(student.StudentID)" class="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 rounded-lg shadow-md bg-linear-to-r from-red-500 to-red-600 hover:shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>លុប</span>
                </button>
              </div>
            </div>
          </div>
          <div class="hidden overflow-x-auto md:block">
            <table class="w-full text-sm">
              <thead class="border-b-2 border-indigo-100 bg-linear-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">លេខកូដ</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">ត្រកូល</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">នាម</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">ថ្នាក់</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">ភេទ</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">អាយុ</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">រូបភាព</th>
                  <th class="px-6 py-4 font-bold text-center text-gray-700">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(student, idx) in students" :key="student.StudentID" class="transition-all duration-200 border-b border-gray-100 hover:bg-linear-to-r hover:from-indigo-50 hover:to-purple-50">
                  <td class="px-6 py-4 font-semibold text-indigo-600">{{ student.StudentID }}</td>
                  <td class="px-6 py-4 font-medium text-gray-700">{{ student.StudentFirstname }}</td>
                  <td class="px-6 py-4 font-medium text-gray-700">{{ student.StudentLastname }}</td>
                  <td class="px-6 py-4"><span class="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full">{{ convertClassToKhmer(student.ClassName, student.ClassLetter) }}</span></td>
                  <td class="px-6 py-4 font-medium text-gray-600">{{ getSexDisplay(student.StudentSex) }}</td>
                  <td class="px-6 py-4 font-medium text-gray-600">{{ student.StudentAge }}</td>
                  <td class="px-6 py-4 text-center">
                    <div v-if="student.StudentPicture" class="mx-auto overflow-hidden border-2 border-indigo-200 shadow-md w-14 h-14 rounded-xl">
                      <img :src="imagePreview(student.StudentPicture)" alt="thumb" class="object-cover w-full h-full" />
                    </div>
                    <div v-else class="text-2xl text-gray-300">👤</div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-2">
                      <button @click.stop="editStudent(student)" class="flex items-center w-full gap-2 px-4 py-2 text-xs font-semibold text-white bg-linear-to-r from-blue-500 to-blue-600 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 sm:w-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2H7a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2z" />
                        </svg>
                        <span>កែប្រែ</span>
                      </button>
                      <button @click.stop="openPrintModal(student)" class="flex items-center w-full gap-2 px-4 py-2 text-xs font-semibold text-white bg-linear-to-r from-green-500 to-emerald-600 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 sm:w-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9v12h12V9M6 9V3h12v6M6 9h12" />
                        </svg>
                        <span>បោះពុម្ព</span>
                      </button>
                      <button @click.stop="deleteStudent(student.StudentID)" class="flex items-center w-full gap-2 px-4 py-2 text-xs font-semibold text-white bg-linear-to-r from-red-500 to-red-600 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 sm:w-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>លុប</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Print Modal -->
          <div
            v-if="showPrintModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          >
            <div
              class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col print-modal-paper border-2 border-gray-200"
            >
              <div
                class="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-linear-to-r from-indigo-50 to-purple-50 rounded-t-2xl no-print"
              >
                <h2 class="w-full text-2xl font-bold text-center text-gray-800 moul-regular">
                  ប្រវត្តិរូបសង្ខេប
                </h2>
                <button
                  @click="closePrintModal"
                  class="absolute px-3 py-1 text-2xl font-bold text-gray-600 transition-all rounded-full right-8 hover:bg-gray-200 no-print"
                >
                  ✕
                </button>
              </div>
              <div class="flex-1 p-8 overflow-y-auto bg-gray-100">
                <div id="print-section" class="bg-white p-8 mx-auto shadow-sm max-w-[210mm] min-h-[297mm]">
                  <div class="mb-3 text-center">
                    <div class="text-lg font-bold text-gray-800">
                      ព្រះរាជាណាចក្រកម្ពុជា
                    </div>
                    <div class="text-base font-semibold text-gray-700">
                      ជាតិ សាសនា ព្រះមហាក្សត្រ
                    </div>
                  </div>
                  <div class="mb-6 text-center">
                    <div class="text-xl font-bold text-gray-800 underline">
                      ប្រវត្តិរូបសង្ខេប
                    </div>
                  </div>
                  <div class="flex flex-col gap-8 md:flex-row">
                    <div class="flex-1 space-y-6">
                      <div>
                        <div class="mb-3 text-base font-bold text-gray-800">
                          I. ព័ត៌មានផ្ទាល់ខ្លួន
                        </div>
                        <table class="w-full text-sm border border-black border-collapse">
                        <tbody>
                          <tr>
                            <td class="p-2 font-semibold border border-black">ឈ្មោះ</td>
                            <td class="p-2 border border-black">{{ printStudent.StudentFirstname }} {{ printStudent.StudentLastname }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">ភេទ</td>
                            <td class="p-2 border border-black">{{ getSexDisplay(printStudent.StudentSex) }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">ថ្ងៃខែឆ្នាំកំណើត</td>
                            <td class="p-2 border border-black">{{ printStudent.StudentBirthdate }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">ទីកន្លែងកំណើត</td>
                            <td class="p-2 border border-black">
                              {{ printStudent.StudentBirthvillage }}
                              {{ printStudent.StudentBirthcommune }}
                              {{ printStudent.StudentBirthdistrict }}
                              {{ printStudent.StudentBirthProvince }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <div class="mb-3 text-base font-bold text-gray-800">
                        II. ស្ថានភាពគ្រួសារ និង អាសយដ្ឋាន
                      </div>
                      <table class="w-full text-sm border border-black border-collapse">
                        <tbody>
                          <tr>
                            <td class="p-2 font-semibold border border-black">ឈ្មោះឪពុក</td>
                            <td class="p-2 border border-black">{{ printStudent.StudentFathername }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">ឈ្មោះម្តាយ</td>
                            <td class="p-2 border border-black">{{ printStudent.StudentMothername }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">អាសយដ្ឋានបច្ចុប្បន្ន</td>
                            <td class="p-2 border border-black">
                              {{ printStudent.StudentCurrentvillage }}
                              {{ printStudent.StudentCurrentcommune }}
                              {{ printStudent.StudentCurrentdistrict }}
                              {{ printStudent.Studentcurrentprovince }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div class="flex flex-col items-center min-w-35">
                    <div
                      v-if="printStudent.StudentPicture"
                      class="w-27.5 h-35 mb-2 border-2 border-indigo-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 shadow-md"
                    >
                      <img
                        :src="imagePreview(printStudent.StudentPicture)"
                        alt="Student Photo"
                        class="object-cover w-full h-full"
                      />
                    </div>
                    <div
                      v-else
                      class="w-27.5 h-35 mb-2 border-2 border-gray-300 rounded-lg flex items-center justify-center text-gray-400 bg-gray-50 text-4xl"
                    >
                      👤
                    </div>
                    <div class="mt-2 text-xs font-medium text-gray-600">
                      លេខសំគាល់: {{ printStudent.StudentID }}
                    </div>
                    <div class="text-xs text-gray-600">
                      ថ្នាក់: {{ convertClassToKhmer(printStudent.ClassName, printStudent.ClassLetter) }}
                    </div>
                    <div class="text-xs text-gray-600">
                      មកពី: {{ printStudent.Fromschool }}
                    </div>
                  </div>
                  </div>
                  <div class="flex flex-row justify-end mt-12">
                    <div class="text-center text-gray-700">
                      <div class="mb-2">
                        ធ្វើនៅ បាត់ដំបង, ថ្ងៃទី {{ new Date().getDate() }} ខែ
                        {{ getKhmerMonth(new Date().getMonth() + 1) }} ឆ្នាំ
                        {{ new Date().getFullYear() }}
                      </div>
                      <div class="font-bold text-center">ហត្ថលេខា</div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="flex items-center justify-end gap-3 p-6 border-t-2 border-gray-200 bg-linear-to-r from-indigo-50 to-purple-50 rounded-b-2xl no-print"
              >
                <div class="mr-auto text-xs font-semibold text-gray-500">CTRL + P</div>
                <button
                  @click="printCurrentStudent"
                  class="px-6 py-2.5 font-semibold text-white bg-linear-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  បោះពុម្ព
                </button>
                <button
                  @click="closePrintModal"
                  class="px-6 py-2.5 font-semibold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-all duration-200"
                >
                  បិទ
                </button>
                <button
                  @click="printStudentPDF"
                  class="px-6 py-2.5 font-semibold text-white bg-linear-to-r from-red-500 to-red-600 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  បោះពុម្ព PDF
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="students.length > 0"
            class="flex items-center justify-between px-6 py-5 border-t-2 border-gray-100 bg-linear-to-r from-indigo-50 to-purple-50"
          >
            <div class="text-sm font-medium text-gray-700">
              បង្ហាញ
              <span class="font-bold text-indigo-600">{{
                (currentPage - 1) * pageSize + 1
              }}</span>
              ដល់
              <span class="font-bold text-indigo-600">{{
                Math.min(currentPage * pageSize, total)
              }}</span>
              នៃ <span class="font-bold text-indigo-600">{{ total }}</span>
              សិស្ស
            </div>
            <div class="flex gap-2">
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="px-4 py-2 bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                ◀ មុន
              </button>
              <span
                class="px-4 py-2 font-bold text-indigo-600 bg-white border-2 border-indigo-200 rounded-xl"
                >{{ currentPage }} / {{ Math.ceil(total / pageSize) }}</span
              >
              <button
                @click="nextPage"
                :disabled="currentPage >= Math.ceil(total / pageSize)"
                class="px-4 py-2 bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                បន្ទាប់ ▶
              </button>
            </div>
          </div>
        </div>
      </div>

    <!-- Student Detail Modal -->
    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-gray-200 overflow-hidden"
      >
        <button
          @click="closeDetailModal"
          class="absolute z-30 px-3 py-1 text-3xl font-bold text-gray-700 bg-white rounded-full shadow-md top-4 right-4 hover:bg-gray-100 focus:outline-none"
        >
          ✕
        </button>

        <div class="flex-1 overflow-auto">
          <form
            @submit.prevent="saveStudent"
            class="p-6 space-y-8 bg-linear-to-br from-white via-blue-50 to-indigo-50"
          >
            <h2 class="flex items-center gap-3 text-2xl font-bold text-gray-800 moul-regular">
              <span v-if="isEditMode" class="text-3xl">✏️</span>
              <span v-else class="text-3xl">👁️</span>
              {{ isEditMode ? "កែប្រែសិស្ស" : "មើលសិស្ស" }}
            </h2>

            <!-- Student ID -->
            <div
              class="p-6 bg-white border-2 border-indigo-100 shadow-md rounded-xl"
            >
              <label
                class="flex items-center gap-2 mb-3 text-sm font-bold text-gray-700"
                for="student-id-field"
              >
                <span class="text-lg">🆔</span>
                លេខសំគាល់សិស្ស
              </label>
              <input
                id="student-id-field"
                v-model="formData.StudentID"
                type="text"
                :disabled="!isNewStudent"
                class="w-full px-5 py-3 font-semibold text-indigo-600 transition-all duration-200 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:bg-gray-100"
                placeholder="លេខសំគាល់សិស្ស"
              />
            </div>

            <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
              <!-- Personal Information -->
              <div
                class="p-6 space-y-6 bg-white border-2 border-indigo-100 shadow-lg rounded-xl"
              >
                <h3
                  class="flex items-center gap-2 pb-3 mb-4 text-lg font-bold text-indigo-700 border-b-2 border-indigo-100 moul-regular"
                >
                  <span class="text-2xl">👤</span>
                  ព័ត៌មានផ្ទាល់ខ្លួន
                </h3>

                <div>
                  <label
                    class="block mb-2 text-sm font-semibold text-gray-700"
                    for="student-firstname-field"
                    >ត្រកូល</label
                  >
                  <input
                    id="student-firstname-field"
                    v-model="formData.StudentFirstname"
                    type="text"
                    class="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ត្រកូល"
                  />
                </div>

                <div>
                  <label
                    class="block mb-2 text-sm font-semibold text-gray-700"
                    for="student-lastname-field"
                    >នាម</label
                  >
                  <input
                    id="student-lastname-field"
                    v-model="formData.StudentLastname"
                    type="text"
                    class="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="នាម"
                  />
                </div>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ភេទ</label
                  >
                  <select
                    v-model="formData.StudentSex"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសភេទ"
                  >
                    <option disabled value="">ជ្រើសរើសភេទ</option>
                    <option value="m">ប្រុស</option>
                    <option value="f">ស្រី</option>
                    <option value="o">ផ្សេងទៀត</option>
                  </select>
                </div>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ថ្នាក់</label
                  >
                  <select
                    v-model="formData.ClassID"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសថ្នាក់"
                  >
                    <option disabled value="">ជ្រើសរើសថ្នាក់</option>
                    <option
                      v-for="cls in classes"
                      :key="cls.classid"
                      :value="cls.classid"
                    >
                      {{ cls.classname }} {{ cls.classletter }}
                    </option>
                  </select>
                </div>

                <div class="relative">
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ថ្ងៃខែឆ្នាំកំណើត</label
                  >
                  <input
                    v-model="formData.StudentBirthdate"
                    type="date"
                    class="w-full px-4 py-3 placeholder-transparent transition-all duration-200 border-2 border-gray-200 rounded-xl peer focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>

                <div class="relative">
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >អាយុ</label
                  >
                  <input
                    v-model.number="formData.StudentAge"
                    type="number"
                    placeholder="អាយុ"
                    min="0"
                    max="120"
                    class="w-full px-4 py-3 placeholder-transparent transition-all duration-200 border-2 border-gray-200 rounded-xl peer focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >មកពីសាលា</label
                  >
                  <select
                    v-model="formData.fromschool"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសសាលា"
                  >
                    <option disabled value="">ជ្រើសរើសសាលា</option>
                    <option
                      v-for="school in schools"
                      :key="school"
                      :value="school"
                    >
                      {{ school }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Address Information -->
              <div
                class="p-6 space-y-6 bg-white border-2 border-indigo-100 shadow-lg rounded-xl"
              >
                <h3
                  class="flex items-center gap-2 pb-3 mb-4 text-lg font-bold text-indigo-700 border-b-2 border-indigo-100 moul-regular"
                >
                  <span class="text-2xl">🏠</span>
                  ទីកន្លែងកំណើត
                </h3>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ខេត្តកំណើត</label
                  >
                  <select
                    v-model="formData.StudentBirthProvince"
                    @change="loadBirthDistricts"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសខេត្ត"
                  >
                    <option disabled value="">ជ្រើសរើសខេត្ត</option>
                    <option
                      v-for="prov in provinces"
                      :key="prov.id"
                      :value="prov.id"
                    >
                      {{ prov.name_kh }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ស្រុក/ខណ្ឌកំណើត</label
                  >
                  <select
                    v-model="formData.StudentBirthdistrict"
                    @change="loadBirthCommunes"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសស្រុក/ខណ្ឌ"
                  >
                    <option disabled value="">ជ្រើសរើសស្រុក/ខណ្ឌ</option>
                    <option
                      v-for="dist in birthDistricts"
                      :key="dist.id"
                      :value="dist.id"
                    >
                      {{ dist.name_kh }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ឃុំ/សង្កាត់កំណើត</label
                  >
                  <select
                    v-model="formData.StudentBirthcommune"
                    @change="loadBirthVillages"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសឃុំ/សង្កាត់"
                  >
                    <option disabled value="">ជ្រើសរើសឃុំ/សង្កាត់</option>
                    <option
                      v-for="com in birthCommunes"
                      :key="com.id"
                      :value="com.id"
                    >
                      {{ com.name_kh }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ភូមិកំណើត</label
                  >
                  <select
                    v-model="formData.StudentBirthvillage"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសភូមិ"
                  >
                    <option disabled value="">ជ្រើសរើសភូមិ</option>
                    <option
                      v-for="vil in birthVillages"
                      :key="vil.id"
                      :value="vil.id"
                    >
                      {{ vil.name_kh }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ខេត្តបច្ចុប្បន្ន</label
                  >
                  <select
                    v-model="formData.Studentcurrentprovince"
                    @change="loadCurrentDistricts"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសខេត្ត"
                  >
                    <option disabled value="">ជ្រើសរើសខេត្ត</option>
                    <option
                      v-for="prov in provinces"
                      :key="prov.id"
                      :value="prov.id"
                    >
                      {{ prov.name_kh }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ស្រុក/ខណ្ឌបច្ចុប្បន្ន</label
                  >
                  <select
                    v-model="formData.StudentCurrentdistrict"
                    @change="loadCurrentCommunes"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសស្រុក/ខណ្ឌ"
                  >
                    <option disabled value="">ជ្រើសរើសស្រុក/ខណ្ឌ</option>
                    <option
                      v-for="dist in currentDistricts"
                      :key="dist.id"
                      :value="dist.id"
                    >
                      {{ dist.name_kh }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ឃុំ/សង្កាត់បច្ចុប្បន្ន</label
                  >
                  <select
                    v-model="formData.StudentCurrentcommune"
                    @change="loadCurrentVillages"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសឃុំ/សង្កាត់"
                  >
                    <option disabled value="">ជ្រើសរើសឃុំ/សង្កាត់</option>
                    <option
                      v-for="com in currentCommunes"
                      :key="com.id"
                      :value="com.id"
                    >
                      {{ com.name_kh }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ភូមិបច្ចុប្បន្ន</label
                  >
                  <select
                    v-model="formData.StudentCurrentvillage"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសភូមិ"
                  >
                    <option disabled value="">ជ្រើសរើសភូមិ</option>
                    <option
                      v-for="vil in currentVillages"
                      :key="vil.id"
                      :value="vil.id"
                    >
                      {{ vil.name_kh }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Parents & School Information -->
            <div
              class="grid grid-cols-1 gap-8 pt-8 border-t-2 border-indigo-100 md:grid-cols-2"
            >
              <div
                class="p-6 space-y-6 bg-white border-2 border-indigo-100 shadow-lg rounded-xl"
              >
                <h3
                  class="flex items-center gap-2 pb-3 mb-4 text-lg font-bold text-indigo-700 border-b-2 border-indigo-100 moul-regular"
                >
                  <span class="text-2xl">👨‍👩‍👧‍👦</span>
                  ព័ត៌មានគ្រួសារ
                </h3>
                <div class="relative">
                  <input
                    v-model="formData.StudentFathername"
                    type="text"
                    class="w-full px-4 py-3 placeholder-transparent transition-all duration-200 border-2 border-gray-200 rounded-xl peer focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ឈ្មោះឪពុក"
                  />
                  <label
                    class="absolute left-3 top-1.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-sm bg-white px-1 pointer-events-none font-semibold"
                    >ឈ្មោះឪពុក</label
                  >
                </div>
                <div class="relative">
                  <input
                    v-model="formData.StudentFathernumber"
                    type="text"
                    class="w-full px-4 py-3 placeholder-transparent transition-all duration-200 border-2 border-gray-200 rounded-xl peer focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="លេខទូរស័ព្ទឪពុក"
                  />
                  <label
                    class="absolute left-3 top-1.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-sm bg-white px-1 pointer-events-none font-semibold"
                    >លេខទូរស័ព្ទឪពុក</label
                  >
                </div>
                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >មុខរបរឪពុក</label
                  >
                  <select
                    v-model="formData.StudentFatherjob"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសមុខរបរ"
                  >
                    <option disabled value="">ជ្រើសរើសមុខរបរ</option>
                    <option v-for="job in jobs" :key="job" :value="job">
                      {{ job }}
                    </option>
                  </select>
                </div>
                <div class="relative">
                  <input
                    v-model="formData.StudentMothername"
                    type="text"
                    class="w-full px-4 py-3 placeholder-transparent transition-all duration-200 border-2 border-gray-200 rounded-xl peer focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ឈ្មោះម្តាយ"
                  />
                  <label
                    class="absolute left-3 top-1.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-sm bg-white px-1 pointer-events-none font-semibold"
                    >ឈ្មោះម្តាយ</label
                  >
                </div>
                <div class="relative">
                  <input
                    v-model="formData.StudentMothernumber"
                    type="text"
                    class="w-full px-4 py-3 placeholder-transparent transition-all duration-200 border-2 border-gray-200 rounded-xl peer focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="លេខទូរស័ព្ទម្តាយ"
                  />
                  <label
                    class="absolute left-3 top-1.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-sm bg-white px-1 pointer-events-none font-semibold"
                    >លេខទូរស័ព្ទម្តាយ</label
                  >
                </div>
                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >មុខរបរម្តាយ</label
                  >
                  <select
                    v-model="formData.StudentMotherJob"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ជ្រើសរើសមុខរបរ"
                  >
                    <option disabled value="">ជ្រើសរើសមុខរបរ</option>
                    <option v-for="job in jobs" :key="job" :value="job">
                      {{ job }}
                    </option>
                  </select>
                </div>
              </div>
              <div
                class="justify-between p-6 space-y-6 bg-white border-2 border-indigo-100 shadow-lg rounded-xl"
              >
                <h3
                  class="flex items-center gap-2 pb-3 mb-4 text-lg font-bold text-indigo-700 border-b-2 border-indigo-100"
                >
                  <span class="text-2xl">🏫</span>
                  រូបថតសិស្ស
                </h3>
                <div>
                  <div>
                    <div
                      v-if="formData.StudentPicture"
                      class="flex items-center justify-center w-full mb-3 overflow-hidden border-2 border-indigo-200 shadow-md h-68 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl"
                    >
                      <img
                        :src="imageSrc"
                        alt="Student"
                        class="object-cover w-full h-full"
                      />
                    </div>

                    <div
                      v-else
                      class="flex items-center justify-center w-full h-48 mb-3 text-4xl text-gray-400 border-2 border-gray-300 border-dashed bg-linear-to-br from-gray-50 to-gray-100 rounded-xl"
                    >
                      👤
                    </div>

                    <input
                      ref="imageInput"
                      type="file"
                      accept="image/*"
                      @change="handleImageUpload"
                      class="hidden"
                      :disabled="false"
                    />

                    <button
                      type="button"
                      @click="$refs.imageInput.click()"
                      class="w-full px-4 py-2.5 mb-3 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                      :disabled="false"
                    >
                      <span class="text-lg">📤</span>
                      បង្ហោះរូបថត
                    </button>

                    <div class="flex items-center gap-2 mb-1">
                      <button
                        v-if="!userAuth"
                        @click.prevent="authorizeUser"
                        type="button"
                        class="px-3 py-2 text-sm text-white bg-linear-to-r from-yellow-500 to-yellow-600 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1"
                      >
                        <span>🔐</span>
                        ផ្តល់សិទ្ធិ Drive
                      </button>
                      <div
                        v-else
                        class="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-white rounded-lg shadow-md bg-linear-to-r from-green-500 to-emerald-600"
                      >
                        <span>✅</span>
                        Drive ត្រូវបានភ្ជាប់
                      </div>
                    </div>

                    <p
                      v-if="uploadProgress > 0"
                      class="inline-block px-2 py-1 mt-2 text-xs font-semibold text-indigo-600 rounded-lg bg-indigo-50"
                    >
                      កំពុងបង្ហោះ: {{ uploadProgress }}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div
              class="flex flex-col justify-end gap-4 pt-8 mt-8 border-t-2 border-indigo-100 md:flex-row"
            >
              <button
                type="button"
                @click="closeDetailModal"
                class="w-full px-8 py-3.5 font-semibold text-gray-700 bg-gray-200 rounded-xl md:w-auto hover:bg-gray-300 transition-all duration-200"
              >
                បោះបង់
              </button>
              <button
                type="submit"
                class="w-full md:w-auto px-8 py-3.5 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {{ isEditMode ? "រក្សាទុកការផ្លាស់ប្តូរ" : "បន្ថែមសិស្ស" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div> <!-- End of container -->
</template>

<script setup>
import { ref, onMounted, computed, defineEmits, watch, nextTick } from "vue";
import { useAppStore } from "../stores/appStore";
import { API_BASE_URL, fetchWithAuth, getAuthHeaders } from "../utils/helpers";

const showPrintModal = ref(false);
const printStudent = ref({});
const appStore = useAppStore();

function openPrintModal(student) {
  printStudent.value = { ...student };
  showPrintModal.value = true;
}

function closePrintModal() {
  showPrintModal.value = false;
}


const getKhmerMonth = (month) => {
  const months = [
    "មករា",
    "កុម្ភៈ",
    "មីនា",
    "មេសា",
    "ឧសភា",
    "មិថុនា",
    "កក្កដា",
    "សីហា",
    "កញ្ញា",
    "តុលា",
    "វិច្ឆិកា",
    "ធ្នូ",
  ];
  return months[month - 1] || month;
};

const printStudentPDF = () => {
  printCurrentStudent();
};

async function printCurrentStudent() {
  await nextTick();
  if (!document.getElementById("print-section")) {
    return alert("រកមិនឃើញផ្នែកបោះពុម្ពទេ!");
  }
  window.print();
}

const emit = defineEmits(["logout"]);

const username = ref("");
const role = ref("");
const students = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(50);
const total = ref(0);
const searchText = ref("");
const showDetailModal = ref(false);
const isEditMode = ref(false);
const isNewStudent = ref(false);
const uploadProgress = ref(0);
const uploadTasks = ref([]);
const userAuth = ref(false);

const classes = ref([]);
const jobs = ref([]);
const schools = ref([]);
const provinces = ref([]);

const birthDistricts = ref([]);
const birthCommunes = ref([]);
const birthVillages = ref([]);
const currentDistricts = ref([]);
const currentCommunes = ref([]);
const currentVillages = ref([]);

const formData = ref({
  StudentID: "",
  StudentFirstname: "",
  StudentLastname: "",
  StudentSex: "",
  ClassID: "",
  StudentBirthdate: "",
  StudentAge: "",
  StudentBirthvillage: "",
  StudentBirthcommune: "",
  StudentBirthdistrict: "",
  StudentBirthProvince: "",
  StudentCurrentvillage: "",
  StudentCurrentcommune: "",
  StudentCurrentdistrict: "",
  Studentcurrentprovince: "",
  StudentFathername: "",
  StudentMothername: "",
  StudentFathernumber: "",
  StudentMothernumber: "",
  StudentFatherjob: "",
  StudentMotherJob: "",
  Enrolldate: "",
  Fromschool: "",
  StudentPicture: "",
});

const imageInput = ref(null);

const computeAge = (birthdate) => {
  if (!birthdate) return null;
  
  // Parse the date string manually to handle YYYY-MM-DD format correctly
  let d;
  if (typeof birthdate === 'string') {
    const parts = birthdate.split('-');
    if (parts.length === 3) {
      // Create date in local timezone from YYYY-MM-DD string
      d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      d = new Date(birthdate);
    }
  } else {
    d = new Date(birthdate);
  }
  
  if (isNaN(d.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  
  return age >= 0 ? age : null;
};

watch(
  () => formData.value.StudentBirthdate,
  (newVal) => {
    try {
      console.debug('[StudentForm] StudentBirthdate changed ->', newVal);
      if (newVal) {
        const a = computeAge(newVal);
        console.debug('[StudentForm] computed age ->', a);
        if (a !== null) {
          // Ensure the bound age is a number (v-model.number uses numeric binding)
          formData.value.StudentAge = Number(a);
          console.debug('[StudentForm] assigned StudentAge ->', formData.value.StudentAge, typeof formData.value.StudentAge);
        }
      }
    } catch (e) {
      console.error("Error computing age:", e);
    }
  },
);

const imageSrc = computed(() => {
  const raw = formData.value.StudentPicture || "";
  if (!raw) return "";

  try {
    if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(raw)) return raw;

    const driveFileMatch = raw.match(
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    );
    if (driveFileMatch)
      return `${API_BASE_URL}/upload/preview?url=${encodeURIComponent(raw)}`;

    const plainIdMatch = String(raw).match(/^[a-zA-Z0-9_-]{10,}$/);
    if (plainIdMatch) {
      const driveUrl = `https://drive.google.com/uc?id=${plainIdMatch[0]}`;
      return `${API_BASE_URL}/upload/preview?url=${encodeURIComponent(driveUrl)}`;
    }

    const openMatch = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openMatch)
      return `${API_BASE_URL}/upload/preview?url=${encodeURIComponent(raw)}`;

    if (
      raw.includes("webContentLink") ||
      raw.includes("webViewLink") ||
      raw.includes("uc?id=")
    )
      return `${API_BASE_URL}/upload/preview?url=${encodeURIComponent(raw)}`;

    return raw;
  } catch (e) {
    return raw;
  }
});

const notifications = ref([]);
const notify = (message, type = "info", timeout = 4000) => {
  const id = Date.now() + Math.random();
  notifications.value.push({ id, message, type });
  setTimeout(() => {
    const idx = notifications.value.findIndex((n) => n.id === id);
    if (idx !== -1) notifications.value.splice(idx, 1);
  }, timeout);
};

const imagePreview = (raw) => {
  if (!raw) return "";
  try {
    if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(raw)) return raw;
    const driveFileMatch = raw.match(
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    );
    if (driveFileMatch)
      return `${API_BASE_URL}/upload/preview?url=${encodeURIComponent(raw)}`;
    const openMatch = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openMatch)
      return `${API_BASE_URL}/upload/preview?url=${encodeURIComponent(raw)}`;
    if (
      raw.includes("webContentLink") ||
      raw.includes("webViewLink") ||
      raw.includes("uc?id=")
    )
      return `${API_BASE_URL}/upload/preview?url=${encodeURIComponent(raw)}`;

    const plainIdMatch2 = String(raw).match(/^[a-zA-Z0-9_-]{10,}$/);
    if (plainIdMatch2) {
      const driveUrl = `https://drive.google.com/uc?id=${plainIdMatch2[0]}`;
      return `${API_BASE_URL}/upload/preview?url=${encodeURIComponent(driveUrl)}`;
    }
    return raw;
  } catch (e) {
    return raw;
  }
};

const closeNotification = (id) => {
  const idx = notifications.value.findIndex((n) => n.id === id);
  if (idx !== -1) notifications.value.splice(idx, 1);
};

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    username.value = user.username;
    role.value = user.role;
  }

  await loadMasterData();
  await loadStudents();
  checkAuthStatus();
});

const loadMasterData = async () => {
  try {
    const [classRes, jobRes, schoolRes, provRes] = await Promise.all([
      fetchWithAuth('/master/classes'),
      fetchWithAuth('/master/jobs'),
      fetchWithAuth('/master/schools'),
      fetchWithAuth('/address/provinces'),
    ]);

    const classData = await classRes.json();
    const jobData = await jobRes.json();
    const schoolData = await schoolRes.json();
    const provData = await provRes.json();

    classes.value = (classData.data || []).map((c) => ({
      classid: c.classid ?? c.ClassID ?? c.id ?? c.ClassId ?? c.ClassId,
      classname: c.classname ?? c.ClassName ?? c.name ?? c.ClassNameKh ?? "",
      classletter: c.classletter ?? c.ClassLetter ?? c.letter ?? "",
    }));

    jobs.value = classRes.ok ? jobData.data || [] : jobData || [];
    schools.value = schoolRes.ok ? schoolData.data || [] : schoolData || [];

    provinces.value = (provData.data || []).map((p) => ({
      id: String(
        p.id ??
          p.ID ??
          p.province_id ??
          p.ProvinceId ??
          p.provinceId ??
          p.value ??
          p.prov_id ??
          "",
      ),
      name_kh: p.name_kh ?? p.name ?? p.Name ?? p.nameKh ?? p.name_kh ?? "",
    }));
  } catch (error) {
    console.error("Error loading master data:", error);
  }
};

const loadStudents = async () => {
  try {
    loading.value = true;
    const res = await fetchWithAuth(
      `/students?page=${currentPage.value}&limit=${pageSize.value}&search=${searchText.value}`
    );
    const data = await res.json();

    students.value = data.data;
    total.value = data.total;
    loading.value = false;
  } catch (error) {
    console.error("Error loading students:", error);
    loading.value = false;
  }
};

watch(
  () => appStore.refreshTokens.students,
  () => {
    loadStudents();
  },
);

watch(
  () => appStore.refreshTokens.classes,
  () => {
    loadMasterData();
  },
);

const checkAuthStatus = async () => {
  try {
    const res = await fetchWithAuth('/upload/auth/status');
    const data = await res.json();
    userAuth.value = !!(data && data.authorized);
  } catch (e) {
    userAuth.value = false;
  }
};

const authorizeUser = async () => {
  try {
    console.log('Starting authorization process...');
    
    // First, check if server is properly configured
    const debugRes = await fetchWithAuth('/upload/auth/debug');
    const debugData = await debugRes.json();
    
    if (!debugData || !debugData.success) {
      notify("កំហុសកំណត់រចនាសម្ព័ន្ធម៉ាស៊ីនមេ", "error");
      return;
    }
    
    console.log('Debug info:', debugData.debug);
    
    if (!debugData.debug.authUrlAvailable) {
      notify("ម៉ាស៊ីនមេមិនត្រូវបានកំណត់រចនាសម្ព័ន្ធសម្រាប់ Google OAuth ទេ។ សូមពិនិត្យមើលអថេរបរិស្ថាន។", "error", 10000);
      return;
    }
    
    // Get the authorization URL
    const res = await fetchWithAuth('/upload/auth/url');
    const data = await res.json();
    
    if (!data || !data.success || !data.url) {
      console.error('Failed to get auth URL:', data);
      notify("មិនអាចទទួលបាន URL ការអនុញ្ញាត: " + (data?.message || 'កំហុសមិនស្គាល់'), "error");
      return;
    }
    
    console.log('Authorization URL received, opening popup...');
    
    // Open popup
    const popupWidth = 600;
    const popupHeight = 700;
    const left = (window.screen.width - popupWidth) / 2;
    const top = (window.screen.height - popupHeight) / 2;
    
    const popup = window.open(
      data.url,
      "Google OAuth",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );
    
    if (!popup) {
      // Fallback: open in new tab
      if (confirm("Pop-up ត្រូវបានបិទ! ចុចយល់ព្រមដើម្បីបើកទំព័រការអនុញ្ញាតនៅក្នុងផ្ទាំងថ្មី។")) {
        window.open(data.url, "_blank");
        notify("បានបើកនៅក្នុងផ្ទាំងថ្មី។ សូមត្រឡប់មកទីនេះវិញបន្ទាប់ពីការអនុញ្ញាត។", "info");
      }
      return;
    }
    
    notify("ទំព័រការអនុញ្ញាតបានបើក។ សូមចូល និងផ្តល់សិទ្ធិ។", "info", 6000);
    
    // Poll for completion
    const pollForCompletion = async () => {
      try {
        const statusRes = await fetchWithAuth('/upload/auth/status');
        const statusData = await statusRes.json();
        
        if (statusData && statusData.authorized) {
          userAuth.value = true;
          notify("✅ Google Drive ត្រូវបានអនុញ្ញាតដោយជោគជ័យ!", "success");
          if (popup && !popup.closed) {
            popup.close();
          }
          return true;
        }
      } catch (e) {
        console.error('Status check error:', e);
      }
      return false;
    };
    
    // Check periodically
    const pollInterval = setInterval(async () => {
      if (popup.closed) {
        clearInterval(pollInterval);
        // Final check
        setTimeout(async () => {
          if (await pollForCompletion()) return;
          notify("ការអនុញ្ញាតត្រូវបានបិទមុនពេលបញ្ចប់។", "warning");
        }, 1000);
        return;
      }
      
      if (await pollForCompletion()) {
        clearInterval(pollInterval);
        if (popup && !popup.closed) {
          popup.close();
        }
      }
    }, 2000);
    
    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (popup && !popup.closed) {
        popup.close();
      }
      if (!userAuth.value) {
        notify("ការអនុញ្ញាតបានអស់ពេល។ សូម​ព្យាយាម​ម្តង​ទៀត។", "error");
      }
    }, 300000);
    
  } catch (err) {
    console.error("authorizeUser error", err);
    notify("កំហុស: " + (err.message || "កំហុសមិនស្គាល់បានកើតឡើង"), "error");
  }
};

const startUserUpload = (file, taskId, objectUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append("image", file);
      fd.append("studentId", formData.value.StudentID);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const p = Math.round((e.loaded / e.total) * 100);
          uploadProgress.value = p;
          const idx = uploadTasks.value.findIndex((t) => t.id === taskId);
          if (idx !== -1) uploadTasks.value[idx].progress = p;
        }
      });

      xhr.addEventListener("load", () => {
        try {
          const text = xhr.responseText || "";
          if (xhr.status >= 200 && xhr.status < 300) {
            let res = {};
            try {
              res = JSON.parse(text);
            } catch (e) {
              res = { success: true, imageUrl: text };
            }
            if (res && res.success) {
              formData.value.StudentPicture = res.imageUrl;
              notify("រូបភាពត្រូវបានបង្ហោះទៅគណនី Drive របស់អ្នកប្រើប្រាស់", "success");
              resolve(res);
            } else {
              notify(
                res && (res.message || res.error)
                  ? res.message || res.error
                  : "ការបង្ហោះរបស់អ្នកប្រើប្រាស់បានបរាជ័យ",
                "error",
              );
              reject(res);
            }
          } else {
            const parsed = (() => {
              try {
                return JSON.parse(text);
              } catch {
                return null;
              }
            })();
            const msg =
              parsed && (parsed.message || parsed.error)
                ? parsed.message || parsed.error
                : `ការបង្ហោះរបស់អ្នកប្រើប្រាស់បានបរាជ័យ (ស្ថានភាព ${xhr.status})`;
            notify(msg, "error", 8000);
            reject(new Error(msg));
          }
        } catch (err) {
          console.error("User upload invalid response", err);
          notify("ការបង្ហោះរបស់អ្នកប្រើប្រាស់បានបរាជ័យ (ការឆ្លើយតបមិនត្រឹមត្រូវ)", "error");
          reject(err);
        } finally {
          const i = uploadTasks.value.findIndex((t) => t.id === taskId);
          if (i !== -1) uploadTasks.value.splice(i, 1);
          uploadProgress.value = 0;
          try {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
          } catch (e) {}
        }
      });
      
      xhr.addEventListener("error", () => {
        console.error("User upload error", xhr.statusText);
        notify("កំហុសក្នុងការបង្ហោះរូបភាព (គណនីអ្នកប្រើប្រាស់)", "error");
        const i = uploadTasks.value.findIndex((t) => t.id === taskId);
        if (i !== -1) uploadTasks.value.splice(i, 1);
        uploadProgress.value = 0;
        reject(new Error("user upload error"));
      });

      const endpoint = `${API_BASE_URL}/upload/user`;
      xhr.open("POST", endpoint);
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(fd);
    } catch (err) {
      console.error("startUserUpload error", err);
      notify("កំហុសក្នុងការចាប់ផ្តើមការបង្ហោះរបស់អ្នកប្រើប្រាស់", "error");
      const i = uploadTasks.value.findIndex((t) => t.id === taskId);
      if (i !== -1) uploadTasks.value.splice(i, 1);
      reject(err);
    }
  });
};

const performSearch = () => {
  currentPage.value = 1;
  loadStudents();
};

const clearSearch = () => {
  searchText.value = "";
  currentPage.value = 1;
  loadStudents();
};

const getNextAvailableStudentId = async () => {
  try {
    const res = await fetchWithAuth('/students-id/next');
    const data = await res.json();
    if (data && data.success && data.nextId) return Number(data.nextId);
    return 1;
  } catch (err) {
    console.error("Error fetching next StudentID:", err);
    return 1;
  }
};

const addNewStudent = async () => {
  isNewStudent.value = true;
  isEditMode.value = false;
  formData.value = {
    StudentID: "",
    StudentFirstname: "",
    StudentLastname: "",
    StudentSex: "",
    ClassID: "",
    StudentBirthdate: "",
    StudentAge: "",
    StudentBirthvillage: "",
    StudentBirthcommune: "",
    StudentBirthdistrict: "",
    StudentBirthProvince: "",
    StudentCurrentvillage: "",
    StudentCurrentcommune: "",
    StudentCurrentdistrict: "",
    Studentcurrentprovince: "",
    StudentFathername: "",
    StudentMothername: "",
    StudentFathernumber: "",
    StudentMothernumber: "",
    StudentFatherjob: "",
    StudentMotherJob: "",
    Enrolldate: "",
    Fromschool: "",
    StudentPicture: "",
  };
  try {
    const nextId = await getNextAvailableStudentId();
    formData.value.StudentID = String(nextId);
  } catch (err) {
    console.error("Error computing next StudentID:", err);
  }

  showDetailModal.value = true;
};

const selectStudent = (student) => {
  editStudent(student);
};

const editStudent = async (student) => {
  isEditMode.value = true;
  isNewStudent.value = false;

  try {
    const res = await fetchWithAuth(`/students/${student.StudentID}`);
    const data = await res.json();
    const normalizeStudent = (s) => {
      if (!s) return {};
      const getId = (v) => {
        if (v === null || v === undefined) return "";
        if (typeof v === "object")
          return String(
            v.id ??
              v.ID ??
              v.Id ??
              v.value ??
              v.province_id ??
              v.district_id ??
              v.commune_id ??
              v.village_id ??
              "",
          );
        return String(v);
      };

      const formatDate = (v) => {
        if (!v) return "";
        const d = new Date(v);
        if (isNaN(d)) return "";
        return d.toISOString().split("T")[0];
      };

      const normalizeSex = (val) => {
        if (!val && val !== 0) return "";
        const s = String(val).trim();
        if (!s) return "";
        const ch = s[0].toLowerCase();
        if (ch === "m") return "m";
        if (ch === "f") return "f";
        if (ch === "o") return "o";
        return "";
      };

      return {
        StudentID: s.StudentID ?? s.studentId ?? s.id ?? "",
        StudentFirstname:
          s.StudentFirstname ??
          s.StudentFirstName ??
          s.firstName ??
          s.StudentFirstname ??
          "",
        StudentLastname:
          s.StudentLastname ??
          s.StudentLastName ??
          s.lastName ??
          s.StudentLastname ??
          "",
        StudentSex: normalizeSex(
          s.StudentSex ?? s.sex ?? s.StudentGender ?? "",
        ),
        ClassID: s.ClassID ?? s.classid ?? s.classId ?? s.ClassId ?? "",
        StudentBirthdate: formatDate(
          s.StudentBirthdate ?? s.birthdate ?? s.StudentBirthdate ?? "",
        ),
        StudentAge: s.StudentAge ?? s.age ?? "",

        StudentBirthProvince: getId(
          s.StudentBirthProvince ??
            s.StudentBirthProvince ??
           
            s.birth_province ??
            s.BirthProvince ??
            s.birthProvince ??


            s.provinceId ??
            "",
        ),
        StudentBirthdistrict: getId(
          s.StudentBirthdistrict ??
           
            s.StudentBirthDistrict ??
            s.birth_district ??
            s.BirthDistrict ??
            s.birthDistrict ??
            s.districtId ??
            "",
        ),
        StudentBirthcommune: getId(
          s.StudentBirthcommune ??
            s.StudentBirthCommune ??
            s.birth_commune ??
            s.BirthCommune ??
            s.birthCommune ??
            s.communeId ??
            "",
        ),
        StudentBirthvillage: getId(
          s.StudentBirthvillage ??
            s.StudentBirthVillage ??
            s.birth_village ??
            s.BirthVillage ??
            s.birthVillage ??
            s.villageId ??
            "",
        ),

        Studentcurrentprovince: getId(
          s.Studentcurrentprovince ??
            s.StudentCurrentProvince ??
            s.StudentCurrentprovince ??
            s.current_province ??
            s.CurrentProvince ??
            s.currentProvince ??
            s.currentProvinceId ??
            "",
        ),
        StudentCurrentdistrict: getId(
          s.StudentCurrentdistrict ??
            s.StudentCurrentDistrict ??
            s.current_district ??
            s.CurrentDistrict ??
            s.currentDistrict ??
            s.currentDistrictId ??
            "",
        ),
        StudentCurrentcommune: getId(
          s.StudentCurrentcommune ??
            s.StudentCurrentCommune ??
            s.current_commune ??
            s.CurrentCommune ??
            s.currentCommune ??
            s.currentCommuneId ??
            "",
        ),
        StudentCurrentvillage: getId(
          s.StudentCurrentvillage ??
            s.StudentCurrentVillage ??
            s.current_village ??
            s.CurrentVillage ??
            s.currentVillage ??
            s.currentVillageId ??
            "",
        ),

        StudentFathername:
          s.StudentFathername ?? s.fatherName ?? s.FatherName ?? "",
        StudentMothername:
          s.StudentMothername ?? s.motherName ?? s.MotherName ?? "",
        StudentFathernumber:
          s.StudentFathernumber ?? s.fatherPhone ?? s.FatherPhone ?? "",
        StudentMothernumber:
          s.StudentMothernumber ?? s.motherPhone ?? s.MotherPhone ?? "",
        StudentFatherjob: s.StudentFatherjob ?? s.fatherJob ?? "",
        StudentMotherJob: s.StudentMotherJob ?? s.motherJob ?? "",
        Enrolldate: formatDate(
          s.Enrolldate ?? s.enrolldate ?? s.enrollDate ?? "",
        ),
        Fromschool: s.Fromschool ?? s.fromschool ?? s.FromSchool ?? "",
        StudentPicture:
          s.StudentPicture ??
          s.StudentPictureUrl ??
          s.pictureUrl ??
          s.StudentPicture ??
          "",
      };
    };

    formData.value = normalizeStudent(data.data);
    showDetailModal.value = true;

    const resolveInList = (val, list) => {
      if (!val) return "";
      const s = String(val).trim();
      if (!list || !list.length) return s;
      const byId = list.find((x) => String(x.id) === s);
      if (byId) return String(byId.id);
      const byName = list.find(
        (x) =>
          (x.name_kh && x.name_kh === s) ||
          (x.name_en && x.name_en === s) ||
          (x.name && x.name === s) ||
          (x.code && x.code === s),
      );
      if (byName) return String(byName.id);
      return s;
    };

    if (formData.value.StudentBirthProvince) {
      formData.value.StudentBirthProvince = resolveInList(
        formData.value.StudentBirthProvince,
        provinces.value,
      );
      await loadBirthDistricts();
      if (formData.value.StudentBirthdistrict) {
        formData.value.StudentBirthdistrict = resolveInList(
          formData.value.StudentBirthdistrict,
          birthDistricts.value,
        );
        await loadBirthCommunes();
        if (formData.value.StudentBirthcommune) {
          formData.value.StudentBirthcommune = resolveInList(
            formData.value.StudentBirthcommune,
            birthCommunes.value,
          );
          await loadBirthVillages();
          if (formData.value.StudentBirthvillage) {
            formData.value.StudentBirthvillage = resolveInList(
              formData.value.StudentBirthvillage,
              birthVillages.value,
            );
          }
        }
      }
    }

    if (formData.value.Studentcurrentprovince) {
      formData.value.Studentcurrentprovince = resolveInList(
        formData.value.Studentcurrentprovince,
        provinces.value,
      );
      await loadCurrentDistricts();
      if (formData.value.StudentCurrentdistrict) {
        formData.value.StudentCurrentdistrict = resolveInList(
          formData.value.StudentCurrentdistrict,
          currentDistricts.value,
        );
        await loadCurrentCommunes();
        if (formData.value.StudentCurrentcommune) {
          formData.value.StudentCurrentcommune = resolveInList(
            formData.value.StudentCurrentcommune,
            currentCommunes.value,
          );
          await loadCurrentVillages();
          if (formData.value.StudentCurrentvillage) {
            formData.value.StudentCurrentvillage = resolveInList(
              formData.value.StudentCurrentvillage,
              currentVillages.value,
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error loading student:", error);
  }
};

const deleteStudent = async (studentId) => {
  if (confirm("តើអ្នកពិតជាចង់លុបសិស្សនេះមែនទេ?")) {
    try {
      const res = await fetchWithAuth(`/students/${studentId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        notify("សិស្សត្រូវបានលុបដោយជោគជ័យ", "success");
        await loadStudents();
      }
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  }
};

const saveStudent = async () => {
  try {
    const method = isNewStudent.value ? "POST" : "PUT";
    const url = isNewStudent.value
      ? '/students'
      : `/students/${formData.value.StudentID}`;

    const payload = { ...formData.value };

    if (
      !payload.StudentID ||
      (!payload.StudentFirstname && !payload.StudentLastname)
    ) {
      notify(
        "លេខសំគាល់សិស្ស និងឈ្មោះ (ត្រកូល ឬនាម) ត្រូវតែបំពេញ",
        "error",
      );
      return;
    }

    const sanitizeDate = (v) => {
      if (v === null || v === undefined) return null;
      if (typeof v === "string") {
        const trimmed = v.trim();
        if (!trimmed || trimmed === "?") return null;
        const maybeDate = new Date(trimmed);
        if (!isNaN(maybeDate)) return maybeDate.toISOString().split("T")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        return null;
      }
      if (v instanceof Date && !isNaN(v)) return v.toISOString().split("T")[0];
      return null;
    };

    payload.StudentBirthdate = sanitizeDate(payload.StudentBirthdate);
    if (
      (payload.StudentAge === "" ||
        payload.StudentAge === null ||
        payload.StudentAge === undefined) &&
      payload.StudentBirthdate
    ) {
      const computed = computeAge(payload.StudentBirthdate);
      payload.StudentAge = computed === null ? null : computed;
    }
    payload.Enrolldate = sanitizeDate(payload.Enrolldate);

    if (
      payload.ClassID === "" ||
      payload.ClassID === null ||
      payload.ClassID === undefined
    ) {
      payload.ClassID = null;
    } else {
      const n = Number(payload.ClassID);
      payload.ClassID = isNaN(n) ? null : n;
    }

    const res = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success) {
      notify(
        `សិស្សត្រូវបាន${isNewStudent.value ? "បង្កើត" : "ធ្វើបច្ចុប្បន្នភាព"}ដោយជោគជ័យ`,
        "success",
      );
      closeDetailModal();
      await loadStudents();
    } else {
      notify(data.message || "កំហុស", "error");
    }
  } catch (error) {
    console.error("Error saving student:", error);
    notify("កំហុសក្នុងការរក្សាទុកសិស្ស", "error");
  }
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  let objectUrl;
  try {
    objectUrl = URL.createObjectURL(file);
    formData.value.StudentPicture = objectUrl;
  } catch (err) {
    console.error("Could not create preview URL", err);
  }

  const taskId = Date.now() + Math.random();
  uploadTasks.value.push({
    id: taskId,
    name: file.name,
    progress: 0,
    retried: false,
  });

  startBackgroundUpload(file, taskId, objectUrl).catch(() => {});
};

const startBackgroundUpload = (file, taskId, objectUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append("image", file);
      fd.append("studentId", formData.value.StudentID);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const p = Math.round((e.loaded / e.total) * 100);
          uploadProgress.value = p;
          const idx = uploadTasks.value.findIndex((t) => t.id === taskId);
          if (idx !== -1) uploadTasks.value[idx].progress = p;
        }
      });

      xhr.addEventListener("load", () => {
        try {
          const text = xhr.responseText || "";
          if (xhr.status >= 200 && xhr.status < 300) {
            let res = {};
            try {
              res = JSON.parse(text);
            } catch (e) {
              res = { success: true, imageUrl: text };
            }
            if (res && res.success) {
              formData.value.StudentPicture = res.imageUrl;
              if (res.fallback) {
                notify(
                  "រូបភាពត្រូវបានបង្ហោះ ប៉ុន្តែត្រូវបានរក្សាទុកក្នុងមូលដ្ឋានទិន្នន័យដោយសារកំណត់ដែនកំណត់ Drive។ វានឹងនៅតែបង្ហាញ។",
                  "warning",
                  8000,
                );
                const taskIdx = uploadTasks.value.findIndex(
                  (t) => t.id === taskId,
                );
                const taskObj =
                  taskIdx !== -1 ? uploadTasks.value[taskIdx] : null;
                if (userAuth.value && taskObj && !taskObj.retried) {
                  taskObj.retried = true;
                  notify(
                    "កំពុងព្យាយាមបង្ហោះម្តងទៀតដោយប្រើគណនី Drive ដែលបានផ្តល់សិទ្ធិ...",
                    "info",
                    4000,
                  );
                  startUserUpload(file, taskId, objectUrl).catch(() => {});
                }
              } else {
                notify("រូបភាពត្រូវបានបង្ហោះដោយជោគជ័យ", "success");
              }
              resolve(res);
            } else {
              console.error("Upload failed", res);
              notify(
                res && (res.message || res.error)
                  ? res.message || res.error
                  : "បរាជ័យក្នុងការបង្ហោះ",
                "error",
                6000,
              );
              reject(res);
            }
          } else {
            let parsed = null;
            try {
              parsed = JSON.parse(text);
            } catch (e) {
              parsed = null;
            }
            const msg =
              parsed && (parsed.message || parsed.error)
                ? parsed.message || parsed.error
                : `បរាជ័យក្នុងការបង្ហោះ (ស្ថានភាព ${xhr.status})`;
            console.error("Upload HTTP error", xhr.status, text);
            notify(msg, "error", 8000);
            reject(new Error(msg));
          }
        } catch (err) {
          console.error("Invalid upload response", err);
          notify("បរាជ័យក្នុងការបង្ហោះ (ការឆ្លើយតបមិនត្រឹមត្រូវពីម៉ាស៊ីនមេ)", "error");
          reject(err);
        } finally {
          try {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
          } catch (e) {}
          setTimeout(() => {
            const i = uploadTasks.value.findIndex((t) => t.id === taskId);
            if (i !== -1) uploadTasks.value.splice(i, 1);
            uploadProgress.value = 0;
          }, 700);
        }
      });

      xhr.addEventListener("timeout", () => {
        const msg = "ការបង្ហោះបានផុតកំណត់ពេល";
        console.error(msg);
        notify(msg, "error");
        const i = uploadTasks.value.findIndex((t) => t.id === taskId);
        if (i !== -1) uploadTasks.value.splice(i, 1);
        uploadProgress.value = 0;
        reject(new Error(msg));
      });

      xhr.addEventListener("error", () => {
        console.error("Upload error", xhr.statusText);
        notify("កំហុសក្នុងការបង្ហោះរូបភាព", "error");
        try {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        } catch (e) {}
        const i = uploadTasks.value.findIndex((t) => t.id === taskId);
        if (i !== -1) uploadTasks.value.splice(i, 1);
        uploadProgress.value = 0;
        reject(new Error("upload error"));
      });

      const targetEndpoint = userAuth.value
        ? `${API_BASE_URL}/upload/user`
        : `${API_BASE_URL}/upload`;
      xhr.open("POST", targetEndpoint);
      
      const token = localStorage.getItem('token');
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      
      xhr.send(fd);
    } catch (err) {
      console.error("startBackgroundUpload error", err);
      notify("កំហុសក្នុងការចាប់ផ្តើមបង្ហោះ", "error");
      const i = uploadTasks.value.findIndex((t) => t.id === taskId);
      if (i !== -1) uploadTasks.value.splice(i, 1);
      reject(err);
    }
  });
};

const loadBirthDistricts = async () => {
  if (!formData.value.StudentBirthProvince) return;
  try {
    const res = await fetchWithAuth(`/address/districts/${formData.value.StudentBirthProvince}`);
    const data = await res.json();
    birthDistricts.value = (data.data || []).map((d) => ({
      id: String(
        d.id ??
          d.ID ??
          d.district_id ??
          d.DistrictId ??
          d.districtId ??
          d.value ??
          "",
      ),
      name_kh: d.name_kh ?? d.name ?? d.Name ?? d.nameKh ?? "",
    }));
    birthCommunes.value = [];
    birthVillages.value = [];
  } catch (error) {
    console.error("Error loading districts:", error);
  }
};

const loadBirthCommunes = async () => {
  if (!formData.value.StudentBirthdistrict) return;
  try {
    const res = await fetchWithAuth(`/address/communes/${formData.value.StudentBirthdistrict}`);
    const data = await res.json();
    birthCommunes.value = (data.data || []).map((c) => ({
      id: String(
        c.id ??
          c.ID ??
          c.commune_id ??
          c.CommuneId ??
          c.communeId ??
          c.value ??
          "",
      ),
      name_kh: c.name_kh ?? c.name ?? c.Name ?? c.nameKh ?? "",
    }));
    birthVillages.value = [];
  } catch (error) {
    console.error("Error loading communes:", error);
  }
};

const loadBirthVillages = async () => {
  if (!formData.value.StudentBirthcommune) return;
  try {
    const res = await fetchWithAuth(`/address/villages/${formData.value.StudentBirthcommune}`);
    const data = await res.json();
    birthVillages.value = (data.data || []).map((v) => ({
      id: String(
        v.id ??
          v.ID ??
          v.village_id ??
          v.VillageId ??
          v.villageId ??
          v.value ??
          "",
      ),
      name_kh: v.name_kh ?? v.name ?? v.Name ?? v.nameKh ?? "",
    }));
  } catch (error) {
    console.error("Error loading villages:", error);
  }
};

const loadCurrentDistricts = async () => {
  if (!formData.value.Studentcurrentprovince) return;
  try {
    const res = await fetchWithAuth(`/address/districts/${formData.value.Studentcurrentprovince}`);
    const data = await res.json();
    currentDistricts.value = (data.data || []).map((d) => ({
      id: String(
        d.id ??
          d.ID ??
          d.district_id ??
          d.DistrictId ??
          d.districtId ??
          d.value ??
          "",
      ),
      name_kh: d.name_kh ?? d.name ?? d.Name ?? d.nameKh ?? "",
    }));
    currentCommunes.value = [];
    currentVillages.value = [];
  } catch (error) {
    console.error("Error loading districts:", error);
  }
};

const loadCurrentCommunes = async () => {
  if (!formData.value.StudentCurrentdistrict) return;
  try {
    const res = await fetchWithAuth(`/address/communes/${formData.value.StudentCurrentdistrict}`);
    const data = await res.json();
    currentCommunes.value = (data.data || []).map((c) => ({
      id: String(
        c.id ??
          c.ID ??
          c.commune_id ??
          c.CommuneId ??
          c.communeId ??
          c.value ??
          "",
      ),
      name_kh: c.name_kh ?? c.name ?? c.Name ?? c.nameKh ?? "",
    }));
    currentVillages.value = [];
  } catch (error) {
    console.error("Error loading communes:", error);
  }
};

const loadCurrentVillages = async () => {
  if (!formData.value.StudentCurrentcommune) return;
  try {
    const res = await fetchWithAuth(`/address/villages/${formData.value.StudentCurrentcommune}`);
    const data = await res.json();
    currentVillages.value = (data.data || []).map((v) => ({
      id: String(
        v.id ??
          v.ID ??
          v.village_id ??
          v.VillageId ??
          v.villageId ??
          v.value ??
          "",
      ),
      name_kh: v.name_kh ?? v.name ?? v.Name ?? v.nameKh ?? "",
    }));
  } catch (error) {
    console.error("Error loading villages:", error);
  }
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  uploadProgress.value = 0;
};

const getSexDisplay = (sex) => {
  if (!sex) return "";
  const s = String(sex).toUpperCase();
  const sexMap = { M: "ប្រុស", F: "ស្រី", O: "ផ្សេងទៀត" };
  return sexMap[s] || sex;
};


const printStudents = () => {
  window.print();
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadStudents();
  }
};

const nextPage = () => {
  if (currentPage.value < Math.ceil(total.value / pageSize.value)) {
    currentPage.value++;
    loadStudents();
  }
};

const logout = () => {
  localStorage.removeItem("user");
  emit("logout");
};

function convertClassToKhmer(className, classLetter) {
  const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  const khmerLetters = {
    'A': 'ក', 'B': 'ខ', 'C': 'គ', 'D': 'ឃ', 'E': 'ង', 'F': 'ច', 'G': 'ឆ', 'H': 'ជ', 'I': 'ឈ', 'J': 'ញ',
    'K': 'ដ', 'L': 'ឋ', 'M': 'ឌ', 'N': 'ឍ', 'O': 'ណ', 'P': 'ត', 'Q': 'ថ', 'R': 'ទ', 'S': 'ធ', 'T': 'ន',
    'U': 'ប', 'V': 'ផ', 'W': 'ព', 'X': 'ភ', 'Y': 'ម', 'Z': 'យ'
  };
  let khmerClass = '';
  if (className) {
    for (const ch of String(className)) {
      khmerClass += khmerNumbers[parseInt(ch, 10)] || ch;
    }
  }
  if (classLetter && khmerLetters[classLetter.trim().toUpperCase()]) {
    khmerClass += ' ' + khmerLetters[classLetter.trim().toUpperCase()];
  } else if (classLetter) {
    khmerClass += ' ' + classLetter;
  }
  return khmerClass.trim();
}
</script>

<style scoped>
.container {
  max-width: 1200px;
}
.form-group {
  display: flex;
  flex-direction: column;
}
@media print {
  :global(body) {
    background: white !important;
  }
  :global(body *) {
    visibility: hidden;
  }
  :global(#print-section),
  :global(#print-section *) {
    visibility: visible;
  }
  :global(#print-section) {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .no-print {
    display: none !important;
  }
  .print-modal-paper {
    max-width: 100% !important;
    max-height: none !important;
    border: none !important;
    box-shadow: none !important;
  }
  #print-section {
    padding: 0 !important;
    overflow: visible !important;
  }
}
@media (max-width: 640px) {
  
}
</style>
