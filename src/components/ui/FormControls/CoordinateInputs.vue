<!-- @/components/ui/FormControls/CoordinateInputs.vue -->
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
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, watch } from 'vue'
import AppNumberInput from '@/components/ui/FormControls/AppNumberInput.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      coordStartKm: null,
      coordStartPk: null,
      coordEndKm: null,
      coordEndPk: null
    })
  },
  objectBounds: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'invalidRange', 'out-of-bounds'])

const isUserTyping = ref(false)
const shouldShowError = ref(false)

const currentStartKm = computed(() => props.modelValue.coordStartKm ?? 0)
const currentStartPk = computed(() => props.modelValue.coordStartPk ?? 0)
const currentEndKm = computed(() => props.modelValue.coordEndKm ?? 0)
const currentEndPk = computed(() => props.modelValue.coordEndPk ?? 0)

const startAbs = computed(() => currentStartKm.value * 1000 + currentStartPk.value * 100)
const endAbs = computed(() => currentEndKm.value * 1000 + currentEndPk.value * 100)

const isInvalid = computed(() => startAbs.value > endAbs.value)

const isOutOfBounds = computed(() => {
  if (!props.objectBounds) return false
  const objStartAbs = props.objectBounds.StartKm * 1000 + props.objectBounds.StartPicket * 100
  const objEndAbs = props.objectBounds.FinishKm * 1000 + props.objectBounds.FinishPicket * 100
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
const handleEndKm = (value) => updateCoords('coordEndKm', clamp(value, 0, 9999))
const handleEndPk = (value) => updateCoords('coordEndPk', clamp(value, 0, 10))

const performValidation = () => {
  emit('invalidRange', isInvalid.value)
  if (isOutOfBounds.value) {
    emit('out-of-bounds')
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
  margin-bottom: 16px;
}

.coordinate-label {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.coordinate-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (max-width: 600px) {
  .coordinate-group {
    grid-template-columns: 1fr;
  }
}
</style>

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
  min-width: 152px;
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
