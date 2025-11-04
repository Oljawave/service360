<template>
  <div class="plan-form-page">
    <div class="header">
      <BackButton @click="goBack" />
      <h1>Журнал планирования ресурсов</h1>
    </div>

    <ResourceInfoSection v-if="recordData" :recordData="recordData" />

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

    <ResourceEditTable
      v-if="recordData && activeTab === 'materials'"
      title="Материалы"
      :rows="recordData.materials"
      :nameOptions="materialNameOptions"
      :unitOptions="unitOptions"
      @update:rows="recordData.materials = $event"
      @save-row="handleSaveRow"
      @delete-row="handleDeleteRow"
    />

    <ResourceEditTable
      v-if="recordData && activeTab === 'tools'"
      title="Инструменты"
      :rows="recordData.tools"
      :nameOptions="toolNameOptions"
      :unitOptions="unitOptions"
      @update:rows="recordData.tools = $event"
      @save-row="handleSaveRow"
      @delete-row="handleDeleteRow"
    />

    <ResourceEditTable
      v-if="recordData && activeTab === 'equipment'"
      title="Техника"
      :rows="recordData.equipment"
      :nameOptions="equipmentNameOptions"
      :unitOptions="unitOptions"
      @update:rows="recordData.equipment = $event"
      @save-row="handleSaveRow"
      @delete-row="handleDeleteRow"
    />

    <ResourceEditTable
      v-if="recordData && activeTab === 'services'"
      title="Услуги"
      :rows="recordData.services"
      :nameOptions="serviceNameOptions"
      :unitOptions="unitOptions"
      @update:rows="recordData.services = $event"
      @save-row="handleSaveRow"
      @delete-row="handleDeleteRow"
    />

    <ResourceEditTable
    v-if="recordData && activeTab === 'performers'"
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
import { loadObjTaskLog } from '@/api/executionApi.js';

const router = useRouter();
const route = useRoute();

const recordData = ref(null);
const isLoading = ref(true);
const workLogId = ref(route.params.id);
const activeTab = ref('materials');

const setActiveTab = (tab) => {
  activeTab.value = tab;
};

const handleSaveRow = (payload) => console.log('Saving row:', payload);
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
        name: item.nameMaterial,
        quantity: item.ValuePlan,
        unit: item.nameMeasure,
      })),
      services: (data.tpService || []).map(item => ({
        name: item.nameTpService,
        quantity: item.ValuePlan,
        unit: 'ед.',
      })),
      tools: (data.tool || []).map(item => ({
        name: item.nameTypTool,
        quantity: item.Value,
        unit: 'шт',
      })),
      equipment: (data.equipment || []).map(item => ({
        name: item.nameTypEquipment,
        quantity: item.Quantity,
        hours: item.Value,
      })),
      performers: (data.personnel || []).map(item => ({
        name: item.namePosition,
        count: item.Quantity,
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

/* Стили info-section удалены, так как они теперь в ResourceInfoSection.vue */

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