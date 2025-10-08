<template>
  <ModalWrapper
    title="Добавить новый инцидент"
    @close="closeModal"
    @save="saveData"
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
        @update:modelValue="onIncidentTypeChange"
      />

      <AppDropdown
        class="col-span-2"
        id="criticality"
        label="Критичность"
        placeholder="Критичность"
        v-model="form.criticality"
        :options="criticalityOptions"
        :loading="loadingCriticality"
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

      <CoordinateInputs
        class="col-span-2"
        v-model="coordinates"
        :object-bounds="objectBounds"
        @update:modelValue="updateCoordinates"
        @invalid-range="handleInvalidRange" 
        @out-of-bounds="handleOutOfBounds"
        :required="true" 
      />

      <AppDropdown
        id="section"
        label="Участок"
        placeholder="Выберите участок"
        v-model="form.section"
        :options="sectionOptions"
        :loading="loadingSections"
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
        label="ФИО заявителя" 
        placeholder="Введите ФИО" 
        v-model="form.applicantName" 
        :required="true"
      />
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, defineEmits, onMounted, nextTick } from 'vue'
import ModalWrapper from '@/components/layout/Modal/ModalWrapper.vue'
import AppInput from '@/components/ui/FormControls/AppInput.vue'
import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue'
import CoordinateInputs from '@/components/ui/FormControls/CoordinateInputs.vue'
import { loadEvents, saveIncident, loadCriticalityLevels } from '@/api/incidentApi'
import { fetchObjectsForSelect, fetchLocationByCoords } from '@/api/planWorkApi'
import { useNotificationStore } from '@/stores/notificationStore'

const emit = defineEmits(['close', 'update-table'])
const notificationStore = useNotificationStore()

const form = ref({
  incidentType: null,
  place: null,
  objectType: null,
  object: null,
  section: null,
  description: '',
  applicantName: '',
  criticality: null,
})

const coordinates = ref({
  coordStartKm: null,
  coordStartPk: null,
  coordEndKm: null,
  coordEndPk: null,
})

const objectBounds = ref(null)
const isInvalidRange = ref(false)
const isOutOfBounds = ref(false)

const incidentTypeOptions = ref([])
const placeOptions = ref([])
const objectTypeOptions = ref([])
const objectOptions = ref([])
const sectionOptions = ref([])
const criticalityOptions = ref([])
const allLoadedRecords = ref([])
const filteredRecordsByPlace = ref([])

const loadingPlaces = ref(false)
const loadingObjectTypes = ref(false)
const loadingObjects = ref(false)
const loadingSections = ref(false)
const loadingCriticality = ref(false)

