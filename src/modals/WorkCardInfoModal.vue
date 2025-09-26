<template>
  <ModalWrapper title="Карточка осмотра/проверки" :showFooter="false" @close="closeModal">
    <div class="work-card-content">
      <WorkHeaderInfo :record="record" :section="section" :date="date" />

      <div class="tabs-block">
        <TabsHeader 
          :tabs="tabs" 
          :modelValue="activeTab" 
          @update:modelValue="handleTabChange" 
          :disabledTabs="disabledTabs" 
        />

        <div class="tab-content">
          <div v-if="activeTab === 'info'">
            <ExistingDataBlock :existingRecords="existingRecords" dataType="info" />
            <div class="new-info-content">
              <div class="section-heading spaced-heading info-heading">Местоположение работы (disabled)</div>
              <div class="coordinates-input-group info-coords">
                <FullCoordinates
                  v-model="newRecord.coordinates"
                  label="Координаты начала"
                  class="coord-start"
                  :isInspection="true"
                  :objectBounds="objectBounds"
                  :disabled="true" 
                />
              </div>
              <div class="form-grid">
                <AppDatePicker
                  label="Дата"
                  placeholder="Выберите дату"
                  id="date-picker"
                  v-model="newRecord.date"
                  class="col-span-1"
                  :disabled="true"
                />
              </div>
              <AppInput
                label="Причина отклонения от плана"
                id="deviation-reason"
                v-model="newRecord.deviationReason"
                placeholder="Введите причину отклонения от плана..."
                class="full-width-input text-area"
                multiline
                :disabled="true"
              />
            </div>
          </div>

          <div v-else-if="activeTab === 'defects'">
            <ExistingDataBlock :existingRecords="existingDefects" dataType="defects" />
            <div class="defects-content">
              <div class="section-heading spaced-heading defect-heading">Местоположение неисправности</div>
              <div class="coordinates-input-group defect-coords">
                <FullCoordinates
                  v-model="defectRecord.startCoordinates"
                  label="Координаты начала"
                  class="coord-start"
                  :objectBounds="inspectionBounds"
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
            <ExistingDataBlock :existingRecords="existingParameters" dataType="parameters" />
            <div class="parameters-content">
              <div class="section-heading spaced-heading parameters-heading">Местоположение параметра</div>
              <div class="coordinates-input-group parameter-coords">
                <FullCoordinates
                  v-model="parameterRecord.startCoordinates"
                  label="Координаты начала"
                  class="coord-start"
                  :objectBounds="inspectionBounds"
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
                  @update:modelValue="handleParameterChange"
                />
              </div>
              
              <div class="parameter-value-group">
                <AppNumberInput
                  label="Минимальное значение"
                  id="min-parameter-value"
                  v-model="parameterRecord.minValue"
                  placeholder="Введите минимальное значение"
                  class="half-width value-input"
                  :status="shouldShowMinMaxError && isMinMaxInvalid ? 'error' : null"
                  @focus="handleMinMaxFocus"
                  @blur="handleMinMaxBlur"
                />
                <AppNumberInput
                  label="Максимальное значение"
                  id="max-parameter-value"
                  v-model="parameterRecord.maxValue"
                  placeholder="Введите максимальное значение"
                  class="half-width value-input"
                  :status="shouldShowMinMaxError && isMinMaxInvalid ? 'error' : null"
                  @focus="handleMinMaxFocus"
                  @blur="handleMinMaxBlur"
                />
              </div>

              <AppNumberInput
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
          <MainButton :label="getButtonLabel()" :loading="isSaving" @click="saveWork" class="save-btn" v-if="activeTab !== 'info'" />
        </div>
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits, onMounted } from 'vue'; 
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
import { 
  loadInspectionEntriesForWorkPlan, saveFaultInfo, saveParameterInfo, 
  loadComponentsByTypObjectForSelect, loadDefectsByComponentForSelect, 
  loadComponentParametersForSelect, loadFaultEntriesForInspection, 
  loadParameterEntriesForInspection, loadFactorValForSelect 
} from '@/api/inspectionsApi.js';
import { formatDate } from '@/stores/date.js';

const props = defineProps({
  record: { type: Object, default: null },
  section: { type: String, default: null },
  date: { type: String, default: null },
  sectionId: { type: [Number, String], default: null },
  sectionPv: { type: [Number, String], default: null },
  inspectionId: { type: [Number, String], default: null },
});

