<template>
  <ModalWrapper
    title="Добавить новый объект"
    @close="closeModal"
    @save="saveData"
    :disabled="isSaveDisabled"
  >
    <div class="form-section">
      <AppInput class="col-span-2" id="name" label="Наименование объекта" placeholder="Введите наименование" v-model="form.name" />
      <AppDropdown
        class="col-span-2"
        id="type"
        label="Вид объекта"
        placeholder="Выберите вид объекта"
        v-model="form.type"
        :options="typeOptions"
        :loading="loadingTypes"
        @update:value="onTypeChange"
      />
      <CoordinateInputs
        v-model="coordinates"
        @update:modelValue="updateCoordinates"
      />
      <AppInput class="col-span-2" id="place" label="Место" placeholder="Введите место" v-model="form.place" :disabled="true" />
      <AppInput class="col-span-2" id="additionalInfo" label="Дополнительные сведения о месте" placeholder="Введите дополнительные сведения" v-model="form.additionalInfo" />
      <AppInput class="col-span-2" id="characteristic" label="Характеристика" placeholder="Введите характеристику" v-model="form.characteristic" />
      <AppDropdown
        id="side"
        label="Сторона (необязательно)"
        placeholder="Выберите сторону"
        v-model="form.side"
        :options="sideOptions"
        :loading="loadingSides"
      />
      <AppInput id="deviceNumber" label="Номер" placeholder="Введите номер прибора" v-model="form.deviceNumber" />
      <AppNumberInput id="replacementPeriod" label="Периодичность замены (год)" placeholder="Введите периодичность" v-model="form.replacementPeriod" />
      <AppDatePicker id="installDate" label="Дата установки" placeholder="Выберите дату" v-model="form.installDate" />
      <AppInput class="col-span-2" id="description" label="Описание объекта" placeholder="Введите примечание..." v-model="form.description" type="textarea" />
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, computed, onMounted, defineEmits, watch } from 'vue'
import ModalWrapper from '@/components/layout/Modal/ModalWrapper.vue'
import AppInput from '@/components/ui/FormControls/AppInput.vue'
import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue'
import AppDatePicker from '@/components/ui/FormControls/AppDatePicker.vue'
import AppNumberInput from '@/components/ui/FormControls/AppNumberInput.vue'
import CoordinateInputs from '@/components/ui/FormControls/CoordinateInputs.vue'

import { useNotificationStore } from '@/stores/notificationStore'
import { loadTypes, loadSides, fetchStationOfCoord } from '@/api/objectApi'
import { saveObjectServed } from '@/api/saveObjectApi'

const notificationStore = useNotificationStore()
const emit = defineEmits(['close', 'update-table'])

const form = ref({
  name: '',
  type: null,
  additionalInfo: '',
  ownership: '',
  characteristic: '',
  side: null, 
  sidePv: '',
  deviceNumber: '',
  replacementPeriod: null,
  installDate: null,
  description: '',
  place: '',
})

const coordinates = ref({
  coordStartKm: null,
  coordStartPk: null,
  coordEndKm: null,
  coordEndPk: null,
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
  try {
    if (!selectedType.value || !selectedType.value.cls) {
      notificationStore.showNotification('Тип объекта не выбран', 'error')
      return
    }

    if (!stationData.value) {
      notificationStore.showNotification('Станция не найдена', 'error')
      return
    }

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

    const createdAt = new Date().toISOString().slice(0, 10)

    const payload = {
      ...form.value,
      ...coordinates.value,
      installDate,
      createdAt,
    }

    const linkCls = selectedType.value.cls
    const objSection = stationData.value.id
    const pvSection = stationData.value.pv

    const sideLabel = form.value.side ? (sideOptions.value.find(s => s.value === form.value.side)?.label || '') : ''
    const typeLabel = typeOptions.value.find(t => t.value === form.value.type)?.label || ''

    console.log("Selected side:", form.value.side);
    console.log("Side PV:", form.value.sidePv);

    const extendedPayload = {
      ...payload,
      linkCls,
      objSection,
      pvSection,
      fvSide: form.value.side ? form.value.side.value : null,  
      pvSide: form.value.side ? form.value.side.pv : null,      
      sideLabel,
      typeLabel,
    }

    console.log("Payload to send:", extendedPayload);

    await saveObjectServed(extendedPayload, selectedType.value, stationData.value)

    notificationStore.showNotification('Объект успешно сохранён!', 'success')
    closeModal()
    emit('update-table')
  } catch (error) {
    notificationStore.showNotification('Ошибка при сохранении объекта', 'error')
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
})

watch(() => form.value.side, (newSideId) => {
  const selectedSide = sideOptions.value.find(option => option.value === newSideId)
  if (selectedSide) {
    form.value.sidePv = selectedSide.pv
  } else {
    form.value.sidePv = ''
  }
})
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