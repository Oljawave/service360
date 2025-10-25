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
          :tabs="tabsRow1"
          :modelValue="activeTab" 
          @update:modelValue="handleTabChange"
          :disabledTabs="disabledTabs"
        />
        <TabsHeader
          :tabs="tabsRow2"
          :modelValue="activeTab"
          @update:modelValue="handleTabChange"
          :disabledTabs="disabledTabs"
          class="second-row-tabs"
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
              <div v-for="(material, index) in materialRecords" :key="index" class="resource-record-block">
                  <div class="resource-record-header">
                    <span v-if="index > 0" class="remove-object" @click="removeMaterialRecord(index)">×</span>
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

          <div v-if="activeTab === 'externalServices'">
            <ExistingDataBlock :existingRecords="existingRecordsServices" dataType="externalServices" />
            
            <div class="new-info-content">
              <div v-for="(service, index) in serviceRecords" :key="index" class="resource-record-block">
                  <div class="resource-record-header">
                    <span v-if="index > 0" class="remove-object" @click="removeServiceRecord(index)">×</span>
                  </div>
                  
                  <div class="form-line-services">
                    <AppDropdown
                      label="Сервис"
                      placeholder="Выберите сервис"
                      :id="`service-dropdown-${index}`"
                      v-model="service.service"
                      :options="serviceOptions"
                      :required="true" />
                      
                    <AppNumberInput
                      label="Объем"
                      :id="`service-volume-input-${index}`"
                      v-model.number="service.volume"
                      placeholder="Введите объем"
                      type="number" 
                      :min="0" />
                  </div>
              </div>
              
              <div class="col-span-2 add-object-btn-wrapper">
                <UiButton text="Добавить услугу" icon="Plus" :loading="isAddingObject" @click="addNewServiceRecord" />
              </div>

            </div>
          </div>
          
          <div v-if="activeTab === 'personnel'">
            <ExistingDataBlock :existingRecords="existingRecordsPersonnel" dataType="personnel" />
            
            <div class="new-info-content">
              <div v-for="(personnel, index) in personnelRecords" :key="index" class="resource-record-block">
                  <div class="resource-record-header">
                    <span v-if="index > 0" class="remove-object" @click="removePersonnelRecord(index)">×</span>
                  </div>
                  
                  <div class="form-line-personnel">
                    <AppDropdown
                      label="Должность"
                      placeholder="Выберите должность"
                      :id="`position-dropdown-${index}`"
                      v-model="personnel.position"
                      :options="positionOptions"
                      :required="true" />
                      
                    <AppNumberInput
                      label="Количество человек"
                      :id="`personnel-count-input-${index}`"
                      v-model.number="personnel.count"
                      placeholder="Кол-во"
                      type="number" 
                      :min="0"
                      :required="true" />
                      
                    <AppNumberInput
                      label="Часы"
                      :id="`personnel-hours-input-${index}`"
                      v-model.number="personnel.hours"
                      placeholder="Введите часы"
                      type="number" 
                      :min="0" />
                  </div>
              </div>
              
              <div class="col-span-2 add-object-btn-wrapper">
                <UiButton text="Добавить еще Должность" icon="Plus" :loading="isAddingObject" @click="addNewPersonnelRecord" />
              </div>

            </div>
          </div>
          
          <div v-if="activeTab === 'equipment'">
            <ExistingDataBlock :existingRecords="existingRecordsEquipment" dataType="equipment" />
            
            <div class="new-info-content">
              <div v-for="(equipment, index) in equipmentRecords" :key="index" class="resource-record-block">
                  <div class="resource-record-header">
                    <span v-if="index > 0" class="remove-object" @click="removeEquipmentRecord(index)">×</span>
                  </div>
                  
                  <div class="form-line-equipment">
                    <AppDropdown
                      label="Тип Техники"
                      placeholder="Выберите тип техники"
                      :id="`equipment-type-dropdown-${index}`"
                      v-model="equipment.equipmentType"
                      :options="equipmentTypeOptions"
                      :required="true" />
                      
                    <AppNumberInput
                      label="Количество"
                      :id="`equipment-count-input-${index}`"
                      v-model.number="equipment.count"
                      placeholder="Кол-во"
                      type="number" 
                      :min="0"
                      :required="true" />
                      
                    <AppNumberInput
                      label="Часы"
                      :id="`equipment-hours-input-${index}`"
                      v-model.number="equipment.hours"
                      placeholder="Введите часы"
                      type="number" 
                      :min="0" />
                  </div>
              </div>
              
              <div class="col-span-2 add-object-btn-wrapper">
                <UiButton text="Добавить еще Технику" icon="Plus" :loading="isAddingObject" @click="addNewEquipmentRecord" />
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
import { 
  loadTasks, 
  saveTaskLogPlan, 
  loadTaskLogEntriesForWorkPlan, 
  loadMaterials, 
  loadUnits, 
  saveResourceMaterial, 
  loadResourceMaterialsForTaskLog,
  loadExternalServices,
  saveResourceExternalService,
  loadResourceExternalServicesForTaskLog,
  // НОВЫЕ ИМПОРТЫ
  loadPositions,
  loadEquipmentTypes,
  saveResourcePersonnel,
  saveResourceEquipment,
  loadResourcePersonnelForTaskLog,
  loadResourceEquipmentForTaskLog
} from '@/api/repairApi.js';
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
const disabledTabs = computed(() => isInfoSaved.value ? [] : ['materials', 'externalServices', 'personnel', 'equipment']); // ДОБАВЛЕНЫ НОВЫЕ ВКЛАДКИ

