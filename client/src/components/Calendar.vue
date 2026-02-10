<template>
  <div class="container p-2 mx-auto">
    <div class="p-2 mb-6 bg-white border border-gray-100 shadow-xl rounded-2xl">
      <div class="flex items-center justify-between px-4 py-3 rounded-2xl bg-linear-to-r from-indigo-50 to-purple-50">
        <div>
          <h2 class="text-xl font-bold text-indigo-700">ប្រតិទិន</h2>
          <p class="text-sm text-gray-600">{{ khmerMonth }} {{ khmerYear }} • {{ buddhistYear }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="prevMonth"
            class="px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            ←
          </button>
          <button
            type="button"
            @click="goToday"
            class="px-4 py-2 text-sm font-semibold text-white shadow-md bg-linear-to-r from-indigo-500 to-indigo-600 rounded-xl hover:shadow-lg"
          >
            ថ្ងៃនេះ
          </button>
          <button
            type="button"
            @click="nextMonth"
            class="px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            →
          </button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-2 p-4">
        <div v-for="day in khmerWeekdays" :key="day" class="text-xs font-semibold text-center text-gray-600 sm:text-sm">
          {{ day }}
        </div>

        <div
          v-for="cell in calendarCells"
          :key="cell.key"
          class="p-2 text-sm transition-all bg-white border border-gray-100 shadow-sm min-h-18 rounded-xl"
          :class="[
            cell.isCurrentMonth ? 'text-gray-800' : 'text-gray-400 bg-gray-50',
            cell.isToday ? 'border-indigo-400 bg-indigo-50' : '',
            cell.isSelected ? 'ring-2 ring-indigo-400' : ''
          ]"
          @click="cell.date && selectDate(cell.date)"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold">{{ cell.label }}</span>
            <span v-if="cell.isToday" class="text-[10px] font-semibold text-indigo-600">●</span>
          </div>
        </div>
      </div>

      <div class="px-4 pb-4">
        <div class="p-4 bg-white border border-gray-100 shadow-md rounded-2xl">
          <div class="text-sm text-gray-500">ថ្ងៃដែលជ្រើសរើស</div>
          <div class="text-lg font-semibold text-gray-800">
            {{ selectedKhmerDate }}
          </div>
          <div class="text-sm text-gray-600">{{ selectedGregorianDate }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const khmerMonths = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ'
]

const khmerWeekdays = [
  'អាទិត្យ',
  'ចន្ទ',
  'អង្គារ',
  'ពុធ',
  'ព្រហស្បតិ៍',
  'សុក្រ',
  'សៅរ៍'
]

const toKhmerNumber = (input) => {
  const khmerNumerals = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
  return String(input).replace(/\d/g, (digit) => khmerNumerals[Number(digit)])
}

const currentDate = ref(new Date())
const selectedDate = ref(new Date())

const monthIndex = computed(() => currentDate.value.getMonth())
const yearNumber = computed(() => currentDate.value.getFullYear())
const khmerMonth = computed(() => khmerMonths[monthIndex.value])
const khmerYear = computed(() => toKhmerNumber(yearNumber.value))
const buddhistYear = computed(() => `ពុទ្ធសករាជ ${toKhmerNumber(yearNumber.value + 543)}`)

const calendarCells = computed(() => {
  const year = yearNumber.value
  const month = monthIndex.value
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const cells = []

  for (let i = firstDay - 1; i >= 0; i -= 1) {
    const date = new Date(year, month - 1, prevMonthDays - i)
    cells.push(buildCell(date, false))
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    cells.push(buildCell(date, true))
  }

  const remainder = 7 - (cells.length % 7 || 7)
  for (let i = 1; i <= remainder; i += 1) {
    const date = new Date(year, month + 1, i)
    cells.push(buildCell(date, false))
  }

  return cells
})

const buildCell = (date, isCurrentMonth) => {
  const today = new Date()
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  const isSelected =
    date.getFullYear() === selectedDate.value.getFullYear() &&
    date.getMonth() === selectedDate.value.getMonth() &&
    date.getDate() === selectedDate.value.getDate()

  return {
    key: date.toISOString(),
    date,
    label: toKhmerNumber(date.getDate()),
    isCurrentMonth,
    isToday,
    isSelected
  }
}

const selectedKhmerDate = computed(() => {
  const date = selectedDate.value
  const day = toKhmerNumber(date.getDate())
  const month = khmerMonths[date.getMonth()]
  const year = toKhmerNumber(date.getFullYear())
  return `${day} ${month} ${year}`
})

const selectedGregorianDate = computed(() => {
  return selectedDate.value.toLocaleDateString('km-KH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const prevMonth = () => {
  const date = new Date(yearNumber.value, monthIndex.value - 1, 1)
  currentDate.value = date
}

const nextMonth = () => {
  const date = new Date(yearNumber.value, monthIndex.value + 1, 1)
  currentDate.value = date
}

const goToday = () => {
  const now = new Date()
  currentDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
  selectedDate.value = now
}

const selectDate = (date) => {
  selectedDate.value = date
}
</script>
