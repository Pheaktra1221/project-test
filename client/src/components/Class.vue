<template>
  <div class="container p-2 mx-auto">
    <!-- Toast notifications - Fixed above modal backdrop -->
    <div class="fixed flex flex-col gap-2 z-100 top-4 right-4">
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
          notificationAnimation[n.id] || 'translate-x-0'
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

    <div class="w-full">
      <!-- Search and Controls -->
      <div
        class="p-2 mb-8 bg-white border border-gray-100 shadow-xl rounded-2xl"
      >
        <div class="grid grid-cols-1 gap-2 mb-6 md:grid-cols-4">
          <input
            v-model="searchText"
            type="text"
            placeholder="ស្វែងរកថ្នាក់រៀន..."
            class="px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 font-medium"
          />
          <button
            @click="performSearch"
            class="px-6 py-3.5 bg-indigo-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span class="text-lg">🔍</span>
            ស្វែងរក
          </button>
          <button
            @click="clearSearch"
            class="px-6 py-3.5 bg-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span class="text-lg">✕</span>
            សម្អាត
          </button>
          <button
            @click="openCreateModal"
            class="px-6 py-3.5 bg-green-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span class="text-lg">➕</span>
            ថ្នាក់ថ្មី
          </button>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            @click="subjectSetting"
            class="px-5 py-2.5 text-sm bg-blue-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
          >
            <span class="text-base">📊</span>
            កំណត់មុខវិជ្ជា
          </button>
        </div>
      </div>

      <!-- Classes Table -->
      <div
        class="overflow-hidden bg-white border border-gray-100 shadow-xl rounded-2xl"
      >
        <div v-if="loading" class="p-12 text-center">
          <div
            class="inline-block w-16 h-16 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin"
          ></div>
          <p class="mt-4 font-medium text-gray-600">កំពុងផ្ទុកទិន្នន័យថ្នាក់...</p>
        </div>

        <div v-else-if="classes.length === 0" class="p-12 text-center">
          <div class="mb-4 text-6xl">📚</div>
          <p class="text-lg font-medium text-gray-600">មិនមានទិន្នន័យថ្នាក់</p>
          <button
            @click="openCreateModal"
            class="px-6 py-3 mt-4 bg-indigo-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            បង្កើតថ្នាក់ថ្មី
          </button>
        </div>

        <div v-else>
          <!-- Mobile View -->
          <div class="block divide-y md:hidden">
            <div 
              v-for="cls in classes" 
              :key="cls.ClassId" 
              class="flex flex-col gap-2 py-4 mb-3 border-b shadow last:border-b-0 bg-white/90 rounded-xl"
            >
              <div class="flex items-center gap-3">
                <div class="relative flex items-center justify-center w-16 h-16 text-2xl text-white bg-indigo-500 border-2 border-indigo-200 shadow-md shrink-0 rounded-xl overflow-hidden">
                  <img v-if="cls.TeacherPicPreview" :src="cls.TeacherPicPreview" :alt="cls.TeacherFullName || 'Teacher'" class="object-cover w-full h-full" />
                  <span v-else>{{ cls.classNumber || '' }}</span>
                </div>
                <div class="flex-1">
                  <div class="text-lg font-bold text-indigo-700">{{ cls.ClassName }}</div>
                  <div class="text-xs text-gray-500">លេខកូដ: {{ cls.ClassId }}</div>
                  <div class="text-xs text-gray-500">អក្សរ: {{ cls.ClassLetter }}</div>
                  <div class="text-xs text-gray-500">
                    គ្រូបន្ទប់: {{ cls.TeacherFullName || 'មិនទាន់មាន' }}
                  </div>
                  <div class="text-xs text-gray-500">
                    សិស្ស: {{ cls.student_count || 0 }} នាក់
                  </div>
                </div>
              </div>
              <div class="flex gap-2 mt-2">
                <button 
                  @click.stop="editClass(cls)" 
                  class="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 bg-blue-500 rounded-lg shadow-md hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2H7a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2z" />
                  </svg>
                  <span>កែប្រែ</span>
                </button>
                <button 
                  @click.stop="viewClassDetails(cls)" 
                  class="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 bg-green-500 rounded-lg shadow-md hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>បញ្ជីឈ្មោះ</span>
                </button>
                <button 
                  @click.stop="deleteClass(cls.ClassId)" 
                  class="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 bg-red-500 rounded-lg shadow-md hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>លុប</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop View -->
          <div class="hidden overflow-x-auto md:block">
            <table class="w-full text-sm">
              <thead class="border-b-2 border-indigo-100 bg-indigo-50">
                <tr>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">លេខកូដ</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">ថ្នាក់</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">អក្សរ</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">គ្រូបន្ទប់</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">ចំនួនសិស្ស</th>
                  <th class="px-6 py-4 font-bold text-left text-gray-700">កាលបរិច្ឆេទបង្កើត</th>
                  <th class="px-6 py-4 font-bold text-center text-gray-700">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="cls in classes" 
                  :key="cls.ClassId" 
                  class="transition-all duration-200 border-b border-gray-100 hover:bg-indigo-50"
                >
                  <td class="px-6 py-4 font-semibold text-indigo-600">{{ cls.ClassId }}</td>
                  <td class="px-6 py-4 text-lg font-bold text-gray-800">{{ cls.ClassName }}</td>
                  <td class="px-6 py-4">
                    <span class="px-3 py-1.5 text-sm font-semibold text-white bg-indigo-500 rounded-full">
                      {{ cls.ClassLetter }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-medium text-gray-700">
                    <div v-if="cls.TeacherFullName" class="flex items-center gap-2">
                      <div class="flex items-center justify-center w-8 h-8 overflow-hidden text-white bg-blue-500 rounded-full">
                        <img v-if="cls.TeacherPicPreview" :src="cls.TeacherPicPreview" :alt="cls.TeacherFullName" class="object-cover w-full h-full" />
                        <span v-else>{{ cls.TeacherFirstName?.charAt(0) || '' }}</span>
                      </div>
                      <span>{{ cls.TeacherFullName }}</span>
                    </div>
                    <span v-else class="italic text-gray-400">មិនទាន់មាន</span>
                  </td>
                  <td class="px-6 py-4 font-medium text-gray-600">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-1 text-xs font-semibold rounded-lg" 
                        :class="cls.student_count > 0 ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'">
                        {{ cls.student_count || 0 }} នាក់
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-500">
                    {{ formatDate(cls.CreatedAt) }}
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-2">
                      <button 
                        @click.stop="editClass(cls)" 
                        class="flex items-center w-full gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 sm:w-auto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2H7a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2z" />
                        </svg>
                        <span>កែប្រែ</span>
                      </button>
                      <button 
                        @click.stop="viewClassDetails(cls)" 
                        class="flex items-center w-full gap-2 px-4 py-2 text-xs font-semibold text-white bg-green-500 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 sm:w-auto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>បញ្ជីឈ្មោះ</span>
                      </button>
                      <button 
                        @click.stop="deleteClass(cls.ClassId)" 
                        class="flex items-center w-full gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-500 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 sm:w-auto"
                      >
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

          <!-- Pagination -->
          <div
            v-if="classes.length > 0"
            class="flex items-center justify-between px-6 py-5 border-t-2 border-gray-100 bg-indigo-50"
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
              ថ្នាក់
            </div>
            <div class="flex gap-2">
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="px-4 py-3 bg-indigo-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                class="px-4 py-3 bg-indigo-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                បន្ទាប់ ▶
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Class Modal -->
    <div
      v-if="showClassModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-50 backdrop-blur-sm"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border-2 border-gray-200 overflow-hidden"
      >
        <button
          @click="closeClassModal"
          class="absolute z-30 flex items-center justify-center w-10 h-10 text-xl font-bold text-gray-700 bg-white rounded-full shadow-md top-4 right-4 hover:bg-gray-100 focus:outline-none"
        >
          ✕
        </button>

        <div class="flex-1 overflow-auto">
          <form
            @submit.prevent="saveClass"
            class="p-6 space-y-8 bg-blue-50"
          >
            <h2 class="flex items-center gap-3 text-2xl font-bold text-gray-800 moul-regular">
              <span class="text-3xl">{{ isEditMode ? '✏️' : '➕' }}</span>
              {{ isEditMode ? "កែប្រែថ្នាក់" : "បង្កើតថ្នាក់ថ្មី" }}
            </h2>

            <!-- Class Preview -->
            <div
              class="p-6 bg-white border-2 border-indigo-100 shadow-md rounded-xl"
            >
              <label
                class="flex items-center gap-2 mb-4 text-lg font-bold text-gray-700"
              >
                <span class="text-2xl">👁️</span>
                មើលជាមុន
              </label>
              <div class="pt-6 text-center border-t border-gray-100">
                <div class="flex justify-center gap-3 text-3xl font-black text-indigo-600">
                  <span class="text-4xl">{{ formData.classNumber || '?' }}</span>
                  <span class="text-4xl">{{ formData.classLetter || '?' }}</span>
                </div>
                <p class="mt-3 text-sm font-semibold tracking-widest text-gray-500 uppercase">
                  {{ formData.classNumber && formData.classLetter ? `ថ្នាក់ទី ${formData.classNumber}${formData.classLetter}` : 'ថ្នាក់រៀន' }}
                </p>
                <div v-if="selectedTeacherFullName" class="mt-2 text-sm text-gray-600">
                  គ្រូបន្ទប់: {{ selectedTeacherFullName }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
              <!-- Class Details -->
              <div
                class="p-6 space-y-6 bg-white border-2 border-indigo-100 shadow-lg rounded-xl"
              >
                <h3
                  class="flex items-center gap-2 pb-3 mb-4 text-lg font-bold text-indigo-700 border-b-2 border-indigo-100 moul-regular"
                >
                  <span class="text-2xl">📚</span>
                  ព័ត៌មានថ្នាក់
                </h3>

                <div>
                  <label
                    class="block mb-2 text-sm font-semibold text-gray-700"
                    for="class-number-field"
                  >
                    កម្រិតថ្នាក់
                  </label>
                  <select
                    id="class-number-field"
                    v-model="formData.classNumber"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  >
                    <option :value="null" disabled>ជ្រើសរើសកម្រិតថ្នាក់</option>
                    <option v-for="num in classNumbers" :key="num" :value="num">
                    {{ num }}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    class="block mb-2 text-sm font-semibold text-gray-700"
                    for="class-letter-field"
                  >
                    បន្ទប់/អក្សរ
                  </label>
                  <select
                    id="class-letter-field"
                    v-model="formData.classLetter"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  >
                    <option :value="null" disabled>ជ្រើសរើសអក្សរ</option>
                    <option v-for="(khmerLetter, index) in classKhmerletter" :key="khmerLetter" :value="classLetters[index]">
                      {{ khmerLetter }} ({{ classLetters[index] }})
                    </option>
                  </select>
                </div>
              </div>

              <!-- Teacher Selection -->
              <div
                class="p-6 space-y-6 bg-white border-2 border-indigo-100 shadow-lg rounded-xl"
              >
                <h3
                  class="flex items-center gap-2 pb-3 mb-4 text-lg font-bold text-indigo-700 border-b-2 border-indigo-100 moul-regular"
                >
                  <span class="text-2xl">👨‍🏫</span>
                  គ្រូបន្ទប់ថ្នាក់
                </h3>

                <div>
                  <label
                    class="block mb-2 text-sm font-semibold text-gray-700"
                    for="homeroom-teacher-field"
                  >
                    ជ្រើសរើសគ្រូបន្ទប់ថ្នាក់
                  </label>
                  <select
                    id="homeroom-teacher-field"
                    v-model="formData.homeroomTeacherId"
                    class="w-full px-4 py-3 font-medium transition-all duration-200 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  >
                    <option :value="null">--- ជ្រើសរើសគ្រូ ---</option>
                    <option v-for="teacher in teachers" :key="teacher.TeacherID" :value="teacher.TeacherID">
                      {{ teacher.TeacherFirstName }} {{ teacher.TeacherLastName }}
                      <template v-if="teacher.Diploma">({{ teacher.Diploma }})</template>
                    </option>
                  </select>
                </div>

                <!-- Selected Teacher Info -->
                <div v-if="selectedTeacherFullName" 
                  class="p-4 mt-4 border-2 border-green-200 rounded-xl bg-green-50"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center w-12 h-12 text-lg font-bold text-white bg-green-500 rounded-full">
                      {{ selectedTeacherFirstName?.charAt(0) || '' }}
                    </div>
                    <div>
                      <div class="font-semibold text-gray-800">{{ selectedTeacherFullName }}</div>
                      <div class="text-sm text-gray-600">
                        <span v-if="selectedTeacherDiploma">សញ្ញាបត្រ: {{ selectedTeacherDiploma }}</span>
                        <span v-else>មិនមានសញ្ញាបត្រ</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="p-4 mt-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                  <div class="flex items-center gap-3 text-gray-500">
                    <div class="text-2xl">⚠️</div>
                    <div class="text-sm">
                      ថ្នាក់នេះមិនទាន់មានគ្រូបន្ទប់ទេ។ អ្នកអាចបោះបង់ការជ្រើសរើសគ្រូបន្ទប់បាន។
                    </div>
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
                @click="closeClassModal"
                class="w-full px-8 py-3.5 font-semibold text-gray-700 bg-gray-200 rounded-xl md:w-auto hover:bg-gray-300 transition-all duration-200"
              >
                បោះបង់
              </button>
              <button
                type="submit"
                :disabled="!formData.classNumber || !formData.classLetter || isLoading"
                :class="[
                  'w-full md:w-auto px-8 py-3.5 rounded-xl font-bold shadow-lg transform transition-all duration-200',
                  formData.classNumber && formData.classLetter && !isLoading
                    ? 'bg-indigo-500 text-white hover:shadow-xl hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                ]"
              >
                <span v-if="isLoading" class="flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                  កំពុងរក្សាទុក...
                </span>
                <span v-else>
                  {{ isEditMode ? "រក្សាទុកការផ្លាស់ប្តូរ" : "បង្កើតថ្នាក់" }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios';
import { onMounted, ref, computed, reactive, watch } from "vue";
import { useRouter } from 'vue-router';
import { useAppStore } from "../stores/appStore";

// Configure axios
// axios.defaults.baseURL is already set in main.js


// Router
const router = useRouter();
const appStore = useAppStore();

// Refs
const classes = ref([]);
const teachers = ref([]);
const searchText = ref('');
const loading = ref(false);
const isLoading = ref(false);
const showClassModal = ref(false);
const isEditMode = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const notifications = ref([]);
const notificationAnimation = ref({});

// Form data
const formData = reactive({
  classNumber: null,
  classLetter: null,
  homeroomTeacherId: null,
  ClassId: null,
  ClassName: '',
  ClassLetter: ''
});

// Constants
const classNumbers = computed(() => Array.from({ length: 6 }, (_, i) => i + 7));
const classKhmerletter = ["ក", "ខ", "គ", "ឃ", "ង", "ច", "ឆ", "ជ", "ឈ", "ញ", "ដ", "ឋ", "ឌ", "ឍ", "ណ", "ត", "ថ", "ទ", "ធ", "ន", "ប", "ផ", "ព", "ភ", "ម", "យ", "រ", "ល", "វ", "ស", "ហ", "ឡ", "អ"];
const classLetters = computed(() => {
  const baseLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
  return classKhmerletter.map((_, i) => {
    return i < baseLetters.length ? baseLetters[i] : `${baseLetters[i % baseLetters.length]}${Math.floor(i / baseLetters.length)}`;
  });
});

// Computed properties
const selectedTeacherFullName = computed(() => {
  if (!formData.homeroomTeacherId) return null;
  const teacher = teachers.value.find(t => t.TeacherID === formData.homeroomTeacherId);
  return teacher ? `${teacher.TeacherFirstName} ${teacher.TeacherLastName}` : null;
});

const selectedTeacherFirstName = computed(() => {
  if (!formData.homeroomTeacherId) return null;
  const teacher = teachers.value.find(t => t.TeacherID === formData.homeroomTeacherId);
  return teacher ? teacher.TeacherFirstName : null;
});

const selectedTeacherDiploma = computed(() => {
  if (!formData.homeroomTeacherId) return null;
  const teacher = teachers.value.find(t => t.TeacherID === formData.homeroomTeacherId);
  return teacher ? teacher.Diploma : null;
});

// Methods
const showNotification = (message, type = 'info') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });
  
  // Slide in animation
  notificationAnimation.value[id] = 'translate-x-0';
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    closeNotification(id);
  }, 5000);
};