const tabsRow1 = ref([
  { name: 'info', label: 'Новая информация по задаче', icon: 'Info' },
  { name: 'externalServices', label: 'Услуги сторонних организаций', icon: 'HardHat' },
]);

const tabsRow2 = ref([
  { name: 'materials', label: 'Материалы', icon: 'Box' },
  { name: 'personnel', label: 'Исполнители', icon: 'Users' }, 
  { name: 'equipment', label: 'Техника', icon: 'Truck' },
  { name: 'tools', label: 'Инструменты', icon: 'Hammer' },
]);

const notificationStore = useNotificationStore();

// Данные для новой записи задачи
const newRecord = ref({
  task: null,
  plannedVolume: null,
  dateStartPlan: null,
  dateEndPlan: null,
});

const createNewMaterialObject = () => ({
  material: null,
  unit: null,
  volume: null,
});

const createNewServiceObject = () => ({ service: null, volume: null });

// НОВЫЕ ФУНКЦИИ ДЛЯ СОЗДАНИЯ ОБЪЕКТОВ
const createNewPersonnelObject = () => ({ position: null, count: null, hours: null });
const createNewEquipmentObject = () => ({ equipmentType: null, count: null, hours: null });

const materialRecords = ref([createNewMaterialObject()]); 
const serviceRecords = ref([createNewServiceObject()]);

// НОВЫЕ МАССИВЫ ДЛЯ ЗАПИСЕЙ
const personnelRecords = ref([createNewPersonnelObject()]);
const equipmentRecords = ref([createNewEquipmentObject()]);

const taskOptions = ref([]);
const materialOptions = ref([]);
const unitOptions = ref([]);
const serviceOptions = ref([]);

// НОВЫЕ МАССИВЫ ДЛЯ СПРАВОЧНИКОВ
const positionOptions = ref([]);
const equipmentTypeOptions = ref([]);

const existingRecords = ref([]); // Для планов работ
const existingRecordsMaterials = ref([]); // Для материалов
const existingRecordsServices = ref([]); // Для услуг

