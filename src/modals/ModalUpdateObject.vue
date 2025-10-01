<template>
  <ModalWrapper
    title="Редактировать объект"
    @close="closeModal"
    @save="saveData"
    :disabled="isSaveDisabled"
  >
    <div class="form-section">
      <h3 class="section-title">Объект</h3>
      
      <AppInput 
        class="col-span-2" 
        id="name" 
        label="Наименование объекта" 
        placeholder="Введите наименование" 
        v-model="form.name" 
        :required="true" />
      
      <AppDropdown
        class="col-span-2"
        id="type"
        label="Вид объекта"
        placeholder="Выберите вид объекта"
        v-model="form.type"
        :options="typeOptions"
        :loading="loadingTypes"
        @update:value="onTypeChange"
        :disabled="true"
        :required="true" />
      
      <CoordinateInputs
        v-model="coordinates"
        @update:modelValue="updateCoordinates"
        :required="true" />
      
      <AppInput 
        class="col-span-2" 
        id="place" 
        label="Место" 
        placeholder="Введите место" 
        v-model="form.place" 
        :disabled="true" 
        :required="true" />
      
      <AppInput 
        class="col-span-2" 
        id="additionalInfo" 
        label="Дополнительные сведения о месте" 
        placeholder="Введите дополнительные сведения" 
        v-model="form.additionalInfo" 
        :required="true" />
      
      <AppDropdown
        id="side"
        label="Сторона"
        placeholder="Выберите сторону"
        v-model="form.side"
        :options="sideOptions"
        :loading="loadingSides"
        :required="true" />
      
      <AppInput 
        id="deviceNumber" 
        label="Номер" 
        placeholder="Введите номер прибора" 
        v-model="form.deviceNumber" 
        :required="true" />
      
      <AppNumberInput 
        id="replacementPeriod" 
        label="Периодичность замены (год)" 
        placeholder="Введите периодичность" 
        v-model="form.replacementPeriod" 
        :required="true" />
      
      <AppDatePicker 
        id="installDate" 
        label="Дата установки" 
        placeholder="Выберите дату" 
        v-model="form.installDate" 
        :required="true" />
      
      <AppInput 
        class="col-span-2" 
        id="description" 
        label="Описание объекта" 
        placeholder="Введите примечание..." 
        v-model="form.description" 
        type="textarea" 
        :required="true" />
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, computed, onMounted, defineEmits, defineProps, watch } from 'vue'
import ModalWrapper from '@/components/layout/Modal/ModalWrapper.vue'
import AppInput from '@/components/ui/FormControls/AppInput.vue'
import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue'
import AppDatePicker from '@/components/ui/FormControls/AppDatePicker.vue'
import AppNumberInput from '@/components/ui/FormControls/AppNumberInput.vue'
import CoordinateInputs from '@/components/ui/FormControls/CoordinateInputs.vue'

import { useNotificationStore } from '@/stores/notificationStore'
import { loadTypes, loadSides, fetchStationOfCoord } from '@/api/objectApi'
import { updateObject } from '@/api/updateObjectApi'
import { fetchUserData } from '@/api/inspectionsApi'

import { parseDate, formatDateToISO } from '@/stores/date'

const notificationStore = useNotificationStore()
const emit = defineEmits(['close', 'update-table'])
const props = defineProps({
  rowData: {
    type: Object,
    required: true
  }
})

const form = ref({
  name: '',
  type: null,
  additionalInfo: '',
  characteristic: '',
  side: null,
  sidePv: '',
  deviceNumber: '',
  replacementPeriod: 0,
  installDate: null, 
  description: '',
  place: '',
})

const coordinates = ref({
  coordStartKm: 0,
  coordStartPk: 0,
  coordEndKm: 0,
  coordEndPk: 0,
})

const typeOptions = ref([])
const loadingTypes = ref(false)
const sideOptions = ref([])
const loadingSides = ref(false)

const selectedType = ref(null)
const stationData = ref(null)
const firstCheckDone = ref(false)

const isSaveDisabled = computed(() => {
  return !form.value.place || ['Место не найдено', 'Не найдено'].includes(form.value.place) || !selectedType.value || !stationData.value
})

const closeModal = () => {
  emit('close')
}

