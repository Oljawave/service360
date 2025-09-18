<template>
  <ModalWrapper title="Карточка осмотра/проверки" @close="closeModal">
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
                  @update:modelValue="handleDefectComponentChange"
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
                  @update:modelValue="handleParameterComponentChange"
                />
                <AppDropdown
                  label="Параметр"
                  id="parameter-dropdown"
                  :options="parameterOptions"
                  v-model="parameterRecord.parameterType"
                  placeholder="Выберите параметр"
                  class="half-width"
                  :loading="loadingParameters"
                />
              </div>
              
              <div class="parameter-value-group">
                <AppNumberInput
                  label="Минимальное значение"
                  id="min-parameter-value"
                  v-model="parameterRecord.minValue"
                  placeholder="Введите минимальное значение"
                  class="half-width value-input"
                />
                <AppNumberInput
                  label="Максимальное значение"
                  id="max-parameter-value"
                  v-model="parameterRecord.maxValue"
                  placeholder="Введите максимальное значение"
                  class="half-width value-input"
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
import AppNumberInput from '@/components/ui/FormControls/AppNumberInput.vue';
import TabsHeader from '@/components/ui/TabsHeader.vue';
import WorkHeaderInfo from '@/components/ui/WorkHeaderInfo.vue';
import ExistingDataBlock from '@/components/ui/ExistingDataBlock.vue';
import { useNotificationStore } from '@/stores/notificationStore';
import { loadInspectionEntriesForWorkPlan, saveInspectionInfo, saveFaultInfo, fetchUserData, loadComponentsByTypObjectForSelect, loadDefectsByComponentForSelect, loadComponentParametersForSelect } from '@/api/inspectionsApi.js';
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
const savedInspectionId = ref(null);

const tabs = ref([
  { name: 'info', label: 'Новая информация по работе', icon: 'Info' },
  { name: 'defects', label: 'Неисправности', icon: 'AlertTriangle' },
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
  defectType: null,
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
  minValue: null,
  maxValue: null,
  value: '',
  note: '',
});

const existingRecords = ref([]);