// НОВЫЕ МАССИВЫ ДЛЯ СУЩЕСТВУЮЩИХ ДАННЫХ
const existingRecordsPersonnel = ref([]);
const existingRecordsEquipment = ref([]);

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
  if (activeTab.value === 'externalServices') {
    return 'Сохранить услуги';
  }
  // НОВЫЕ МЕТКИ ДЛЯ КНОПОК
  if (activeTab.value === 'personnel') {
    return 'Сохранить исполнителей';
  }
  if (activeTab.value === 'equipment') {
    return 'Сохранить технику';
  }
  return 'Сохранить';
};

// Метод для добавления новой формы материала
const addNewMaterialRecord = () => {
  materialRecords.value.push(createNewMaterialObject());
};

const addNewServiceRecord = () => {
  serviceRecords.value.push(createNewServiceObject());
};

// НОВЫЕ МЕТОДЫ ДОБАВЛЕНИЯ
const addNewPersonnelRecord = () => {
  personnelRecords.value.push(createNewPersonnelObject());
};
const addNewEquipmentRecord = () => {
  equipmentRecords.value.push(createNewEquipmentObject());
};

const removeServiceRecord = (index) => {
  if (serviceRecords.value.length > 1) serviceRecords.value.splice(index, 1);
};


const removeMaterialRecord = (index) => {
  if (materialRecords.value.length > 1) materialRecords.value.splice(index, 1);
};

// НОВЫЕ МЕТОДЫ УДАЛЕНИЯ
const removePersonnelRecord = (index) => {
  if (personnelRecords.value.length > 1) personnelRecords.value.splice(index, 1);
};
const removeEquipmentRecord = (index) => {
  if (equipmentRecords.value.length > 1) equipmentRecords.value.splice(index, 1);
};