const closeNotification = (id) => {
  // Slide out animation
  notificationAnimation.value[id] = 'translate-x-full opacity-0';
  
  // Remove from DOM after animation
  setTimeout(() => {
    notifications.value = notifications.value.filter(n => n.id !== id);
    delete notificationAnimation.value[id];
  }, 300);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('km-KH');
};

const fetchClasses = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/class');
    if (response.data && response.data.success) {
      classes.value = response.data.data || [];
      total.value = response.data.total || classes.value.length;
    }
  } catch (error) {
    console.error('Error fetching classes:', error);
    showNotification('មិនអាចទាញយកទិន្នន័យថ្នាក់បានទេ', 'error');
  } finally {
    loading.value = false;
  }
};

const fetchTeachers = async () => {
  try {
    const response = await axios.get('/class/homeroom-teachers');
    if (response.data && response.data.success) {
      teachers.value = response.data.data || [];
    } else if (Array.isArray(response.data)) {
      teachers.value = response.data;
    } else {
      teachers.value = [];
    }
  } catch (error) {
    console.error('Fetch Error:', error);
  }
};

watch(
  () => appStore.refreshTokens.classes,
  () => {
    fetchClasses();
  },
);

watch(
  () => appStore.refreshTokens.teachers,
  () => {
    fetchTeachers();
  },
);

