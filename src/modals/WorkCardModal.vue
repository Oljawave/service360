<template>
  <ModalWrapper title="Карточка плановой работы" @close="closeModal">
    <div class="work-card-content">
      <WorkHeaderInfo :record="record" :section="section" :date="date" />
      <ExistingDataBlock :existingRecords="existingRecords" />

      <div class="tabs-block">
        <TabsHeader :tabs="tabs" :modelValue="activeTab" @update:modelValue="handleTabChange" />

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
              <div class="form-grid">
                <AppDatePicker
                  label="Дата"
                  placeholder="Выберите дату"
                  id="date-picker"
                  v-model="newRecord.date"
                  class="col-span-1"
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
                  :loading="loadingComponents"
                  @update:value="handleDefectComponentChange"
                />
                <AppDropdown
                  label="Дефект / неисправность"
                  id="defect-dropdown"
                  :options="defectOptions"
                  v-model="defectRecord.defectType"
                  placeholder="Выберите дефект"
                  class="half-width"
                  :loading="loadingDefects"
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
                  :loading="loadingComponents"
                  @update:value="handleParameterComponentChange"
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

      <div class="button-container">
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
import FullCoordinates from '@/components/ui/FormControls/FullCoordinates.vue';
import AppDatePicker from '@/components/ui/FormControls/AppDatePicker.vue';
import AppInput from '@/components/ui/FormControls/AppInput.vue';
import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue';
import TabsHeader from '@/components/ui/TabsHeader.vue';
import WorkHeaderInfo from '@/components/ui/WorkHeaderInfo.vue';
import ExistingDataBlock from '@/components/ui/ExistingDataBlock.vue';
import { useNotificationStore } from '@/stores/notificationStore';
import { loadInspectionEntriesForWorkPlan, saveInspectionInfo, fetchUserData, loadComponentsByTypObjectForSelect, loadDefectsByComponentForSelect } from '@/api/inspectionsApi.js';
import { formatDate, formatDateToISO } from '@/stores/date.js';

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
  sectionId: {
    type: [Number, String],
    default: null,
  },
  sectionPv: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(['close']);

const isSaving = ref(false);
const activeTab = ref('info');
const isInfoSaved = ref(false);

const tabs = ref([
  { name: 'info', label: 'Новая информация по работе', icon: 'Info' },
  { name: 'defects', label: 'Дефекты', icon: 'AlertTriangle' },
  { name: 'parameters', label: 'Параметры', icon: 'SlidersHorizontal' },
]);

const notificationStore = useNotificationStore();

const newRecord = ref({
  coordinates: {
    coordStartKm: null,
    coordStartPk: null,
    coordStartZv: null,
    coordEndKm: null,
    coordEndPk: null,
    coordEndZv: null,
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
    coordEndZv: null,
  },
  defectType: '',
  note: '',
  component: null,
});

const parameterRecord = ref({
  startCoordinates: {
    coordStartKm: null,
    coordStartPk: null,
    coordEndKm: null,
    coordEndPk: null,
    coordEndZv: null,
  },
  component: null,
  parameterType: null,
  value: '',
  note: '',
});

const existingRecords = ref([]);

// Динамические опции для компонентов и дефектов
const componentOptions = ref([]);
const defectOptions = ref([]);
const loadingComponents = ref(false);
const loadingDefects = ref(false);

const parameterOptions = ref([
  { label: 'Вертикальный износ', value: 'Вертикальный износ' },
  { label: 'Боковой износ', value: 'Боковой износ' },
  { label: 'Прокат', value: 'Прокат' },
]);

const objectBounds = ref({
  StartKm: null,
  StartPicket: null,
  FinishKm: null,
  FinishPicket: null,
});

const closeModal = () => {
  emit('close');
};

const handleTabChange = (newTab) => {
  if (newTab !== 'info' && !isInfoSaved.value) {
    notificationStore.showNotification('Сначала необходимо сохранить информацию по работе!', 'error');
    return;
  }
  activeTab.value = newTab;
};

const saveWork = async () => {
  if (isSaving.value) return; // Предотвращаем повторные вызовы
  
  if (activeTab.value === 'info') {
    isSaving.value = true;  
    try {
      const user = await fetchUserData();

      const formattedDate = formatDateToISO(newRecord.value.date);

      const dataToSave = {
        name: `${props.record.id}-${formattedDate}`,
        objLocationClsSection: props.sectionId,
        pvLocationClsSection: parseInt(props.sectionPv),
        objWorkPlan: props.record.id,
        pvWorkPlan: props.record.pv,
        objUser: user.id,
        pvUser: user.pv,
        StartKm: newRecord.value.coordinates.coordStartKm,
        FinishKm: newRecord.value.coordinates.coordEndKm,
        StartPicket: newRecord.value.coordinates.coordStartPk,
        FinishPicket: newRecord.value.coordinates.coordEndPk,
        StartLink: newRecord.value.coordinates.coordStartZv,
        FinishLink: newRecord.value.coordinates.coordEndZv,
        FactDateEnd: formattedDate,
        CreatedAt: new Date().toISOString().split('T')[0],
        UpdatedAt: new Date().toISOString().split('T')[0],
        ReasonDeviation: newRecord.value.deviationReason,
      };

      console.log('Payload for API call:', dataToSave);
      await saveInspectionInfo(dataToSave);

      notificationStore.showNotification('Информация по работе успешно сохранена!', 'success');
      isInfoSaved.value = true;
      
      // Обновляем список существующих записей после успешного сохранения
      await loadExistingData(props.record);
      
      // Автоматически заполняем координаты в табах "Дефекты" и "Параметры"
      const savedCoordinates = {
        coordStartKm: newRecord.value.coordinates.coordStartKm,
        coordStartPk: newRecord.value.coordinates.coordStartPk,
        coordStartZv: newRecord.value.coordinates.coordStartZv,
        coordEndKm: newRecord.value.coordinates.coordEndKm,
        coordEndPk: newRecord.value.coordinates.coordEndPk,
        coordEndZv: newRecord.value.coordinates.coordEndZv,
      };
      
      // Заполняем координаты для дефектов
      defectRecord.value.startCoordinates = { ...savedCoordinates };
      
      // Заполняем координаты для параметров
      parameterRecord.value.startCoordinates = { ...savedCoordinates };
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      
      // Извлекаем сообщение об ошибке из ответа сервера
      let errorMessage = 'Не удалось сохранить информацию по работе.';
      
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Ошибка сервера. Попробуйте еще раз.';
      }
      
      notificationStore.showNotification(errorMessage, 'error');
    } finally {
      isSaving.value = false;
    }
  } else if (activeTab.value === 'defects') {
    const dataToSave = defectRecord.value;
    console.log('Сохраняем данные дефекта:', dataToSave);
  } else if (activeTab.value === 'parameters') {
    const dataToSave = parameterRecord.value;
    console.log('Сохраняем данные параметра:', dataToSave);
  }
};

