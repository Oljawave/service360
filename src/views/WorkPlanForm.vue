<template>
  <div class="plan-form-page">
    <div class="header">
      <BackButton @click="goToInspections" />
      <h1>Запись в Журнал осмотров и проверок</h1>
    </div>
    <div class="filters-section">
      <div class="filter-row">
        <AppDropdown
          v-model:value="selectedSection"
          label="Участок"
          placeholder="Выберите участок"
          :required="true"
          class="filter-item"
          :options="sections"
          @update:value="onSectionChange"
        />
        <AppDropdown
          :key="monthDropdownKey"
          v-model:value="selectedMonth"
          label="Месяц"
          placeholder="Выберите месяц"
          :required="true"
          class="filter-item"
          :options="months"
          @update:value="onMonthChange"
        />
        <AppDropdown
          :key="dayDropdownKey"
          v-model:value="selectedDay"
          label="День"
          placeholder="Выберите день"
          :required="true"
          class="filter-item"
          :options="days"
        />
        <div class="action-buttons">
          <MainButton
            label="Сформировать план работы"
            :loading="isGenerating"
            @click="generatePlan"
            class="generate-btn"
          />
        </div>
      </div>
    </div>
    <div class="table-section">
      <div class="table-header">
        <h2>План работ на {{ formattedDate }}</h2>
        <div class="table-subheader">
          <p class="subtitle">
            Отображаются только незавершенные работы. Для детального просмотра дважды кликните по строке.
          </p>
          <span class="total-count">Всего работ: {{ tableData.length }}</span>
        </div>
      </div>
      <BaseTable
        :columns="columns"
        :rows="tableData"
        :loading="isLoading"
        :expanded-rows="[]"
        :toggle-row-expand="() => {}"
        :children-map="{}"
        :active-filters="{}"
        @row-dblclick="onRowDoubleClick"
        :showFilters="false"
      />
    </div>

    <WorkCardModal
      v-if="isWorkCardModalOpen"
      :record="selectedRecord"
      :section="selectedSectionName"
      :date="selectedDate"
      :sectionId="selectedSection"
      :sectionPv="selectedSectionPv"
      @close="isWorkCardModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { loadSections, loadWorkPlanDates, loadWorkPlanUnfinishedByDate } from '@/api/inspectionsApi.js';

import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue';
import BaseTable from '@/components/layout/Table/BaseTable.vue';
import BackButton from '@/components/ui/BackButton.vue';
import MainButton from '@/components/ui/MainButton.vue';
import WorkCardModal from '@/modals/WorkCardModal.vue';

const selectedSection = ref(null);
const selectedMonth = ref(null);
const selectedDay = ref(null);
const isGenerating = ref(false);
const isLoading = ref(false);
const tableData = ref([]);
const sections = ref([]);
const sectionsData = ref([]);
const months = ref([]);
const days = ref([]);

const monthDropdownKey = ref(0);
const dayDropdownKey = ref(0);

const isWorkCardModalOpen = ref(false);
const selectedRecord = ref(null);

const selectedDate = computed(() => {
  if (!selectedMonth.value || !selectedDay.value) return null;
  const [year, month] = selectedMonth.value.split('-');
  const day = selectedDay.value.toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
});

