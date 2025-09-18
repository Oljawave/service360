<template>
  <TableWrapper
    ref="tableWrapperRef"
    title="Журнал неисправностей"
    :columns="columns"
    :actions="tableActions"
    :limit="limit"
    :loadFn="loadFaultsWrapper"
    :datePickerConfig="datePickerConfig"
    :dropdownConfig="dropdownConfig"
    :showFilters="true"
    :filters="filters"
    @update:filters="filters = $event"
    @row-dblclick="onRowDoubleClick"
  >
    <template #modals="{ selectedRow, showEditModal, closeModals }">
      </template>
  </TableWrapper>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TableWrapper from '@/components/layout/Table/TableWrapper.vue';
import { loadFaults } from '@/api/faultApi';
import { loadPeriodTypes } from '@/api/periodApi';

const limit = 10;
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

const handleTableUpdate = () => {
  if (tableWrapperRef.value && tableWrapperRef.value.refreshTable) {
    tableWrapperRef.value.refreshTable();
  }
};

const formatDateToString = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadFaultsWrapper = async ({ page, limit, filters: filterValues }) => {
  try {
    const objLocation = localStorage.getItem('objLocation');
    if (!objLocation) {
      return { total: 0, data: [] };
    }

    const selectedDate = filterValues.date ? formatDateToString(filterValues.date) : formatDateToString(new Date());
    const periodTypeId = filterValues.periodType?.value ?? 41;

    const records = await loadFaults(selectedDate, periodTypeId);
    const totalRecords = records.length;
    const start = (page - 1) * limit;
    const end = page * limit;

    const sliced = records.slice(start, end).map((r, index) => ({
      index: start + index + 1,

      nameSection: r.nameSection,
      nameDefect: r.nameDefect,
      nameObject: r.nameObject,
      coordinates: `${r.StartKm} км ${r.StartPicket} пк - ${r.FinishKm} км ${r.FinishPicket} пк`,
      CreationDateTime: r.CreationDateTime,
      FactDateEnd: r.FactDateEnd,
      Description: r.Description,
      nameDefectsComponent: r.nameDefectsComponent,
      nameDefectsCategory: r.nameDefectsCategory,
      nameLocationClsSection: r.nameLocationClsSection,
      rawData: r,
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
  { key: 'FactDateEnd', label: 'Дата проверки' },
  { key: 'nameSection', label: 'Участок' },
  { key: 'nameLocationClsSection', label: 'Место' },
  { key: 'nameObject', label: 'Объект' },
  { key: 'coordinates', label: 'Координаты' },
  { key: 'nameDefectsComponent', label: 'Компонент' },
  { key: 'nameDefect', label: 'Неисправность' },
  { key: 'Description', label: 'Примечание' },
  { key: 'nameDefectsCategory', label: 'Категория' },
  { key: 'CreationDateTime', label: 'Время создания записи' },
];

const tableActions = [
  {
    label: 'Экспорт',
    icon: 'Download',
    onClick: () => console.log('Экспортирование...'),
  }
];
</script>