const emit = defineEmits(['close']);

const isSaving = ref(false);
// Устанавливаем вкладку "defects" по умолчанию
const activeTab = ref('defects');
const savedInspectionId = ref(props.inspectionId);

const shouldShowMinMaxError = ref(false);
const isUserTypingMinMax = ref(false);

const tabs = ref([
  { name: 'info', label: 'Новая информация по работе', icon: 'Info' }, 
  { name: 'defects', label: 'Неисправности', icon: 'AlertTriangle' },
  { name: 'parameters', label: 'Параметры', icon: 'SlidersHorizontal' },
]);

// Computed свойство для отключения вкладки 'info'
const disabledTabs = computed(() => ['info']);

const notificationStore = useNotificationStore();

const newRecord = ref({
  coordinates: { coordStartKm: null, coordStartPk: null, coordStartZv: null, coordEndKm: null, coordEndPk: null, coordEndZv: null },
  date: null,
  deviationReason: '',
});

const defectRecord = ref({
  startCoordinates: { coordStartKm: null, coordStartPk: null, coordStartZv: null, coordEndKm: null, coordEndPk: null, coordEndZv: null },
  defectType: null, note: '', component: null,
});

const parameterRecord = ref({
  startCoordinates: { coordStartKm: null, coordStartPk: null, coordStartZv: null, coordEndKm: null, coordEndPk: null, coordEndZv: null },
  component: null, parameterType: null, minValue: null, maxValue: null, value: '', note: '',
});

const existingRecords = ref([]);
const existingDefects = ref([]);
const existingParameters = ref([]);

const componentOptions = ref([]);
const defectOptions = ref([]);
const parameterOptions = ref([]);
const outOfNormOptions = ref([]);
const loadingComponents = ref(false);
const loadingDefects = ref(false);
const loadingParameters = ref(false);

const objectBounds = ref({ StartKm: null, StartPicket: null, FinishKm: null, FinishPicket: null });
const inspectionBounds = ref({ StartKm: null, StartPicket: null, StartLink: null, FinishKm: null, FinishPicket: null, FinishLink: null });

const isMinMaxInvalid = computed(() => {
  const minVal = parseFloat(parameterRecord.value.minValue);
  const maxVal = parseFloat(parameterRecord.value.maxValue);
  return !isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal;
});

const handleMinMaxFocus = () => { isUserTypingMinMax.value = true; shouldShowMinMaxError.value = false; };
const handleMinMaxBlur = () => { isUserTypingMinMax.value = false; setTimeout(() => { shouldShowMinMaxError.value = true; validateMinMax(); }, 100); };
const validateMinMax = () => {
  if (isMinMaxInvalid.value) {
    notificationStore.showNotification('Минимальное значение не может быть больше максимального значения!', 'error');
  }
};

const closeModal = () => { emit('close'); };

const getButtonLabel = () => {
  switch (activeTab.value) {
    case 'defects': return 'Добавить неисправность';
    case 'parameters': return 'Добавить параметр';
    default: return 'Сохранить'; 
  }
};

const handleTabChange = async (newTab) => {
  if (disabledTabs.value.includes(newTab)) {
    // Запрещаем переход на вкладку 'info'
    return;
  }
  
  activeTab.value = newTab;
  
  if (newTab === 'defects' && savedInspectionId.value) {
    await loadExistingDefects(savedInspectionId.value);
  } else if (newTab === 'parameters' && savedInspectionId.value) {
    await loadExistingParameters(savedInspectionId.value);
    if (outOfNormOptions.value.length === 0) { await loadOutOfNormFactors(); }
  }
};

const formatCoordinates = (startKm, startPk, startZv, finishKm, finishPk, finishZv) => {
  const startPart = startKm != null && startPk != null ? `${startKm}км ${startPk}пк${startZv != null ? ` ${startZv}зв` : ''}` : '';
  const finishPart = finishKm != null && finishPk != null ? `${finishKm}км ${finishPk}пк${finishZv != null ? ` ${finishZv}зв` : ''}` : '';
  return startPart && finishPart ? `${startPart} — ${finishPart}` : 'Координаты отсутствуют';
};

