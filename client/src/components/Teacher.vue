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
            @click="addNewTeacher"
            class="px-6 py-3.5 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span class="text-lg">➕</span>
            គ្រូថ្មី
          </button>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            @click="exportToExcel"
            class="px-5 py-2.5 text-sm bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
          >
            <span class="text-base">📊</span>
            នាំចេញ Excel
          </button>
          <button
            @click="printTeachers"
            class="px-5 py-2.5 text-sm bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
          >
            <span class="text-base">🖨️</span>
            បោះពុម្ព
          </button>
        </div>
      </div>

      <!-- Teachers Table -->
      <div
        class="overflow-hidden bg-white border border-gray-100 shadow-xl rounded-2xl"
      >
        <div v-if="loading" class="p-12 text-center">
          <div
            class="inline-block w-16 h-16 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin"
          ></div>
          <p class="mt-4 font-medium text-gray-600">កំពុងផ្ទុកទិន្នន័យគ្រូ...</p>
        </div>

        <div v-else-if="teachers.length === 0" class="p-12 text-center">
          <div class="mb-4 text-6xl">📭</div>
          <p class="text-lg font-medium text-gray-600">មិនមានទិន្នន័យគ្រូ</p>
        </div>

        <div v-else>
          <div class="block divide-y md:hidden">
            <div v-for="(teacher, idx) in teachers" :key="teacher.TeacherID" class="flex flex-col gap-2 py-4 mb-3 border-b shadow last:border-b-0 bg-white/90 rounded-xl">
              <div class="flex items-center gap-3">
                <div v-if="teacher.TeacherPic" class="w-16 h-16 overflow-hidden border-2 border-indigo-200 shadow-md shrink-0 rounded-xl">
                  <img :src="imagePreview(teacher.TeacherPic)" alt="thumb" class="object-cover w-full h-full" />
                </div>
                <div v-else class="flex items-center justify-center w-16 h-16 text-3xl text-gray-300 border-2 border-gray-200 shrink-0 rounded-xl">👤</div>
                <div class="flex-1">
                  <div class="font-bold text-indigo-700">{{ teacher.TeacherFirstName }} {{ teacher.TeacherLastName }}</div>
                  <div class="text-xs text-gray-500">លេខសំគាល់: {{ teacher.TeacherID }}</div>
                  <div class="text-xs text-gray-500">ភេទ: {{ getSexDisplay(teacher.TeacherSex) }}</div>
                  <div class="text-xs text-gray-500">អាយុ: {{ teacher.TeacherAge }}</div>
                  <div class="text-xs text-gray-500">សញ្ញាប័ត្រ: {{ teacher.Diploma }}</div>
                </div>
              </div>
              <div class="flex gap-2 mt-2">
                <button @click.stop="editTeacher(teacher)" class="flex items-center justify-center flex-1 gap-2 px-3 py-3 text-xs font-semibold text-white transition-all duration-200 rounded-lg shadow-md bg-linear-to-r from-blue-500 to-blue-600 hover:shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2H7a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2z" />
                  </svg>
                  <span>កែប្រែ</span>
                </button>
                <button @click.stop="openPrintModal(teacher)" class="flex items-center justify-center flex-1 gap-2 px-3 py-3 text-xs font-semibold text-white transition-all duration-200 rounded-lg shadow-md bg-linear-to-r from-green-500 to-emerald-600 hover:shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9v12h12V9M6 9V3h12v6M6 9h12" />
                  </svg>
                  <span>បោះពុម្ព</span>
                </button>
                <button @click.stop="deleteTeacher(teacher.TeacherID)" class="flex items-center justify-center flex-1 gap-2 px-3 py-3 text-xs font-semibold text-white transition-all duration-200 rounded-lg shadow-md bg-linear-to-r from-red-500 to-red-600 hover:shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9v12h12V9M6 9V3h12v6M6 9h12" />
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
                  <th class="px-6 py-4 font-bold text-left text-gray-700">ភេទ</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">អាយុ</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">សញ្ញាប័ត្រ</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">មុខវិជ្ជា</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">រូបភាព</th>
                  <th class="px-6 py-4 font-bold text-center text-gray-700">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(teacher, idx) in teachers" :key="teacher.TeacherID" class="transition-all duration-200 border-b border-gray-100 hover:bg-linear-to-r hover:from-indigo-50 hover:to-purple-50">
                  <td class="px-6 py-4 font-semibold text-indigo-600">{{ teacher.TeacherID }}</td>
                  <td class="px-6 py-4 font-medium text-gray-700">{{ teacher.TeacherFirstName }}</td>
                  <td class="px-6 py-4 font-medium text-gray-700">{{ teacher.TeacherLastName }}</td>
                  <td class="px-6 py-4 font-medium text-gray-600">{{ getSexDisplay(teacher.TeacherSex) }}</td>
                  <td class="px-6 py-4 font-medium text-gray-600">{{ teacher.TeacherAge }}</td>
                  <td class="px-6 py-4">
                    <span class="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">{{ teacher.Diploma || 'មិនមាន' }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-col gap-1">
                      <span v-if="teacher.Subject1Name" class="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">{{ teacher.Subject1Name }}</span>
                      <span v-if="teacher.Subject2Name" class="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">{{ teacher.Subject2Name }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div v-if="teacher.TeacherPic" class="mx-auto overflow-hidden border-2 border-indigo-200 shadow-md w-14 h-14 rounded-xl">
                      <img :src="imagePreview(teacher.TeacherPic)" alt="thumb" class="object-cover w-full h-full" />
                    </div>
                    <div v-else class="text-2xl text-gray-300">👤</div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-2">
                      <button @click.stop="editTeacher(teacher)" class="flex items-center w-full gap-2 px-4 py-2 text-xs font-semibold text-white bg-linear-to-r from-blue-500 to-blue-600 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 sm:w-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2H7a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2z" />
                        </svg>
                        <span>កែប្រែ</span>
                      </button>
                      <button @click.stop="openPrintModal(teacher)" class="flex items-center w-full gap-2 px-4 py-2 text-xs font-semibold text-white bg-linear-to-r from-green-500 to-emerald-600 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 sm:w-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9v12h12V9M6 9V3h12v6M6 9h12" />
                        </svg>
                        <span>បោះពុម្ព</span>
                      </button>
                      <button @click.stop="deleteTeacher(teacher.TeacherID)" class="flex items-center w-full gap-2 px-4 py-2 text-xs font-semibold text-white bg-linear-to-r from-red-500 to-red-600 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 sm:w-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 9v12h12V9M6 9V3h12v6M6 9h12" />
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
                  ប្រវត្តិរូបសង្ខេបគ្រូ
                </h2>
                <button
                  @click="closePrintModal"
                  class="absolute flex items-center justify-center w-10 h-10 text-xl font-bold text-gray-600 transition-all rounded-full right-8 hover:bg-gray-200 no-print"
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
                      ប្រវត្តិរូបសង្ខេបគ្រូ
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
                            <td class="p-2 border border-black">{{ printTeacher.TeacherFirstName }} {{ printTeacher.TeacherLastName }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">ភេទ</td>
                            <td class="p-2 border border-black">{{ getSexDisplay(printTeacher.TeacherSex) }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">អាយុ</td>
                            <td class="p-2 border border-black">{{ printTeacher.TeacherAge }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">ថ្ងៃខែឆ្នាំកំណើត</td>
                            <td class="p-2 border border-black">{{ formatDate(printTeacher.TeacherBirthDate) }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">ទីកន្លែងកំណើត</td>
                            <td class="p-2 border border-black">{{ getFullAddress(printTeacher, 'birth') }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">សញ្ញាប័ត្រ</td>
                            <td class="p-2 border border-black">{{ printTeacher.Diploma || 'មិនមាន' }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <div class="mb-3 text-base font-bold text-gray-800">
                        II. ព័ត៌មានបន្ថែម
                      </div>
                      <table class="w-full text-sm border border-black border-collapse">
                        <tbody>
                          <tr>
                            <td class="p-2 font-semibold border border-black">ថ្ងៃចូលធ្វើការ</td>
                            <td class="p-2 border border-black">{{ formatDate(printTeacher.JoinDate) }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">មុខវិជ្ជាសំខាន់</td>
                            <td class="p-2 border border-black">{{ printTeacher.Subject1Name || 'មិនមាន' }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">មុខវិជ្ជាជំនួយ</td>
                            <td class="p-2 border border-black">{{ printTeacher.Subject2Name || 'មិនមាន' }}</td>
                          </tr>
                          <tr>
                            <td class="p-2 font-semibold border border-black">អាសយដ្ឋានបច្ចុប្បន្ន</td>
                            <td class="p-2 border border-black">{{ getFullAddress(printTeacher, 'current') }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div class="flex flex-col items-center min-w-35">
                    <div
                      v-if="printTeacher.TeacherPic"
                      class="w-27.5 h-35 mb-2 border-2 border-indigo-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 shadow-md"
                    >
                      <img
                        :src="imagePreview(printTeacher.TeacherPic)"
                        alt="Teacher Photo"
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
                      លេខសំគាល់: {{ printTeacher.TeacherID }}
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
                    <div class="font-bold">ហត្ថលេខា</div>
                  </div>
                </div>
                </div>
              </div>
              <div
                class="flex items-center justify-end gap-3 p-6 border-t-2 border-gray-200 bg-linear-to-r from-indigo-50 to-purple-50 rounded-b-2xl no-print"
              >
                <div class="mr-auto text-xs font-semibold text-gray-500">CTRL + P</div>
                <button
                  @click="printCurrentTeacher"
                  class="px-6 py-3.5 font-semibold text-white bg-linear-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  បោះពុម្ព
                </button>
                <button
                  @click="closePrintModal"
                  class="px-6 py-3.5 font-semibold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-all duration-200"
                >
                  បិទ
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="teachers.length > 0"
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
              គ្រូ
            </div>
            <div class="flex gap-2">
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="px-4 py-3 bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                ◀ មុន
              </button>
              <span
                class="px-4 py-3 font-bold text-indigo-600 bg-white border-2 border-indigo-200 rounded-xl flex items-center"
                >{{ currentPage }} / {{ Math.ceil(total / pageSize) }}</span
              >
              <button
                @click="nextPage"
                :disabled="currentPage >= Math.ceil(total / pageSize)"
                class="px-4 py-3 bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                បន្ទាប់ ▶
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Teacher Detail Modal -->
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
            @submit.prevent="saveTeacher"
            class="p-6 space-y-8 bg-linear-to-br from-white via-blue-50 to-indigo-50"
          >
            <h2 class="flex items-center gap-3 text-2xl font-bold text-gray-800 moul-regular">
              <span v-if="isEditMode" class="text-3xl">✏️</span>
              <span v-else class="text-3xl">👁️</span>
              {{ isEditMode ? "កែប្រែគ្រូ" : "បន្ថែមគ្រូថ្មី" }}
            </h2>
            
            <!-- Teacher ID -->
            <div
              class="p-6 bg-white border-2 border-indigo-100 shadow-md rounded-xl"
            >
              <label
                class="flex items-center gap-2 mb-3 text-sm font-bold text-gray-700"
                for="teacher-id-field"
              >
                <span class="text-lg">🆔</span>
                លេខសំគាល់គ្រូ
              </label>
              <input
                id="teacher-id-field"
                v-model="formData.TeacherID"
                type="text"
                :disabled="!isNewTeacher"
                class="w-full px-5 py-3 font-semibold text-indigo-600 transition-all duration-200 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:bg-gray-100"
                placeholder="លេខសំគាល់គ្រូ"
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
                    for="teacher-firstname-field"
                    >ត្រកូល</label
                  >
                  <input
                    id="teacher-firstname-field"
                    v-model="formData.TeacherFirstName"
                    type="text"
                    class="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="ត្រកូល"
                    required
                  />
                </div>

                <div>
                  <label
                    class="block mb-2 text-sm font-semibold text-gray-700"
                    for="teacher-lastname-field"
                    >នាម</label
                  >
                  <input
                    id="teacher-lastname-field"
                    v-model="formData.TeacherLastName"
                    type="text"
                    class="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="នាម"
                    required
                  />
                </div>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ភេទ</label
                  >
                  <select
                    v-model="formData.TeacherSex"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    required
                  >
                    <option disabled value="">ជ្រើសរើសភេទ</option>
                    <option value="M">ប្រុស</option>
                    <option value="F">ស្រី</option>
                    <option value="O">ផ្សេងទៀត</option>
                  </select>
                </div>

                <div class="relative">
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ថ្ងៃខែឆ្នាំកំណើត</label
                  >
                  <input
                    v-model="formData.TeacherBirthDate"
                    type="date"
                    class="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>

                <div class="relative">
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >អាយុ</label
                  >
                  <input
                    v-model="formData.TeacherAge"
                    type="number"
                    min="18"
                    max="100"
                    class="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >សញ្ញាប័ត្រ</label
                  >
                  <input
                    v-model="formData.Diploma"
                    type="text"
                    class="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    placeholder="សញ្ញាប័ត្រ"
                  />
                </div>

                <div class="relative">
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >ថ្ងៃចូលធ្វើការ</label
                  >
                  <input
                    v-model="formData.JoinDate"
                    type="date"
                    class="w-full px-4 py-3 transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
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
                    v-model="formData.TeacherBirthProvince"
                    @change="loadBirthDistricts"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  >
                    <option value="">ជ្រើសរើសខេត្ត</option>
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
                    v-model="formData.TeacherBirthDistrict"
                    @change="loadBirthCommunes"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    :disabled="!formData.TeacherBirthProvince"
                  >
                    <option value="">ជ្រើសរើសស្រុក/ខណ្ឌ</option>
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
                    v-model="formData.TeacherBirthCommune"
                    @change="loadBirthVillages"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    :disabled="!formData.TeacherBirthDistrict"
                  >
                    <option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>
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
                    v-model="formData.TeacherBirthVillage"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    :disabled="!formData.TeacherBirthCommune"
                  >
                    <option value="">ជ្រើសរើសភូមិ</option>
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
                    v-model="formData.TeacherCurrentProvince"
                    @change="loadCurrentDistricts"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  >
                    <option value="">ជ្រើសរើសខេត្ត</option>
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
                    v-model="formData.TeacherCurrentDistrict"
                    @change="loadCurrentCommunes"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    :disabled="!formData.TeacherCurrentProvince"
                  >
                    <option value="">ជ្រើសរើសស្រុក/ខណ្ឌ</option>
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
                    v-model="formData.TeacherCurrentCommune"
                    @change="loadCurrentVillages"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    :disabled="!formData.TeacherCurrentDistrict"
                  >
                    <option value="">ជ្រើសរើសឃុំ/សង្កាត់</option>
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
                    v-model="formData.TeacherCurrentVillage"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    :disabled="!formData.TeacherCurrentCommune"
                  >
                    <option value="">ជ្រើសរើសភូមិ</option>
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

            <!-- Subjects & Photo Information -->
            <div
              class="grid grid-cols-1 gap-8 pt-8 border-t-2 border-indigo-100 md:grid-cols-2"
            >
              <div
                class="p-6 space-y-6 bg-white border-2 border-indigo-100 shadow-lg rounded-xl"
              >
                <h3
                  class="flex items-center gap-2 pb-3 mb-4 text-lg font-bold text-indigo-700 border-b-2 border-indigo-100 moul-regular"
                >
                  <span class="text-2xl">📚</span>
                  មុខវិជ្ជា
                </h3>
                
                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >មុខវិជ្ជាសំខាន់</label
                  >
                  <select
                    v-model="formData.Subject1"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  >
                    <option value="">ជ្រើសរើសមុខវិជ្ជាសំខាន់</option>
                    <option
                      v-for="subject in subjects"
                      :key="subject.SubjectID"
                      :value="subject.SubjectID"
                    >
                      {{ subject.SubjectName }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block mb-2 text-sm font-semibold text-gray-700"
                    >មុខវិជ្ជាជំនួយ</label
                  >
                  <select
                    v-model="formData.Subject2"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  >
                    <option value="">ជ្រើសរើសមុខវិជ្ជាជំនួយ</option>
                    <option
                      v-for="subject in subjects"
                      :key="subject.SubjectID"
                      :value="subject.SubjectID"
                    >
                      {{ subject.SubjectName }}
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
                  រូបថតគ្រូ
                </h3>
                <div>
                  <div>
                    <div
                      v-if="formData.TeacherPic"
                      class="flex items-center justify-center w-full mb-3 overflow-hidden border-2 border-indigo-200 shadow-md h-68 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl"
                    >
                      <img
                        :src="imageSrc"
                        alt="Teacher"
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
                {{ isEditMode ? "រក្សាទុកការផ្លាស់ប្តូរ" : "បន្ថែមគ្រូ" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineEmits, watch, nextTick } from "vue";
import { useAppStore } from "../stores/appStore";

const API_BASE_URL = (() => {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  if (base) return base
  const url = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  if (url) return url.endsWith('/api') ? url : url + '/api'
  return '/api'
})()
const appStore = useAppStore();

const showPrintModal = ref(false);
const printTeacher = ref({});

function openPrintModal(teacher) {
  printTeacher.value = { ...teacher };
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

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB');
};

const getFullAddress = (teacher, type) => {
  if (type === 'birth') {
    return [teacher.TeacherBirthVillage, teacher.TeacherBirthCommune, teacher.TeacherBirthDistrict, teacher.TeacherBirthProvince]
      .filter(Boolean).join(' ');
  } else {
    return [teacher.TeacherCurrentVillage, teacher.TeacherCurrentCommune, teacher.TeacherCurrentDistrict, teacher.TeacherCurrentProvince]
      .filter(Boolean).join(' ');
  }
};

async function printCurrentTeacher() {
  await nextTick();
  if (!document.getElementById("print-section")) {
    return alert("Print section not found!");
  }
  window.print();
}

const emit = defineEmits(["logout"]);

const username = ref("");
const role = ref("");
const teachers = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(50);
const total = ref(0);
const searchText = ref("");
const showDetailModal = ref(false);
const isEditMode = ref(false);
const isNewTeacher = ref(false);
const uploadProgress = ref(0);
const uploadTasks = ref([]);
const userAuth = ref(false);

const subjects = ref([]);
const provinces = ref([]);

const birthDistricts = ref([]);
const birthCommunes = ref([]);
const birthVillages = ref([]);
const currentDistricts = ref([]);
const currentCommunes = ref([]);
const currentVillages = ref([]);

const formData = ref({
  TeacherID: "",
  TeacherFirstName: "",
  TeacherLastName: "",
  TeacherSex: "",
  TeacherAge: "",
  TeacherBirthDate: "",
  TeacherBirthVillage: "",
  TeacherBirthCommune: "",
  TeacherBirthDistrict: "",
  TeacherBirthProvince: "",
  TeacherCurrentVillage: "",
  TeacherCurrentCommune: "",
  TeacherCurrentDistrict: "",
  TeacherCurrentProvince: "",
  JoinDate: "",
  Diploma: "",
  Subject1: "",
  Subject2: "",
  TeacherPic: "",
});

const imageInput = ref(null);

const computeAge = (birthdate) => {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (isNaN(d)) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
};

watch(
  () => formData.value.TeacherBirthDate,
  (newVal) => {
    try {
      if (newVal) {
        const a = computeAge(newVal);
        if (a !== null) formData.value.TeacherAge = a;
      }
    } catch (e) {
      console.error("Error computing age:", e);
    }
  },
);

const imageSrc = computed(() => {
  const raw = formData.value.TeacherPic || "";
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
  await loadTeachers();
  checkAuthStatus();
});

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const loadMasterData = async () => {
  try {
    const headers = getAuthHeaders();
    const [subjectRes, provRes] = await Promise.all([
      fetch(`${API_BASE_URL}/subjects`, { headers }),
      fetch(`${API_BASE_URL}/address/provinces`, { headers }),
    ]);

    if (subjectRes.ok) {
      const subjectData = await subjectRes.json();
      subjects.value = (subjectData.data || []).map((s) => ({
        SubjectID: s.SubjectID ?? s.subjectid ?? s.id ?? s.SubjectId ?? s.SubjectId,
        SubjectName: s.SubjectName ?? s.subjectname ?? s.name ?? s.SubjectNameKh ?? "",
      }));
    }

    if (provRes.ok) {
      const provData = await provRes.json();
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
    }
  } catch (error) {
    console.error("Error loading master data:", error);
  }
};

const loadTeachers = async () => {
  try {
    loading.value = true;
    const res = await fetch(
      `${API_BASE_URL}/teachers?page=${currentPage.value}&limit=${pageSize.value}&search=${encodeURIComponent(searchText.value)}`,
      { headers: getAuthHeaders() }
    );
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    if (data.success) {
      teachers.value = data.data || [];
      total.value = data.total || 0;
    } else {
      teachers.value = [];
      total.value = 0;
      notify(data.message || "មិនអាចទាញយកទិន្នន័យ", "error");
    }
  } catch (error) {
    console.error("Error loading teachers:", error);
    notify("កំហុសក្នុងការទាញយកទិន្នន័យ", "error");
    teachers.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

watch(
  () => appStore.refreshTokens.teachers,
  () => {
    loadTeachers();
  },
);

const checkAuthStatus = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/upload/auth/status`, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      userAuth.value = !!(data && data.authorized);
    }
  } catch (e) {
    console.error("Error checking auth status:", e);
    userAuth.value = false;
  }
};

const authorizeUser = async () => {
  try {
    console.log('Starting authorization process for Teacher...');
    
    const debugRes = await fetch(`${API_BASE_URL}/upload/auth/debug`, { headers: getAuthHeaders() });
    const debugData = await debugRes.json();
    
    if (!debugData || !debugData.success) {
      notify("Server configuration error", "error");
      return;
    }
    
    console.log('Debug info:', debugData.debug);
    
    if (!debugData.debug.authUrlAvailable) {
      notify("Server not configured for Google OAuth. Check environment variables.", "error", 10000);
      return;
    }
    
    const res = await fetch(`${API_BASE_URL}/upload/auth/url`, { headers: getAuthHeaders() });
    const data = await res.json();
    
    if (!data || !data.success || !data.url) {
      console.error('Failed to get auth URL:', data);
      notify("Could not get authorization URL: " + (data?.message || 'Unknown error'), "error");
      return;
    }
    
    console.log('Authorization URL received, opening popup...');
    
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
      if (confirm("Popup blocked! Click OK to open authorization page in a new tab.")) {
        window.open(data.url, "_blank");
        notify("Opened in new tab. Please return here after authorization.", "info");
      }
      return;
    }
    
    notify("Authorization page opened. Please log in and grant permissions.", "info", 6000);
    
    const pollForCompletion = async () => {
      try {
        const statusRes = await fetch(`${API_BASE_URL}/upload/auth/status`, { headers: getAuthHeaders() });
        const statusData = await statusRes.json();
        
        if (statusData && statusData.authorized) {
          userAuth.value = true;
          notify("✅ Google Drive authorized successfully!", "success");
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
    
    const pollInterval = setInterval(async () => {
      if (popup.closed) {
        clearInterval(pollInterval);
        setTimeout(async () => {
          if (await pollForCompletion()) return;
          notify("Authorization was closed before completion.", "warning");
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
    
    setTimeout(() => {
      clearInterval(pollInterval);
      if (popup && !popup.closed) {
        popup.close();
      }
      if (!userAuth.value) {
        notify("Authorization timeout. Please try again.", "error");
      }
    }, 300000);
    
  } catch (err) {
    console.error("authorizeUser error", err);
    notify("Error: " + (err.message || "Unknown error occurred"), "error");
  }
};

const startUserUpload = (file, taskId, objectUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append("image", file);
      fd.append("teacherId", formData.value.TeacherID);

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
              formData.value.TeacherPic = res.imageUrl;
              notify("រូបភាពត្រូវបានបង្ហោះទៅក្នុងគណនី Drive របស់អ្នក", "success");
              resolve(res);
            } else {
              notify(
                res && (res.message || res.error)
                  ? res.message || res.error
                  : "ការបង្ហោះទៅក្នុងគណនីអ្នកប្រើប្រាស់បានបរាជ័យ",
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
                : `ការបង្ហោះទៅក្នុងគណនីអ្នកប្រើប្រាស់បានបរាជ័យ (ស្ថានភាព ${xhr.status})`;
            notify(msg, "error", 8000);
            reject(new Error(msg));
          }
        } catch (err) {
          console.error("User upload invalid response", err);
          notify("ការបង្ហោះទៅក្នុងគណនីអ្នកប្រើប្រាស់បានបរាជ័យ (ការឆ្លើយតបមិនត្រឹមត្រូវ)", "error");
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

      xhr.open("POST", `${API_BASE_URL}/upload/user`);
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(fd);
    } catch (err) {
      console.error("startUserUpload error", err);
      notify("កំហុសក្នុងការចាប់ផ្តើមបង្ហោះគណនីអ្នកប្រើប្រាស់", "error");
      const i = uploadTasks.value.findIndex((t) => t.id === taskId);
      if (i !== -1) uploadTasks.value.splice(i, 1);
      reject(err);
    }
  });
};

const performSearch = () => {
  currentPage.value = 1;
  loadTeachers();
};

const clearSearch = () => {
  searchText.value = "";
  currentPage.value = 1;
  loadTeachers();
};

const getNextAvailableTeacherId = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/teachers-id/next`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (data && data.success && data.nextId) return Number(data.nextId);
    return 1;
  } catch (err) {
    console.error("Error fetching next TeacherID:", err);
    return 1;
  }
};

const addNewTeacher = async () => {
  isNewTeacher.value = true;
  isEditMode.value = false;
  
  formData.value = {
    TeacherID: "",
    TeacherFirstName: "",
    TeacherLastName: "",
    TeacherSex: "",
    TeacherAge: "",
    TeacherBirthDate: "",
    TeacherBirthVillage: "",
    TeacherBirthCommune: "",
    TeacherBirthDistrict: "",
    TeacherBirthProvince: "",
    TeacherCurrentVillage: "",
    TeacherCurrentCommune: "",
    TeacherCurrentDistrict: "",
    TeacherCurrentProvince: "",
    JoinDate: "",
    Diploma: "",
    Subject1: "",
    Subject2: "",
    TeacherPic: "",
  };
  
  try {
    const nextId = await getNextAvailableTeacherId();
    formData.value.TeacherID = String(nextId);
  } catch (err) {
    console.error("Error computing next TeacherID:", err);
    formData.value.TeacherID = "";
  }

  birthDistricts.value = [];
  birthCommunes.value = [];
  birthVillages.value = [];
  currentDistricts.value = [];
  currentCommunes.value = [];
  currentVillages.value = [];

  showDetailModal.value = true;
};

const editTeacher = async (teacher) => {
  isEditMode.value = true;
  isNewTeacher.value = false;

  try {
    const res = await fetch(`${API_BASE_URL}/teachers/${teacher.TeacherID}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    if (data.success && data.data) {
      const t = data.data;
      
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        return date.toISOString().split('T')[0];
      };

      formData.value = {
        TeacherID: t.TeacherID || "",
        TeacherFirstName: t.TeacherFirstName || "",
        TeacherLastName: t.TeacherLastName || "",
        TeacherSex: t.TeacherSex || "",
        TeacherAge: t.TeacherAge || "",
        TeacherBirthDate: formatDateForInput(t.TeacherBirthDate),
        TeacherBirthVillage: t.TeacherBirthVillage || "",
        TeacherBirthCommune: t.TeacherBirthCommune || "",
        TeacherBirthDistrict: t.TeacherBirthDistrict || "",
        TeacherBirthProvince: t.TeacherBirthProvince || "",
        TeacherCurrentVillage: t.TeacherCurrentVillage || "",
        TeacherCurrentCommune: t.TeacherCurrentCommune || "",
        TeacherCurrentDistrict: t.TeacherCurrentDistrict || "",
        TeacherCurrentProvince: t.TeacherCurrentProvince || "",
        JoinDate: formatDateForInput(t.JoinDate),
        Diploma: t.Diploma || "",
        Subject1: t.Subject1 || "",
        Subject2: t.Subject2 || "",
        TeacherPic: t.TeacherPic || "",
      };

      if (formData.value.TeacherBirthProvince) {
        await loadBirthDistricts();
        if (formData.value.TeacherBirthDistrict) {
          await loadBirthCommunes();
          if (formData.value.TeacherBirthCommune) {
            await loadBirthVillages();
          }
        }
      }

      if (formData.value.TeacherCurrentProvince) {
        await loadCurrentDistricts();
        if (formData.value.TeacherCurrentDistrict) {
          await loadCurrentCommunes();
          if (formData.value.TeacherCurrentCommune) {
            await loadCurrentVillages();
          }
        }
      }

      showDetailModal.value = true;
    } else {
      notify("មិនអាចទាញយកទិន្នន័យគ្រូ", "error");
    }
  } catch (error) {
    console.error("Error loading teacher:", error);
    notify("កំហុសក្នុងការទាញយកទិន្នន័យ", "error");
  }
};

const deleteTeacher = async (teacherId) => {
  if (!confirm("តើអ្នកពិតជាចង់លុបគ្រូនេះមែនទេ?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/teachers/${teacherId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    
    const data = await res.json();
    
    if (data.success) {
      notify("គ្រូត្រូវបានលុបដោយជោគជ័យ", "success");
      await loadTeachers();
    } else {
      notify(data.message || "មិនអាចលុបគ្រូ", "error");
    }
  } catch (error) {
    console.error("Error deleting teacher:", error);
    notify("កំហុសក្នុងការលុបគ្រូ", "error");
  }
};

const saveTeacher = async () => {
  if (!formData.value.TeacherID || !formData.value.TeacherFirstName || !formData.value.TeacherLastName) {
    notify("សូមបំពេញព័ត៌មានចាំបាច់: លេខសំគាល់, ត្រកូល, នាម", "error");
    return;
  }

  try {
    const method = isNewTeacher.value ? "POST" : "PUT";
    const url = isNewTeacher.value
      ? `${API_BASE_URL}/teachers`
      : `${API_BASE_URL}/teachers/${formData.value.TeacherID}`;

    const payload = { ...formData.value };
    
    const optionalFields = ['TeacherAge', 'Diploma', 'Subject1', 'Subject2', 
                           'TeacherBirthVillage', 'TeacherBirthCommune', 'TeacherBirthDistrict', 'TeacherBirthProvince',
                           'TeacherCurrentVillage', 'TeacherCurrentCommune', 'TeacherCurrentDistrict', 'TeacherCurrentProvince',
                           'TeacherPic'];
    
    optionalFields.forEach(field => {
      if (payload[field] === '') {
        payload[field] = null;
      }
    });

    const res = await fetch(url, {
      method,
      headers: { 
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    
    if (data.success) {
      notify(
        `គ្រូត្រូវបាន${isNewTeacher.value ? "បង្កើត" : "ធ្វើបច្ចុប្បន្នភាព"}ដោយជោគជ័យ`,
        "success",
      );
      closeDetailModal();
      await loadTeachers();
    } else {
      notify(data.message || "កំហុសក្នុងការរក្សាទុក", "error");
    }
  } catch (error) {
    console.error("Error saving teacher:", error);
    notify("កំហុសក្នុងការរក្សាទុកគ្រូ", "error");
  }
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    notify("រូបភាពមានទំហំធំពេក (អតិបរមា 5MB)", "error");
    return;
  }

  if (!file.type.match('image.*')) {
    notify("សូមជ្រើសរើសឯកសាររូបភាពប៉ុណ្ណោះ", "error");
    return;
  }

  let objectUrl;
  try {
    objectUrl = URL.createObjectURL(file);
    formData.value.TeacherPic = objectUrl;
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

  console.debug('[Teacher] starting upload', { teacherId: formData.value.TeacherID, taskId });
  startBackgroundUpload(file, taskId, objectUrl).catch(() => {});
};

const startBackgroundUpload = (file, taskId, objectUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append("image", file);
      fd.append("teacherId", formData.value.TeacherID);

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
              if (res.fallback) {
                notify(
                  "រូបភាពត្រូវបានបង្ហោះ ប៉ុន្តែត្រូវបានរក្សាទុកក្នុងមូលដ្ឋានទិន្នន័យដោយសារកំណត់ដែនកំណត់ Drive។ វានឹងនៅតែបង្ហាញ។",
                  "warning",
                  8000,
                );

                const taskIdx = uploadTasks.value.findIndex((t) => t.id === taskId);
                const taskObj = taskIdx !== -1 ? uploadTasks.value[taskIdx] : null;
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
                formData.value.TeacherPic = res.imageUrl;
                notify("រូបភាពត្រូវបានបង្ហោះដោយជោគជ័យ", "success");
              }
              resolve(res);
            } else {
              notify(
                res && (res.message || res.error)
                  ? res.message || res.error
                  : "បរាជ័យក្នុងការបង្ហោះ",
                "error",
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
            notify(msg, "error", 8000);
            reject(new Error(msg));
          }
        } catch (err) {
          console.error("Invalid upload response", err);
          notify("បរាជ័យក្នុងការបង្ហោះ (ការឆ្លើយតបមិនត្រឹមត្រូវ)", "error");
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

      xhr.timeout = 30000;
      xhr.addEventListener("timeout", () => {
        notify("ការបង្ហោះបានផុតកំណត់ពេល", "error");
        const i = uploadTasks.value.findIndex((t) => t.id === taskId);
        if (i !== -1) uploadTasks.value.splice(i, 1);
        uploadProgress.value = 0;
        reject(new Error("timeout"));
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
  if (!formData.value.TeacherBirthProvince) {
    birthDistricts.value = [];
    birthCommunes.value = [];
    birthVillages.value = [];
    return;
  }
  
  try {
    const res = await fetch(
      `${API_BASE_URL}/address/districts/${formData.value.TeacherBirthProvince}`,
      { headers: getAuthHeaders() }
    );
    if (res.ok) {
      const data = await res.json();
      birthDistricts.value = (data.data || []).map((d) => ({
        id: String(d.id ?? d.ID ?? d.district_id ?? d.DistrictId ?? d.districtId ?? d.value ?? ""),
        name_kh: d.name_kh ?? d.name ?? d.Name ?? d.nameKh ?? "",
      }));
    }
    birthCommunes.value = [];
    birthVillages.value = [];
  } catch (error) {
    console.error("Error loading districts:", error);
  }
};

const loadBirthCommunes = async () => {
  if (!formData.value.TeacherBirthDistrict) {
    birthCommunes.value = [];
    birthVillages.value = [];
    return;
  }
  
  try {
    const res = await fetch(
      `${API_BASE_URL}/address/communes/${formData.value.TeacherBirthDistrict}`,
      { headers: getAuthHeaders() }
    );
    if (res.ok) {
      const data = await res.json();
      birthCommunes.value = (data.data || []).map((c) => ({
        id: String(c.id ?? c.ID ?? c.commune_id ?? c.CommuneId ?? c.communeId ?? c.value ?? ""),
        name_kh: c.name_kh ?? c.name ?? c.Name ?? c.nameKh ?? "",
      }));
    }
    birthVillages.value = [];
  } catch (error) {
    console.error("Error loading communes:", error);
  }
};

const loadBirthVillages = async () => {
  if (!formData.value.TeacherBirthCommune) {
    birthVillages.value = [];
    return;
  }
  
  try {
    const res = await fetch(
      `${API_BASE_URL}/address/villages/${formData.value.TeacherBirthCommune}`,
      { headers: getAuthHeaders() }
    );
    if (res.ok) {
      const data = await res.json();
      birthVillages.value = (data.data || []).map((v) => ({
        id: String(v.id ?? v.ID ?? v.village_id ?? v.VillageId ?? v.villageId ?? v.value ?? ""),
        name_kh: v.name_kh ?? v.name ?? v.Name ?? v.nameKh ?? "",
      }));
    }
  } catch (error) {
    console.error("Error loading villages:", error);
  }
};

const loadCurrentDistricts = async () => {
  if (!formData.value.TeacherCurrentProvince) {
    currentDistricts.value = [];
    currentCommunes.value = [];
    currentVillages.value = [];
    return;
  }
  
  try {
    const res = await fetch(
      `${API_BASE_URL}/address/districts/${formData.value.TeacherCurrentProvince}`,
      { headers: getAuthHeaders() }
    );
    if (res.ok) {
      const data = await res.json();
      currentDistricts.value = (data.data || []).map((d) => ({
        id: String(d.id ?? d.ID ?? d.district_id ?? d.DistrictId ?? d.districtId ?? d.value ?? ""),
        name_kh: d.name_kh ?? d.name ?? d.Name ?? d.nameKh ?? "",
      }));
    }
    currentCommunes.value = [];
    currentVillages.value = [];
  } catch (error) {
    console.error("Error loading districts:", error);
  }
};

const loadCurrentCommunes = async () => {
  if (!formData.value.TeacherCurrentDistrict) {
    currentCommunes.value = [];
    currentVillages.value = [];
    return;
  }
  
  try {
    const res = await fetch(
      `${API_BASE_URL}/address/communes/${formData.value.TeacherCurrentDistrict}`,
      { headers: getAuthHeaders() }
    );
    if (res.ok) {
      const data = await res.json();
      currentCommunes.value = (data.data || []).map((c) => ({
        id: String(c.id ?? c.ID ?? c.commune_id ?? c.CommuneId ?? c.communeId ?? c.value ?? ""),
        name_kh: c.name_kh ?? c.name ?? c.Name ?? c.nameKh ?? "",
      }));
    }
    currentVillages.value = [];
  } catch (error) {
    console.error("Error loading communes:", error);
  }
};

const loadCurrentVillages = async () => {
  if (!formData.value.TeacherCurrentCommune) {
    currentVillages.value = [];
    return;
  }
  
  try {
    const res = await fetch(
      `${API_BASE_URL}/address/villages/${formData.value.TeacherCurrentCommune}`,
      { headers: getAuthHeaders() }
    );
    if (res.ok) {
      const data = await res.json();
      currentVillages.value = (data.data || []).map((v) => ({
        id: String(v.id ?? v.ID ?? v.village_id ?? v.VillageId ?? v.villageId ?? v.value ?? ""),
        name_kh: v.name_kh ?? v.name ?? v.Name ?? v.nameKh ?? "",
      }));
    }
  } catch (error) {
    console.error("Error loading villages:", error);
  }
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  uploadProgress.value = 0;
};

const getSexDisplay = (sex) => {
  const sexMap = { M: "ប្រុស", F: "ស្រី", O: "ផ្សេងទៀត" };
  return sexMap[sex] || sex;
};

const exportToExcel = async () => {
  try {
    const headers = [
      "លេខសំគាល់",
      "ត្រកូល",
      "នាម",
      "ភេទ",
      "អាយុ",
      "សញ្ញាប័ត្រ",
      "មុខវិជ្ជាសំខាន់",
      "មុខវិជ្ជាជំនួយ",
      "ថ្ងៃចូលធ្វើការ",
      "ថ្ងៃកំណើត",
      "ទីកន្លែងកំណើត",
      "អាសយដ្ឋានបច្ចុប្បន្ន"
    ];
    
    const rows = teachers.value.map((t) => [
      t.TeacherID,
      t.TeacherFirstName,
      t.TeacherLastName,
      getSexDisplay(t.TeacherSex),
      t.TeacherAge,
      t.Diploma || '',
      t.Subject1Name || '',
      t.Subject2Name || '',
      formatDate(t.JoinDate),
      formatDate(t.TeacherBirthDate),
      getFullAddress(t, 'birth'),
      getFullAddress(t, 'current')
    ]);

    const csv = [headers, ...rows].map((r) => 
      r.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teachers_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting:", error);
    notify("កំហុសក្នុងការនាំចេញទិន្នន័យ", "error");
  }
};

const printTeachers = () => {
  window.print();
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadTeachers();
  }
};

const nextPage = () => {
  if (currentPage.value < Math.ceil(total.value / pageSize.value)) {
    currentPage.value++;
    loadTeachers();
  }
};

const logout = () => {
  localStorage.removeItem("user");
  emit("logout");
};
</script>

<style scoped>
.container {
  max-width: 1200px;
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
  .container {
    padding: 0.5rem;
  }
}
</style>
