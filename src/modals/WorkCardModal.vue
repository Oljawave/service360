<template>
  <ModalWrapper title="Карточка плановой работы" @close="closeModal">
    <div class="work-card-content">
      <WorkHeaderInfo :record="record" :section="section" :date="date" />
      <ExistingDataBlock :existingRecords="existingRecords" />

      <div class="tabs-block">
        <TabsHeader :tabs="tabs" v-model="activeTab" />

        <div class="tab-content">
          <div v-if="activeTab === 'info'">
            <div class="new-info-content">
              <div class="section-heading spaced-heading info-heading">Местоположение работы</div>
              <div class="coordinates-input-group info-coords">
                <FullCoordinates
                  v-model="newRecord.coordinates"
                  label="Координаты начала"
                  class="coord-start"
                  :objectBounds="objectBounds"
                />
              </div>
              <div class="input-row date-input-row">
                <AppDatePicker
                  label="Дата"
                  placeholder="Выберите дату"
                  id="date-picker"
                  v-model="newRecord.date"
                  class="date-picker"
                />
              </div>
              <AppInput
                label="Причина отклонения от плана"
                id="deviation-reason"
                v-model="newRecord.deviationReason"
                placeholder="Введите причину отклонения от плана..."
                class="full-width-input text-area"
                multiline
              />
            </div>
          </div>

          <div v-else-if="activeTab === 'defects'">
            <div class="defects-content">
              <div class="section-heading spaced-heading defect-heading">Местоположение дефекта</div>
              <div class="coordinates-input-group defect-coords">
                <FullCoordinates
                  v-model="defectRecord.startCoordinates"
                  label="Координаты начала"
                  class="coord-start"
                  :objectBounds="objectBounds"
                />
              </div>
              <div class="defect-info-group">
                <AppDropdown
                  label="Компонент"
                  id="component-dropdown"
                  :options="componentOptions"
                  v-model="defectRecord.component"
                  placeholder="Выберите компонент"
                  class="half-width"
                />
                <AppInput
                  label="Дефект / неисправность"
                  id="defect-input"
                  v-model="defectRecord.defectType"
                  placeholder="Введите дефект"
                  class="half-width"
                />
              </div>
              <AppInput
                label="Примечание / заметка"
                id="defect-note"
                v-model="defectRecord.note"
                placeholder="Введите примечание..."
                class="full-width-input text-area"
                multiline
              />
            </div>
          </div>

          <div v-else-if="activeTab === 'parameters'">
            <div class="parameters-content">
              <div class="section-heading spaced-heading parameters-heading">Местоположение параметра</div>
              <div class="coordinates-input-group parameter-coords">
                <FullCoordinates
                  v-model="parameterRecord.startCoordinates"
                  label="Координаты начала"
                  class="coord-start"
                  :objectBounds="objectBounds"
                />
              </div>
              <div class="parameter-info-group">
                <AppDropdown
                  label="Компонент"
                  id="component-dropdown"
                  :options="componentOptions"
                  v-model="parameterRecord.component"
                  placeholder="Выберите компонент"
                  class="half-width"
                />
                <AppDropdown
                  label="Параметр"
                  id="parameter-dropdown"
                  :options="parameterOptions"
                  v-model="parameterRecord.parameterType"
                  placeholder="Выберите параметр"
                  class="half-width"
                />
              </div>
              <AppInput
                label="Значение"
                id="parameter-value"
                v-model="parameterRecord.value"
                placeholder="Введите значение"
                class="half-width value-input"
              />
              <AppInput
                label="Примечание / заметка"
                id="parameter-note"
                v-model="parameterRecord.note"
                placeholder="Введите примечание..."
                class="full-width-input text-area"
                multiline
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'info'" class="button-container">
        <UiButton text="Добавить местоположение" icon="Plus" class="add-location-btn" />
        <div class="main-actions">
          <MainButton label="Сохранить" :loading="isSaving" @click="saveWork" class="save-btn" />
        </div>
      </div>

      <div v-if="activeTab === 'defects'" class="button-container">
        <UiButton text="Добавить дефект" icon="Plus" class="add-location-btn" />
        <div class="main-actions">
          <MainButton label="Сохранить" :loading="isSaving" @click="saveWork" class="save-btn" />
        </div>
      </div>

      <div v-if="activeTab === 'parameters'" class="button-container">
        <UiButton text="Добавить параметр" icon="Plus" class="add-location-btn" />
        <div class="main-actions">
          <MainButton label="Сохранить" :loading="isSaving" @click="saveWork" class="save-btn" />
        </div>
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import ModalWrapper from '@/components/layout/Modal/ModalWrapper.vue';
import MainButton from '@/components/ui/MainButton.vue';
import UiButton from '@/components/ui/UiButton.vue';
import FullCoordinates from '@/components/ui/FormControls/FullCoordinates.vue';
import AppDatePicker from '@/components/ui/FormControls/AppDatePicker.vue';
import AppInput from '@/components/ui/FormControls/AppInput.vue';
import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue';
import TabsHeader from '@/components/ui/TabsHeader.vue';
import WorkHeaderInfo from '@/components/ui/WorkHeaderInfo.vue';
import ExistingDataBlock from '@/components/ui/ExistingDataBlock.vue';