const loadExistingDefects = async (inspectionId) => {
  if (!inspectionId) { existingDefects.value = []; return; }
  try {
    const data = await loadFaultEntriesForInspection(inspectionId);
    existingDefects.value = data.map(item => ({
      date: formatDate(item.CreationDateTime),
      coordinates: formatCoordinates(item.StartKm, item.StartPicket, item.StartLink, item.FinishKm, item.FinishPicket, item.FinishLink),
      defect: item.nameDefect || 'Неизвестный дефект'
    }));
  } catch (error) {
    console.error("Не удалось загрузить существующие дефекты:", error);
    notificationStore.showNotification('Не удалось загрузить ранее внесенные дефекты.', 'error');
    existingDefects.value = [];
  }
};

const loadExistingParameters = async (inspectionId) => {
  if (!inspectionId) { existingParameters.value = []; return; }
  try {
    const data = await loadParameterEntriesForInspection(inspectionId);
    existingParameters.value = data.map(item => ({
      date: formatDate(item.CreationDateTime),
      coordinates: formatCoordinates(item.StartKm, item.StartPicket, item.StartLink, item.FinishKm, item.FinishPicket, item.FinishLink),
      component: item.nameComponent || 'Неизвестный компонент',
      parameter: item.nameComponentParams || 'Неизвестный параметр',
      value: item.ParamsLimit || 'Не указано'
    }));
  } catch (error) {
    console.error("Не удалось загрузить существующие параметры:", error);
    notificationStore.showNotification('Не удалось загрузить ранее внесенные параметры.', 'error');
    existingParameters.value = [];
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
    componentOptions.value = components.map(c => ({ label: c.name || c.label, value: c.id || c.value, objComponent: c.id || c.value }));
  } catch (error) {
    console.error('Ошибка загрузки компонентов:', error);
    notificationStore.showNotification('Не удалось загрузить компоненты', 'error');
    componentOptions.value = [];
  } finally {
    loadingComponents.value = false;
  }
};

const loadDefects = async (objComponent) => {
  if (!objComponent) { defectOptions.value = []; return; }
  loadingDefects.value = true;
  try {
    const defects = await loadDefectsByComponentForSelect(objComponent);
    defectOptions.value = defects.map(d => ({ label: d.name || d.label, value: d.id || d.value, pv: d.pv || d.id || d.value }));
  } catch (error) {
    console.error('Ошибка загрузки дефектов:', error);
    notificationStore.showNotification('Не удалось загрузить дефекты', 'error');
    defectOptions.value = [];
  } finally {
    loadingDefects.value = false;
  }
};

const loadParameters = async (objComponent) => {
  if (!objComponent) { parameterOptions.value = []; return; }
  loadingParameters.value = true;
  try {
    const parameters = await loadComponentParametersForSelect(objComponent);
    parameterOptions.value = parameters.map(p => ({ label: p.name || p.label, value: p.id || p.value, pv: p.pv || p.id || p.value, paramslimitmin: p.paramslimitmin, paramslimitmax: p.paramslimitmax }));
  } catch (error) {
    console.error('Ошибка загрузки параметров:', error);
    notificationStore.showNotification('Не удалось загрузить параметры', 'error');
    parameterOptions.value = [];
  } finally {
    loadingParameters.value = false;
  }
};

const loadOutOfNormFactors = async () => {
  try {
    const factors = await loadFactorValForSelect();
    outOfNormOptions.value = factors.map(f => ({ label: f.name || f.label, value: f.id || f.value, pv: f.pv || f.id || f.value }));
  } catch (error) {
    console.error('Ошибка загрузки факторов OutOfNorm:', error);
    notificationStore.showNotification('Не удалось загрузить факторы "вне нормы"', 'error');
    outOfNormOptions.value = [];
  }
};

const handleDefectComponentChange = async (newComponent) => {
  defectRecord.value.defectType = null;
  defectOptions.value = [];
  if (newComponent?.value) {
    await loadDefects(newComponent.value);
  }
};

const handleParameterComponentChange = async (newComponent) => {
  parameterRecord.value.parameterType = null;
  parameterOptions.value = [];
  if (newComponent?.value) {
    await loadParameters(newComponent.value);
  }
};

const handleParameterChange = (newParameter) => {
  parameterRecord.value.minValue = null;
  parameterRecord.value.maxValue = null;

  if (newParameter?.paramslimitmin != null) {
    parameterRecord.value.minValue = newParameter.paramslimitmin;
  }
  if (newParameter?.paramslimitmax != null) {
    parameterRecord.value.maxValue = newParameter.paramslimitmax;
  }
};