const formattedDate = computed(() => {
  if (!selectedDate.value) return '';
  const date = new Date(selectedDate.value);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

const selectedSectionName = computed(() => {
  const section = sections.value.find((s) => s.value === selectedSection.value);
  return section ? section.label : null;
});

const getSelectedSectionData = () => {
  if (!selectedSection.value) return { id: null, pv: null };
  const section = sectionsData.value.find((s) => s.id === selectedSection.value);
  return { id: section.id, pv: section.pv };
};

const selectedSectionPv = computed(() => getSelectedSectionData().pv);

const columns = [
  { key: 'name', label: 'НАИМЕНОВАНИЕ РАБОТЫ' },
  { key: 'place', label: 'МЕСТО' },
  { key: 'objectType', label: 'ТИП ОБЪЕКТА' },
  { key: 'object', label: 'ОБЪЕКТ' },
  { key: 'coordinates', label: 'КООРДИНАТЫ' },
];

const router = useRouter();

const goToInspections = () => {
  router.push({ name: 'Inspections' });
};

const loadWorkPlanForDate = async () => {
  if (!selectedDate.value || !selectedSection.value) {
    window.$message?.error('Пожалуйста, выберите участок и дату.');
    return;
  }

  isLoading.value = true;
  try {
    const sectionData = getSelectedSectionData();
    if (!sectionData.pv) {
      throw new Error('PV участка не найден');
    }

    const records = await loadWorkPlanUnfinishedByDate(sectionData.id, sectionData.pv, selectedDate.value);

    tableData.value = records.map((record) => ({
      id: record.id,
      pv: record.pv,
      name: record.fullNameWork || 'Без названия',
      place: record.nameSection || 'Не указано',
      objectType: record.nameClsObject || 'Неизвестно',
      object: record.fullNameObject || 'Объект не указан',
      coordinates: record.StartKm && record.FinishKm ? `${record.StartKm}км ${record.StartPicket || 0}пк ${record.StartLink || 0}зв — ${record.FinishKm}км ${record.FinishPicket || 0}пк ${record.FinishLink || 0}зв` : 'Координаты отсутствуют',
      StartKm: record.StartKm,
      StartPicket: record.StartPicket,
      StartLink: record.StartLink,
      FinishKm: record.FinishKm,
      FinishPicket: record.FinishPicket,
      FinishLink: record.FinishLink,
    }));
  } catch (error) {
    console.error('Ошибка загрузки плана:', error);
    window.$message?.error('Не удалось загрузить план работ');
    tableData.value = [];
  } finally {
    isLoading.value = false;
  }
};

const loadSectionsData = async () => {
  try {
    const data = await loadSections();
    sectionsData.value = data;
    sections.value = data.map((section) => ({
      value: section.id,
      label: section.name,
    }));

    if (data.length > 0) {
      selectedSection.value = data[0].id;
      await loadWorkPlanDatesData();
    }
  } catch (error) {
    console.error('Ошибка при загрузке участков:', error);
    window.$message?.error('Не удалось загрузить участки');
  }
};

const loadWorkPlanDatesData = async () => {
  const sectionData = getSelectedSectionData();

  if (!sectionData.pv) {
    months.value = [];
    days.value = [];
    selectedMonth.value = null;
    selectedDay.value = null;
    monthDropdownKey.value++;
    dayDropdownKey.value++;
    return;
  }

  try {
    const dates = await loadWorkPlanDates(sectionData.id, sectionData.pv);

    const monthsSet = new Set();
    const daysSet = new Set();

    dates.forEach((date) => {
      const [year, month, day] = date.split('-');
      monthsSet.add(`${year}-${month}`);
      daysSet.add(day);
    });

    months.value = Array.from(monthsSet).map((month) => ({
      value: month,
      label: new Date(`${month}-01`).toLocaleString('ru-RU', { month: 'long' }),
    }));
    days.value = Array.from(daysSet).map((day) => ({
      value: day,
      label: day,
    }));

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentDay = now.getDate().toString();

    if (months.value.some((m) => m.value === currentMonth)) {
      selectedMonth.value = currentMonth;
      if (days.value.some((d) => d.value === currentDay)) {
        selectedDay.value = currentDay;
      } else {
        selectedDay.value = days.value.length > 0 ? days.value[0].value : null;
      }
    } else {
      selectedMonth.value = months.value.length > 0 ? months.value[0].value : null;
      selectedDay.value = days.value.length > 0 ? days.value[0].value : null;
    }

    monthDropdownKey.value++;
    dayDropdownKey.value++;
  } catch (error) {
    console.error('Ошибка при загрузке дат для плана:', error);
    window.$message?.error('Не удалось загрузить даты для плана');
    months.value = [];
    days.value = [];
    selectedMonth.value = null;
    selectedDay.value = null;
    monthDropdownKey.value++;
    dayDropdownKey.value++;
  }
};

const onSectionChange = async (newSectionId) => {
  if (newSectionId) {
    selectedMonth.value = null;
    selectedDay.value = null;
    months.value = [];
    days.value = [];
    monthDropdownKey.value++;
    dayDropdownKey.value++;

    await loadWorkPlanDatesData();
  } else {
    months.value = [];
    days.value = [];
    selectedMonth.value = null;
    selectedDay.value = null;
    tableData.value = [];
    monthDropdownKey.value++;
    dayDropdownKey.value++;
  }
};

const onMonthChange = (newMonth) => {
  if (!newMonth) {
    selectedDay.value = null;
    dayDropdownKey.value++;
    return;
  }
  selectedDay.value = null;
  dayDropdownKey.value++;
};

const generatePlan = () => {
  if (isGenerating.value) return; // Предотвращаем повторные вызовы
  
  if (!selectedDate.value) {
    window.$message?.error('Пожалуйста, выберите корректную дату.');
    return;
  }
  isGenerating.value = true;
  loadWorkPlanForDate().finally(() => {
    isGenerating.value = false;
  });
};

onMounted(async () => {
  await loadSectionsData();
});

const onRowDoubleClick = (row) => {
  selectedRecord.value = row;
  isWorkCardModalOpen.value = true;
};
</script>



<style scoped>
.plan-form-page {
  padding: 24px;
  background: #f7fafc;
  min-height: 100vh;
  font-family: system-ui;
  overflow-y: auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
}

.filters-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}

.filter-item {
  flex: 1;
  min-width: 240px;
}

.filter-item :deep(.hint) {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  justify-content: flex-start;
  margin-top: 16px;
  flex-shrink: 0;
}

.generate-btn {
  max-width: 240px;
  height: 40px;
  font-size: 14px;
  padding: 0 16px;
  border-radius: 8px;
  background-color: #2b6cb0 ;
  color: white;
  border: none;
  cursor: pointer;
}

.table-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.table-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.table-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.table-subheader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.subtitle {
  font-size: 14px;
  color: #718096;
  line-height: 1.5;
  margin: 0;
  flex: 1;
}

.total-count {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
  white-space: nowrap;
}
</style>
