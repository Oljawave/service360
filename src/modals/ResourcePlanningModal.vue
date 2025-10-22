<template>
  <ModalWrapper
    title="Планирование ресурсов"
    :show-save="false"
    :show-cancel="false"
    :showDelete="false"
    @close="closeModal"
  >
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
            <ExistingDataBlock :existingRecords="existingRecords" dataType="planning" />
            
            <div class="new-info-content">
              <div class="form-grid-planning">
                
                <AppDropdown
                  label="Задача"
                  placeholder="Выберите задачу"
                  id="task-dropdown"
                  v-model="newRecord.task"
                  :options="taskOptions"
                  class="col-span-2"
                  :required="true" />

                <AppNumberInput
                  label="Плановый объем"
                  id="planned-volume-input"
                  v-model.number="newRecord.plannedVolume"
                  placeholder="Введите плановый объем"
                  type="number" 
                  :min="0"
                  class="col-span-2" />
                
                <AppDatePicker
                  label="Дата начала"
                  placeholder="Выберите дату начала"
                  id="date-start-picker"
                  v-model="newRecord.dateStartPlan"
                  class="col-span-1"
                  :required="true" />
                  
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
          
          <div v-if="activeTab === 'materials'">
            <ExistingDataBlock :existingRecords="existingRecordsMaterials" dataType="materials" />
            
            <div class="new-info-content">
              <div v-for="(material, index) in materialRecords" :key="index" class="material-record-block">
                  <div class="material-record-header">
                    <span v-if="index > 0" class="remove-object" @click="removeObject(index)">×</span>
                  </div>
                  
                  <div class="form-line-materials">
                    <AppDropdown
                      label="Материал"
                      placeholder="Выберите материал"
                      :id="`material-dropdown-${index}`"
                      v-model="material.material"
                      :options="materialOptions"
                      :required="true" />
                      
                    <AppDropdown
                      label="Единица измерения"
                      placeholder="Выберите ед. изм."
                      :id="`unit-dropdown-${index}`"
                      v-model="material.unit"
                      :options="unitOptions"
                      :required="true" />
                      
                    <AppNumberInput
                      label="Объем"
                      :id="`material-volume-input-${index}`"
                      v-model.number="material.volume"
                      placeholder="Введите объем"
                      type="number" 
                      :min="0" />
                  </div>
              </div>
              
              <div class="col-span-2 add-object-btn-wrapper">
                <UiButton
                  text="Добавить материал"
                  icon="Plus"
                  :loading="isAddingObject"
                  @click="addNewMaterialRecord"
                />
              </div>

            </div>
          </div>
          
        </div>
      </div>

      <div class="button-container">
        <div class="main-actions">
          <MainButton 
            :label="getButtonLabel()" 
            :loading="isSaving" 
            @click="saveData" 
            class="save-btn" />
        </div>
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted, computed } from 'vue';
import ModalWrapper from '@/components/layout/Modal/ModalWrapper.vue';
import MainButton from '@/components/ui/MainButton.vue';
import AppDatePicker from '@/components/ui/FormControls/AppDatePicker.vue';
import AppNumberInput from '@/components/ui/FormControls/AppNumberInput.vue';
import TabsHeader from '@/components/ui/TabsHeader.vue';
import WorkHeaderInfo from '@/components/ui/WorkHeaderInfo.vue';
import ExistingDataBlock from '@/components/ui/ExistingDataBlock.vue';
import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue';
import UiButton from '@/components/ui/UiButton.vue'; 

import { useNotificationStore } from '@/stores/notificationStore';
import { fetchUserData } from '@/api/inspectionsApi.js'; 
import { loadTasks, saveTaskLogPlan, loadTaskLogEntriesForWorkPlan, loadMaterials, loadUnits, saveResourceMaterial, loadResourceMaterialsForTaskLog } from '@/api/repairApi.js';
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
const isAddingObject = ref(false); 
const activeTab = ref('info');
const isInfoSaved = ref(false);
const savedTaskLogId = ref(null);
const savedTaskLogCls = ref(null);
const disabledTabs = computed(() => isInfoSaved.value ? [] : ['materials']);

