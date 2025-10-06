<template>
  <ModalWrapper
    title="Добавить новый инцидент"
    @close="closeModal"
    @save="saveData"
    :disabled="isSaveDisabled"
  >
    <div class="form-section">
      <AppDropdown
        class="col-span-2"
        id="incidentType"
        label="Событие / запрос"
        placeholder="Выберите тип инцидента"
        v-model="form.incidentType"
        :options="incidentTypeOptions"
        :required="true"
      />

      <AppDropdown
        id="place"
        label="Место"
        placeholder="Выберите место"
        v-model="form.place"
        :options="placeOptions"
        :required="true"
      />

      <AppDropdown
        id="objectType"
        label="Тип объекта"
        placeholder="Выберите тип объекта"
        v-model="form.objectType"
        :options="objectTypeOptions"
        :required="true"
      />

      <AppDropdown
        class="col-span-2"
        id="object"
        label="Объект"
        placeholder="Выберите объект"
        v-model="form.object"
        :options="objectOptions"
        :required="true" 
      />

      <CoordinateInputs
        class="col-span-2"
        v-model="coordinates"
        :required="true" 
        
      />

      <AppInput 
        class="col-span-2" 
        id="description" 
        label="Описание" 
        placeholder="Введите описание инцидента..." 
        v-model="form.description" 
        type="textarea" 
      />

      <AppInput 
        class="col-span-2" 
        id="applicantName" 
        label="ФИО заявителя" 
        placeholder="Введите ФИО" 
        v-model="form.applicantName" 
      />
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue'

import ModalWrapper from '@/components/layout/Modal/ModalWrapper.vue'
import AppInput from '@/components/ui/FormControls/AppInput.vue'
import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue'
import CoordinateInputs from '@/components/ui/FormControls/CoordinateInputs.vue'

const emit = defineEmits(['close', 'update-table'])

const form = ref({
  incidentType: null,
  place: null,
  objectType: null,
  object: null,
  description: '',
  applicantName: '',
})

const coordinates = ref({
  coordStartKm: null,
  coordStartPk: null,
  coordEndKm: null,
  coordEndPk: null,
})

const incidentTypeOptions = ref([])
const placeOptions = ref([])
const objectTypeOptions = ref([])
const objectOptions = ref([])

const isSaveDisabled = computed(() => {
  return !(
    form.value.incidentType && 
    form.value.place && 
    form.value.objectType && 
    form.value.description && 
    form.value.applicantName
  )
})

const closeModal = () => {
  emit('close')
}

const saveData = () => {
  console.log('Данные инцидента для сохранения:', { ...form.value, coordinates: coordinates.value })
}
</script>

<style scoped>
.form-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  padding: 0 32px 32px;
  background-color: #f9fafb;
}

.col-span-2 {
  grid-column: span 2;
}
</style>