const saveData = async () => {
  if (activeTab.value === 'info') {
    // ... (Логика сохранения плана работ, без изменений) ...
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
      
      const resultRecord = response?.result?.store?.records?.[0];

      if (resultRecord?.id) {
        savedTaskLogId.value = resultRecord.id;
        savedTaskLogCls.value = resultRecord.cls || resultRecord.linkCls;
      } else {
        console.error("Не удалось получить ID и CLS из ответа:", response);
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
    // ... (Логика сохранения материалов, без изменений) ...
    if (isSaving.value) return; 

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

      const savePromises = validRecords.map(async (material) => {
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
  } else if (activeTab.value === 'externalServices') {
    // ... (Логика сохранения услуг, без изменений) ...
    if (isSaving.value) return;

    const validRecords = serviceRecords.value.filter(s => s.service && s.volume != null && s.volume > 0);
    
    if (validRecords.length === 0) {
      notificationStore.showNotification('Нет данных для сохранения. Заполните обязательные поля (Сервис, Объем) хотя бы для одной записи.', 'error');
      return;
    }

    if (validRecords.some(s => s.volume < 0)) {
      notificationStore.showNotification('Объем услуги не может быть отрицательным.', 'error');
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

      const savePromises = validRecords.map(async (service) => {
        const payload = {
          name: `${savedTaskLogId.value}-${today}`,
          objTpService: service.service.value,
          pvTpService: service.service.pv,
          Value: Number(service.volume),
          objTaskLog: savedTaskLogId.value,
          linkCls: savedTaskLogCls.value,
          CreatedAt: today,
          UpdatedAt: today,
          objUser: user.id,
          pvUser: user.pv,
        };
        return saveResourceExternalService(payload);
      });

      const results = await Promise.allSettled(savePromises);

      const successfulSaves = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
      const failedSaves = results.length - successfulSaves;

      if (failedSaves > 0) {
        console.error('Не удалось сохранить следующие услуги:', results.filter(r => r.status === 'rejected' || r.value.error));
        notificationStore.showNotification(`Не удалось сохранить ${failedSaves} из ${results.length} услуг. Успешно: ${successfulSaves}.`, 'warning');
      } else {
        notificationStore.showNotification(`Успешно сохранено ${successfulSaves} записей услуг!`, 'success');
      }
      
      if (successfulSaves > 0) {
        serviceRecords.value = [createNewServiceObject()];
        await loadExistingServices(savedTaskLogId.value);
      }
    } catch (error) {
      let errorMessage = 'Не удалось сохранить информацию по услугам.';
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Ошибка сервера. Попробуйте еще раз.';
      }
      
      console.error('Ошибка сохранения услуг:', error);
      notificationStore.showNotification(errorMessage, 'error');
    } finally {
      isSaving.value = false;
    }
  } else if (activeTab.value === 'personnel') { // НОВАЯ ЛОГИКА СОХРАНЕНИЯ: Исполнители
    if (isSaving.value) return;

    const validRecords = personnelRecords.value.filter(p => p.position && p.count != null && p.count > 0);
    
    if (validRecords.length === 0) {
      notificationStore.showNotification('Нет данных для сохранения. Заполните обязательные поля (Должность, Количество человек) хотя бы для одной записи.', 'error');
      return;
    }

    if (validRecords.some(p => p.count < 0 || (p.hours !== null && p.hours < 0))) {
      notificationStore.showNotification('Количество человек и часы не могут быть отрицательными.', 'error');
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

      const savePromises = validRecords.map(async (personnel) => {
        const payload = {
          name: `${savedTaskLogId.value}-${personnel.position.label}-${today}`,
          objPersonnel: personnel.position.value, // Идентификатор должности
          pvPersonnel: personnel.position.pv,     // PV должности
          Value: Number(personnel.count),        // Количество человек
          Hours: personnel.hours ? Number(personnel.hours) : null, // Часы
          objTaskLog: savedTaskLogId.value,
          linkCls: savedTaskLogCls.value,
          CreatedAt: today,
          UpdatedAt: today,
          objUser: user.id,
          pvUser: user.pv,
        };
        return saveResourcePersonnel(payload);
      });

      const results = await Promise.allSettled(savePromises);

      const successfulSaves = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
      const failedSaves = results.length - successfulSaves;

      if (failedSaves > 0) {
        console.error('Не удалось сохранить следующих исполнителей:', results.filter(r => r.status === 'rejected' || r.value.error));
        notificationStore.showNotification(`Не удалось сохранить ${failedSaves} из ${results.length} исполнителей. Успешно: ${successfulSaves}.`, 'warning');
      } else {
        notificationStore.showNotification(`Успешно сохранено ${successfulSaves} записей исполнителей!`, 'success');
      }
      
      if (successfulSaves > 0) {
        personnelRecords.value = [createNewPersonnelObject()];
        await loadExistingPersonnel(savedTaskLogId.value);
      }
    } catch (error) {
      let errorMessage = 'Не удалось сохранить информацию по исполнителям.';
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Ошибка сервера. Попробуйте еще раз.';
      }
      
      console.error('Ошибка сохранения исполнителей:', error);
      notificationStore.showNotification(errorMessage, 'error');
    } finally {
      isSaving.value = false;
    }
  } else if (activeTab.value === 'equipment') { // НОВАЯ ЛОГИКА СОХРАНЕНИЯ: Техника
    if (isSaving.value) return;

    const validRecords = equipmentRecords.value.filter(e => e.equipmentType && e.count != null && e.count > 0);
    
    if (validRecords.length === 0) {
      notificationStore.showNotification('Нет данных для сохранения. Заполните обязательные поля (Тип Техники, Количество) хотя бы для одной записи.', 'error');
      return;
    }

    if (validRecords.some(e => e.count < 0 || (e.hours !== null && e.hours < 0))) {
      notificationStore.showNotification('Количество техники и часы не могут быть отрицательными.', 'error');
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

      const savePromises = validRecords.map(async (equipment) => {
        const payload = {
          name: `${savedTaskLogId.value}-${equipment.equipmentType.label}-${today}`,
          objEquipment: equipment.equipmentType.value, // Идентификатор типа техники
          pvEquipment: equipment.equipmentType.pv,     // PV типа техники
          Value: Number(equipment.count),            // Количество техники
          Hours: equipment.hours ? Number(equipment.hours) : null, // Часы
          objTaskLog: savedTaskLogId.value,
          linkCls: savedTaskLogCls.value,
          CreatedAt: today,
          UpdatedAt: today,
          objUser: user.id,
          pvUser: user.pv,
        };
        return saveResourceEquipment(payload);
      });

      const results = await Promise.allSettled(savePromises);

      const successfulSaves = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
      const failedSaves = results.length - successfulSaves;

      if (failedSaves > 0) {
        console.error('Не удалось сохранить следующую технику:', results.filter(r => r.status === 'rejected' || r.value.error));
        notificationStore.showNotification(`Не удалось сохранить ${failedSaves} из ${results.length} записей техники. Успешно: ${successfulSaves}.`, 'warning');
      } else {
        notificationStore.showNotification(`Успешно сохранено ${successfulSaves} записей техники!`, 'success');
      }
      
      if (successfulSaves > 0) {
        equipmentRecords.value = [createNewEquipmentObject()];
        await loadExistingEquipment(savedTaskLogId.value);
      }
    } catch (error) {
      let errorMessage = 'Не удалось сохранить информацию по технике.';
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Ошибка сервера. Попробуйте еще раз.';
      }
      
      console.error('Ошибка сохранения техники:', error);
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

const loadExistingServices = async (taskLogId) => {
  if (!taskLogId) {
    existingRecordsServices.value = [];
    return;
  }
  try {
    const data = await loadResourceExternalServicesForTaskLog(taskLogId);
    
    existingRecordsServices.value = data.map(item => {
      return {
        id: item.id,
        service: item.nameTpService || item.name || '—',
        volume: item.Value !== null && item.Value !== undefined ? `${item.Value}` : '—',
      };
    });
    
  } catch (error) {
    console.error('Ошибка загрузки услуг:', error);
    notificationStore.showNotification('Не удалось загрузить ранее внесенные услуги.', 'error');
    existingRecordsServices.value = [];
  }
};

// НОВЫЙ МЕТОД: Загрузка существующих исполнителей
const loadExistingPersonnel = async (taskLogId) => {
  if (!taskLogId) {
    existingRecordsPersonnel.value = [];
    return;
  }
  try {
    const data = await loadResourcePersonnelForTaskLog(taskLogId);
    
    existingRecordsPersonnel.value = data.map(item => {
      return {
        id: item.id,
        position: item.namePersonnel || '—',
        count: item.Value !== null && item.Value !== undefined ? `${item.Value}` : '—',
        hours: item.Hours !== null && item.Hours !== undefined ? `${item.Hours}` : '—',
      };
    });
  } catch (error) {
    console.error('Ошибка загрузки исполнителей:', error);
    notificationStore.showNotification('Не удалось загрузить ранее внесенных исполнителей.', 'error');
    existingRecordsPersonnel.value = [];
  }
};

// НОВЫЙ МЕТОД: Загрузка существующей техники
const loadExistingEquipment = async (taskLogId) => {
  if (!taskLogId) {
    existingRecordsEquipment.value = [];
    return;
  }
  try {
    const data = await loadResourceEquipmentForTaskLog(taskLogId);
    
    existingRecordsEquipment.value = data.map(item => {
      return {
        id: item.id,
        equipmentType: item.nameEquipment || '—',
        count: item.Value !== null && item.Value !== undefined ? `${item.Value}` : '—',
        hours: item.Hours !== null && item.Hours !== undefined ? `${item.Hours}` : '—',
      };
    });
  } catch (error) {
    console.error('Ошибка загрузки техники:', error);
    notificationStore.showNotification('Не удалось загрузить ранее внесенную технику.', 'error');
    existingRecordsEquipment.value = [];
  }
};


const loadTaskOptions = async () => {
  try {
    taskOptions.value = await loadTasks();
  } catch (error) {
    notificationStore.showNotification('Не удалось загрузить список задач.', 'error');
  }
};

const loadMaterialOptions = async () => {
  try {
    materialOptions.value = await loadMaterials();
  } catch (error) {
    notificationStore.showNotification('Не удалось загрузить список материалов.', 'error');
  }
};

const loadUnitOptions = async () => {
  try {
    unitOptions.value = await loadUnits();
  } catch (error) {
    notificationStore.showNotification('Не удалось загрузить список единиц измерения.', 'error');
  }
};

const loadServiceOptions = async () => {
  try {
    serviceOptions.value = await loadExternalServices();
  } catch (error) {
    notificationStore.showNotification('Не удалось загрузить список услуг.', 'error');
  }
};

// НОВЫЕ МЕТОДЫ: Загрузка справочников
const loadPositionOptions = async () => {
  try {
    positionOptions.value = await loadPositions();
  } catch (error) {
    notificationStore.showNotification('Не удалось загрузить список должностей.', 'error');
  }
};

const loadEquipmentTypeOptions = async () => {
  try {
    equipmentTypeOptions.value = await loadEquipmentTypes();
  } catch (error) {
    notificationStore.showNotification('Не удалось загрузить список типов техники.', 'error');
  }
};


const handleTabChange = (newTab) => {
  const resourceTabs = ['materials', 'externalServices', 'personnel', 'equipment']; // ДОБАВЛЕНЫ НОВЫЕ ВКЛАДКИ
  if (resourceTabs.includes(newTab) && !isInfoSaved.value) {
    notificationStore.showNotification('Сначала необходимо сохранить информацию по задаче!', 'error');
    return;
  }
  activeTab.value = newTab;

  if (newTab === 'materials' && isInfoSaved.value) {
    loadExistingMaterials(savedTaskLogId.value);
  }
  
  if (newTab === 'externalServices' && isInfoSaved.value) {
    loadExistingServices(savedTaskLogId.value);
  }
  
  // НОВАЯ ЛОГИКА ДЛЯ СМЕНЫ ВКЛАДОК
  if (newTab === 'personnel' && isInfoSaved.value) {
    loadExistingPersonnel(savedTaskLogId.value);
  }
  
  if (newTab === 'equipment' && isInfoSaved.value) {
    loadExistingEquipment(savedTaskLogId.value);
  }
};

onMounted(() => {
  loadTaskOptions();
  loadMaterialOptions();
  loadUnitOptions();
  loadServiceOptions();
  loadPositionOptions();    // Загрузка должностей
  loadEquipmentTypeOptions(); // Загрузка типов техники
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
      
      // Сброс и инициализация массивов ресурсов
      materialRecords.value = [createNewMaterialObject()];
      existingRecordsMaterials.value = [];

      serviceRecords.value = [createNewServiceObject()];
      existingRecordsServices.value = [];
      
      personnelRecords.value = [createNewPersonnelObject()];
      existingRecordsPersonnel.value = [];
      
      equipmentRecords.value = [createNewEquipmentObject()];
      existingRecordsEquipment.value = [];
      
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

.new-info-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Общий класс для блоков ресурсов */
.resource-record-block {
  padding-bottom: 16px; 
  border-bottom: 1px solid #eee;
  position: relative; /* Для позиционирования крестика */
}

.resource-record-block:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.resource-record-header {
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

.form-line-services {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

/* НОВЫЕ СТИЛИ ДЛЯ ИСПОЛНИТЕЛЕЙ И ТЕХНИКИ */
.form-line-personnel,
.form-line-equipment {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr; /* Должность/Тип Техники, Количество, Часы */
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
  .form-line-materials,
  .form-line-services,
  .form-line-personnel, /* АДАПТИВНОСТЬ */
  .form-line-equipment /* АДАПТИВНОСТЬ */
  {
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

  .tabs-block .second-row-tabs {
    border-top: none;
    margin-bottom: 16px;
  }
}
</style>