const openCreateModal = () => {
  isEditMode.value = false;
  resetForm();
  showClassModal.value = true;
};

const openEditModal = (cls) => {
  isEditMode.value = true;
  resetForm();
  
  console.log('Editing class data:', cls);
  
  let classNumber = cls.classNumber;
  let classLetter = cls.ClassLetter;
  
  if (!classNumber && cls.ClassName) {
    const className = cls.ClassName;
    const numberMatch = className.match(/(\d+)/);
    if (numberMatch) {
      classNumber = parseInt(numberMatch[1]);
    }
    
    if (!classLetter && className) {
      const letterMatch = className.match(/([A-Za-z])$/);
      if (letterMatch) {
        classLetter = letterMatch[1].toUpperCase();
      }
    }
  }
  
  formData.classNumber = classNumber;
  formData.classLetter = classLetter;
  formData.homeroomTeacherId = cls.HomeroomTeacherID || null;
  formData.ClassId = cls.ClassId;
  formData.ClassName = cls.ClassName;
  formData.ClassLetter = cls.ClassLetter;
  
  showClassModal.value = true;
};

const editClass = (cls) => {
  openEditModal(cls);
};

// Navigate to ClassList with class data

const viewClassDetails = (cls) => {
  router.push({
    name: 'ClassList',
    params: {
      id: cls.ClassId
    }
  });
};

