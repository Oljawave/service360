<template>
  <ModalWrapper
    title="Добавить новый инцидент"
    :show-save="canInsert"
    @close="closeModal"
    @save="saveData"
  >
    <div class="form-section">
      <AppDropdown
        class="col-span-2"
        id="incidentType"
        label="Событие / запрос"
        placeholder="Введите или выберите тип инцидента"
        v-model="form.incidentType"
        :options="computedIncidentTypeOptions"
        @update:value="onIncidentTypeSelect"
        filterable
        @search="handleIncidentSearch"
        :required="true"
      />

      <AppDropdown
        id="place"
        label="Место"
        placeholder="Выберите место"
        v-model="form.place"
        :options="placeOptions"
        :loading="loadingPlaces"
        @update:value="onPlaceChange"
        :required="true"
      />

      <AppDropdown
        id="objectType"
        label="Тип объекта"
        placeholder="Выберите тип объекта"
        v-model="form.objectType"
        :options="objectTypeOptions"
        :loading="loadingObjectTypes"
        @update:value="onObjectTypeChange"
        :required="true"
      />

      <AppDropdown
        class="col-span-2"
        id="object"
        label="Объект"
        placeholder="Выберите объект"
        v-model="form.object"
        :options="objectOptions"
        :loading="loadingObjects"
        @update:value="onObjectChange"
        :required="true" 
      />

      <FullCoordinates
        class="col-span-2"
        v-model="coordinates"
        :object-bounds="objectBounds"
        @invalid-range="handleInvalidRange"
        @out-of-bounds="handleOutOfBounds" 
        :required="true" 
      />

      <AppInput 
        class="col-span-2" 
        id="description" 
        label="Описание" 
        placeholder="Введите описание инцидента..." 
        v-model="form.description" 
        type="textarea" 
        :required="true"
      />

      <AppInput 
        class="col-span-2" 
        id="applicantName" 
        label="Информация о заявителе" 
        placeholder="Введите информацию о заявителе.." 
        v-model="form.applicantName" 
        :required="true"
      />
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, defineEmits, onMounted, nextTick, computed } from 'vue'
import ModalWrapper from '@/components/layout/Modal/ModalWrapper.vue'
import AppInput from '@/components/ui/FormControls/AppInput.vue'
import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue'
import FullCoordinates from '@/components/ui/FormControls/FullCoordinates.vue'
import { loadEvents, saveIncident, saveNewEvent } from '@/api/incidentApi'
import { fetchObjectsForSelect, fetchLocationByCoords } from '@/api/planWorkApi'
import { usePermissions } from '@/api/usePermissions';
import { useNotificationStore } from '@/stores/notificationStore'

const emit = defineEmits(['close', 'update-table'])
const notificationStore = useNotificationStore()
const { hasPermission } = usePermissions()
const canInsert = computed(() => hasPermission('inc:ins'))

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
  coordStartZv: null,
  coordEndKm: null,
  coordEndPk: null,
  coordEndZv: null,
})

const objectBounds = ref(null)
const isInvalidRange = ref(false)
const isOutOfBounds = ref(false)

const incidentTypeOptions = ref([])
const placeOptions = ref([])
const objectTypeOptions = ref([])
const objectOptions = ref([])
const allLoadedRecords = ref([])
const filteredRecordsByPlace = ref([])

const loadingPlaces = ref(false)
const loadingObjectTypes = ref(false)
const loadingObjects = ref(false)
const searchQuery = ref('');

const computedIncidentTypeOptions = computed(() => {
  if (searchQuery.value && !incidentTypeOptions.value.some(opt => opt.label.toLowerCase() === searchQuery.value.toLowerCase())) {
    return [
      {
        label: `Создать "${searchQuery.value}"`,
        value: `__CREATE__${searchQuery.value}`,
        isCreate: true
      },
      ...incidentTypeOptions.value
    ];
  }
  return incidentTypeOptions.value;
});

const handleIncidentSearch = (query) => {
  searchQuery.value = query;
};

const onIncidentTypeSelect = async (selectedValue, selectedOption) => {
  if (typeof selectedValue === 'string' && selectedValue.startsWith('__CREATE__')) {
    const labelToCreate = selectedValue.substring('__CREATE__'.length);
    
    // Сбрасываем v-model, чтобы "Создать..." не оставалось в поле
    form.value.incidentType = null;
    searchQuery.value = '';

    try {
      if (!labelToCreate.trim()) return;
      
      const newEvent = await saveNewEvent(labelToCreate);
      incidentTypeOptions.value.push(newEvent);
      
      // Устанавливаем только что созданный элемент как выбранный
      await nextTick();
      // Важно: присваиваем полный объект, а не только его value
      form.value.incidentType = incidentTypeOptions.value.find(opt => opt.value === newEvent.value);
      notificationStore.showNotification(`Событие "${labelToCreate}" успешно создано`, 'success');
    } catch (error) {
      notificationStore.showNotification(`Ошибка при создании события: ${error.message}`, 'error');
      form.value.incidentType = null; // Очищаем поле в случае ошибки
    }
  } else {
    // Обычный выбор из списка
    form.value.incidentType = selectedOption;
    searchQuery.value = '';
  }
};