const formatCoordinates = (startKm, startPk, startZv, finishKm, finishPk, finishZv) => {
  const startPart = startKm != null && startPk != null ? `${startKm}км ${startPk}пк${startZv != null ? ` ${startZv}зв` : ''}` : '';
  const finishPart = finishKm != null && finishPk != null ? `${finishKm}км ${finishPk}пк${finishZv != null ? ` ${finishZv}зв` : ''}` : '';
  return startPart && finishPart ? `${startPart} — ${finishPart}` : 'Координаты отсутствуют';
};

const loadExistingData = async (record) => {
  if (!record || !record.id || !record.pv) {
    return;
  }
  try {
    const data = await loadInspectionEntriesForWorkPlan(record.id, record.pv);
    existingRecords.value = data.map(item => ({
      date: formatDate(item.FactDateEnd),
      coordinates: formatCoordinates(item.StartKm, item.StartPicket, item.StartLink, item.FinishKm, item.FinishPicket, item.FinishLink)
    }));
  } catch (error) {
    console.error("Не удалось загрузить существующие записи:", error);
    notificationStore.showNotification('Не удалось загрузить ранее внесенные записи.', 'error');
    existingRecords.value = [];
  }
};

// Загрузка компонентов по objObject
const loadComponents = async () => {
  if (!props.record?.objObject) {
    console.warn('objObject не найден в записи:', props.record);
    return;
  }

  loadingComponents.value = true;
  try {
    const components = await loadComponentsByTypObjectForSelect(props.record.objObject);
    componentOptions.value = components.map(component => ({
      label: component.name || component.label,
      value: component.id || component.value,
      objComponent: component.id || component.value
    }));
  } catch (error) {
    console.error('Ошибка загрузки компонентов:', error);
    notificationStore.showNotification('Не удалось загрузить компоненты', 'error');
    componentOptions.value = [];
  } finally {
    loadingComponents.value = false;
  }
};

// Загрузка дефектов по выбранному компоненту
const loadDefects = async (objComponent) => {
  if (!objComponent) {
    defectOptions.value = [];
    return;
  }

  loadingDefects.value = true;
  try {
    const defects = await loadDefectsByComponentForSelect(objComponent);
    defectOptions.value = defects.map(defect => ({
      label: defect.name || defect.label,
      value: defect.id || defect.value
    }));
  } catch (error) {
    console.error('Ошибка загрузки дефектов:', error);
    notificationStore.showNotification('Не удалось загрузить дефекты', 'error');
    defectOptions.value = [];
  } finally {
    loadingDefects.value = false;
  }
};

// Обработчик изменения компонента для дефектов
const handleDefectComponentChange = async (selectedComponent) => {
  defectRecord.value.defectType = null; // Сбрасываем выбранный дефект
  if (selectedComponent) {
    const component = componentOptions.value.find(c => c.value === selectedComponent);
    if (component?.objComponent) {
      await loadDefects(component.objComponent);
    }
  } else {
    defectOptions.value = [];
  }
};

// Обработчик изменения компонента для параметров
const handleParameterComponentChange = async (selectedComponent) => {
  parameterRecord.value.parameterType = null; // Сбрасываем выбранный параметр
  // Здесь можно добавить загрузку параметров по компоненту, если потребуется
};

watch(
  () => props.record,
  (newRecordData) => {
    if (newRecordData) {
      objectBounds.value = {
        StartKm: newRecordData.StartKm || null,
        StartPicket: newRecordData.StartPicket || null,
        StartLink: newRecordData.StartLink || null,
        FinishKm: newRecordData.FinishKm || null,
        FinishPicket: newRecordData.FinishPicket || null,
        FinishLink: newRecordData.FinishLink || null,
      };

      Object.assign(newRecord.value.coordinates, {
        coordStartKm: newRecordData.StartKm || null,
        coordStartPk: newRecordData.StartPicket || null,
        coordStartZv: newRecordData.StartLink || null,
        coordEndKm: newRecordData.FinishKm || null,
        coordEndPk: newRecordData.FinishPicket || null,
        coordEndZv: newRecordData.FinishLink || null,
      });
      
      loadExistingData(newRecordData);
      
      // Загружаем компоненты при инициализации
      loadComponents();
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
