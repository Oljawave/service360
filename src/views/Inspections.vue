<template>
  <TableWrapper
    ref="tableWrapperRef"
    title="Журнал осмотров и проверок"
    :columns="columns"
    :actions="tableActions"
    :limit="limit"
    :loadFn="loadInspectionsWrapper"
    :datePickerConfig="datePickerConfig"
    :dropdownConfig="dropdownConfig"
    :showFilters="true"
    :filters="filters"
    @update:filters="filters = $event"
    @row-dblclick="onRowDoubleClick"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TableWrapper from '@/components/layout/Table/TableWrapper.vue';
import { loadInspections } from '@/api/inspectionApi';
import { loadPeriodTypes } from '@/api/periodApi';

const router = useRouter();

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

const formatDateToString = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadInspectionsWrapper = async ({ page, limit, filters: filterValues }) => {
  try {
    const objLocation = localStorage.getItem('objLocation');
    if (!objLocation) {
      return { total: 0, data: [] };
    }

    const selectedDate = filterValues.date ? formatDateToString(filterValues.date) : formatDateToString(new Date());
    const periodTypeId = filterValues.periodType?.value ?? 41;

    const records = await loadInspections(selectedDate, periodTypeId);
    const totalRecords = records.length;
    const start = (page - 1) * limit;
    const end = page * limit;

    const sliced = records.slice(start, end).map((r, index) => ({
      index: start + index + 1,
      name: r.nameLocationClsSection,
      work: r.fullNameWork,
      fullNameWork: r.fullNameWork,
      location: r.nameSection,
      coordinates: `${r.StartKm} км ${r.StartPicket} пк - ${r.FinishKm} км ${r.FinishPicket} пк`,
      object: r.fullNameObject,
      planDate: r.PlanDateEnd,
      factDate: r.FactDateEnd,
      inspector: r.fullNameUser,
      deviation: r.nameDeviationDefect,
      reason: r.ReasonDeviation,
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
    console.error('Ошибка при загрузке данных инспекций:', e);
    return { total: 0, data: [] };
  }
};

const onRowDoubleClick = (row) => {
  console.log('Двойной клик по записи:', row);
};

const columns = [
  { key: 'index', label: '№' },
  { key: 'work', label: 'Вид работы' },
  { key: 'name', label: 'Участок' },
  { key: 'location', label: 'Место' },
  { key: 'object', label: 'Объект' },
  { key: 'coordinates', label: 'Координаты' },
  { key: 'planDate', label: 'Плановая дата' },
  { key: 'factDate', label: 'Фактическая дата' },
  // { key: 'deviation', label: 'Отклонение' },
  // { key: 'reason', label: 'Причина отклонения' },
];

const tableActions = [
  {
    label: 'Добавить запись',
    icon: 'Plus',
    onClick: () => {
      router.push({ name: 'InspectionRecord' });
    },
  },
  {
    label: 'Экспорт',
    icon: 'Download',
    onClick: () => console.log('Экспортирование инспекций...'),
  }
];
</script>