const tabs = ref([
  { name: 'info', label: 'Новая информация по задаче', icon: 'Info' },
  { name: 'materials', label: 'Материалы', icon: 'Box' },
]);

const notificationStore = useNotificationStore();

// Данные для новой записи задачи
const newRecord = ref({
  task: null,
  plannedVolume: null,
  dateStartPlan: null,
  dateEndPlan: null,
});

// Функция для создания нового объекта материала по умолчанию
const createNewMaterialObject = () => ({
  material: null,
  unit: null,
  volume: null,
});

// Массив для хранения записей материалов. Инициализируем с одной пустой формой.
const materialRecords = ref([createNewMaterialObject()]); 

const taskOptions = ref([]);
const materialOptions = ref([]); // <- Инициализация для материалов
const unitOptions = ref([]); // <- Инициализация для единиц измерения

const existingRecords = ref([]); // Для планов работ
const existingRecordsMaterials = ref([]); // Для материалов

const closeModal = () => {
  emit('close');
};

const getButtonLabel = () => {
  if (activeTab.value === 'info') {
    return 'Добавить новую задачу в план';
  }
  if (activeTab.value === 'materials') {
    return 'Сохранить материалы';
  }
  return 'Сохранить';
};

// Метод для добавления новой формы материала
const addNewMaterialRecord = () => {
  materialRecords.value.push(createNewMaterialObject());
};

// Метод для удаления формы материала по индексу
const removeObject = (index) => {
  materialRecords.value.splice(index, 1);
};

