<template>
  <div class="container p-2 mx-auto">
    <!-- Toast notifications -->
    <div class="fixed z-50 flex flex-col gap-1 top-2 right-2 left-2 sm:left-auto">
      <div
        v-for="n in notifications"
        :key="n.id"
        :class="[
          'px-4 py-3 rounded-lg shadow-lg text-white flex items-center justify-between gap-2 text-sm sm:text-base sm:px-5 sm:py-3 sm:rounded-xl',
          n.type === 'error'
            ? 'bg-red-500'
            : n.type === 'success'
              ? 'bg-green-500'
              : 'bg-indigo-500',
        ]"
      >
        <div class="flex-1">{{ n.message }}</div>
        <button
          @click="closeNotification(n.id)"
          class="text-lg text-white opacity-80 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="w-full">
      <!-- Header -->
      <div class="p-4 mb-4 bg-white border border-gray-100 shadow-md rounded-xl sm:p-6 sm:mb-6 sm:rounded-2xl sm:shadow-xl">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="flex items-center justify-center w-12 h-12 overflow-hidden font-bold text-white rounded-full shadow-md sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-500 to-purple-600">
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt="Profile"
                  class="object-cover w-full h-full"
                  @error="handleImageError"
                />
                <span v-else class="text-xl sm:text-2xl">
                  {{ (userProfile.username || userProfile.fullName || 'U').charAt(0).toUpperCase() }}
                </span>
              </div>
              <div :class="[
                'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white sm:w-4 sm:h-4',
                userProfile.role === 'admin' ? 'bg-purple-500' :
                userProfile.role === 'teacher' ? 'bg-blue-500' :
                'bg-green-500'
              ]"></div>
            </div>
            
            <div class="flex-1 min-w-0">
              <h1 class="text-lg font-bold text-gray-800 truncate sm:text-2xl">ការគ្រប់គ្រងវត្តមាន</h1>
              <div class="flex flex-wrap items-center gap-2 mt-1">
                <span :class="[
                  'px-2 py-0.5 text-xs font-semibold rounded-full sm:px-3 sm:py-1 sm:text-sm',
                  userProfile.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                  userProfile.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                ]">
                  {{ getRoleName(userProfile.role) }}
                </span>
                
                <span v-if="userProfile.fullName" class="text-xs text-gray-600 truncate sm:text-sm">
                  {{ userProfile.fullName }}
                </span>
                
                <span v-if="userProfile.className" class="text-xs text-gray-500 truncate sm:text-sm">
                  ({{ userProfile.className }})
                </span>
              </div>
            </div>
            
          </div>
          
          <div class="flex gap-2 sm:gap-3">
            <button
              @click="openPrintModal"
              class="flex-1 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow hover:shadow-md hover:bg-blue-700 sm:px-6 sm:py-3 sm:text-sm"
            >
              <span class="sm:hidden">🖨️</span>
              <span class="hidden sm:inline">បោះពុម្ពរបាយការណ៍</span>
            </button>
            
            <button
              v-if="userProfile.role === 'admin'"
              @click="exportAllSessions"
              class="flex-1 px-3 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg shadow hover:shadow-md hover:bg-green-700 sm:px-6 sm:py-3 sm:text-sm"
            >
              <span class="sm:hidden">📊</span>
              <span class="hidden sm:inline">នាំចេញទិន្នន័យ</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="mb-6 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-3 sm:gap-6">
        <!-- Left: Filters -->
        <div class="p-4 bg-white border border-gray-100 shadow-md rounded-xl sm:p-6 lg:col-span-2 sm:rounded-2xl sm:shadow-xl">
          <h2 class="mb-3 text-base font-bold text-gray-800 sm:text-lg">ការជ្រើសរើស</h2>
          
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <!-- Date -->
            <div>
              <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">កាលបរិច្ឆេទ</label>
              <input
                v-model="selectedDate"
                :disabled="showAllDates"
                type="date"
                class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 sm:px-4 sm:py-3 sm:text-base sm:rounded-xl"
              />
              <div class="flex items-center gap-2 mt-2">
                <input id="allDates" type="checkbox" v-model="showAllDates" @change="loadSessionsForDate" class="w-3 h-3 sm:w-4 sm:h-4" />
                <label for="allDates" class="text-xs text-gray-600 sm:text-sm">ទាំងអស់</label>
              </div>
            </div>

            <!-- Class -->
            <div>
              <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">ថ្នាក់</label>
              <select
                v-model="selectedClassId"
                @change="loadSessionsForDate"
                :disabled="userProfile.role === 'classrep' || userProfile.role === 'student'"
                class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 sm:px-4 sm:py-3 sm:text-base sm:rounded-xl"
              >
                <option value="">ទាំងអស់</option>
                <option
                  v-for="cls in filteredClasses"
                  :key="cls.ClassId"
                  :value="cls.ClassId"
                >
                  {{ cls.ClassName }} {{ cls.ClassLetter }}
                </option>
              </select>
              <div v-if="userProfile.role === 'classrep' || userProfile.role === 'student'" class="mt-1 text-xs text-gray-500 sm:text-sm">
                ថ្នាក់៖ {{ userProfile.className }}
              </div>
            </div>

            <!-- Subject -->
            <div v-if="userProfile.role !== 'classrep' && userProfile.role !== 'student'">
              <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">មុខវិជ្ជា</label>
              <select
                v-model="selectedSubjectId"
                @change="loadSessionsForDate"
                class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:px-4 sm:py-3 sm:text-base sm:rounded-xl"
              >
                <option value="">ទាំងអស់</option>
                <option
                  v-for="sub in filteredSubjects"
                  :key="sub.SubjectId"
                  :value="sub.SubjectId"
                >
                  {{ sub.SubjectName }} {{ sub.subjectletter || '' }}
                </option>
              </select>
            </div>
          </div>

          <div class="flex gap-2 pt-4 mt-4 border-t border-gray-200 sm:pt-6 sm:mt-6 sm:gap-3">
            <button
              @click="loadSessionsForDate"
              class="flex-1 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg shadow hover:shadow-md hover:bg-indigo-700 sm:px-6 sm:py-3 sm:text-sm"
            >
              <span class="sm:hidden">🔍</span>
              <span class="hidden sm:inline">ស្វែងរក</span>
            </button>
            
            <button
              v-if="canCreateSession"
              @click="openCreateSessionModal"
              class="flex-1 px-3 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg shadow hover:shadow-md hover:bg-green-700 sm:px-6 sm:py-3 sm:text-sm"
            >
              <span class="sm:hidden">➕</span>
              <span class="hidden sm:inline">បង្កើតសម័យ</span>
            </button>
          </div>
        </div>

        <!-- Right: Session Info -->
        <div class="p-4 bg-white border border-gray-100 shadow-md rounded-xl sm:p-6 sm:rounded-2xl sm:shadow-xl">
          <h2 class="mb-3 text-base font-bold text-gray-800 sm:text-lg">ព័ត៌មានសម័យ</h2>
          
          <div v-if="selectedSession" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="text-xs text-gray-500 sm:text-sm">ឈ្មោះសម័យ</div>
                <div class="text-sm font-semibold text-gray-800 truncate sm:text-lg">{{ selectedSession.SessionName }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 sm:text-sm">ស្ថានភាព</div>
                <div :class="[
                  'inline-block px-2 py-0.5 text-xs font-semibold rounded-full sm:px-3 sm:py-1 sm:text-sm',
                  selectedSession.Status === 'open' ? 'bg-green-100 text-green-800' :
                  selectedSession.Status === 'closed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                ]">
                  {{ selectedSession.Status === 'open' ? 'បើក' : 'បិទ' }}
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="text-xs text-gray-500 sm:text-sm">ពេលចាប់ផ្តើម</div>
                <div class="text-sm font-semibold text-gray-800 sm:text-lg">{{ formatTime(selectedSession.StartTime) }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 sm:text-sm">ពេលបញ្ចប់</div>
                <div class="text-sm font-semibold text-gray-800 sm:text-lg">{{ formatTime(selectedSession.EndTime) }}</div>
              </div>
            </div>

            <div v-if="selectedSession.CreatorName" class="pt-3 border-t border-gray-200">
              <div class="text-xs text-gray-500 sm:text-sm">បង្កើតដោយ</div>
              <div class="text-sm font-medium text-gray-800 truncate sm:text-base">{{ selectedSession.CreatorName }}</div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col gap-2 pt-4">
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="openEditSessionModal(selectedSession)"
                  :disabled="!canEditSession(selectedSession)"
                  :class="[
                    'px-2 py-1.5 text-xs font-semibold text-white rounded-lg transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm',
                    canEditSession(selectedSession)
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  ]"
                >
                  <span class="sm:hidden">✏️</span>
                  <span class="hidden sm:inline">កែប្រែសម័យ</span>
                </button>
                <button
                  @click="toggleSessionStatus"
                  :disabled="!canChangeSessionStatus(selectedSession)"
                  :class="[
                    'px-2 py-1.5 text-xs font-semibold text-white rounded-lg transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm',
                    !canChangeSessionStatus(selectedSession)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : selectedSession.Status === 'open' 
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                  ]"
                >
                  <span v-if="selectedSession.Status === 'open'">🔒</span>
                  <span v-else>🔓</span>
                  <span class="hidden ml-1 sm:inline">
                    {{ selectedSession.Status === 'open' ? 'បិទសម័យ' : 'បើកសម័យ' }}
                  </span>
                </button>
              </div>
              
              <button
                v-if="userProfile.role === 'admin'"
                @click="deleteSession(selectedSession)"
                class="w-full px-2 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm"
              >
                <span class="sm:hidden">🗑️</span>
                <span class="hidden sm:inline">លុបសម័យ</span>
              </button>
              
              <button
                @click="printSingleSession(selectedSession.SessionID)"
                class="w-full px-2 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm"
              >
                <span class="sm:hidden">🖨️</span>
                <span class="hidden sm:inline">បោះពុម្ពសម័យនេះ</span>
              </button>
            </div>
          </div>
          
          <div v-else class="py-6 text-center">
            <div class="mb-3 text-4xl sm:text-6xl">📅</div>
            <p class="text-sm text-gray-600 sm:text-base">សូមជ្រើសរើសសម័យដើម្បីមើលព័ត៌មាន</p>
          </div>
        </div>
      </div>

      <!-- Sessions List -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-bold text-gray-800 sm:text-xl">សម័យប្រចាំថ្ងៃ</h2>
          <div class="text-xs text-gray-600 sm:text-sm">
            បានរកឃើញ {{ sessions.length }} សម័យ
          </div>
        </div>
        
        <!-- Loading -->
        <div v-if="loading" class="p-8 text-center">
          <div class="inline-block w-12 h-12 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin sm:w-16 sm:h-16"></div>
          <p class="mt-3 text-sm font-medium text-gray-600 sm:text-base">កំពុងផ្ទុកទិន្នន័យសម័យ...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="sessions.length === 0" class="p-6 text-center bg-white border border-gray-100 shadow-md rounded-xl sm:p-12 sm:rounded-2xl sm:shadow-xl">
          <div class="mb-3 text-4xl sm:mb-4 sm:text-6xl">📭</div>
          <p class="text-sm font-medium text-gray-600 sm:text-lg">មិនមានសម័យសម្រាប់កាលបរិច្ឆេទនេះ</p>
          <button
            v-if="canCreateSession"
            @click="openCreateSessionModal"
            class="px-4 py-2 mt-3 text-xs font-semibold text-white bg-green-600 rounded-lg shadow hover:shadow-md hover:bg-green-700 sm:mt-4 sm:px-6 sm:py-3 sm:text-sm"
          >
            ➕ បង្កើតសម័យថ្មី
          </button>
        </div>

        <!-- Sessions Grid -->
        <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <div
            v-for="session in sessions"
            :key="session.SessionID"
            @click="selectSession(session)"
            :class="[
              'p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 sm:p-6 sm:rounded-2xl',
              selectedSession?.SessionID === session.SessionID
                ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                : 'border-gray-200 bg-white shadow-md hover:shadow-lg'
            ]"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-bold text-gray-800 truncate sm:text-lg">{{ session.SessionName }}</h3>
                <div class="flex items-center gap-1 mt-1">
                  <div :class="[
                    'w-1.5 h-1.5 rounded-full sm:w-2 sm:h-2',
                    session.Status === 'open' ? 'bg-green-500' : 'bg-red-500'
                  ]"></div>
                  <span class="text-xs text-gray-600 sm:text-sm">
                    {{ session.Status === 'open' ? 'បើក' : 'បិទ' }}
                  </span>
                  <span v-if="session.SubjectName" class="ml-1 px-1.5 py-0.5 text-xs font-medium text-blue-600 bg-blue-100 rounded-full truncate sm:text-sm">
                    {{ session.SubjectName }}
                  </span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-500 sm:text-sm">ថ្នាក់</div>
                <div class="text-sm font-semibold text-gray-800 sm:text-lg">
                  {{ session.ClassName }} {{ session.ClassLetter }}
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div class="text-xs text-gray-500 sm:text-sm">ចាប់ផ្តើម</div>
                <div class="text-sm font-semibold text-gray-800 sm:text-base">{{ formatTime(session.StartTime) }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 sm:text-sm">បញ្ចប់</div>
                <div class="text-sm font-semibold text-gray-800 sm:text-base">{{ formatTime(session.EndTime) }}</div>
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-gray-200">
              <div class="text-xs text-gray-600 sm:text-sm">
                {{ formatDate(session.SessionDate) }}
                <div v-if="session.CreatorName" class="text-xs text-gray-500 truncate sm:text-xs">
                  ដោយ: {{ session.CreatorName }}
                </div>
              </div>
              <div class="flex gap-1.5 sm:gap-2">
                <button
                  @click.stop="openAttendanceModal(session)"
                  :disabled="!canTakeAttendance(session)"
                  :class="[
                    'px-2 py-1 text-xs font-semibold text-white rounded-lg transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm',
                    canTakeAttendance(session)
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  ]"
                >
                  <span class="hidden sm:inline">សម្គាល់</span>
                  <span class="sm:hidden">✓</span>
                </button>
                <button
                  @click.stop="printSingleSession(session.SessionID)"
                  class="px-2 py-1 text-xs font-semibold text-purple-600 transition-all duration-200 bg-purple-100 rounded-lg hover:bg-purple-200 sm:px-3 sm:py-2 sm:text-sm"
                >
                  <span class="sm:hidden">🖨️</span>
                  <span class="hidden sm:inline">បោះពុម្ព</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance Summary -->
      <div v-if="selectedSession && attendanceRecords.length > 0" class="mb-6">
        <div class="p-4 bg-white border border-gray-100 shadow-md rounded-xl sm:p-6 sm:rounded-2xl sm:shadow-xl">
          <h2 class="mb-4 text-base font-bold text-gray-800 sm:text-xl">ស្ថិតិវត្តមាន</h2>
          
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            <div v-for="stat in attendanceStats" :key="stat.label" class="text-center">
              <div class="mb-1 text-2xl sm:mb-2 sm:text-4xl">{{ stat.icon }}</div>
              <div class="text-xl font-bold sm:text-2xl" :style="{ color: stat.color }">{{ stat.count }}</div>
              <div class="text-xs text-gray-600 sm:text-sm">{{ stat.label }}</div>
              <div class="text-xs text-gray-500 sm:text-xs">{{ stat.percentage }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Print Modal -->
      <div
        v-if="showPrintModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      >
        <div class="w-full max-w-md bg-white shadow-2xl rounded-xl sm:max-w-2xl sm:rounded-2xl">
          <div class="flex items-center justify-between p-4 border-b border-gray-200 sm:p-6">
            <h2 class="text-lg font-bold text-gray-800 sm:text-xl">បោះពុម្ពរបាយការណ៍</h2>
            <button
              @click="closePrintModal"
              class="text-xl text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div class="p-4 overflow-y-auto max-h-[60vh] sm:p-6">
            <div class="mb-6">
              <h3 class="mb-3 text-base font-semibold text-gray-800 sm:text-lg">ជម្រើសបោះពុម្ព</h3>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  @click="printCurrentSession"
                  :disabled="!selectedSession"
                  :class="[
                    'p-4 border-2 rounded-xl text-left transition-all duration-200 sm:p-6',
                    selectedSession
                      ? 'border-blue-500 bg-blue-50 hover:bg-blue-100 cursor-pointer'
                      : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                  ]"
                >
                  <div class="mb-2 text-2xl sm:text-3xl">📄</div>
                  <h4 class="mb-1 text-sm font-bold text-gray-800 sm:text-base">បោះពុម្ពសម័យបច្ចុប្បន្ន</h4>
                  <p class="text-xs text-gray-600 sm:text-sm">
                    {{ selectedSession ? selectedSession.SessionName : 'សូមជ្រើសរើសសម័យមុន' }}
                  </p>
                </button>

                <button
                  @click="openBulkPrintModal"
                  class="p-4 text-left transition-all duration-200 border-2 border-green-500 rounded-xl bg-green-50 hover:bg-green-100 sm:p-6"
                >
                  <div class="mb-2 text-2xl sm:text-3xl">📊</div>
                  <h4 class="mb-1 text-sm font-bold text-gray-800 sm:text-base">បោះពុម្ពជាក្រុម</h4>
                  <p class="text-xs text-gray-600 sm:text-sm">បោះពុម្ពសម័យច្រើនតាមកាលកំណត់ ឬថ្នាក់</p>
                </button>
              </div>
            </div>

            <div v-if="selectedSession" class="p-4 bg-gray-50 rounded-xl sm:p-6">
              <h4 class="mb-3 text-sm font-semibold text-gray-800 sm:text-base">សម័យបច្ចុប្បន្ន</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <div class="text-xs text-gray-500 sm:text-sm">ឈ្មោះសម័យ</div>
                  <div class="text-sm font-medium text-gray-800 sm:text-base">{{ selectedSession.SessionName }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 sm:text-sm">កាលបរិច្ឆេទ</div>
                  <div class="text-sm font-medium text-gray-800 sm:text-base">{{ formatDate(selectedSession.SessionDate) }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 sm:text-sm">ពេលវេលា</div>
                  <div class="text-sm font-medium text-gray-800 sm:text-base">{{ formatTime(selectedSession.StartTime) }} - {{ formatTime(selectedSession.EndTime) }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 sm:text-sm">ថ្នាក់</div>
                  <div class="text-sm font-medium text-gray-800 sm:text-base">{{ selectedSession.ClassName }} {{ selectedSession.ClassLetter }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-2 p-4 border-t border-gray-200 sm:gap-3 sm:p-6">
            <button
              @click="closePrintModal"
              class="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 sm:px-6 sm:py-3"
            >
              បោះបង់
            </button>
            <button
              v-if="selectedSession"
              @click="printCurrentSession"
              class="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 sm:px-6 sm:py-3"
            >
              🖨️ បោះពុម្ព
            </button>
          </div>
        </div>
      </div>

      <!-- Bulk Print Modal -->
      <div
        v-if="showBulkPrintModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      >
        <div class="w-full h-full max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col sm:max-w-6xl sm:rounded-2xl">
          <div class="flex items-center justify-between p-4 border-b border-gray-200 sm:p-6">
            <h2 class="text-lg font-bold text-gray-800 sm:text-xl">បោះពុម្ពសម័យជាក្រុម</h2>
            <button
              @click="closeBulkPrintModal"
              class="text-xl text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div class="flex-1 overflow-auto">
            <div class="p-4 sm:p-6">
              <!-- Filters -->
              <div class="p-4 mb-4 bg-gray-50 rounded-xl sm:p-6">
                <h3 class="mb-3 text-base font-semibold text-gray-800 sm:text-lg">ការតំរង់ត្រា</h3>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">ពីកាលបរិច្ឆេទ</label>
                    <input
                      v-model="printFilters.startDate"
                      type="date"
                      class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:px-4 sm:py-3 sm:rounded-xl"
                    />
                  </div>
                  <div>
                    <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">ដល់កាលបរិច្ឆេទ</label>
                    <input
                      v-model="printFilters.endDate"
                      type="date"
                      class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:px-4 sm:py-3 sm:rounded-xl"
                    />
                  </div>

                  <div>
                    <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">ថ្នាក់</label>
                    <select
                      v-model="printFilters.classId"
                      class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:px-4 sm:py-3 sm:rounded-xl"
                    >
                      <option value="">ទាំងអស់</option>
                      <option
                        v-for="cls in classes"
                        :key="cls.ClassId"
                        :value="cls.ClassId"
                      >
                        {{ cls.ClassName }} {{ cls.ClassLetter }}
                      </option>
                    </select>
                  </div>

                  <div v-if="userProfile.role === 'admin'">
                    <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">មុខវិជ្ជា</label>
                    <select
                      v-model="printFilters.subjectId"
                      class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:px-4 sm:py-3 sm:rounded-xl"
                    >
                      <option value="">ទាំងអស់</option>
                      <option
                        v-for="sub in subjects"
                        :key="sub.SubjectId"
                        :value="sub.SubjectId"
                      >
                        {{ sub.SubjectName }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="flex justify-end gap-2 mt-4 sm:mt-6 sm:gap-3">
                  <button
                    @click="resetPrintFilters"
                    class="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 sm:px-6 sm:py-3"
                  >
                    កំណត់ឡើងវិញ
                  </button>
                  <button
                    @click="loadSessionsForPrint"
                    :disabled="loadingPrintSessions"
                    class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 sm:px-6 sm:py-3"
                  >
                    <span v-if="loadingPrintSessions" class="flex items-center gap-2">
                      <div class="w-3 h-3 border-2 border-white rounded-full border-t-transparent animate-spin sm:w-4 sm:h-4"></div>
                      កំពុងផ្ទុក...
                    </span>
                    <span v-else>ស្វែងរកសម័យ</span>
                  </button>
                </div>
              </div>

              <!-- Sessions List -->
              <div v-if="loadingPrintSessions" class="p-8 text-center">
                <div class="inline-block w-8 h-8 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin sm:w-12 sm:h-12"></div>
                <p class="mt-3 text-sm font-medium text-gray-600">កំពុងផ្ទុកសម័យ...</p>
              </div>

              <div v-else-if="printSessions.length > 0">
                <!-- Selection Controls -->
                <div class="p-3 mb-3 bg-blue-50 rounded-xl sm:p-4">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="selectAll"
                          :checked="allSessionsSelected"
                          @change="toggleSelectAllSessions"
                          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label for="selectAll" class="text-sm font-medium text-gray-700 sm:text-base">ជ្រើសរើសទាំងអស់</label>
                      </div>
                      <span class="text-xs text-gray-600 sm:text-sm">
                        បានជ្រើសរើស {{ selectedPrintSessions.length }} នៃ {{ printSessions.length }} សម័យ
                      </span>
                    </div>
                    <button
                      @click="printSelectedSessions"
                      :disabled="selectedPrintSessions.length === 0"
                      class="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 sm:px-6 sm:py-2 sm:text-sm"
                    >
                      🖨️ បោះពុម្ពដែលបានជ្រើស ({{ selectedPrintSessions.length }})
                    </button>
                  </div>
                </div>

                <!-- Sessions Table -->
                <div class="overflow-x-auto border border-gray-200 rounded-lg">
                  <table class="w-full min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="w-12 px-3 py-2">
                          <input
                            type="checkbox"
                            :checked="allSessionsSelected"
                            @change="toggleSelectAllSessions"
                            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </th>
                        <th class="px-3 py-2 text-xs font-semibold text-left text-gray-700 sm:text-sm">សម័យ</th>
                        <th class="px-3 py-2 text-xs font-semibold text-left text-gray-700 sm:text-sm">កាលបរិច្ឆេទ</th>
                        <th class="px-3 py-2 text-xs font-semibold text-left text-gray-700 sm:text-sm">ពេលវេលា</th>
                        <th class="px-3 py-2 text-xs font-semibold text-left text-gray-700 sm:text-sm">ថ្នាក់</th>
                        <th class="px-3 py-2 text-xs font-semibold text-left text-gray-700 sm:text-sm">មុខវិជ្ជា</th>
                        <th class="px-3 py-2 text-xs font-semibold text-left text-gray-700 sm:text-sm">ស្ថានភាព</th>
                        <th class="px-3 py-2 text-xs font-semibold text-left text-gray-700 sm:text-sm">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="session in printSessions" :key="session.SessionID">
                        <td class="px-3 py-2">
                          <input
                            type="checkbox"
                            :value="session.SessionID"
                            v-model="selectedPrintSessions"
                            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-3 py-2">
                          <div class="text-xs font-medium text-gray-900 truncate max-w-25 sm:text-sm sm:max-w-none">{{ session.SessionName }}</div>
                        </td>
                        <td class="px-3 py-2 text-xs text-gray-700 sm:text-sm">{{ formatDate(session.SessionDate) }}</td>
                        <td class="px-3 py-2 text-xs text-gray-700 sm:text-sm">
                          {{ formatTime(session.StartTime) }} - {{ formatTime(session.EndTime) }}
                        </td>
                        <td class="px-3 py-2 text-xs text-gray-700 sm:text-sm">{{ session.ClassName }} {{ session.ClassLetter }}</td>
                        <td class="px-3 py-2 text-xs text-gray-700 sm:text-sm">{{ session.SubjectName || 'គ្មាន' }}</td>
                        <td class="px-3 py-2">
                          <span :class="[
                            'px-2 py-0.5 text-xs font-semibold rounded-full sm:px-3 sm:py-1',
                            session.Status === 'open' ? 'bg-green-100 text-green-800' :
                            session.Status === 'closed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          ]">
                            {{ session.Status === 'open' ? 'បើក' : 'បិទ' }}
                          </span>
                        </td>
                        <td class="px-3 py-2">
                          <button
                            @click="printSingleSession(session.SessionID)"
                            class="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 sm:px-3 sm:py-1 sm:text-sm"
                          >
                            🖨️
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Summary -->
                <div class="grid grid-cols-2 gap-3 p-4 mt-4 bg-gray-50 rounded-xl sm:grid-cols-4 sm:p-4">
                  <div class="text-center">
                    <div class="text-lg font-bold text-gray-800 sm:text-2xl">{{ printSessions.length }}</div>
                    <div class="text-xs text-gray-600 sm:text-sm">សម័យសរុប</div>
                  </div>
                  <div class="text-center">
                    <div class="text-lg font-bold text-green-600 sm:text-2xl">
                      {{ printSessions.filter(s => s.Status === 'open').length }}
                    </div>
                    <div class="text-xs text-gray-600 sm:text-sm">សម័យបើក</div>
                  </div>
                  <div class="text-center">
                    <div class="text-lg font-bold text-red-600 sm:text-2xl">
                      {{ printSessions.filter(s => s.Status === 'closed').length }}
                    </div>
                    <div class="text-xs text-gray-600 sm:text-sm">សម័យបិទ</div>
                  </div>
                  <div class="text-center">
                    <div class="text-lg font-bold text-blue-600 sm:text-2xl">{{ selectedPrintSessions.length }}</div>
                    <div class="text-xs text-gray-600 sm:text-sm">បានជ្រើសរើស</div>
                  </div>
                </div>
              </div>

              <div v-else class="p-8 text-center bg-gray-50 rounded-xl">
                <div class="mb-3 text-4xl sm:mb-4 sm:text-6xl">📭</div>
                <p class="text-sm font-medium text-gray-600 sm:text-base">មិនមានសម័យតាមលក្ខខណ្ឌតំរង់ត្រា</p>
                <p class="text-xs text-gray-500 sm:text-sm">សូមជ្រើសរើសលក្ខខណ្ឌតំរង់ត្រាផ្សេង</p>
              </div>
            </div>
          </div>

          <div class="flex gap-2 p-4 border-t border-gray-200 sm:gap-3 sm:p-6">
            <button
              @click="closeBulkPrintModal"
              class="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 sm:px-6 sm:py-3"
            >
              បិទ
            </button>
            <button
              v-if="selectedPrintSessions.length > 0"
              @click="printSelectedSessions"
              class="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 sm:px-6 sm:py-3"
            >
              🖨️ បោះពុម្ព ({{ selectedPrintSessions.length }})
            </button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Session Modal -->
      <div
        v-if="showSessionModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      >
        <div class="w-full max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col sm:max-w-2xl sm:rounded-2xl">
          <div class="flex items-center justify-between p-4 border-b border-gray-200 sm:p-6">
            <h2 class="text-lg font-bold text-gray-800 sm:text-xl">
              {{ isEditingSession ? 'កែប្រែសម័យ' : 'បង្កើតសម័យថ្មី' }}
            </h2>
            <button
              @click="closeSessionModal"
              class="text-xl text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div class="flex-1 p-4 overflow-y-auto sm:p-6">
            <form @submit.prevent="saveSession">
              <div class="space-y-4 sm:space-y-6">
                <div v-if="userProfile.role !== 'classrep'">
                  <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">មុខវិជ្ជា</label>
                  <select
                    v-model="sessionForm.SubjectID"
                    @change="onSubjectChange"
                    class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:px-4 sm:py-3 sm:text-base sm:rounded-xl"
                  >
                    <option value="">ជ្រើសរើសមុខវិជ្ជា</option>
                    <option 
                      v-for="sub in filteredSubjects" 
                      :key="sub.SubjectId" 
                      :value="sub.SubjectId"
                    >
                      {{ sub.SubjectName }} {{ sub.subjectletter || '' }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">ឈ្មោះសម័យ</label>
                  <input
                    v-model="sessionForm.SessionName"
                    @input="sessionNameEdited = true"
                    type="text"
                    required
                    class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:px-4 sm:py-3 sm:text-base sm:rounded-xl"
                    placeholder="ឧទាហរណ៍៖ មុខវិជ្ជា + កាលបរិច្ឆេទ + ម៉ោង"
                  />
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">កាលបរិច្ឆេទ</label>
                    <input
                      v-model="sessionForm.SessionDate"
                      type="date"
                      required
                      class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:px-4 sm:py-3 sm:text-base sm:rounded-xl"
                    />
                  </div>

                  <div>
                    <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">ថ្នាក់</label>
                    <select
                      v-model="sessionForm.ClassID"
                      required
                      class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:px-4 sm:py-3 sm:text-base sm:rounded-xl"
                    >
                      <option disabled value="">ជ្រើសរើសថ្នាក់</option>
                      <option
                        v-for="cls in filteredClasses"
                        :key="cls.ClassId"
                        :value="cls.ClassId"
                      >
                        {{ cls.ClassName }} {{ cls.ClassLetter }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">ពេលចាប់ផ្តើម</label>
                    <input
                      v-model="sessionForm.StartTime"
                      type="time"
                      required
                      class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:px-4 sm:py-3 sm:text-base sm:rounded-xl"
                    />
                  </div>

                  <div>
                    <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">ពេលបញ្ចប់</label>
                    <input
                      v-model="sessionForm.EndTime"
                      type="time"
                      required
                      class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:px-4 sm:py-3 sm:text-base sm:rounded-xl"
                    />
                  </div>
                </div>

                <div v-if="userProfile.role !== 'classrep'">
                  <label class="block mb-1 text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm">ស្ថានភាព</label>
                  <select
                    v-model="sessionForm.Status"
                    class="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:px-4 sm:py-3 sm:text-base sm:rounded-xl"
                  >
                    <option value="open">បើក</option>
                    <option value="closed">បិទ</option>
                    <option value="pending">កំពុងរង់ចាំ</option>
                  </select>
                </div>
              </div>

              <div class="flex gap-2 pt-6 mt-6 border-t border-gray-200 sm:gap-3">
                <button
                  type="button"
                  @click="closeSessionModal"
                  class="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 sm:px-6 sm:py-3"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  class="flex-1 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow hover:shadow-md hover:bg-indigo-700 sm:px-6 sm:py-3"
                >
                  {{ isEditingSession ? 'រក្សាទុក' : 'បង្កើត' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Attendance Modal -->
      <div
        v-if="showAttendanceModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black bg-opacity-50 backdrop-blur-sm sm:p-4"
      >
        <div class="w-full h-full max-h-[95vh] bg-white rounded-xl shadow-2xl flex flex-col sm:max-w-6xl sm:rounded-2xl">
          <div class="flex items-center justify-between p-4 border-b border-gray-200 sm:p-6">
            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-bold text-gray-800 truncate sm:text-xl">ការសម្គាល់វត្តមាន</h2>
              <p class="text-xs text-gray-600 truncate sm:text-sm">
                {{ selectedSession?.SessionName }} - {{ formatDate(selectedSession?.SessionDate) }}
              </p>
            </div>
            <button
              @click="closeAttendanceModal"
              class="text-xl text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div class="flex-1 overflow-auto">
            <div v-if="loadingAttendance" class="p-8 text-center">
              <div class="inline-block w-8 h-8 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin sm:w-12 sm:h-12"></div>
              <p class="mt-3 text-sm font-medium text-gray-600">កំពុងផ្ទុកទិន្នន័យសិស្ស...</p>
            </div>

            <div v-else class="p-4 sm:p-6">
              <!-- Quick Actions -->
              <div class="flex flex-wrap gap-2 p-3 mb-4 rounded-lg bg-gray-50 sm:p-4 sm:mb-6 sm:rounded-xl">
                <div v-for="status in attendanceStatuses" :key="status.StatusID" class="flex items-center gap-1">
                  <button
                    @click="applyStatusToAll(status.StatusID)"
                    :style="{ backgroundColor: status.Color }"
                    class="px-3 py-1.5 text-xs font-semibold text-white rounded hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    {{ status.StatusName }}
                  </button>
                </div>
              </div>

              <!-- Attendance Table (Desktop) -->
              <div class="hidden overflow-x-auto border border-gray-200 rounded-lg md:block">
                <table class="w-full min-w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-3 py-2 text-xs font-semibold text-left text-gray-700 sm:px-6 sm:py-4 sm:text-sm">ល.រ</th>
                      <th class="px-3 py-2 text-xs font-semibold text-left text-gray-700 sm:px-6 sm:py-4 sm:text-sm">រូបភាព</th>
                      <th class="px-3 py-2 text-xs font-semibold text-left text-gray-700 sm:px-6 sm:py-4 sm:text-sm">ឈ្មោះ</th>
                      <th v-for="status in attendanceStatuses" :key="status.StatusID" class="px-3 py-2 text-xs font-semibold text-center text-gray-700 sm:px-6 sm:py-4 sm:text-sm">
                        {{ status.StatusName }}
                      </th>
                      <th class="px-3 py-2 text-xs font-semibold text-left text-gray-700 sm:px-6 sm:py-4 sm:text-sm">មូលហេតុ</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="(student, index) in studentsInClass" :key="student.StudentID">
                      <td class="px-3 py-2 text-xs font-medium text-gray-900 sm:px-6 sm:py-4 sm:text-sm">{{ index + 1 }}</td>
                      <td class="px-3 py-2">
                        <div class="w-8 h-8 overflow-hidden rounded-full sm:w-12 sm:h-12">
                          <img
                            :src="imagePreview(student.StudentPicture)"
                            alt=""
                            class="object-cover w-full h-full"
                          />
                        </div>
                      </td>
                      <td class="px-3 py-2">
                        <div class="text-xs font-medium text-gray-900 truncate max-w-20 sm:text-sm sm:max-w-none">
                          {{ student.StudentFirstname }} {{ student.StudentLastname }}
                        </div>
                        <div class="text-xs text-gray-500 sm:text-xs">{{ student.StudentID }}</div>
                      </td>
                      
                      <!-- Status Radio Buttons -->
                      <td v-for="status in attendanceStatuses" :key="status.StatusID" class="px-3 py-2 text-center">
                        <input
                          type="radio"
                          :name="'attendance-' + student.StudentID"
                          :value="status.StatusID"
                          :checked="getStudentAttendance(student.StudentID)?.StatusID === status.StatusID"
                          @change="updateAttendance(student.StudentID, status.StatusID)"
                          class="w-3 h-3 text-indigo-600 border-gray-300 focus:ring-indigo-500 sm:w-4 sm:h-4"
                        />
                      </td>

                      <!-- Reason Field -->
                      <td class="px-3 py-2">
                        <input
                          type="text"
                          :value="getStudentAttendance(student.StudentID)?.reason || ''"
                          @input="updateAttendanceReason(student.StudentID, $event.target.value)"
                          placeholder="មូលហេតុ"
                          class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:px-3 sm:py-2 sm:text-sm"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Attendance Cards (Mobile) -->
              <div class="space-y-3 md:hidden">
                <div v-for="(student, index) in studentsInClass" :key="student.StudentID" class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div class="flex items-center gap-3 mb-3">
                    <div class="text-xs font-semibold text-gray-500">{{ index + 1 }}</div>
                    <div class="w-10 h-10 overflow-hidden rounded-full shrink-0">
                      <img
                        :src="imagePreview(student.StudentPicture)"
                        alt=""
                        class="object-cover w-full h-full"
                      />
                    </div>
                    <div class="flex-1">
                      <div class="text-sm font-semibold text-gray-900">
                        {{ student.StudentFirstname }} {{ student.StudentLastname }}
                      </div>
                      <div class="text-xs text-gray-500">{{ student.StudentID }}</div>
                    </div>
                  </div>

                  <!-- Status Buttons (Mobile) -->
                  <div class="mb-3">
                    <div class="mb-2 text-xs font-semibold text-gray-600">ស្ថានភាព:</div>
                    <div class="flex flex-wrap gap-2">
                      <label v-for="status in attendanceStatuses" :key="status.StatusID" class="inline-flex items-center">
                        <input
                          type="radio"
                          :name="'attendance-' + student.StudentID"
                          :value="status.StatusID"
                          :checked="getStudentAttendance(student.StudentID)?.StatusID === status.StatusID"
                          @change="updateAttendance(student.StudentID, status.StatusID)"
                          class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span class="ml-2 text-sm font-medium text-gray-700">{{ status.StatusName }}</span>
                      </label>
                    </div>
                  </div>

                  <!-- Reason Field (Mobile) -->
                  <div>
                    <label class="block mb-1 text-xs font-semibold text-gray-600">មូលហេតុ:</label>
                    <input
                      type="text"
                      :value="getStudentAttendance(student.StudentID)?.reason || ''"
                      @input="updateAttendanceReason(student.StudentID, $event.target.value)"
                      placeholder="សរសេរមូលហេតុ..."
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <!-- Save Button -->
              <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-200 sm:gap-3 sm:pt-6 sm:mt-6">
                <button
                  @click="closeAttendanceModal"
                  class="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 sm:px-6 sm:py-3"
                >
                  បោះបង់
                </button>
                <button
                  @click="saveAttendance"
                  class="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow hover:shadow-md hover:bg-green-700 disabled:opacity-50 sm:px-6 sm:py-3"
                  :disabled="savingAttendance"
                >
                  <span v-if="savingAttendance" class="flex items-center gap-2">
                    <div class="w-3 h-3 border-2 border-white rounded-full border-t-transparent animate-spin sm:w-4 sm:h-4"></div>
                    កំពុងរក្សាទុក...
                  </span>
                  <span v-else>រក្សាទុកវត្តមាន</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { imagePreview, formatDate, formatTime, API_BASE_URL } from '../utils/helpers';

// State
const userProfile = ref({});
const loading = ref(false);
const imageError = ref(false);
const loadingAttendance = ref(false);
const savingAttendance = ref(false);
const loadingPrintSessions = ref(false);
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const selectedClassId = ref('');
const selectedSubjectId = ref('');
const showAllDates = ref(false);
const selectedSession = ref(null);
const sessions = ref([]);
const classes = ref([]);
const subjects = ref([]);
const studentsInClass = ref([]);
const attendanceRecords = ref([]);
const attendanceStatuses = ref([]);
const notifications = ref([]);
const showSessionModal = ref(false);
const showAttendanceModal = ref(false);
const showPrintModal = ref(false);
const showBulkPrintModal = ref(false);
const isEditingSession = ref(false);
const sessionNameEdited = ref(false);
const printSessions = ref([]);
const selectedPrintSessions = ref([]);
const userClasses = ref([]);
const userSubjects = ref([]);

// Forms
const sessionForm = ref({
  SessionID: null,
  SessionName: '',
  SessionDate: selectedDate.value,
  ClassID: '',
  SubjectID: '',
  StartTime: '07:00',
  EndTime: '08:00',
  Status: 'open'
});

const printFilters = ref({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  classId: '',
  subjectId: ''
});

// Computed Properties
const attendanceStats = computed(() => {
  const total = attendanceRecords.value.length;
  const present = attendanceRecords.value.filter(r => 
    ['P', 'H'].includes(getStatusCode(r.StatusID))
  ).length;
  const absent = attendanceRecords.value.filter(r => 
    ['A'].includes(getStatusCode(r.StatusID))
  ).length;
  const late = attendanceRecords.value.filter(r => 
    ['L'].includes(getStatusCode(r.StatusID))
  ).length;
  const excused = attendanceRecords.value.filter(r => 
    ['E'].includes(getStatusCode(r.StatusID))
  ).length;

  return [
    { icon: '✅', label: 'បានមក', count: present, percentage: total ? Math.round((present / total) * 100) : 0, color: '#10B981' },
    { icon: '❌', label: 'អវត្តមាន', count: absent, percentage: total ? Math.round((absent / total) * 100) : 0, color: '#EF4444' },
    { icon: '⏰', label: 'យឺត', count: late, percentage: total ? Math.round((late / total) * 100) : 0, color: '#F59E0B' },
    { icon: '📝', label: 'អនុញ្ញាត', count: excused, percentage: total ? Math.round((excused / total) * 100) : 0, color: '#7C3AED' }
  ];
});

const filteredClasses = computed(() => {
  if (userProfile.value.role === 'admin') return classes.value;
  if (userProfile.value.role === 'teacher') return userClasses.value;
  if (userProfile.value.role === 'classrep') {
    return classes.value.filter(cls => cls.ClassId === userClasses.value[0]?.ClassId);
  }
  return [];
});

const filteredSubjects = computed(() => {
  if (userProfile.value.role === 'admin') return subjects.value;
  if (userProfile.value.role === 'teacher') return userSubjects.value;
  return [];
});

const allSessionsSelected = computed(() => {
  return printSessions.value.length > 0 && 
         selectedPrintSessions.value.length === printSessions.value.length;
});

const canCreateSession = computed(() => {
  const role = userProfile.value.role;
  if (role === 'admin' || role === 'teacher') return true;
  if (role === 'classrep' && !showAllDates.value) return true;
  return false;
});

const avatarUrl = computed(() => {
  if (imageError.value) return '';
  const raw = userProfile.value.Photo || 
              userProfile.value.photoUrl || 
              userProfile.value.PhotoUrl || 
              userProfile.value.photoPath || 
              userProfile.value.PhotoPath || 
              userProfile.value.profilePic;
  return imagePreview(raw);
});

// Helper Functions
const notify = (message, type = 'info', timeout = 4000) => {
  const id = Date.now() + Math.random();
  notifications.value.push({ id, message, type });
  setTimeout(() => {
    const idx = notifications.value.findIndex((n) => n.id === id);
    if (idx !== -1) notifications.value.splice(idx, 1);
  }, timeout);
};

const closeNotification = (id) => {
  const idx = notifications.value.findIndex((n) => n.id === id);
  if (idx !== -1) notifications.value.splice(idx, 1);
};

const handleImageError = () => {
  imageError.value = true;
};

const getRoleName = (role) => {
  const roles = {
    'admin': 'អ្នកគ្រប់គ្រង',
    'teacher': 'គ្រូ',
    'classrep': 'ប្រធានថ្នាក់',
    'student': 'សិស្ស'
  };
  return roles[role] || role;
};

const getClassName = (classId) => {
  const cls = classes.value.find(c => c.ClassId === classId);
  return cls ? `${cls.ClassName} ${cls.ClassLetter}` : 'គ្មាន';
};

const getStatusCode = (statusId) => {
  const status = attendanceStatuses.value.find(s => s.StatusID === statusId);
  return status ? status.StatusCode : '';
};

const getStudentAttendance = (studentId) => {
  if (!Array.isArray(attendanceRecords.value)) return undefined;
  return attendanceRecords.value.find(record => 
    record.StudentID === studentId && 
    record.SessionID === selectedSession.value?.SessionID
  );
};

// Permission Helpers
const canEditSession = (session) => {
  const role = userProfile.value.role;
  if (role === 'admin') return true;
  if (role === 'teacher') {
    return session.Status !== 'closed';
  }
  if (role === 'classrep') {
    const isCreator = session.CreatorName?.includes(userProfile.value.firstName);
    return isCreator && session.Status === 'open' && session.ClassID === userProfile.value.classId;
  }
  return false;
};

const canChangeSessionStatus = (session) => {
  const role = userProfile.value.role;
  if (role === 'admin') return true;
  if (role === 'teacher') {
    return session.Status !== 'closed' || role === 'admin';
  }
  return false;
};

const canTakeAttendance = (session) => {
  if (session.Status !== 'open') return false;
  const role = userProfile.value.role;
  if (role === 'admin') return true;
  if (role === 'teacher') return true;
  if (role === 'classrep') {
    return session.ClassID === userProfile.value.classId;
  }
  return false;
};

const loadUserResources = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const res = await fetch(`${API_BASE_URL}/attendance/user-resources`, {
      headers: getAuthHeaders()
    });
    
    const data = await res.json();
    
    if (data.success) {
      classes.value = data.data.classes || [];
      subjects.value = data.data.subjects || [];
      userClasses.value = data.data.classes || [];
      userSubjects.value = data.data.subjects || [];
      
      if (userProfile.value.role === 'classrep' || userProfile.value.role === 'student') {
        selectedClassId.value = userProfile.value.classId || '';
      }
    }
  } catch (error) {
    console.error('Error loading user resources:', error);
  }
};

const loadUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders()
    });
    
    const data = await res.json();
    
    if (data.success) {
      userProfile.value = { ...userProfile.value, ...data.data };
      if (userProfile.value.role) userProfile.value.role = userProfile.value.role.toLowerCase();
      
      // Notify other components (App.vue, Navbar, Sidebar) about the profile update
      const event = new CustomEvent('profile-updated', { detail: data.data });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
};

// API Functions
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const loadSessionsForDate = async () => {
  try {
    loading.value = true;
    
    let url = `${API_BASE_URL}/attendance/sessions`;
    const params = [];
    
    if (!showAllDates.value && selectedDate.value) {
      params.push(`date=${selectedDate.value}`);
    }
    if (selectedClassId.value) {
      params.push(`classId=${selectedClassId.value}`);
    }
    if (selectedSubjectId.value && userProfile.value.role !== 'classrep' && userProfile.value.role !== 'student') {
      params.push(`subjectId=${selectedSubjectId.value}`);
    }
    
    if (params.length) url += `?${params.join('&')}`;
    
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    
    const data = await res.json();
    
    if (data.success) {
      sessions.value = data.data;
      if (sessions.value.length > 0 && !selectedSession.value) {
        selectSession(sessions.value[0]);
      }
    }
    loading.value = false;
  } catch (error) {
    console.error('Error loading sessions:', error);
    loading.value = false;
    notify('កំហុសក្នុងការផ្ទុកទិន្នន័យសម័យ', 'error');
  }
};

const loadAttendanceStatuses = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/attendance/statuses`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      attendanceStatuses.value = data.data;
    }
  } catch (error) {
    console.error('Error loading attendance statuses:', error);
  }
};

const loadStudentsForClass = async (classId) => {
  try {
    loadingAttendance.value = true;
    const res = await fetch(`${API_BASE_URL}/classes/${classId}/students?limit=100`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    
    if (data.success) {
      studentsInClass.value = data.data.students || [];
    }
    loadingAttendance.value = false;
  } catch (error) {
    console.error('Error loading students:', error);
    loadingAttendance.value = false;
    notify('កំហុសក្នុងការផ្ទុកទិន្នន័យសិស្ស', 'error');
  }
};

const loadAttendanceForSession = async (sessionId) => {
  attendanceRecords.value = [];
  try {
    const res = await fetch(`${API_BASE_URL}/attendance/session/${sessionId}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    
    if (data.success) {
      attendanceRecords.value = Array.isArray(data.data) ? data.data : [];
    } else {
      attendanceRecords.value = [];
    }
  } catch (error) {
    console.error('Error loading attendance:', error);
    attendanceRecords.value = [];
  }
};

// Session Functions
const selectSession = async (session) => {
  selectedSession.value = session;
  selectedClassId.value = session.ClassID;
  await loadAttendanceForSession(session.SessionID);
};

const openCreateSessionModal = () => {
  isEditingSession.value = false;
  sessionForm.value = {
    SessionID: null,
    SessionName: '',
    SessionDate: selectedDate.value,
    ClassID: selectedClassId.value || '',
    SubjectID: '',
    StartTime: '07:00',
    EndTime: '08:00',
    Status: 'open'
  };
  sessionNameEdited.value = false;
  showSessionModal.value = true;
};

const openEditSessionModal = (session) => {
  isEditingSession.value = true;
  sessionForm.value = { ...session };
  sessionNameEdited.value = true;
  showSessionModal.value = true;
};

const closeSessionModal = () => {
  showSessionModal.value = false;
};

const saveSession = async () => {
  try {
    const method = isEditingSession.value ? 'PUT' : 'POST';
    const url = isEditingSession.value 
      ? `${API_BASE_URL}/attendance/sessions/${sessionForm.value.SessionID}`
      : `${API_BASE_URL}/attendance/sessions`;

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(sessionForm.value)
    });

    const data = await res.json();

    if (data.success) {
      notify(
        isEditingSession.value ? 'សម័យត្រូវបានកែប្រែដោយជោគជ័យ' : 'សម័យត្រូវបានបង្កើតដោយជោគជ័យ',
        'success'
      );
      closeSessionModal();
      await loadSessionsForDate();
    } else {
      notify(data.message || 'កំហុស', 'error');
    }
  } catch (error) {
    console.error('Error saving session:', error);
    notify('កំហុសក្នុងការរក្សាទុកសម័យ', 'error');
  }
};

const toggleSessionStatus = async () => {
  if (!selectedSession.value) return;

  try {
    const newStatus = selectedSession.value.Status === 'open' ? 'closed' : 'open';
    
    const res = await fetch(`${API_BASE_URL}/attendance/sessions/${selectedSession.value.SessionID}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();

    if (data.success) {
      selectedSession.value.Status = newStatus;
      notify(`សម័យត្រូវបាន${newStatus === 'open' ? 'បើក' : 'បិទ'}ដោយជោគជ័យ`, 'success');
    }
  } catch (error) {
    console.error('Error toggling session status:', error);
    notify('កំហុសក្នុងការផ្លាស់ប្តូរស្ថានភាព', 'error');
  }
};

const deleteSession = async (session) => {
  if (!confirm(`តើអ្នកពិតជាចង់លុបសម័យ "${session.SessionName}" នេះមែនទេ?`)) {
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE_URL}/attendance/sessions/${session.SessionID}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    const data = await res.json();
    
    if (data.success) {
      notify('សម័យត្រូវបានលុបដោយជោគជ័យ', 'success');
      sessions.value = sessions.value.filter(s => s.SessionID !== session.SessionID);
      selectedSession.value = null;
    } else {
      notify(data.message || 'កំហុសក្នុងការលុបសម័យ', 'error');
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    notify('កំហុសក្នុងការលុបសម័យ', 'error');
  }
};

// Attendance Functions
const openAttendanceModal = async (session) => {
  selectedSession.value = session;
  showAttendanceModal.value = true;
  
  await loadStudentsForClass(session.ClassID);
  await loadAttendanceForSession(session.SessionID);
};

const closeAttendanceModal = () => {
  showAttendanceModal.value = false;
  attendanceRecords.value = [];
};

const updateAttendance = (studentId, statusId) => {
  const existingIndex = attendanceRecords.value.findIndex(record => 
    record.StudentID === studentId && 
    record.SessionID === selectedSession.value?.SessionID
  );

  if (existingIndex !== -1) {
    attendanceRecords.value[existingIndex].StatusID = statusId;
  } else {
    attendanceRecords.value.push({
      StudentID: studentId,
      SessionID: selectedSession.value?.SessionID,
      ClassID: selectedClassId.value,
      AttendanceDate: selectedSession.value?.SessionDate,
      StatusID: statusId,
      Notes: ''
    });
  }
};

const updateAttendanceReason = (studentId, reason) => {
  const existingIndex = attendanceRecords.value.findIndex(record => 
    record.StudentID === studentId && 
    record.SessionID === selectedSession.value?.SessionID
  );

  if (existingIndex !== -1) {
    attendanceRecords.value[existingIndex].Notes = reason;
  }
};

const applyStatusToAll = (statusId) => {
  if (!selectedSession.value) return;
  
  studentsInClass.value.forEach(student => {
    const existingIndex = attendanceRecords.value.findIndex(record => 
      record.StudentID === student.StudentID && 
      record.SessionID === selectedSession.value?.SessionID
    );

    if (existingIndex !== -1) {
      attendanceRecords.value[existingIndex].StatusID = statusId;
    } else {
      attendanceRecords.value.push({
        StudentID: student.StudentID,
        SessionID: selectedSession.value?.SessionID,
        ClassID: selectedClassId.value,
        AttendanceDate: selectedSession.value?.SessionDate,
        StatusID: statusId,
        Notes: ''
      });
    }
  });

  notify('បានអនុវត្តស្ថានភាពទៅលើសិស្សទាំងអស់', 'success');
};

const saveAttendance = async () => {
  if (!selectedSession.value) return;

  try {
    savingAttendance.value = true;

    const sessionRecords = attendanceRecords.value.filter(record => 
      record.SessionID === selectedSession.value.SessionID
    );

    const res = await fetch(`${API_BASE_URL}/attendance/session/${selectedSession.value.SessionID}/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ records: sessionRecords })
    });

    const data = await res.json();

    if (data.success) {
      notify('វត្តមានត្រូវបានរក្សាទុកដោយជោគជ័យ', 'success');
      closeAttendanceModal();
    } else {
      notify(data.message || 'កំហុស', 'error');
    }
  } catch (error) {
    console.error('Error saving attendance:', error);
    notify('កំហុសក្នុងការរក្សាទុកវត្តមាន', 'error');
  } finally {
    savingAttendance.value = false;
  }
};

