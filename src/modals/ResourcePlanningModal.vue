<template>
  <ModalWrapper
    title="Карточка работы"
    :show-save="false"
    :show-cancel="false"
    :showDelete="false"
    @close="closeModal"
  >
    <div class="work-card-content">
      <WorkHeaderInfo :record="record" :section="section" :date="date" />

      <div class="tabs-block">
        <TabsHeader :tabs="tabs" :modelValue="activeTab" />

        <div class="tab-content">
          <div v-if="activeTab === 'info'">
            <ExistingDataBlock :existingRecords="existingRecords" dataType="planning" />
            
            <div class="new-info-content">
              <!-- Новая структура для вкладки "Новая информация по задаче" -->
              <div class="form-grid-planning">
                
                <!-- 1. Задача (AppDropdown) class="col-span-2" -->
                <AppDropdown
                  label="Задача"
                  placeholder="Выберите задачу"
                  id="task-dropdown"
                  v-model="newRecord.task"
                  :options="taskOptions"
                  class="col-span-2"
                  :required="true" />

                <!-- 2. Плановый объем (AppNumberInput) class="col-span-2" -->
                <AppNumberInput
                  label="Плановый объем"
                  id="planned-volume-input"
                  v-model.number="newRecord.plannedVolume"
                  placeholder="Введите плановый объем"
                  type="number" 
                  min="0"
                  class="col-span-2" />
                
                <!-- 3. Дата начала (AppDatePicker) class="col-span-1" -->
                <AppDatePicker
                  label="Дата начала"
                  placeholder="Выберите дату начала"
                  id="date-start-picker"
                  v-model="newRecord.dateStartPlan"
                  class="col-span-1"
                  :required="true" />
                  
                <!-- 4. Дата завершения (AppDatePicker) class="col-span-1" -->
                <AppDatePicker
                  label="Дата завершения"
                  placeholder="Выберите дату завершения"
                  id="date-end-picker"
                  v-model="newRecord.dateEndPlan"
                  class="col-span-1"
                  :required="true" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="button-container">
        <div class="main-actions">
          <MainButton :label="getButtonLabel()" :loading="isSaving" @click="saveWork" class="save-btn" />
        </div>
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits, onMounted } from 'vue';
import ModalWrapper from '@/components/layout/Modal/ModalWrapper.vue';
import MainButton from '@/components/ui/MainButton.vue';
import AppDatePicker from '@/components/ui/FormControls/AppDatePicker.vue';
import AppNumberInput from '@/components/ui/FormControls/AppNumberInput.vue';
import TabsHeader from '@/components/ui/TabsHeader.vue';
import WorkHeaderInfo from '@/components/ui/WorkHeaderInfo.vue';
import ExistingDataBlock from '@/components/ui/ExistingDataBlock.vue';
import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue';
import { useNotificationStore } from '@/stores/notificationStore';
import { fetchUserData } from '@/api/inspectionsApi.js'; 
import { loadTasks, saveTaskLog, loadTaskLogEntriesForWorkPlan } from '@/api/repairApi.js';
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
  { name: 'info', label: 'Новая информация по задаче', icon: 'Info' },
]);

const notificationStore = useNotificationStore();

// НОВЫЕ ПОЛЯ ДЛЯ ПЛАНИРОВАНИЯ
const newRecord = ref({
  task: null, // Выбранный объект из AppDropdown: { label, value }
  plannedVolume: null, // Плановый объем
  dateStartPlan: null, // Дата начала
  dateEndPlan: null, // Дата завершения
});

const taskOptions = ref([]);

const existingRecords = ref([]);

// Упрощено, так как координаты больше не используются в этом блоке
const objectBounds = ref({}); 

const closeModal = () => {
  emit('close');
};

const getButtonLabel = () => {
  return 'Добавить запись в журнал';
};

// ... handleTabChange остается без изменений