const resetForm = () => {
  formData.classNumber = null;
  formData.classLetter = null;
  formData.homeroomTeacherId = null;
  formData.ClassId = null;
  formData.ClassName = '';
  formData.ClassLetter = '';
};

const closeClassModal = () => {
  showClassModal.value = false;
  resetForm();
};

const saveClass = async () => {
  if (!formData.classNumber || !formData.classLetter) {
    showNotification('សូមបំពេញកម្រិតថ្នាក់ និងអក្សរថ្នាក់', 'error');
    return;
  }

  isLoading.value = true;
  const className = `${formData.classNumber}`;
  const classData = {
    className: className,
    classLetter: formData.classLetter,
    homeroomTeacherId: formData.homeroomTeacherId,
    classNumber: formData.classNumber
  };

  try {
    let response;
    if (isEditMode.value) {
      response = await axios.put(`/class/${formData.ClassId}`, classData);
    } else {
      response = await axios.post('/class', classData);
    }

    if (response.data.success) {
      showNotification(
        isEditMode.value 
          ? 'ថ្នាក់ត្រូវបានកែប្រែដោយជោគជ័យ!' 
          : 'ថ្នាក់ថ្មីត្រូវបានបង្កើតដោយជោគជ័យ!',
        'success'
      );
      closeClassModal();
      fetchClasses();
    } else {
      showNotification(response.data.message || 'កំហុសក្នុងការរក្សាទុក', 'error');
    }
  } catch (error) {
    let errorMsg = 'កំហុសសេវាកម្ម';
    if (error.response) {
      errorMsg = error.response.data?.message || 'Server Error';
    } else if (error.request) {
      errorMsg = 'មិនអាចតភ្ជាប់ទៅម៉ាស៊ីនបម្រើ';
    }
    showNotification(errorMsg, 'error');
    console.error('Save error:', error);
  } finally {
    isLoading.value = false;
  }
};

