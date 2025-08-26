<template>
  <TableWrapper
    ref="tableWrapperRef"
    title="План работ"
    :columns="columns"
    :actions="tableActions"
    :limit="limit"
    :loadFn="loadWorkPlanWrapper"
    :datePickerConfig="datePickerConfig"
    :dropdownConfig="dropdownConfig"
    :showFilters="true"
    :filters="filters"
    @update:filters="filters = $event"
    @row-dblclick="onRowDoubleClick"
  >
    <template #modals="{ selectedRow, showEditModal, closeModals }">
      <ModalEditPlan
        v-if="showEditModal"
        :rowData="selectedRow"
        @close="closeModals"
        @save="onSave(closeModals)"
      />
    </template>
  </TableWrapper>

  <ModalPlanWork
    v-if="isPlanWorkModalOpen"
    @close="closePlanWorkModal"
    @update-table="handleTableUpdate"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TableWrapper from '@/components/layout/Table/TableWrapper.vue';
import ModalEditPlan from '@/modals/ModalEditPlan.vue';
import ModalPlanWork from '@/modals/ModalPlanWork.vue';
import { loadWorkPlan } from '@/api/planApi';
import { loadPeriodTypes } from '@/api/periodApi';

const limit = 10;
const isPlanWorkModalOpen = ref(false);
const tableWrapperRef = ref(null);

const filters = ref({
  date: new Date(),
  periodType: null,
});

const datePickerConfig = {
  label: 'Дата',
  placeholder: 'Выберите дату',
};

const dropdownConfig = ref({
  label: 'Тип периода',
  options: [],
  placeholder: 'Выберите тип периода',
});

onMounted(async () => {
  try {
    const types = await loadPeriodTypes();
    
    dropdownConfig.value.options = types;
    
    const defaultType = types.find(t => t.value === 41);
    if (defaultType) {
      filters.value.periodType = defaultType;
    } else if (types.length > 0) {
      filters.value.periodType = types[0];
    }
    
  } catch (error) {
    console.error('Ошибка загрузки типов периодов:', error);
    dropdownConfig.value.options = [];
  }
});

const closePlanWorkModal = () => {
  isPlanWorkModalOpen.value = false;
};

const handleTableUpdate = () => {
  if (tableWrapperRef.value && tableWrapperRef.value.refreshTable) {
    tableWrapperRef.value.refreshTable();
  }
};

const onSave = (closeFn) => {
  closeFn();              
  handleTableUpdate();    
};

const formatDateToString = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadWorkPlanWrapper = async ({ page, limit, filters: filterValues }) => {
  try {
    
    const objLocation = localStorage.getItem('objLocation');
    if (!objLocation) {
      return { total: 0, data: [] };
    }

    const selectedDate = filterValues.date ? formatDateToString(filterValues.date) : formatDateToString(new Date());
    const periodTypeId = filterValues.periodType?.value ?? 41;

    const records = await loadWorkPlan(selectedDate, periodTypeId);
    const totalRecords = records.length;
    const start = (page - 1) * limit;
    const end = page * limit;

    const sliced = records.slice(start, end).map((r, index) => ({
      index: start + index + 1,
      name: r.nameLocationClsSection,
      work: r.nameClsWork,
      fullNameWork: r.fullNameWork,
      coordinates: `${r.StartKm} км ${r.StartPicket} пк - ${r.FinishKm} км ${r.FinishPicket} пк`,
      object: r.fullNameObject,
      planDate: r.PlanDateEnd,
      rawData: r,
      objWork: r.objWork,
      objObject: r.objObject,
      StartKm: r.StartKm,
      StartPicket: r.StartPicket,
      FinishKm: r.FinishKm,
      FinishPicket: r.FinishPicket,
      nameLocationClsSection: r.nameLocationClsSection,
      objLocationClsSection: r.objLocationClsSection
    }));

    return {
      total: totalRecords,
      data: sliced,
    };
  } catch (e) {
    console.error('Ошибка при загрузке данных:', e);
    return { total: 0, data: [] };
  }
};

const onRowDoubleClick = (row) => {
  console.log('Двойной клик по строке:', row);
};

const columns = [
  { key: 'index', label: '№' },
  { key: 'name', label: 'Участок' },
  { key: 'work', label: 'Вид работы' },
  { key: 'fullNameWork', label: 'Работы' },
  { key: 'coordinates', label: 'Координаты' },
  { key: 'object', label: 'Объект' },
  { key: 'planDate', label: 'Плановая дата' },
];

const tableActions = [
  {
    label: 'Запланировать новую работу',
    icon: 'Plus',
    onClick: () => {
      isPlanWorkModalOpen.value = true;
    },
  },
  {
    label: 'Экспорт',
    icon: 'Download',
    onClick: () => console.log('Экспортирование...'),
  }
];
</script>