const saveWork = async () => {
  if (isSaving.value) return;
  if (!savedInspectionId.value) {
    notificationStore.showNotification('Отсутствует ID осмотра для сохранения данных.', 'error');
    return;
  }

  if (activeTab.value === 'defects') {
    // Валидация данных дефекта
    if (!defectRecord.value.component || !defectRecord.value.defectType) {
      notificationStore.showNotification('Необходимо выбрать компонент и дефект!', 'error');
      return;
    }
    if (!defectRecord.value.startCoordinates.coordStartKm || !defectRecord.value.startCoordinates.coordStartPk) {
      notificationStore.showNotification('Необходимо указать координаты дефекта!', 'error');
      return;
    }

    isSaving.value = true;
    try {
      const selectedDefect = defectOptions.value.find(d => d.value === (defectRecord.value.defectType.value || defectRecord.value.defectType));
      if (!selectedDefect) {
        throw new Error('Выбранный дефект не найден');
      }
      
      const now = new Date();
      // Добавляем 5 часов для казахстанского времени (UTC+5)
      const kazakhstanTime = new Date(now.getTime() + (5 * 60 * 60 * 1000));
      const currentDateTime = kazakhstanTime.toISOString();
      const currentDate = currentDateTime.split('T')[0];

      const dataToSave = {
        name: `${currentDate}-${selectedDefect.value}`,
        objInspection: savedInspectionId.value,
        objDefect: selectedDefect.value,
        pvDefect: selectedDefect.pv || selectedDefect.value,
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

      await saveFaultInfo(dataToSave);
      notificationStore.showNotification('Дефект успешно сохранен!', 'success');
      await loadExistingDefects(savedInspectionId.value);
      
      // Очищаем форму дефекта после успешного сохранения
      defectRecord.value.defectType = null;
      defectRecord.value.note = '';
      defectRecord.value.component = null;
      defectOptions.value = [];

    } catch (error) {
      console.error('Ошибка сохранения дефекта:', error);
      let errorMessage = 'Не удалось сохранить дефект.';
      if (error.response?.data?.error?.message) { errorMessage = error.response.data.error.message; }
      notificationStore.showNotification(errorMessage, 'error');
    } finally {
      isSaving.value = false;
    }
  } else if (activeTab.value === 'parameters') {
    // Валидация данных параметра
    if (!parameterRecord.value.component || !parameterRecord.value.parameterType) {
      notificationStore.showNotification('Необходимо выбрать компонент и параметр!', 'error');
      return;
    }
    if (!parameterRecord.value.startCoordinates.coordStartKm || !parameterRecord.value.startCoordinates.coordStartPk) {
      notificationStore.showNotification('Необходимо указать координаты параметра!', 'error');
      return;
    }
    if (isMinMaxInvalid.value) {
      notificationStore.showNotification('Минимальное значение не может быть больше максимального значения!', 'error');
      shouldShowMinMaxError.value = true;
      return;
    }
    if (parameterRecord.value.value === null || parameterRecord.value.value === '') {
      notificationStore.showNotification('Необходимо ввести значение параметра!', 'error');
      return;
    }

    isSaving.value = true;
    try {
      const selectedParameter = parameterOptions.value.find(p => p.value === (parameterRecord.value.parameterType.value || parameterRecord.value.parameterType));
      if (!selectedParameter) { throw new Error('Выбранный параметр не найден'); }

      if (outOfNormOptions.value.length === 0) { await loadOutOfNormFactors(); }

      const paramValue = parseFloat(parameterRecord.value.value);
      const minValue = parseFloat(parameterRecord.value.minValue);
      const maxValue = parseFloat(parameterRecord.value.maxValue);
      let isOutOfNorm = false;
      if (!isNaN(paramValue)) {
        if (!isNaN(minValue) && !isNaN(maxValue)) {
          isOutOfNorm = paramValue < minValue || paramValue > maxValue;
        } else if (!isNaN(minValue)) {
          isOutOfNorm = paramValue < minValue;
        } else if (!isNaN(maxValue)) {
          isOutOfNorm = paramValue > maxValue;
        }
      }
      
      const outOfNormFactor = isOutOfNorm ? (outOfNormOptions.value.find(f => f.label === 'Да') || {}).value : (outOfNormOptions.value.find(f => f.label === 'Нет') || {}).value;

      const now = new Date();
      const kazakhstanTime = new Date(now.getTime() + (5 * 60 * 60 * 1000));
      const currentDateTime = kazakhstanTime.toISOString();
      const currentDate = currentDateTime.split('T')[0];

      const dataToSave = {
        name: `${currentDate}-${selectedParameter.value}`,
        objInspection: savedInspectionId.value,
        objComponentParams: selectedParameter.value,
        pvComponentParams: selectedParameter.pv || selectedParameter.value,
        pvLocationClsSection: parseInt(props.sectionPv),
        objLocationClsSection: props.sectionId,
        StartKm: parameterRecord.value.startCoordinates.coordStartKm,
        FinishKm: parameterRecord.value.startCoordinates.coordEndKm || parameterRecord.value.startCoordinates.coordStartKm,
        StartPicket: parameterRecord.value.startCoordinates.coordStartPk,
        FinishPicket: parameterRecord.value.startCoordinates.coordEndPk || parameterRecord.value.startCoordinates.coordStartPk,
        StartLink: parameterRecord.value.startCoordinates.coordStartZv || 0,
        FinishLink: parameterRecord.value.startCoordinates.coordEndZv || parameterRecord.value.startCoordinates.coordStartZv || 0,
        Value: parameterRecord.value.value,
        ParamsLimitMin: parameterRecord.value.minValue,
        ParamsLimitMax: parameterRecord.value.maxValue,
        Description: parameterRecord.value.note || '',
        CreationDateTime: currentDateTime,
        ObjFactorVal: outOfNormFactor,
        PvFactorVal: outOfNormFactor, // Assuming pv is the same as obj for this type of object
      };

      await saveParameterInfo(dataToSave);
      notificationStore.showNotification('Параметр успешно сохранен!', 'success');
      await loadExistingParameters(savedInspectionId.value);
      
      // Очищаем форму параметра после успешного сохранения
      parameterRecord.value.parameterType = null;
      parameterRecord.value.minValue = null;
      parameterRecord.value.maxValue = null;
      parameterRecord.value.value = '';
      parameterRecord.value.note = '';
      parameterRecord.value.component = null;
      parameterOptions.value = [];

    } catch (error) {
      console.error('Ошибка сохранения параметра:', error);
      let errorMessage = 'Не удалось сохранить параметр.';
      if (error.response?.data?.error?.message) { errorMessage = error.response.data.error.message; }
      notificationStore.showNotification(errorMessage, 'error');
    } finally {
      isSaving.value = false;
    }
  }
};

onMounted(async () => {
  // При открытии WorkCardInfoModal, сразу загружаем существующие данные
  if (savedInspectionId.value) {
    await loadExistingDefects(savedInspectionId.value);
    await loadExistingParameters(savedInspectionId.value);
  }
  
  // Всегда загружаем компоненты, так как они нужны для вкладок Defects и Parameters
  await loadComponents();
  
  if (activeTab.value === 'parameters' && outOfNormOptions.value.length === 0) {
    await loadOutOfNormFactors();
  }
});

watch(() => props.inspectionId, (newId) => {
  savedInspectionId.value = newId;
  if (newId) {
    loadExistingDefects(newId);
    loadExistingParameters(newId);
  }
}, { immediate: true });
</script>

<style scoped>
.work-card-content { padding: 24px; }
.tabs-block { margin-bottom: 24px; }
.tab-content { display: flex; flex-direction: column; gap: 16px; }
.section-heading.spaced-heading { margin-bottom: 24px; }
.coordinates-input-group { display: flex; gap: 24px; width: 100%; }
.coord-start, .coord-end { flex: 1; }
.full-width-input { width: 100%; }
.button-container { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; }
.main-actions { display: flex; gap: 12px; }
.defects-content { display: flex; flex-direction: column; gap: 16px; }
.defect-heading { color: #c70039; }
.defect-info-group { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.half-width { width: 100%; }
.text-area { height: 100px; }
.parameters-content { display: flex; flex-direction: column; gap: 16px; }
.parameters-heading { color: #3182ce; }
.parameter-info-group { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.value-input { width: 50%; }
.new-info-content { display: flex; flex-direction: column; gap: 16px; }
.info-heading { color: #3182ce; }
.parameter-value-group { display: flex; gap: 16px; }

@media (max-width: 768px) {
  .coordinates-input-group { flex-direction: column; gap: 12px; }
  .button-container { flex-direction: column; gap: 16px; }
  .main-actions { width: 100%; justify-content: center; }
  .defect-info-group, .parameter-info-group { grid-template-columns: 1fr; gap: 12px; }
  .value-input { width: 100%; }
}
</style>