const onIncidentTypeChange = (selectedIncident) => {
  form.value.criticality = null;

  if (selectedIncident && selectedIncident.nameCriticality) {
    // fvCriticality из события соответствует value (id) в опциях критичности
    const foundCriticality = criticalityOptions.value.find(
      c => c.value === selectedIncident.fvCriticality
    );
    if (foundCriticality) {
      form.value.criticality = foundCriticality;
    }
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

const loadSections = async (workId = 0) => {
  form.value.section = null
  sectionOptions.value = []
  
  if (!coordinates.value.coordStartKm || !coordinates.value.coordEndKm) {
    return
  }

  loadingSections.value = true
  try {
    const sections = await fetchLocationByCoords(
      workId,
      coordinates.value.coordStartKm,
      coordinates.value.coordEndKm,
      coordinates.value.coordStartPk || 0,
      coordinates.value.coordEndPk || 0
    )

    if (Array.isArray(sections) && sections.length > 0) {
      sectionOptions.value = sections.map(s => ({
        label: s.name || s.label,
        value: s.id || s.value,
        pv: s.pv,
        fullRecord: s
      }))

      form.value.section = sections.length === 1 ? sectionOptions.value[0] : null
    } else {
      sectionOptions.value = []
      form.value.section = null
      notificationStore.showNotification('Не найден участок по указанным координатам', 'warning')
    }
  } catch (error) {
    console.error('Ошибка при загрузке участков:', error)
    notificationStore.showNotification('Ошибка при загрузке участков', 'error')
    sectionOptions.value = []
    form.value.section = null
  } finally {
    loadingSections.value = false
  }
}

const onPlaceChange = (selectedPlaceId) => {
  form.value.objectType = null
  form.value.object = null
  form.value.section = null
  objectTypeOptions.value = []
  objectOptions.value = []
  sectionOptions.value = []
  filteredRecordsByPlace.value = []
  coordinates.value = { coordStartKm: null, coordStartPk: null, coordEndKm: null, coordEndPk: null }
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
  form.value.section = null
  objectOptions.value = []
  sectionOptions.value = []
  coordinates.value = { coordStartKm: null, coordStartPk: null, coordEndKm: null, coordEndPk: null }
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
  coordinates.value = { coordStartKm: null, coordStartPk: null, coordEndKm: null, coordEndPk: null }
  objectBounds.value = null
  isInvalidRange.value = false
  isOutOfBounds.value = false
  form.value.section = null
  sectionOptions.value = []

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
    coordEndKm: parseInt(record.FinishKm) || 0,
    coordEndPk: parseInt(record.FinishPicket) || 0
  }

  objectBounds.value = {
    startAbs: (record.StartKm || 0) * 1000 + (record.StartPicket || 0) * 100,
    endAbs: (record.FinishKm || 0) * 1000 + (record.FinishPicket || 0) * 100,
    StartKm: record.StartKm,
    StartPicket: record.StartPicket,
    FinishKm: record.FinishKm,
    FinishPicket: record.FinishPicket
  }

  await nextTick(async () => {
    await loadSections()
  })
}

const updateCoordinates = async (newCoords) => {
  coordinates.value = newCoords

  form.value.section = null
  sectionOptions.value = []
  
  await loadSections()
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
  if (!form.value.section || !form.value.section.value) {
    notificationStore.showNotification('Не выбран Участок', 'error')
    return false
  }

  const coords = coordinates.value
  if (
    coords.coordStartKm === null ||
    coords.coordStartPk === null ||
    coords.coordEndKm === null ||
    coords.coordEndPk === null
  ) {
    notificationStore.showNotification('Не заполнены все Координаты', 'error')
    return false
  }

  const startAbs = (coords.coordStartKm || 0) * 1000 + (coords.coordStartPk || 0) * 100
  const endAbs = (coords.coordEndKm || 0) * 1000 + (coords.coordEndPk || 0) * 100

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
  
  const selectedCriticality = form.value.criticality;
  const selectedObjectOption = objectOptions.value.find(opt => opt.value == form.value.object?.value)
  const selectedSection = form.value.section
  const selectedEvent = incidentTypeOptions.value.find(opt => opt.value == form.value.incidentType?.value)
  
  if (!selectedEvent || !selectedObjectOption || !selectedObjectOption.fullRecord || !selectedSection || !selectedCriticality) {
      notificationStore.showNotification('Не удалось получить полные данные для сохранения (внутренняя ошибка)', 'error')
      return
  }

  const objectRecord = selectedObjectOption.fullRecord
  
  const payloadData = {
    eventName: selectedEvent.label,
    eventId: selectedEvent.id,
    eventPv: selectedEvent.pv,
    criticalityFv: selectedCriticality.value, // id из loadFactorValForSelect
    criticalityPv: selectedCriticality.pv,    // pv из loadFactorValForSelect
    
    objectId: objectRecord.objObject,
    objectPv: objectRecord.pvObject,

    objLocationClsSection: selectedSection.value,
    pvLocationClsSection: selectedSection.pv,
    
    StartKm: coordinates.value.coordStartKm !== null ? parseFloat(coordinates.value.coordStartKm) : 0.0,
    FinishKm: coordinates.value.coordEndKm !== null ? parseFloat(coordinates.value.coordEndKm) : 0.0,
    StartPicket: coordinates.value.coordStartPk !== null ? parseFloat(coordinates.value.coordStartPk) : 0.0,
    FinishPicket: coordinates.value.coordEndPk !== null ? parseFloat(coordinates.value.coordEndPk) : 0.0,
    
    Description: form.value.description,
    InfoApplicant: form.value.applicantName,
    
    StartLink: 0.0,
    FinishLink: 0.0,
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
    loadingCriticality.value = true;
    const [events, criticalityLevels, _] = await Promise.all([
      loadEvents(),
      loadCriticalityLevels(),
      loadAllObjects()
    ]);
    incidentTypeOptions.value = events;
    criticalityOptions.value = criticalityLevels;
  } catch (error) {
    notificationStore.showNotification('Ошибка при загрузке начальных данных', 'error')
  } finally {
    loadingCriticality.value = false;
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
  padding: 0 32px 32px;
  background-color: #f9fafb;
}

.col-span-2 {
  grid-column: span 2;
}
</style>