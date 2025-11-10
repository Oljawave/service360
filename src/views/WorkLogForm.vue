<template>
  <div class="plan-form-page">
    <div class="header">
      <BackButton @click="goBack" />
      <h1>Журнал планирования ресурсов</h1>
    </div>

    <ResourceInfoSection 
      v-if="recordData" 
      :recordData="recordData"
      :taskLogId="workLogId"
      :onTaskUpdated="onTaskUpdated"
    />

    <div class="cards-section" v-if="recordData">
      <ResourceCard
        title="Материалы"
        icon="package"
        :items="recordData.materials"
        :is-active="activeTab === 'materials'"
        @click="setActiveTab('materials')" />
      <ResourceCard
        title="Инструменты"
        icon="wrench"
        :items="recordData.tools"
        :is-active="activeTab === 'tools'"
        @click="setActiveTab('tools')"
      />
      <ResourceCard
        title="Техника"
        icon="truck"
        :items="recordData.equipment"
        :is-active="activeTab === 'equipment'"
        @click="setActiveTab('equipment')"
      />
      <ResourceCard
        title="Услуги"
        icon="briefcase"
        :items="recordData.services"
        :is-active="activeTab === 'services'"
        @click="setActiveTab('services')"
      />
      <ResourceCard
        title="Исполнители"
        icon="users"
        :items="recordData.performers"
        :is-active="activeTab === 'performers'"
        is-performer
        @click="setActiveTab('performers')"
      />
    </div>

    <div class="table-transition-wrapper">
      <Transition name="fade-table" mode="out-in">
        <ResourceEditTable
          v-if="recordData && activeTab === 'materials'"
          key="materials"
          title="Материалы"
          :rows="recordData.materials"
          :nameOptions="materialNameOptions"
          :unitOptions="unitOptions"
          @update:rows="recordData.materials = $event"
          @save-row="handleSaveRow"
          @delete-row="handleDeleteRow"
          @add-row="handleAddMaterialRow"
        />
        <ResourceEditTable
          v-else-if="recordData && activeTab === 'tools'"
          key="tools"
          title="Инструменты"
          :rows="recordData.tools"
          :nameOptions="toolNameOptions"
          :unitOptions="unitOptions"
          @update:rows="recordData.tools = $event"
          @save-row="handleSaveRow"
          @delete-row="handleDeleteRow"
          @add-row="handleAddToolRow"
        />
        <ResourceEditTable
          v-else-if="recordData && activeTab === 'equipment'"
          key="equipment"
          title="Техника"
          :rows="recordData.equipment"
          :nameOptions="equipmentNameOptions"
          :unitOptions="unitOptions"
          @update:rows="recordData.equipment = $event"
          @save-row="handleSaveRow"
          @delete-row="handleDeleteRow"
          @add-row="handleAddEquipmentRow"
        />
        <ResourceEditTable
          v-else-if="recordData && activeTab === 'services'"
          key="services"
          title="Услуги"
          :rows="recordData.services"
          :nameOptions="serviceNameOptions"
          :unitOptions="unitOptions"
          @update:rows="recordData.services = $event"
          @save-row="handleSaveRow"
          @delete-row="handleDeleteRow"
          @add-row="handleAddServiceRow"
        />
        <ResourceEditTable
          v-else-if="recordData && activeTab === 'performers'"
          key="performers"
          title="Исполнители"
          :rows="recordData.performers"
          :nameOptions="performerNameOptions"
          :unitOptions="performerUnitOptions"
          :is-performer="true"
          :performerNameOptions="performerNameOptionsForDropdown"
          @update:rows="recordData.performers = $event"
          @save-row="handleSaveRow"
          @delete-row="handleDeleteRow"
        />
      </Transition>
    </div>

    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      Загрузка данных...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import BackButton from '@/components/ui/BackButton.vue';
