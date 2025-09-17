<template>
  <div class="coordinate-wrapper">
    <label class="coordinate-label">Координаты</label>
    <div class="coordinate-group">
      <AppNumberInput
        :modelValue="currentStartKm"
        label="Начало (км)"
        placeholder="км"
        :status="shouldShowError && (isInvalid || isOutOfBounds) ? 'error' : null"
        @update:modelValue="handleStartKm"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <AppNumberInput
        :modelValue="currentStartPk"
        label="Начало (пк)"
        placeholder="пк"
        :max="10"
        :status="shouldShowError && (isInvalid || isOutOfBounds) ? 'error' : null"
        @update:modelValue="handleStartPk"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <AppNumberInput
        :modelValue="currentStartZv"
        label="Начало (зв)"
        placeholder="зв"
        :status="shouldShowError && (isInvalid || isOutOfBounds) ? 'error' : null"
        @update:modelValue="handleStartZv"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <AppNumberInput
        :modelValue="currentEndKm"
        label="Конец (км)"
        placeholder="км"
        :status="shouldShowError && (isInvalid || isOutOfBounds) ? 'error' : null"
        @update:modelValue="handleEndKm"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <AppNumberInput
        :modelValue="currentEndPk"
        label="Конец (пк)"
        placeholder="пк"
        :max="10"
        :status="shouldShowError && (isInvalid || isOutOfBounds) ? 'error' : null"
        @update:modelValue="handleEndPk"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <AppNumberInput
        :modelValue="currentEndZv"
        label="Конец (зв)"
        placeholder="зв"
        :status="shouldShowError && (isInvalid || isOutOfBounds) ? 'error' : null"
        @update:modelValue="handleEndZv"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, watch } from 'vue'
import AppNumberInput from '@/components/ui/FormControls/AppNumberInput.vue'
import { useNotificationStore } from '@/stores/notificationStore'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      coordStartKm: null,
      coordStartPk: null,
      coordStartZv: null,
      coordEndKm: null,
      coordEndPk: null,
      coordEndZv: null
    })
  },
  objectBounds: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'invalidRange', 'out-of-bounds'])

const notificationStore = useNotificationStore()

const isUserTyping = ref(false)
const shouldShowError = ref(false)

const currentStartKm = computed(() => props.modelValue.coordStartKm ?? 0)
const currentStartPk = computed(() => props.modelValue.coordStartPk ?? 0)
const currentStartZv = computed(() => props.modelValue.coordStartZv ?? 0)
const currentEndKm = computed(() => props.modelValue.coordEndKm ?? 0)
const currentEndPk = computed(() => props.modelValue.coordEndPk ?? 0)
const currentEndZv = computed(() => props.modelValue.coordEndZv ?? 0)

const startAbs = computed(() => currentStartKm.value * 1000 + currentStartPk.value * 100 + currentStartZv.value)
const endAbs = computed(() => currentEndKm.value * 1000 + currentEndPk.value * 100 + currentEndZv.value)

const isInvalid = computed(() => startAbs.value > endAbs.value)

const isOutOfBounds = computed(() => {
  if (!props.objectBounds) return false
  const objStartAbs = props.objectBounds.StartKm * 1000 + props.objectBounds.StartPicket * 100 + props.objectBounds.StartZv * 25
  const objEndAbs = props.objectBounds.FinishKm * 1000 + props.objectBounds.FinishPicket * 100 + props.objectBounds.FinishZv * 25
  return startAbs.value < objStartAbs || endAbs.value > objEndAbs
})

const clamp = (value, min, max) => {
  if (value == null || isNaN(value)) return min
  const num = Math.floor(Number(value))
  return Math.max(min, Math.min(max, num))
}

const updateCoords = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

const handleStartKm = (value) => updateCoords('coordStartKm', clamp(value, 0, 9999))
const handleStartPk = (value) => updateCoords('coordStartPk', clamp(value, 0, 10))
const handleStartZv = (value) => updateCoords('coordStartZv', clamp(value, 0, 99)) // Assuming a max value for zv
const handleEndKm = (value) => updateCoords('coordEndKm', clamp(value, 0, 9999))
const handleEndPk = (value) => updateCoords('coordEndPk', clamp(value, 0, 10))
const handleEndZv = (value) => updateCoords('coordEndZv', clamp(value, 0, 99)) // Assuming a max value for zv

const performValidation = () => {
  if (isInvalid.value) {
    emit('invalidRange', isInvalid.value)
    notificationStore.showNotification('Диапазон координат неверен!', 'error')
  }

  if (isOutOfBounds.value) {
    emit('out-of-bounds')
    notificationStore.showNotification('Координаты выходят за пределы допустимого диапазона!', 'error')
  }
}

const handleFocus = () => {
  isUserTyping.value = true
  shouldShowError.value = false
}

const handleBlur = () => {
  isUserTyping.value = false
  setTimeout(() => {
    shouldShowError.value = true
    performValidation()
  }, 100)
}

watch([startAbs, endAbs], () => {
  if (!isUserTyping.value) {
    performValidation()
  }
})

watch(() => props.objectBounds, () => {
  if (!isUserTyping.value) {
    shouldShowError.value = true
    performValidation()
  }
})
</script>

<style scoped>
.coordinate-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coordinate-label {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

.coordinate-group {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  justify-content: space-between;
}

.coordinate-group > * {
  flex: 1;
  min-width: 90px;
}

@media (max-width: 768px) {
  .coordinate-group {
    flex-direction: column;
  }

  .coordinate-group > * {
    width: 100%;
  }
}
</style>