const saveData = async () => {
  if (activeTab.value === 'info') {
    // ... (Логика сохранения плана работ) ...
    if (isSaving.value) return;

    if (!newRecord.value.task || !newRecord.value.dateStartPlan || !newRecord.value.dateEndPlan) {
      notificationStore.showNotification('Пожалуйста, заполните все обязательные поля (Задача, Дата начала, Дата завершения).', 'error');
      return;
    }

    if (newRecord.value.plannedVolume !== null && newRecord.value.plannedVolume < 0) {
      notificationStore.showNotification('Плановый объем не может быть отрицательным.', 'error');
      return;
    }

    isSaving.value = true;
    try {
      const user = await fetchUserData();
      const today = formatDateToISO(new Date());

      const dataToSave = {
        name: `${props.record.id}-${new Date().getTime()}`,
        objWorkPlan: props.record.id,
        pvWorkPlan: props.record.pv,
        objTask: newRecord.value.task.value,
        pvTask: newRecord.value.task.pv,
        objUser: user.id,
        pvUser: user.pv,
        Value: newRecord.value.plannedVolume ? Number(newRecord.value.plannedVolume) : null,
        PlanDateStart: newRecord.value.dateStartPlan ? formatDateToISO(newRecord.value.dateStartPlan) : null,
        PlanDateEnd: newRecord.value.dateEndPlan ? formatDateToISO(newRecord.value.dateEndPlan) : null,
        CreatedAt: today,
        UpdatedAt: today,
        objLocationClsSection: props.sectionId,
        pvLocationClsSection: parseInt(props.sectionPv),
      };

      const response = await saveTaskLogPlan(dataToSave);
      
      if (response.error) {
        throw new Error(response.error.message || JSON.stringify(response.error));
      }
      
      const resultRecord = response?.result?.records?.[0];

      if (resultRecord?.id) {
        savedTaskLogId.value = resultRecord.id;
        savedTaskLogCls.value = resultRecord.cls;
      } else if (response?.result?.id) { // Fallback for direct result ID
        savedTaskLogId.value = response.result.id;
        savedTaskLogCls.value = response.result.cls; // Assuming cls is also directly available
      } else if (response?.id) {
        savedTaskLogId.value = response.id;
      }

      isInfoSaved.value = true;

      notificationStore.showNotification('Запись в план успешно добавлена!', 'success');
      
      await loadExistingData(props.record);
      
      newRecord.value.task = null;
      newRecord.value.plannedVolume = null;
      newRecord.value.dateStartPlan = null;
      newRecord.value.dateEndPlan = null;
      
    } catch (error) {
      let errorMessage = 'Не удалось сохранить информацию по работе.';
      
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Ошибка сервера. Попробуйте еще раз.';
      }
      
      console.error('Ошибка сохранения:', error);
      notificationStore.showNotification(errorMessage, 'error');
    } finally {
      isSaving.value = false;
    }

  } else if (activeTab.value === 'materials') {
    if (isSaving.value) return; // Добавляем эту проверку здесь

    const validRecords = materialRecords.value.filter(m => m.material && m.unit && m.volume != null && m.volume > 0);
    
    if (validRecords.length === 0) {
      notificationStore.showNotification('Нет данных для сохранения. Заполните обязательные поля (Материал, Ед. изм., Объем) хотя бы для одной записи.', 'error');
      return;
    }

    if (validRecords.some(m => m.volume < 0)) {
      notificationStore.showNotification('Объем материала не может быть отрицательным.', 'error');
      return;
    }

    if (!savedTaskLogId.value || !savedTaskLogCls.value) {
      notificationStore.showNotification('Не найден ID или CLS родительской задачи. Пожалуйста, пересохраните информацию по задаче.', 'error');
      return;
    }

    isSaving.value = true;
    try {
      const user = await fetchUserData();
      const today = formatDateToISO(new Date());

      const savePromises = validRecords.map(material => {
        const payload = {
          name: `${savedTaskLogId.value}-${today}`,
          objMaterial: material.material.value,
          pvMaterial: material.material.pv,
          meaMeasure: material.unit.value,
          pvMeasure: material.unit.pv,
          Value: Number(material.volume),
          objTaskLog: savedTaskLogId.value,
          linkCls: savedTaskLogCls.value,
          CreatedAt: today,
          UpdatedAt: today,
          objUser: user.id,
          pvUser: user.pv,
        };
        console.log('Отправка данных для сохранения материала:', JSON.stringify(payload, null, 2));
        return saveResourceMaterial(payload);
      });

      const results = await Promise.allSettled(savePromises);

      const successfulSaves = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
      const failedSaves = results.length - successfulSaves;

      if (failedSaves > 0) {
        console.error('Не удалось сохранить следующие материалы:', results.filter(r => r.status === 'rejected' || r.value.error));
        notificationStore.showNotification(`Не удалось сохранить ${failedSaves} из ${results.length} материалов. Успешно: ${successfulSaves}.`, 'warning');
      } else {
        notificationStore.showNotification(`Успешно сохранено ${successfulSaves} записей материалов!`, 'success');
      }
      
      if (successfulSaves > 0) {
        // Сброс формы материалов
        materialRecords.value = [createNewMaterialObject()];
        
        // Обновляем список сохраненных материалов
        await loadExistingMaterials(savedTaskLogId.value);
      }

      

    } catch (error) {
      let errorMessage = 'Не удалось сохранить информацию по материалам.';
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Ошибка сервера. Попробуйте еще раз.';
      }
      
      console.error('Ошибка сохранения материалов:', error);
      notificationStore.showNotification(errorMessage, 'error');
    } finally {
      isSaving.value = false;
    }
  }
};

const loadExistingData = async (record) => {
  if (!record || !record.id || !record.pv) {
    existingRecords.value = [];
    return;
  }
  try {
    const data = await loadTaskLogEntriesForWorkPlan(record.id, record.pv);
    
    existingRecords.value = data.map(item => {
      return {
        id: item.id,
        task: item.fullNameTask || item.nameTask || '—',
        volumePlan: item.Value !== null && item.Value !== undefined ? `${item.Value}` : '—',
        startDatePlan: item.PlanDateStart ? formatDate(item.PlanDateStart) : '—',
        endDatePlan: item.PlanDateEnd ? formatDate(item.PlanDateEnd) : '—',
        coordinates: '—'
      };
    });
    
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    notificationStore.showNotification('Не удалось загрузить ранее внесенные записи.', 'error');
    existingRecords.value = [];
  }
};