// Print Functions
const openPrintModal = () => {
  showPrintModal.value = true;
};

const closePrintModal = () => {
  showPrintModal.value = false;
};

const openBulkPrintModal = async () => {
  showPrintModal.value = false;
  showBulkPrintModal.value = true;
  
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  
  printFilters.value.startDate = lastWeek.toISOString().split('T')[0];
  printFilters.value.endDate = today.toISOString().split('T')[0];
  
  await loadSessionsForPrint();
};

const closeBulkPrintModal = () => {
  showBulkPrintModal.value = false;
  selectedPrintSessions.value = [];
  printSessions.value = [];
};

const resetPrintFilters = () => {
  const today = new Date().toISOString().split('T')[0];
  printFilters.value = {
    startDate: today,
    endDate: today,
    classId: '',
    subjectId: ''
  };
};

const loadSessionsForPrint = async () => {
  try {
    loadingPrintSessions.value = true;
    
    const params = new URLSearchParams();
    if (printFilters.value.startDate) params.append('startDate', printFilters.value.startDate);
    if (printFilters.value.endDate) params.append('endDate', printFilters.value.endDate);
    if (printFilters.value.classId) params.append('classId', printFilters.value.classId);
    if (printFilters.value.subjectId && userProfile.value.role === 'admin') {
      params.append('subjectId', printFilters.value.subjectId);
    }
    
    const url = `${API_BASE_URL}/attendance/sessions/print/all?${params.toString()}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    
    const data = await res.json();
    
    if (data.success) {
      printSessions.value = data.data;
      selectedPrintSessions.value = [];
    } else {
      notify('កំហុសក្នុងការផ្ទុកសម័យសម្រាប់បោះពុម្ព', 'error');
    }
  } catch (error) {
    console.error('Error loading sessions for print:', error);
    notify('កំហុសក្នុងការផ្ទុកទិន្នន័យ', 'error');
  } finally {
    loadingPrintSessions.value = false;
  }
};

const printCurrentSession = async () => {
  if (!selectedSession.value) {
    notify('សូមជ្រើសរើសសម័យមុនពេលបោះពុម្ព', 'error');
    return;
  }
  
  await printSingleSession(selectedSession.value.SessionID);
  closePrintModal();
};

const printSingleSession = async (sessionId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/attendance/sessions/${sessionId}/print`, {
      headers: getAuthHeaders()
    });
    
    const data = await res.json();
    
    if (data.success) {
      generatePDF(data.data);
      notify('កំពុងបង្កើតឯកសារ PDF', 'success');
    } else {
      notify(data.message || 'កំហុសក្នុងការបង្កើតរបាយការណ៍', 'error');
    }
  } catch (error) {
    console.error('Error printing session:', error);
    notify('កំហុសក្នុងការបោះពុម្ព', 'error');
  }
};