const loadAllObjects = async () => {
  loadingPlaces.value = true
  try {
    const records = await fetchObjectsForSelect(0) 
    allLoadedRecords.value = records

    if (records.length === 0) {
      notificationStore.showNotification('Нет доступных объектов для выбора', 'warning')
      return
    }

    const uniquePlaces = [...new Map(
      records.map(item => [String(item.objSection), item])
    ).values()]

    placeOptions.value = uniquePlaces.map(p => ({
      label: p.nameSection,
      value: p.objSection,
      fullRecord: p
    }))

  } catch (error) {
    notificationStore.showNotification('Ошибка при загрузке мест', 'error')
  } finally {
    loadingPlaces.value = false
  }
}

const onPlaceChange = (selectedPlaceId) => {
  form.value.objectType = null
  form.value.object = null
  objectTypeOptions.value = []
  objectOptions.value = []
  filteredRecordsByPlace.value = []
  coordinates.value = { coordStartKm: null, coordStartPk: null, coordStartZv: null, coordEndKm: null, coordEndPk: null, coordEndZv: null }
  objectBounds.value = null
  isInvalidRange.value = false
  isOutOfBounds.value = false

  if (!selectedPlaceId) return

  loadingObjectTypes.value = true
  try {
    const placeIdToCompare = typeof selectedPlaceId === 'number' ? selectedPlaceId : parseInt(selectedPlaceId)

    const filtered = allLoadedRecords.value.filter(
      record => record.objSection === placeIdToCompare
    )
    filteredRecordsByPlace.value = filtered

    const uniqueTypes = [...new Map(
      filtered.map(r => [String(r.objObjectType), r])
    ).values()]

    objectTypeOptions.value = uniqueTypes.map(t => ({
      label: t.nameObjectType,
      value: t.objObjectType
    }))
  } catch (error) {
    notificationStore.showNotification('Ошибка при фильтрации типов объектов', 'error')
  } finally {
    loadingObjectTypes.value = false
  }
}

const onObjectTypeChange = (selectedObjectTypeId) => {
  form.value.object = null
  objectOptions.value = []
  coordinates.value = { coordStartKm: null, coordStartPk: null, coordStartZv: null, coordEndKm: null, coordEndPk: null, coordEndZv: null }
  objectBounds.value = null
  isInvalidRange.value = false
  isOutOfBounds.value = false

  if (!selectedObjectTypeId || !form.value.place) return

  loadingObjects.value = true
  try {
    const objectTypeIdToCompare = typeof selectedObjectTypeId === 'number' ? selectedObjectTypeId : parseInt(selectedObjectTypeId)

    const filtered = filteredRecordsByPlace.value.filter(
      r => r.objObjectType === objectTypeIdToCompare
    )

    objectOptions.value = filtered.map(r => ({
      label: r.nameObject,
      value: r.objObject,
      fullRecord: r
    }))
  } catch (error) {
    notificationStore.showNotification('Ошибка при фильтрации объектов', 'error')
  } finally {
    loadingObjects.value = false
  }
}

const onObjectChange = async (selectedObjectId) => {
  coordinates.value = { coordStartKm: null, coordStartPk: null, coordStartZv: null, coordEndKm: null, coordEndPk: null, coordEndZv: null }
  objectBounds.value = null
  isInvalidRange.value = false
  isOutOfBounds.value = false

  if (!selectedObjectId) return

  let selectedOption = objectOptions.value.find(
    opt => opt.value == selectedObjectId
  )

  if (!selectedOption) {
    selectedOption = objectOptions.value.find(
      opt => opt.value == selectedObjectId
    )
  }

  if (!selectedOption || !selectedOption.fullRecord) return
  
  const record = selectedOption.fullRecord;

  coordinates.value = {
    coordStartKm: parseInt(record.StartKm) || 0,
    coordStartPk: parseInt(record.StartPicket) || 0,
    coordStartZv: parseInt(record.StartLink) || 0,
    coordEndKm: parseInt(record.FinishKm) || 0,
    coordEndPk: parseInt(record.FinishPicket) || 0,
    coordEndZv: parseInt(record.FinishLink) || 0,
  }

  objectBounds.value = {
    startAbs: (record.StartKm || 0) * 1000 + (record.StartPicket || 0) * 100 + (record.StartLink || 0) * 25,
    endAbs: (record.FinishKm || 0) * 1000 + (record.FinishPicket || 0) * 100 + (record.FinishLink || 0) * 25,
    StartKm: record.StartKm,
    StartPicket: record.StartPicket,
    StartLink: record.StartLink,
    FinishKm: record.FinishKm,
    FinishPicket: record.FinishPicket,
    FinishLink: record.FinishLink,
  }

}