const componentOptions = ref([]);
const defectOptions = ref([]);
const parameterOptions = ref([]);
const loadingComponents = ref(false);
const loadingDefects = ref(false);
const loadingParameters = ref(false);

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
  if (isSaving.value) return;

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
      const response = await saveInspectionInfo(dataToSave);
      
      // Сохраняем ID созданной записи инспекции
      console.log('Response from saveInspectionInfo:', response);
      if (response?.result?.id) {
        savedInspectionId.value = response.result.id;
      } else if (response?.id) {
        savedInspectionId.value = response.id;
      } else if (response?.result?.records?.[0]?.id) {
        savedInspectionId.value = response.result.records[0].id;
      }
      
      console.log('Saved inspection ID:', savedInspectionId.value);

      notificationStore.showNotification('Информация по работе успешно сохранена!', 'success');
      isInfoSaved.value = true;
      
      const existingData = await loadExistingData(props.record);
      
      // Если ID не был получен из ответа API, попробуем найти его в загруженных данных
      if (!savedInspectionId.value && existingData && existingData.length > 0) {
        // Берем ID последней созданной записи
        const lastRecord = existingData[existingData.length - 1];
        if (lastRecord.id) {
          savedInspectionId.value = lastRecord.id;
          console.log('Inspection ID found in existing data:', savedInspectionId.value);
        }
      }
      
      const savedCoordinates = {
        coordStartKm: newRecord.value.coordinates.coordStartKm,
        coordStartPk: newRecord.value.coordinates.coordStartPk,
        coordStartZv: newRecord.value.coordinates.coordStartZv,
        coordEndKm: newRecord.value.coordinates.coordEndKm,
        coordEndPk: newRecord.value.coordinates.coordEndPk,
        coordEndZv: newRecord.value.coordinates.coordEndZv,
      };
      
      defectRecord.value.startCoordinates = { ...savedCoordinates };
      
      parameterRecord.value.startCoordinates = { ...savedCoordinates };
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      
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
    // Валидация данных дефекта
    if (!defectRecord.value.component || !defectRecord.value.defectType) {
      notificationStore.showNotification('Необходимо выбрать компонент и дефект!', 'error');
      return;
    }

    if (!defectRecord.value.startCoordinates.coordStartKm || !defectRecord.value.startCoordinates.coordStartPk) {
      notificationStore.showNotification('Необходимо указать координаты дефекта!', 'error');
      return;
    }

    if (!savedInspectionId.value) {
      notificationStore.showNotification('Сначала необходимо сохранить информацию по работе!', 'error');
      return;
    }

    isSaving.value = true;
    try {
      // Получаем данные выбранного дефекта для извлечения pv
      const selectedDefect = defectOptions.value.find(d => d.value === defectRecord.value.defectType.value || d.value === defectRecord.value.defectType);
      
      if (!selectedDefect) {
        throw new Error('Выбранный дефект не найден');
      }

      // Формируем данные для сохранения согласно требуемой структуре API
      const currentDateTime = new Date().toISOString();
      
      const dataToSave = {
        name: `${currentDateTime}-${selectedDefect.value}`,
        objInspection: savedInspectionId.value,
        objDefect: selectedDefect.value,
        pvDefect: selectedDefect.pv || selectedDefect.value, // Используем pv если есть, иначе value
        pvLocationClsSection: parseInt(props.sectionPv),
        objLocationClsSection: props.sectionId,
        StartKm: defectRecord.value.startCoordinates.coordStartKm,
        FinishKm: defectRecord.value.startCoordinates.coordEndKm || defectRecord.value.startCoordinates.coordStartKm,
        StartPicket: defectRecord.value.startCoordinates.coordStartPk,
        FinishPicket: defectRecord.value.startCoordinates.coordEndPk || defectRecord.value.startCoordinates.coordStartPk,
        StartLink: defectRecord.value.startCoordinates.coordStartZv || 0,
        FinishLink: defectRecord.value.startCoordinates.coordEndZv || defectRecord.value.startCoordinates.coordStartZv || 0,
        Description: defectRecord.value.note || '',
        CreationDateTime: currentDateTime
      };

      console.log('Payload for defect API call:', dataToSave);
      await saveFaultInfo(dataToSave);

      notificationStore.showNotification('Дефект успешно сохранен!', 'success');
      
      // Очищаем форму дефекта после успешного сохранения
      defectRecord.value = {
        startCoordinates: { ...defectRecord.value.startCoordinates },
        defectType: null,
        note: '',
        component: null,
      };
      defectOptions.value = [];
      
    } catch (error) {
      console.error('Ошибка сохранения дефекта:', error);
      
      let errorMessage = 'Не удалось сохранить дефект.';
      
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Ошибка сервера. Попробуйте еще раз.';
      }
      
      notificationStore.showNotification(errorMessage, 'error');
    } finally {
      isSaving.value = false;
    }
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
    return [];
  }
  try {
    const data = await loadInspectionEntriesForWorkPlan(record.id, record.pv);
    existingRecords.value = data.map(item => ({
      date: formatDate(item.FactDateEnd),
      coordinates: formatCoordinates(item.StartKm, item.StartPicket, item.StartLink, item.FinishKm, item.FinishPicket, item.FinishLink)
    }));
    return data; // Возвращаем исходные данные для поиска ID
  } catch (error) {
    console.error("Не удалось загрузить существующие записи:", error);
    notificationStore.showNotification('Не удалось загрузить ранее внесенные записи.', 'error');
    existingRecords.value = [];
    return [];
  }
};

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
      value: defect.id || defect.value,
      pv: defect.pv || defect.id || defect.value // Сохраняем pv для использования в API
    }));
  } catch (error) {
    console.error('Ошибка загрузки дефектов:', error);
    notificationStore.showNotification('Не удалось загрузить дефекты', 'error');
    defectOptions.value = [];
  } finally {
    loadingDefects.value = false;
  }
};

const loadParameters = async (objComponent) => {
  if (!objComponent) {
    parameterOptions.value = [];
    return;
  }
  
  loadingParameters.value = true;
  try {
    const parameters = await loadComponentParametersForSelect(objComponent);
    parameterOptions.value = parameters.map(parameter => ({
      label: parameter.name || parameter.label,
      value: parameter.id || parameter.value
    }));
  } catch (error) {
    console.error('Ошибка загрузки параметров:', error);
    notificationStore.showNotification('Не удалось загрузить параметры', 'error');
    parameterOptions.value = [];
  } finally {
    loadingParameters.value = false;
  }
};

const handleDefectComponentChange = async (selectedComponent) => {
  defectRecord.value.defectType = null;
  defectOptions.value = [];

  if (selectedComponent) {
    const componentId = selectedComponent.value || selectedComponent;
    const component = componentOptions.value.find(c => c.value === componentId);
    if (component?.objComponent) {
      await loadDefects(component.objComponent);
    }
  }
};

const handleParameterComponentChange = async (selectedComponent) => {
  parameterRecord.value.parameterType = null;
  if (selectedComponent) {
    const componentId = selectedComponent.value || selectedComponent;
    const component = componentOptions.value.find(c => c.value === componentId);
    if (component?.objComponent) {
      await loadParameters(component.objComponent);
    }
  } else {
    parameterOptions.value = [];
  }
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
        coordEndZv: newRecord.value.coordinates.coordEndZv,
      });
      
      loadExistingData(newRecordData);
      
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

.parameter-value-group {
  display: flex;
  gap: 16px;
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