const saveWork = async () => {
  if (isSaving.value) return;

  if (activeTab.value === 'info') {
    // Валидация обязательных полей
    if (!newRecord.value.task || !newRecord.value.dateStartPlan || !newRecord.value.dateEndPlan) {
      notificationStore.showNotification('Пожалуйста, заполните все обязательные поля (Задача, Дата начала, Дата завершения).', 'error');
      return;
    }

    // Валидация на отрицательное значение
    if (newRecord.value.plannedVolume !== null && newRecord.value.plannedVolume < 0) {
      notificationStore.showNotification('Плановый объем не может быть отрицательным.', 'error');
      return;
    }

    isSaving.value = true;
    try {
      const user = await fetchUserData();

      // Подготовка данных для сохранения
      const dataToSave = {
        // Обязательные поля для связи с планом/секцией
        objLocationClsSection: props.sectionId,
        pvLocationClsSection: parseInt(props.sectionPv),
        objWorkPlan: props.record.id,
        pvWorkPlan: props.record.pv,
        
        // Информация о пользователе
        objUser: user.id,
        pvUser: user.pv,
        
        // НОВЫЕ ПОЛЯ ДЛЯ ПЛАНИРОВАНИЯ
        // Предполагаем, что value из AppDropdown - это ID задачи
        objTask: newRecord.value.task.value, 
        pvTask: props.record.pv, // Предполагаем, что pv задачи совпадает с pv работы
        
        PlannedVolume: newRecord.value.plannedVolume ? Number(newRecord.value.plannedVolume) : null,
        PlanDateStart: newRecord.value.dateStartPlan ? formatDateToISO(newRecord.value.dateStartPlan) : null,
        PlanDateEnd: newRecord.value.dateEndPlan ? formatDateToISO(newRecord.value.dateEndPlan) : null,
        
        // Служебные поля
        name: `${props.record.id}-${new Date().getTime()}`, // Уникальное имя
        CreatedAt: new Date().toISOString().split('T')[0],
        UpdatedAt: new Date().toISOString().split('T')[0],
        
        // УДАЛЕНЫ поля: StartKm, FinishKm, StartPicket, FinishPicket, StartLink, FinishLink, FactDateEnd, ReasonDeviation
      };

      const response = await saveTaskLog(dataToSave);
      
      if (response?.result?.id) {
        savedInspectionId.value = response.result.id;
      } else if (response?.id) {
        savedInspectionId.value = response.id;
      } else if (response?.result?.records?.[0]?.id) {
        savedInspectionId.value = response.result.records[0].id;
      }
      
      notificationStore.showNotification('Информация по работе успешно сохранена!', 'success');
      isInfoSaved.value = true;
      
      await loadExistingData(props.record);
      
      if (!savedInspectionId.value && existingData && existingData.length > 0) {
        const lastRecord = existingData[existingData.length - 1];
        if (lastRecord.id) {
          savedInspectionId.value = lastRecord.id;
        }
      }
      
    } catch (error) {
      
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
  }
};

const formatCoordinates = (startKm, startPk, startZv, finishKm, finishPk, finishZv) => {
  // Функция оставлена для loadExistingData, хотя в новой форме не используется
  const isPresent = (val) => val !== null && val !== undefined && val !== '';

  const createCoordPart = (km, pk, zv) => {
    if (!isPresent(km) && !isPresent(pk) && km !== 0 && pk !== 0) {
      return '';
    }

    let part = '';

    if (isPresent(km) || km === 0) {
      part += `${km}км`;
    }

    if (isPresent(pk) || pk === 0) {
      if (part) {
        part += ' ';
      }
      part += `${pk}пк`;
    }

    if (isPresent(zv) || zv === 0) {
      if (part) {
        part += ' ';
      }
      part += `${zv}зв`;
    }

    return part.trim();
  };

  const startPart = createCoordPart(startKm, startPk, startZv);
  const finishPart = createCoordPart(finishKm, finishPk, finishZv);
  
  if (startPart && finishPart) {
    return `${startPart} — ${finishPart}`;
  } else if (startPart) {
    return startPart;
  } else if (finishPart) {
    return finishPart;
  }
  
  return '';
};


const loadExistingData = async (record) => {
  if (!record || !record.id || !record.pv) {
    return [];
  }
  try {
    const data = await loadTaskLogEntriesForWorkPlan(record.id, record.pv);
    
    existingRecords.value = data.map(item => ({
      id: item.id,
      // Новые поля для отображения в ExistingDataBlock
      taskName: item.fullNameTask || '—',
      startDatePlan: item.PlanDateStart ? formatDate(item.PlanDateStart) : '—',
      endDatePlan: item.PlanDateEnd ? formatDate(item.PlanDateEnd) : '—',
      volumePlan: item.ValuePlan ? `${item.ValuePlan} ед.` : '—',
      
      // Старые поля, которые могут понадобиться для других dataType
      date: '—',
      coordinates: '—'
    }));
    
    return data;
  } catch (error) {
    notificationStore.showNotification('Не удалось загрузить ранее внесенные записи.', 'error');
    existingRecords.value = [];
    return [];
  }
};

const loadTaskOptions = async () => {
  try {
    taskOptions.value = await loadTasks();
  } catch (error) {
    notificationStore.showNotification('Не удалось загрузить список задач.', 'error');
  }
};

onMounted(loadTaskOptions);

watch(
  () => props.record,
  (newRecordData) => {
    if (newRecordData) {
      // Упрощенная инициализация, т.к. координаты и границы больше не нужны
      objectBounds.value = {}; 

      // Сброс полей для новой записи
      newRecord.value.task = null;
      newRecord.value.plannedVolume = null;
      newRecord.value.dateStartPlan = null;
      newRecord.value.dateEndPlan = null;
      
      loadExistingData(newRecordData);
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

/* УДАЛЕНЫ стили для coordinates-input-group */

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
  justify-content: flex-end;
  align-items: flex-end;
  margin-top: 24px;
}

.main-actions {
  display: flex;
  gap: 12px;
}

.text-area {
  height: 100px;
}

/* Info tab specific styles */
.new-info-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* НОВАЯ СЕТКА ДЛЯ ПЛАНИРОВАНИЯ (2 колонки) */
.form-grid-planning {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.col-span-1 {
  grid-column: span 1 / span 1;
}

.col-span-2 {
  grid-column: span 2 / span 2;
}

@media (max-width: 768px) {
  /* УДАЛЕНЫ стили для coordinates-input-group */

  .button-container {
    flex-direction: column;
    gap: 16px;
  }

  .main-actions {
    width: 100%;
    justify-content: center;
  }
  
  /* Адаптация сетки для мобильных устройств */
  .form-grid-planning {
    grid-template-columns: 1fr; /* Одна колонка на мобильных */
  }
  
  .col-span-1,
  .col-span-2 {
    grid-column: span 1 / span 1; /* Все элементы занимают полную ширину */
  }
}
</style>
