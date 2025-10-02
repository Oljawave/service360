<template>
  <ModalWrapper
    title="Информация о неисправности"
    @close="closeModal"
    :showSaveButton="false"
    :showCancelButton="false"
    :showDelete="true"
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
</template>

<script setup>
import { ref, onMounted, defineEmits, defineProps } from 'vue'
import ModalWrapper from '@/components/layout/Modal/ModalWrapper.vue'
import AppInput from '@/components/ui/FormControls/AppInput.vue'
import AppDatePicker from '@/components/ui/FormControls/AppDatePicker.vue'
import FullCoordinates from '@/components/ui/FormControls/FullCoordinates.vue'

const emit = defineEmits(['close'])
const props = defineProps({
  rowData: {
    type: Object,
    required: true
  }
})

const initialCoordinates = { coordStartKm: null, coordStartPk: null, coordStartZv: null, coordEndKm: null, coordEndPk: null, coordEndZv: null }

const form = ref({
  nameObject: '',
  nameSection: '',
  nameLocationClsSection: '',
  nameDefectsComponent: '',
  nameDefect: '',
  factDateEnd: null,
  parsedCoordinates: { ...initialCoordinates },
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
}

onMounted(() => {
  fillFormWithData()
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
</style>