const props = defineProps({
  record: {
    type: Object,
    default: null,
  },
  section: {
    type: String,
    default: null,
  },
  date: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['close']);

const isSaving = ref(false);
const activeTab = ref('info');

const tabs = ref([
  { name: 'info', label: 'Новая информация по работе', icon: 'Info' },
  { name: 'defects', label: 'Дефекты', icon: 'AlertTriangle' },
  { name: 'parameters', label: 'Параметры', icon: 'SlidersHorizontal' },
]);

const newRecord = ref({
  coordinates: {
    coordStartKm: null,
    coordStartPk: null,
    coordEndKm: null,
    coordEndPk: null,
  },
  endCoordinates: {
    coordStartKm: null,
    coordStartPk: null,
    coordEndKm: null,
    coordEndPk: null,
  },
  date: null,
  deviationReason: '',
});

const defectRecord = ref({
  startCoordinates: {
    coordStartKm: null,
    coordStartPk: null,
    coordEndKm: null,
    coordEndPk: null,
  },
  endCoordinates: {
    coordStartKm: null,
    coordStartPk: null,
    coordEndKm: null,
    coordEndPk: null,
  },
  component: null,
  defectType: '',
  note: '',
});

const parameterRecord = ref({
  startCoordinates: {
    coordStartKm: null,
    coordStartPk: null,
    coordEndKm: null,
    coordEndPk: null,
  },
  endCoordinates: {
    coordStartKm: null,
    coordStartPk: null,
    coordEndKm: null,
    coordEndPk: null,
  },
  component: null,
  parameterType: null,
  value: '',
  note: '',
});

const existingRecords = ref([
  { date: '03.04.2025', coordinates: '19км 3пк 0зв — 29км 10пк 0зв' },
  { date: '03.04.2025', coordinates: '19км 3пк 0зв — 29км 10пк 0зв' },
]);

const componentOptions = ref([
  { label: 'Рельс', value: 'Рельс' },
  { label: 'Шпалы', value: 'Шпалы' },
  { label: 'Стрелочный перевод', value: 'Стрелочный перевод' },
]);

const parameterOptions = ref([
  { label: 'Вертикальный износ', value: 'Вертикальный износ' },
  { label: 'Боковой износ', value: 'Боковой износ' },
  { label: 'Прокат', value: 'Прокат' },
]);

const objectBounds = ref({
  StartKm: 19,
  StartPicket: 0,
  FinishKm: 30,
  FinishPicket: 0,
});

const closeModal = () => {
  emit('close');
};

const saveWork = () => {
  isSaving.value = true;
  let dataToSave;
  if (activeTab.value === 'info') {
    dataToSave = newRecord.value;
  } else if (activeTab.value === 'defects') {
    dataToSave = defectRecord.value;
  } else if (activeTab.value === 'parameters') {
    dataToSave = parameterRecord.value;
  }
  console.log('Сохраняем данные:', dataToSave);
  setTimeout(() => {
    isSaving.value = false;
    closeModal();
  }, 1000);
};

watch(
  () => props.record,
  (newRecord) => {
    if (newRecord) {
      // При получении новой записи, можно инициализировать поля
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.work-card-content {
  padding: 24px;
}

.tabs-block {
  margin-bottom: 24px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-heading.spaced-heading {
  margin-bottom: 24px;
}

.coordinates-input-group {
  display: flex;
  gap: 24px;
  width: 100%;
}

.coord-start, .coord-end {
  flex: 1;
}

.date-picker {
  width: 100%;
}

.full-width-input {
  width: 100%;
}

.spacer-24 {
  height: 24px;
}

.button-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 24px;
}

.main-actions {
  display: flex;
  gap: 12px;
}

/* New defect section styles */
.defects-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.defect-heading {
  color: #c70039;
}

.defect-info-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.half-width {
  width: 100%;
}

.text-area {
  height: 100px;
}

/* New parameter section styles */
.parameters-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.parameters-heading {
  color: #3182ce;
}

.parameter-info-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.value-input {
  width: 50%;
}

/* Info tab specific styles */
.new-info-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-heading {
  color: #3182ce;
}

@media (max-width: 768px) {
  .coordinates-input-group {
    flex-direction: column;
    gap: 12px;
  }

  .button-container {
    flex-direction: column;
    gap: 16px;
  }

  .main-actions {
    width: 100%;
    justify-content: center;
  }

  .defect-info-group,
  .parameter-info-group {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .value-input {
    width: 100%;
  }
}
</style>