const loadExistingMaterials = async (taskLogId) => {
  if (!taskLogId) {
    existingRecordsMaterials.value = [];
    return;
  }
  try {
    // Предполагаем, что есть API-метод для загрузки материалов по ID задачи
    const data = await loadResourceMaterialsForTaskLog(taskLogId);
    
    existingRecordsMaterials.value = data.map(item => {
      return {
        id: item.id,
        material: item.nameMaterial || '—',
        unit: item.nameMeasure || '—',
        volume: item.Value !== null && item.Value !== undefined ? `${item.Value}` : '—',
      };
    });
    
  } catch (error) {
    console.error('Ошибка загрузки материалов:', error);
    notificationStore.showNotification('Не удалось загрузить ранее внесенные материалы.', 'error');
    existingRecordsMaterials.value = [];
  }
};

const loadTaskOptions = async () => {
  try {
    taskOptions.value = await loadTasks();
  } catch (error) {
    notificationStore.showNotification('Не удалось загрузить список задач.', 'error');
  }
};

// Функция для загрузки материалов
const loadMaterialOptions = async () => {
  try {
    materialOptions.value = await loadMaterials();
  } catch (error) {
    notificationStore.showNotification('Не удалось загрузить список материалов.', 'error');
  }
};

// Функция для загрузки единиц измерения
const loadUnitOptions = async () => {
  try {
    unitOptions.value = await loadUnits();
  } catch (error) {
    notificationStore.showNotification('Не удалось загрузить список единиц измерения.', 'error');
  }
};

const handleTabChange = (newTab) => {
  if (newTab === 'materials' && !isInfoSaved.value) {
    notificationStore.showNotification('Сначала необходимо сохранить информацию по задаче!', 'error');
    return;
  }
  activeTab.value = newTab;

  if (newTab === 'materials' && isInfoSaved.value) {
    // Загружаем материалы при переходе на вкладку
    loadExistingMaterials(savedTaskLogId.value);
  }
};

onMounted(() => {
  loadTaskOptions();
  loadMaterialOptions(); // <- Вызов загрузки материалов
  loadUnitOptions();    // <- Вызов загрузки единиц измерения
});

watch(
  () => props.record,
  (newRecordData) => {
    if (newRecordData) {

      // Сброс полей для вкладки "Задачи"
      newRecord.value.task = null;
      newRecord.value.plannedVolume = null;
      newRecord.value.dateStartPlan = null;
      newRecord.value.dateEndPlan = null;

      // Сброс состояния при смене записи
      isInfoSaved.value = false;
      savedTaskLogId.value = null;
      savedTaskLogCls.value = null;
      activeTab.value = 'info';
      
      // Сброс и инициализация массива материалов при смене записи
      materialRecords.value = [createNewMaterialObject()];
      existingRecordsMaterials.value = [];
      
      loadExistingData(newRecordData);
      // При смене записи также можно обновить списки опций, если они зависят от контекста
      // loadMaterialOptions(); 
      // loadUnitOptions();    
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

.new-info-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.material-record-block {
  padding-bottom: 16px; 
  border-bottom: 1px solid #eee;
  position: relative; /* Для позиционирования крестика */
}

.material-record-block:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.material-record-header {
  height: 20px; /* Фиксированная высота для заголовка, чтобы крестик не "прыгал" */
}

.remove-object {
  position: absolute;
  top: 0; 
  right: 0; 
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  color: #ff4d4f; /* Красный цвет для удаления */
  line-height: 1;
  padding: 0 4px; /* Небольшой отступ, чтобы было легче нажать */
  transition: color 0.2s;
}

.remove-object:hover {
  color: #ff7875;
}

.add-object-btn-wrapper {
  display: flex;
  justify-content: flex-start;
  margin-top: 8px;
}

.form-grid-planning {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-line-materials {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.col-span-1 {
  grid-column: span 1 / span 1;
}

.col-span-2 {
  grid-column: span 2 / span 2;
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

@media (max-width: 768px) {
  .form-grid-planning,
  .form-line-materials {
    grid-template-columns: 1fr;
  }
  
  .col-span-1,
  .col-span-2 {
    grid-column: span 1 / span 1; 
  }

  .button-container {
    flex-direction: column;
    gap: 16px;
  }

  .main-actions {
    width: 100%;
    justify-content: center;
  }
  
  .remove-object {
    right: auto;
    left: 0;
  }
}
</style>