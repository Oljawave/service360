<template>
  <ModalWrapper
    title="Информация об инциденте"
    @close="closeModal"
    :showSaveButton="false"
    :showCancelButton="false"
    :showDelete="true"
    @delete="onDeleteClicked" 
  >
    <div class="form-section">
      <AppInput
        class="col-span-2"
        id="name"
        label="Событие / запрос"
        v-model="form.name"
        :disabled="true"
      />

      <AppInput
        class="col-span-2"
        id="object"
        label="Объект"
        v-model="form.object"
        :disabled="true"
      />
      
      <AppInput
        id="status"
        label="Статус"
        v-model="form.statusName"
        :disabled="true"
      />
      
      <AppInput
        id="criticality"
        label="Критичность"
        v-model="form.criticality"
        :disabled="true"
      />
      
      <FullCoordinates
        v-model="form.parsedCoordinates"
        label="Координаты"
        class="col-span-2"
        :disabled="true" 
      />
      
      <AppInput
        class="col-span-2"
        id="description"
        label="Описание"
        v-model="form.description"
        :disabled="true"
        type="textarea"
      />
      
      <AppInput
        id="applicantName"
        label="ФИО заявителя"
        v-model="form.applicantName"
        :disabled="true"
      />
      
      <AppInput
        id="date"
        label="Дата регистрации"
        v-model="form.date"
        :disabled="true"
      />

    </div>
  </ModalWrapper>

  <ConfirmationModal
    v-if="showConfirmModal"
    title="Удаление инцидента"
    :message="`Вы действительно хотите удалить инцидент?`"
    @confirm="onConfirmDelete"
    @cancel="onCancelDelete"
  />
</template>

<script setup>
import { ref, onMounted, defineEmits, defineProps } from 'vue'
import ModalWrapper from '@/components/layout/Modal/ModalWrapper.vue'
import AppInput from '@/components/ui/FormControls/AppInput.vue'
import FullCoordinates from '@/components/ui/FormControls/FullCoordinates.vue'
import ConfirmationModal from './ConfirmationModal.vue' 
import { useNotificationStore } from '@/stores/notificationStore'
import { deleteIncident } from '@/api/incidentApi' 

const emit = defineEmits(['close', 'deleted'])
const props = defineProps({
  rowData: {
    type: Object,
    required: true
  }
})

const showConfirmModal = ref(false)
const notificationStore = useNotificationStore()

const initialCoordinates = { 
  coordStartKm: null, 
  coordStartPk: null, 
  coordStartZv: null, 
  coordEndKm: null, 
  coordEndPk: null, 
  coordEndZv: null 
}

const form = ref({
  id: null,
  name: '', 
  object: '', 
  place: 'Не указано', 
  criticality: '', 
  statusName: '', 
  date: null, 
  time: null,
  description: '', 
  applicantName: 'Неизвестно', 
  parsedCoordinates: { ...initialCoordinates },
})

const closeModal = () => {
  emit('close')
}

const fillFormWithData = () => {
  const data = props.rowData
  const rawData = data.rawData
  
  form.value.id = data.id || null
  form.value.name = data.name || ''
  form.value.object = data.object || ''
  form.value.criticality = data.criticality || ''
  form.value.statusName = data.statusName || ''
  form.value.date = data.date || null
  form.value.time = data.time || null
  form.value.description = data.description || ''
  
  form.value.place = rawData.nameLocationClsSection || 'Не указано'
  form.value.applicantName = rawData.InfoApplicant || 'Неизвестно', 
  
  form.value.parsedCoordinates = {
    coordStartKm: rawData.StartKm || null, 
    coordStartPk: rawData.StartPicket || null,
    coordStartZv: rawData.StartLink || null, 
    
    coordEndKm: rawData.FinishKm || null,
    coordEndPk: rawData.FinishPicket || null,
    coordEndZv: rawData.FinishLink || null,
  }
}

onMounted(() => {
  fillFormWithData()
})

const onDeleteClicked = () => {
  if (!form.value.id) {
     notificationStore.showNotification('Не удалось получить ID записи для удаления.', 'error')
     return
  }
  showConfirmModal.value = true
}

const onCancelDelete = () => {
  showConfirmModal.value = false
}

const onConfirmDelete = async () => {
  showConfirmModal.value = false
  
  const recordId = form.value.id

  try {
    await deleteIncident(recordId) 
    
    notificationStore.showNotification('Инцидент успешно удален!', 'success')
    emit('deleted') 

  } catch (error) {
    notificationStore.showNotification('Ошибка при удалении инцидента.', 'error')
  }
}

</script>

<style scoped>
.form-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  padding: 32px;
  background-color: #f9fafb;
}

.section-title {
  font-weight: 600;
  color: #2b6cb0;
  grid-column: span 2;
  font-size: 14px;
  margin-bottom: -12px;
}

.col-span-2 {
  grid-column: span 2;
}
</style>