const deleteClass = async (classId) => {
  if (!confirm('តើអ្នកពិតជាចង់លុបថ្នាក់នេះមែនទេ?')) {
    return;
  }

  try {
    const response = await axios.delete(`/class/${classId}`);
    if (response.data.success) {
      showNotification('ថ្នាក់ត្រូវបានលុបដោយជោគជ័យ!', 'success');
      fetchClasses();
    } else {
      showNotification(response.data.message || 'មិនអាចលុបថ្នាក់បានទេ', 'error');
    }
  } catch (error) {
    let errorMsg = 'កំហុសក្នុងការលុបថ្នាក់';
    if (error.response) {
      errorMsg = error.response.data?.message || 'Server Error';
    }
    showNotification(errorMsg, 'error');
    console.error('Delete error:', error);
  }
};

const performSearch = async () => {
  if (!searchText.value.trim()) {
    fetchClasses();
    return;
  }

  loading.value = true;
  try {
    const response = await axios.get(`/class/search/${searchText.value}`);
    if (response.data && response.data.success) {
      classes.value = response.data.data || [];
      total.value = response.data.count || classes.value.length;
      showNotification(`បានរកឃើញ ${classes.value.length} ថ្នាក់`, 'success');
    }
  } catch (error) {
    console.error('Search error:', error);
    showNotification('កំហុសក្នុងការស្វែងរក', 'error');
  } finally {
    loading.value = false;
  }
};

const clearSearch = () => {
  searchText.value = '';
  fetchClasses();
  showNotification('បានសម្អាតការស្វែងរក', 'success');
};

const subjectSetting = () => {
  showNotification('មុខងារកំណត់មុខវិជ្ជានេះត្រូវបានលុបចោល', 'info');
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchClasses();
  }
};

const nextPage = () => {
  const totalPages = Math.ceil(total.value / pageSize.value);
  if (currentPage.value < totalPages) {
    currentPage.value++;
    fetchClasses();
  }
};

const testConnection = async () => {
  try {
    await axios.get('/health');
  } catch (error) {
    showNotification('មិនអាចតភ្ជាប់ទៅម៉ាស៊ីនបម្រើ', 'error');
  }
};

// Lifecycle
onMounted(() => {
  testConnection();
  fetchClasses();
  fetchTeachers();
});
</script>

<style scoped>
.moul-regular {
  font-family: 'Moul', cursive;
}

/* Notification animations */
.notification-enter-active {
  transition: all 0.3s ease-out;
}

.notification-leave-active {
  transition: all 0.3s ease-in;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
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
</style>