const saveData = async () => {
  console.group('ModalUpdateObject: Сохранение данных')
  console.log('form.value.installDate (до форматирования):', form.value.installDate)

  try {
    if (!selectedType.value || !selectedType.value.cls) {
      notificationStore.showNotification('Тип объекта не выбран', 'error')
      console.warn('Тип объекта не выбран')
      console.groupEnd()
      return
    }

    if (!stationData.value) {
      notificationStore.showNotification('Станция не найдена', 'error')
      console.warn('Станция не найдена')
      console.groupEnd()
      return
    }

    // Получаем данные пользователя
    const user = await fetchUserData()

    // Форматируем дату установки
    let installDate = null
    const rawDate = form.value.installDate

    const formatDateToString = (date) => {
      if (!date) return null
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    if (typeof rawDate === 'number' && !isNaN(rawDate)) {
      installDate = formatDateToString(rawDate)
    } else if (rawDate instanceof Date && !isNaN(rawDate)) {
      installDate = formatDateToString(rawDate)
    } else if (typeof rawDate === 'string' && rawDate.length >= 10) {
      installDate = rawDate.slice(0, 10)
    }

    console.log('Форматированная дата установки:', installDate)

    const updatedAt = new Date().toISOString().slice(0, 10)
    console.log('updatedAt:', updatedAt)

    const sideLabel = sideOptions.value.find(s => s.value === form.value.side)?.label || ''
    const typeLabel = typeOptions.value.find(t => t.value === form.value.type)?.label || ''

    const payload = {
      id: props.rowData.id,
      name: form.value.name,
      type: form.value.type,
      additionalInfo: form.value.additionalInfo,
      characteristic: form.value.characteristic,
      side: form.value.side,
      sidePv: form.value.sidePv,
      deviceNumber: form.value.deviceNumber,
      replacementPeriod: form.value.replacementPeriod,
      installDate,
      updatedAt,
      description: form.value.description,
      place: form.value.place,
      coordStartKm: coordinates.value.coordStartKm,
      coordStartPk: coordinates.value.coordStartPk,
      coordEndKm: coordinates.value.coordEndKm,
      coordEndPk: coordinates.value.coordEndPk,
      linkCls: selectedType.value.cls,
      objSection: stationData.value.id,
      pvSection: stationData.value.pv,
      fvSide: form.value.side,
      pvSide: form.value.sidePv,
      sideLabel,
      typeLabel,
      objUser: user.id,
      pvUser: user.pv,
    }

    console.log("Payload для обновления:", payload)

    await updateObject(payload, selectedType.value, stationData.value)

    notificationStore.showNotification('Объект успешно обновлён!', 'success')
    closeModal()
    emit('update-table')
  } catch (error) {
    console.error('Ошибка при обновлении объекта:', error)
    notificationStore.showNotification('Ошибка при сохранении изменений', 'error')
  } finally {
    console.groupEnd()
  }
}

const checkPlace = async () => {
  const { coordStartKm, coordStartPk, coordEndKm, coordEndPk } = coordinates.value
  if (coordStartKm && coordStartPk && coordEndKm && coordEndPk) {
    try {
      const response = await fetchStationOfCoord({
        StartKm: coordStartKm,
        FinishKm: coordEndKm,
        StartPicket: coordStartPk,
        FinishPicket: coordEndPk
      })
      if (response.result && response.result.records.length > 0) {
        form.value.place = response.result.records[0].name || 'Место не найдено'
        stationData.value = response.result.records[0]
      } else {
        form.value.place = 'Место не найдено'
        stationData.value = null
      }
    } catch (error) {
      form.value.place = 'Место не найдено'
      stationData.value = null
    }
  }
}

const updateCoordinates = async (newCoordinates) => {
  coordinates.value = newCoordinates
  const filled = Object.values(coordinates.value).every(v => v !== null && v !== undefined)

  if (!firstCheckDone.value && filled) {
    firstCheckDone.value = true
    await checkPlace()
  } else if (firstCheckDone.value) {
    await checkPlace()
  }
}

const onTypeChange = (value) => {
  selectedType.value = typeOptions.value.find(option => option.value === value)
  if (!selectedType.value) {
    notificationStore.showNotification('Тип объекта не выбран', 'error')
  }
}

onMounted(async () => {
  try {
    loadingTypes.value = true
    const loadedTypes = await loadTypes()
    typeOptions.value = loadedTypes
  } catch (error) {
    notificationStore.showNotification('Ошибка загрузки типов', 'error')
  } finally {
    loadingTypes.value = false
  }

  try {
    loadingSides.value = true
    const loadedSides = await loadSides()
    sideOptions.value = loadedSides.map(option => ({
      label: option.name,
      value: option.id,
      pv: option.pv,
    }))
  } catch (error) {
    notificationStore.showNotification('Ошибка загрузки сторон', 'error')
  } finally {
    loadingSides.value = false
  }

  fillFormWithData()
})

const fillFormWithData = () => {
  const data = props.rowData

  console.group('ModalUpdateObject: Загрузка данных')
  console.log('rowData:', data)
  console.log('data.installDate (raw):', data.installDate)

  form.value.name = data.name || ''
  form.value.type = data.objObjectType || null
  form.value.additionalInfo = data.location || ''
  form.value.characteristic = data.feature || ''
  form.value.deviceNumber = data.number || ''
  form.value.replacementPeriod = data.replacement || 0
  form.value.description = data.description || ''

  const parsedDate = parseDate(data.installDate)
  console.log('Результат parseDate(data.installDate):', parsedDate)
  form.value.installDate = parsedDate

  const match = data.coords?.match(/(\d+) км (\d+) пк - (\d+) км (\d+) пк/)
  if (match) {
    coordinates.value = {
      coordStartKm: parseInt(match[1]),
      coordStartPk: parseInt(match[2]),
      coordEndKm: parseInt(match[3]),
      coordEndPk: parseInt(match[4]),
    }
    console.log('Координаты распаршены:', coordinates.value)
  } else {
    console.warn('Координаты не распарсились из:', data.coords)
  }

  form.value.side = data.fvSide || null
  console.log('fvSide из данных:', data.fvSide)

  const selectedSide = sideOptions.value.find(s => s.value === data.fvSide)
  if (selectedSide) {
    form.value.sidePv = selectedSide.pv
    console.log('sidePv установлен из стороны:', selectedSide.pv)
  } else {
    console.warn('Сторона не найдена в sideOptions:', data.fvSide)
  }

  selectedType.value = typeOptions.value.find(t => t.value === data.objObjectType) || null
  console.log('objObjectType из данных:', data.objObjectType)
  console.log('selectedType.value:', selectedType.value)

  setTimeout(() => {
    firstCheckDone.value = false
    console.log('Вызов updateCoordinates с:', coordinates.value)
    updateCoordinates(coordinates.value)
  }, 100)

  console.groupEnd()
}

watch(() => form.value.side, (newSideId) => {
  const selectedSide = sideOptions.value.find(option => option.value === newSideId)
  if (selectedSide) {
    form.value.sidePv = selectedSide.pv
  }
})
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

.coordinate-row {
  display: flex;
  gap: 24px;
}

.coordinate-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  align-items: end;
}
</style>