import ResourceCard from '@/components/ui/ResourceCard.vue';
import ResourceEditTable from '@/components/ui/ResourceEditTable.vue';
import ResourceInfoSection from '@/components/ui/ResourceInfoSection.vue';
import { loadObjTaskLog, saveResourceFact, saveServiceFact } from '@/api/executionApi.js';
import { useNotificationStore } from '@/stores/notificationStore';

const router = useRouter();
const route = useRoute();

const recordData = ref(null);
const isLoading = ref(true);
const workLogId = ref(route.params.id);
const activeTab = ref('materials');
const notificationStore = useNotificationStore();

const setActiveTab = (tab) => {
  activeTab.value = tab;
};

const getFormattedDate = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const handleSaveRow = async ({ row }) => {
  // TODO: Заменить на получение реальных данных пользователя
  const user = { id: 1003, pv: 1087 };

  const payload = {
    id: row.id,
    idValue: row.idValue,
    Value: row.fact,
    idUser: row.idUser,
    objUser: user.id,
    pvUser: user.pv,
    idUpdatedAt: row.idUpdatedAt,
    UpdatedAt: getFormattedDate(),
  };

  try {
    let apiMethod, successMsg, errorMsg, errorLog;

    if (activeTab.value === 'materials') {
      apiMethod = saveResourceFact;
      successMsg = 'Факт по материалу успешно сохранен!';
      errorMsg = 'Ошибка при сохранении факта по материалу.';
      errorLog = 'Ошибка сохранения факта по материалу:';
    } else if (activeTab.value === 'services') {
      apiMethod = saveServiceFact;
      successMsg = 'Факт по услуге успешно сохранен!';
      errorMsg = 'Ошибка при сохранении факта по услуге.';
      errorLog = 'Ошибка сохранения факта по услуге:';
    }

    await apiMethod(payload);
    notificationStore.showNotification(successMsg, 'success');
    await loadWorkLogData(workLogId.value);
  } catch (error) {
    notificationStore.showNotification(errorMsg, 'error');
    console.error(errorLog, error);
  }
};

const handleAddMaterialRow = async (newRowData) => {
  try {
    // TODO: Здесь должен быть вызов API для добавления нового материала
    // const response = await addMaterial(workLogId.value, newRowData);
    
    notificationStore.showNotification('Материал успешно добавлен!', 'success');
    await loadWorkLogData(workLogId.value);
  } catch (error) {
    notificationStore.showNotification('Ошибка при добавлении материала.', 'error');
    console.error('Ошибка добавления материала:', error);
  }
};

const handleAddToolRow = async (newRowData) => {
  try {
    // TODO: Здесь должен быть вызов API для добавления нового инструмента
    notificationStore.showNotification('Инструмент успешно добавлен!', 'success');
    await loadWorkLogData(workLogId.value);
  } catch (error) {
    notificationStore.showNotification('Ошибка при добавлении инструмента.', 'error');
    console.error('Ошибка добавления инструмента:', error);
  }
};

const handleAddEquipmentRow = async (newRowData) => {
  try {
    // TODO: Здесь должен быть вызов API для добавления новой техники
    notificationStore.showNotification('Техника успешно добавлена!', 'success');
    await loadWorkLogData(workLogId.value);
  } catch (error) {
    notificationStore.showNotification('Ошибка при добавлении техники.', 'error');
    console.error('Ошибка добавления техники:', error);
  }
};

const handleAddServiceRow = async (newRowData) => {
  try {
    // TODO: Здесь должен быть вызов API для добавления новой услуги
    notificationStore.showNotification('Услуга успешно добавлена!', 'success');
    await loadWorkLogData(workLogId.value);
  } catch (error) {
    notificationStore.showNotification('Ошибка при добавлении услуги.', 'error');
    console.error('Ошибка добавления услуги:', error);
  }
};

const handleDeleteRow = (payload) => console.log('Deleting row:', payload);