const printSelectedSessions = async () => {
  if (selectedPrintSessions.value.length === 0) {
    notify('សូមជ្រើសរើសសម័យយ៉ាងតិចមួយសម្រាប់បោះពុម្ព', 'error');
    return;
  }
  
  try {
    const reportData = {
      sessions: [],
      printDate: new Date().toLocaleDateString('km-KH'),
      totalSessions: selectedPrintSessions.value.length
    };
    
    for (const sessionId of selectedPrintSessions.value) {
      const res = await fetch(`${API_BASE_URL}/attendance/sessions/${sessionId}/print`, {
        headers: getAuthHeaders()
      });
      
      const data = await res.json();
      if (data.success) {
        reportData.sessions.push(data.data);
      }
    }
    
    generateBulkPDF(reportData);
    notify(`បានបោះពុម្ព ${selectedPrintSessions.value.length} សម័យ`, 'success');
    
  } catch (error) {
    console.error('Error printing selected sessions:', error);
    notify('កំហុសក្នុងការបោះពុម្ព', 'error');
  }
};

const toggleSelectAllSessions = () => {
  if (allSessionsSelected.value) {
    selectedPrintSessions.value = [];
  } else {
    selectedPrintSessions.value = printSessions.value.map(s => s.SessionID);
  }
};