const validateForm = () => {
  if (!form.value.incidentType || !form.value.incidentType.value) {
    notificationStore.showNotification('Не выбран Тип инцидента', 'error')
    return false
  }

  if (!form.value.place || !form.value.place.value) {
    notificationStore.showNotification('Не выбрано Место', 'error')
    return false
  }
  if (!form.value.objectType || !form.value.objectType.value) {
    notificationStore.showNotification('Не выбран Тип объекта', 'error')
    return false
  }
  if (!form.value.object || !form.value.object.value) {
    notificationStore.showNotification('Не выбран Объект', 'error')
    return false
  }

  const coords = coordinates.value
  if (
    coords.coordStartKm === null ||
    coords.coordStartPk === null ||
    coords.coordEndKm === null ||
    coords.coordEndPk === null ||
    coords.coordStartZv === null ||
    coords.coordEndZv === null
  ) {
    notificationStore.showNotification('Не заполнены все Координаты', 'error')
    return false
  }

  const startAbs = (coords.coordStartKm || 0) * 1000 + (coords.coordStartPk || 0) * 100 + (coords.coordStartZv || 0) * 25
  const endAbs = (coords.coordEndKm || 0) * 1000 + (coords.coordEndPk || 0) * 100 + (coords.coordEndZv || 0) * 25



  if (startAbs > endAbs) {
    notificationStore.showNotification('Начало не может быть больше конца', 'error')
    return false
  }

  if (objectBounds.value) {
    const objStartAbs = objectBounds.value.startAbs
    const objEndAbs = objectBounds.value.endAbs
    if (startAbs < objStartAbs || endAbs > objEndAbs) {
      notificationStore.showNotification('Координаты выходят за границы объекта', 'error')
      return false
    }
  }

  if (isInvalidRange.value) {
     notificationStore.showNotification('Начало не может быть больше конца (проверка координат)', 'error')
     return false
  }
  
  if (isOutOfBounds.value) {
     notificationStore.showNotification('Координаты выходят за границы объекта (проверка координат)', 'error')
     return false
  }
  
  if (!form.value.description) {
      notificationStore.showNotification('Введите описание инцидента', 'error')
      return false
  }
  
  if (!form.value.applicantName) {
      notificationStore.showNotification('Введите ФИО заявителя', 'error')
      return false
  }

  return true
}

const saveData = async () => {
  if (!validateForm()) {
     return
  }
  
  const selectedObjectOption = objectOptions.value.find(opt => opt.value == form.value.object?.value)
  const selectedEvent = incidentTypeOptions.value.find(opt => opt.value == form.value.incidentType?.value)
  
  if (!selectedEvent || !selectedObjectOption || !selectedObjectOption.fullRecord) {
      notificationStore.showNotification('Не удалось получить полные данные для сохранения (внутренняя ошибка)', 'error')
      return
  }

  const objectRecord = selectedObjectOption.fullRecord
  
  const payloadData = {
    eventName: selectedEvent.label,
    eventId: selectedEvent.id,
    eventPv: selectedEvent.pv,

    // Добавляем критичность из выбранного события
    criticalityFv: selectedEvent.fvCriticality,
    criticalityPv: selectedEvent.pvCriticality,
    
    objectId: objectRecord.objObject,
    objectPv: objectRecord.pvObject,
    
    StartKm: coordinates.value.coordStartKm !== null ? parseFloat(coordinates.value.coordStartKm) : 0.0,
    FinishKm: coordinates.value.coordEndKm !== null ? parseFloat(coordinates.value.coordEndKm) : 0.0,
    StartPicket: coordinates.value.coordStartPk !== null ? parseFloat(coordinates.value.coordStartPk) : 0.0,
    FinishPicket: coordinates.value.coordEndPk !== null ? parseFloat(coordinates.value.coordEndPk) : 0.0,
    Description: form.value.description,
    InfoApplicant: form.value.applicantName,
    
    StartLink: coordinates.value.coordStartZv !== null ? parseFloat(coordinates.value.coordStartZv) : 0.0,
    FinishLink: coordinates.value.coordEndZv !== null ? parseFloat(coordinates.value.coordEndZv) : 0.0,
  }
  
  try {
      await saveIncident(payloadData)
      notificationStore.showNotification('Инцидент успешно добавлен', 'success')
      emit('update-table')
      closeModal()
  } catch (error) {
      notificationStore.showNotification(error.message, 'error')
  }
}

const handleInvalidRange = (isInvalid) => {
  isInvalidRange.value = isInvalid
  if (isInvalid) {
    notificationStore.showNotification('Начало не может быть больше конца', 'error')
  }
}

const handleOutOfBounds = () => {
  isOutOfBounds.value = true
  notificationStore.showNotification('Координаты выходят за границы объекта', 'error')
}

onMounted(async () => {
  try {
    const [events, _] = await Promise.all([
      loadEvents(),
      loadAllObjects()
    ]);
    incidentTypeOptions.value = events;
  } catch (error) {
    notificationStore.showNotification('Ошибка при загрузке начальных данных', 'error')
  }
})

const closeModal = () => {
  emit('close')
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

.col-span-2 {
  grid-column: span 2;
}
</style>