const goBack = () => {
  router.push({ name: 'WorkLog' });
};

const formatDate = (dateStr) => {
  if (!dateStr || dateStr.startsWith('0000')) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
};

const formatCoordinates = (startKm, startPk, finishKm, finishPk) => {
  const isPresent = (val) => val !== null && val !== undefined;
  const start = isPresent(startKm) ? `${startKm}км ${startPk || 0}пк` : '';
  const finish = isPresent(finishKm) ? `${finishKm}км ${finishPk || 0}пк` : '';

  if (start && finish) {
    return `${start} - ${finish}`;
  }
  return start || finish || 'Координаты отсутствуют';
};

const onTaskUpdated = () => {
  loadWorkLogData(workLogId.value);
};

const loadWorkLogData = async (id) => {
  isLoading.value = true;
  
  try {
    const data = await loadObjTaskLog(id);
    if (!data) {
      throw new Error("Данные для записи журнала работ не найдены.");
    }

    recordData.value = {
      taskName: data.fullNameTask || '-',
      volume: data.ValuePlan !== null ? data.ValuePlan : '-',
      startDate: formatDate(data.PlanDateStart),
      endDate: formatDate(data.PlanDateEnd),
      workName: data.fullNameWork || '-',
      section: data.nameLocationClsSection || '-',
      place: data.nameSection || '-',
      objectName: data.fullNameObject || '-',
      coordinates: formatCoordinates(data.StartKm, data.StartPicket, data.FinishKm, data.FinishPicket),
      volumeFact: data.ValueFact !== null ? data.ValueFact : '-',
      startDateFact: formatDate(data.FactDateStart),
      endDateFact: formatDate(data.FactDateEnd),
      
      materials: (data.material || []).map(item => ({
        id: item.id,
        name: item.nameMaterial,
        plan: item.ValuePlan,
        fact: item.Value,
        unit: item.nameMeasure,
        idValue: item.idValue,
        idUser: item.idUser,
        idUpdatedAt: item.idUpdatedAt,
      })),
      services: (data.tpService || []).map(item => ({
        id: item.id,
        name: item.nameTpService,
        plan: item.ValuePlan,
        fact: item.Value || 0,
        unit: 'ед.',
        idValue: item.idValue,
        idUser: item.idUser,
        idUpdatedAt: item.idUpdatedAt,
        Value: item.Value, // Добавляем факт из tpService
      })),
      tools: (data.tool || []).map(item => ({
        name: item.nameTypTool,
        plan: item.Value,
        unit: 'шт',
      })),
      equipment: (data.equipment || []).map(item => ({
        name: item.nameTypEquipment,
        plan: item.Quantity,
        hours: item.Value,
      })),
      performers: (data.personnel || []).map(item => ({
        name: item.namePosition,
        plan: item.Quantity,
        hours: item.Value,
      })),
    };
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  } finally {
    isLoading.value = false;
  }
};

// Mock data for dropdowns in ResourceEditTable
const materialNameOptions = ref([]);
const toolNameOptions = ref([]);
const equipmentNameOptions = ref([]);
const serviceNameOptions = ref([]);
const performerNameOptions = ref([]);
const unitOptions = ref([]);
const performerUnitOptions = ref([]);


onMounted(() => {
  loadWorkLogData(workLogId.value);
});
</script>

<style scoped>
.plan-form-page {
  padding: 24px;
  background: #f7fafc;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.cards-section {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  margin-bottom: 24px;
  overflow-x: auto;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  gap: 16px;
  font-size: 16px;
  color: #4a5568;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #3182ce;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.table-transition-wrapper {
  position: relative;
}

.fade-table-enter-active,
.fade-table-leave-active {
  transition: opacity 0.15s ease;
}

.fade-table-enter-from,
.fade-table-leave-to {
  opacity: 0;
}


@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1200px) {
  .cards-section {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .cards-section {
    gap: 8px;
  }
}
</style>