// PDF Generation
const generatePDF = (reportData) => {
  const printWindow = window.open('', '_blank');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>របាយការណ៍វត្តមាន - ${reportData.session.SessionName}</title>
      <style>
        body { font-family: 'Khmer OS System', 'Arial', sans-serif; direction: ltr; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .school-name { font-size: 20px; font-weight: bold; margin-bottom: 8px; }
        .report-title { font-size: 16px; margin-bottom: 15px; }
        .session-info { margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px; }
        .info-item { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 4px 0; font-size: 12px; }
        .attendance-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
        .attendance-table th, .attendance-table td { border: 1px solid #333; padding: 6px; text-align: center; }
        .attendance-table th { background-color: #f2f2f2; font-weight: bold; }
        .statistics { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center; }
        .stat-item { padding: 8px; }
        .footer { margin-top: 30px; text-align: right; font-size: 10px; color: #666; }
        @media print {
          body { font-size: 10px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-name">សាលារៀន</div>
        <div class="report-title">របាយការណ៍វត្តមាន</div>
      </div>
      
      <div class="session-info">
        <h3>ព័ត៌មានសម័យ</h3>
        <div class="info-grid">
          <div class="info-item">
            <span>ឈ្មោះសម័យ:</span>
            <span>${reportData.session.SessionName}</span>
          </div>
          <div class="info-item">
            <span>កាលបរិច្ឆេទ:</span>
            <span>${reportData.session.formattedDate}</span>
          </div>
          <div class="info-item">
            <span>ពេលវេលា:</span>
            <span>${reportData.session.formattedStartTime} - ${reportData.session.formattedEndTime}</span>
          </div>
          <div class="info-item">
            <span>ថ្នាក់:</span>
            <span>${reportData.session.ClassName} ${reportData.session.ClassLetter}</span>
          </div>
          <div class="info-item">
            <span>មុខវិជ្ជា:</span>
            <span>${reportData.session.SubjectName || 'គ្មាន'}</span>
          </div>
          <div class="info-item">
            <span>គ្រូ:</span>
            <span>${reportData.session.TeacherName || reportData.session.CreatorName || 'គ្មាន'}</span>
          </div>
        </div>
      </div>
      
      <table class="attendance-table">
        <thead>
          <tr>
            <th>ល.រ</th>
            <th>កូដសិស្ស</th>
            <th>ឈ្មោះសិស្ស</th>
            <th>ស្ថានភាព</th>
            <th>មូលហេតុ</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.attendance.map((item, index) => `
            <tr>
              <td>${item.no}</td>
              <td>${item.studentCode}</td>
              <td>${item.studentName}</td>
              <td>${item.status}</td>
              <td>${item.notes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="statistics">
        <h3>ស្ថិតិវត្តមាន</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div style="font-size: 16px; font-weight: bold;">${reportData.statistics.totalStudents}</div>
            <div>សិស្សសរុប</div>
          </div>
          <div class="stat-item">
            <div style="font-size: 16px; font-weight: bold; color: #10B981;">${reportData.statistics.presentCount}</div>
            <div>បានមក</div>
          </div>
          <div class="stat-item">
            <div style="font-size: 16px; font-weight: bold; color: #EF4444;">${reportData.statistics.absentCount}</div>
            <div>អវត្តមាន</div>
          </div>
          <div class="stat-item">
            <div style="font-size: 16px; font-weight: bold; color: #F59E0B;">${reportData.statistics.lateCount}</div>
            <div>យឺត</div>
          </div>
        </div>
        <div style="text-align: center; margin-top: 15px; font-size: 14px;">
          អត្រាវត្តមានសរុប: <strong>${reportData.statistics.attendanceRate}%</strong>
        </div>
      </div>
      
      <div class="footer">
        <div>បានបង្កើតនៅ: ${reportData.statistics.generatedDate} ${reportData.statistics.generatedTime}</div>
        <div>ទំព័រ 1/1</div>
      </div>
      
      <div class="no-print" style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 8px 16px; background-color: #4F46E5; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
          🖨️ បោះពុម្ព
        </button>
        <button onclick="window.close()" style="padding: 8px 16px; background-color: #6B7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 8px; font-size: 12px;">
          បិទ
        </button>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
};

const generateBulkPDF = (reportData) => {
  const printWindow = window.open('', '_blank');
  
  let sessionsHTML = '';
  reportData.sessions.forEach((sessionData, index) => {
    sessionsHTML += `
      <div class="session-report" style="page-break-after: ${index < reportData.sessions.length - 1 ? 'always' : 'auto'}; margin-bottom: 40px;">
        <h3>សម័យ ${index + 1}: ${sessionData.session.SessionName}</h3>
        <div style="font-size: 11px; margin-bottom: 12px;">
          <div>កាលបរិច្ឆេទ: ${sessionData.session.formattedDate}</div>
          <div>ពេលវេលា: ${sessionData.session.formattedStartTime} - ${sessionData.session.formattedEndTime}</div>
          <div>ថ្នាក់: ${sessionData.session.ClassName} ${sessionData.session.ClassLetter}</div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr>
              <th style="border: 1px solid #333; padding: 4px;">ល.រ</th>
              <th style="border: 1px solid #333; padding: 4px;">ឈ្មោះសិស្ស</th>
              <th style="border: 1px solid #333; padding: 4px;">ស្ថានភាព</th>
            </tr>
          </thead>
          <tbody>
            ${sessionData.attendance.map((item, idx) => `
              <tr>
                <td style="border: 1px solid #333; padding: 4px; text-align: center;">${idx + 1}</td>
                <td style="border: 1px solid #333; padding: 4px;">${item.studentName}</td>
                <td style="border: 1px solid #333; padding: 4px; text-align: center;">${item.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 12px; font-size: 11px;">
          <strong>ស្ថិតិ:</strong> 
          សិស្សសរុប: ${sessionData.statistics.totalStudents} | 
          បានមក: ${sessionData.statistics.presentCount} | 
          អវត្តមាន: ${sessionData.statistics.absentCount} | 
          អត្រាវត្តមាន: ${sessionData.statistics.attendanceRate}%
        </div>
      </div>
    `;
  });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>របាយការណ៍វត្តមានជាក្រុម</title>
      <style>
        body { font-family: 'Khmer OS System', 'Arial', sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .summary { margin-bottom: 20px; padding: 12px; background-color: #f0f0f0; border-radius: 5px; }
        @media print {
          body { font-size: 10px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>របាយការណ៍វត្តមានជាក្រុម</h1>
        <div>សរុប ${reportData.totalSessions} សម័យ</div>
        <div>កាលបរិច្ឆេទបោះពុម្ព: ${reportData.printDate}</div>
      </div>
      
      <div class="summary">
        <strong>សរុប:</strong> ${reportData.totalSessions} សម័យ<br>
        <strong>កាលបរិច្ឆេទ:</strong> ${printFilters.value.startDate} ដល់ ${printFilters.value.endDate}
      </div>
      
      ${sessionsHTML}
      
      <div class="footer" style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
        ទំព័រ <span class="pageNumber"></span>
      </div>
      
      <div class="no-print" style="position: fixed; bottom: 15px; right: 15px;">
        <button onclick="window.print()" style="padding: 8px 16px; background-color: #4F46E5; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
          🖨️ បោះពុម្ពទាំងអស់
        </button>
        <button onclick="window.close()" style="padding: 8px 16px; background-color: #6B7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 8px; font-size: 12px;">
          បិទ
        </button>
      </div>
      
      <script>
        window.onload = function() {
          const pages = document.querySelectorAll('.session-report');
          pages.forEach((page, index) => {
            const pageNum = page.querySelector('.pageNumber');
            if (pageNum) {
              pageNum.textContent = \`\${index + 1}/\${pages.length}\`;
            }
          });
        };
      <\/script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
};

// Export function
const exportAllSessions = async () => {
  if (userProfile.value.role !== 'admin') {
    notify('ត្រូវការសិទ្ធិអ្នកគ្រប់គ្រងដើម្បីនាំចេញទិន្នន័យ', 'error');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE_URL}/attendance/export/all`, {
      headers: getAuthHeaders()
    });
    
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notify('ទិន្នន័យត្រូវបាននាំចេញដោយជោគជ័យ', 'success');
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    notify('កំហុសក្នុងការនាំចេញទិន្នន័យ', 'error');
  }
};

// Subject change handler
const onSubjectChange = () => {
  if (!sessionNameEdited.value) {
    const subject = filteredSubjects.value.find(s => s.SubjectId === sessionForm.value.SubjectID);
    const subjectName = subject ? subject.SubjectName : '';
    const date = sessionForm.value.SessionDate || '';
    const time = sessionForm.value.StartTime || '';
    sessionForm.value.SessionName = [subjectName, date, time].filter(Boolean).join(' - ');
  }
};

// Lifecycle
onMounted(() => {
      // Remove dependency on localStorage for initial user data to ensure we get fresh data including profile picture
      /*
      const user = localStorage.getItem('user');
      if (user) {
        try {
          userProfile.value = JSON.parse(user);
          if (userProfile.value.role) userProfile.value.role = userProfile.value.role.toLowerCase();
        } catch (e) {
          console.error('Error parsing user from local storage', e);
        }
      }
      */

      loadUserProfile();
      loadUserResources();
      loadSessionsForDate();
      loadAttendanceStatuses();
    });

// Watchers
watch(selectedDate, () => {
  selectedSession.value = null;
  loadSessionsForDate();
});

watch(showAllDates, () => {
  selectedSession.value = null;
  loadSessionsForDate();
});
</script>

<style scoped>
.container {
  max-width: 1200px;
}

/* Responsive table */
@media (max-width: 640px) {
  table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
  
  .hidden-mobile {
    display: none;
  }
}

/* Better touch targets on mobile */
@media (max-width: 640px) {
  button, input, select {
    min-height: 44px;
  }
  
  .text-xs {
    font-size: 0.75rem;
    line-height: 1rem;
  }
}

/* Improve readability on small screens */
@media (max-width: 480px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .space-y-4 > * + * {
    margin-top: 0.75rem;
  }
}
</style>
