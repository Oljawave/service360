<template>
  <ModalWrapper
    title="Информация о неисправности"
    @close="closeModal"
    :showSaveButton="false"
    :showCancelButton="false"
    :showDelete="true"
    @delete="onDeleteClicked" 
  >
    <div class="form-section">

      <AppInput
        class="col-span-2"
        id="nameObject"
        label="Объект"
        v-model="form.nameObject"
        :disabled="true"
      />
      
      <AppInput
        id="nameSection"
        label="Участок"
        v-model="form.nameSection"
        :disabled="true"
      />
      
      <AppInput
        id="nameLocationClsSection"
        label="Место"
        v-model="form.nameLocationClsSection"
        :disabled="true"
      />
      
      <FullCoordinates
        v-model="form.parsedCoordinates"
        label="Координаты"
        class="col-span-2"
        :disabled="true" 
      />
      
      <AppInput
        id="component"
        label="Компонент"
        v-model="form.nameDefectsComponent"
        :disabled="true"
      />
      
      <AppDatePicker
        id="factDateEnd"
        label="Дата проверки"
        v-model="form.factDateEnd"
        :disabled="true"
      />

      <AppInput
        class="col-span-2"
        id="defect"
        label="Неисправность"
        v-model="form.nameDefect"
        :disabled="true"
      />

      <div /> 

    </div>
  </ModalWrapper>

  <ConfirmationModal
    v-if="showConfirmModal"
    title="Удаление неисправности"
    :message="`Вы действительно хотите удалить неисправность?`"
    @confirm="onConfirmDelete"
    @cancel="onCancelDelete"
  />
</template>

<script setup>
import { ref, onMounted, defineEmits, defineProps } from 'vue'
import ModalWrapper from '@/components/layout/Modal/ModalWrapper.vue'
import AppInput from '@/components/ui/FormControls/AppInput.vue'
import AppDatePicker from '@/components/ui/FormControls/AppDatePicker.vue'
import FullCoordinates from '@/components/ui/FormControls/FullCoordinates.vue'
import ConfirmationModal from './ConfirmationModal.vue' 
import { deleteFaultOrParameter } from '@/api/faultApi'
import { useNotificationStore } from '@/stores/notificationStore'

const emit = defineEmits(['close', 'deleted'])
const props = defineProps({
  rowData: {
    type: Object,
    required: true
  }
})

const showConfirmModal = ref(false)
const notificationStore = useNotificationStore()

const initialCoordinates = { coordStartKm: null, coordStartPk: null, coordStartZv: null, coordEndKm: null, coordEndPk: null, coordEndZv: null }

const form = ref({
  nameObject: '',
  nameSection: '',
  nameLocationClsSection: '',
  nameDefectsComponent: '',
  nameDefect: '',
  factDateEnd: null,
  parsedCoordinates: { ...initialCoordinates },

  id: null, 
})

const closeModal = () => {
  emit('close')
}

const parseDateForPicker = (dateString) => {
  return dateString || null
}

const parseCoordinatesString = (coordsString, rawData) => {
    const result = { ...initialCoordinates };
    
    if (rawData) {
        result.coordStartKm = rawData.StartKm;
        result.coordStartPk = rawData.StartPicket;
        result.coordStartZv = rawData.StartLink || null; 
        
        result.coordEndKm = rawData.FinishKm;
        result.coordEndPk = rawData.FinishPicket;
        result.coordEndZv = rawData.FinishLink || null;
    }

    else if (coordsString) {
        const match = coordsString.match(/(\d+) км (\d+) пк - (\d+) км (\d+) пк/);
        if (match) {
            result.coordStartKm = parseInt(match[1]);
            result.coordStartPk = parseInt(match[2]);
            result.coordEndKm = parseInt(match[3]);
            result.coordEndPk = parseInt(match[4]);
        }
    }
    
    return result;
}

const fillFormWithData = () => {
  const data = props.rowData

  console.log('ModalFaultInfo: Загрузка данных неисправности:', data)

  form.value.nameObject = data.nameObject || ''
  form.value.nameSection = data.nameSection || ''
  form.value.nameLocationClsSection = data.nameLocationClsSection || ''
  form.value.nameDefectsComponent = data.nameDefectsComponent || ''
  form.value.nameDefect = data.nameDefect || ''
  form.value.factDateEnd = parseDateForPicker(data.FactDateEnd)
  form.value.parsedCoordinates = parseCoordinatesString(data.coordinates, data.rawData)
  // Получаем ID из rawData для удаления
  form.value.id = data.rawData?.id || null 
}

onMounted(() => {
  fillFormWithData()
})

// --- Логика удаления ---

const onDeleteClicked = () => {
  showConfirmModal.value = true
}

const onCancelDelete = () => {
  showConfirmModal.value = false
}

const onConfirmDelete = async () => {
  showConfirmModal.value = false
  
  const recordId = form.value.id

  if (!recordId) {
    console.error('Не удалось получить ID записи для удаления.')
    notificationStore.showNotification('Не удалось получить ID записи для удаления.', 'error')
    return
  }

  try {
    console.log(`Попытка удаления записи с ID: ${recordId}`)
    await deleteFaultOrParameter(recordId)
    
    console.log('Удаление успешно.')
    notificationStore.showNotification('Неисправность успешно удалена!', 'success')
    // Эмитим событие, чтобы родительский компонент мог обновить список и закрыть модальное окно
    emit('deleted') 

  } catch (error) {
    console.error('Ошибка при удалении записи:', error)
    // Можно добавить уведомление пользователю об ошибке
    notificationStore.showNotification('Ошибка при удалении неисправности.', 'error')
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