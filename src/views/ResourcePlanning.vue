<template>
  <TableWrapper
    ref="tableWrapperRef"
    title="Планирование ресурсов"
    :columns="columns"
    :actions="tableActions"
    :limit="limit"
    :loadFn="loadInspectionsWrapper"
    :datePickerConfig="datePickerConfig"
    :dropdownConfig="dropdownConfig"
    :showFilters="true"
    :filters="filters"
    :getRowClassFn="getRowClassFn"
    @update:filters="filters = $event"
  />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import TableWrapper from '@/components/layout/Table/TableWrapper.vue';
import { loadPlanCorrectional } from '@/api/repairApi';
import { loadPeriodTypes } from '@/api/periodApi';
import { usePermissions } from '@/api/usePermissions';

const { hasPermission } = usePermissions();
const canInsert = computed(() => hasPermission('ins:ins'));

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

const formatCoordinates = (startKm, startPk, startZv, finishKm, finishPk, finishZv) => {
  const isPresent = (val) => val !== null && val !== undefined && val !== '';

  const createCoordPart = (km, pk, zv) => {
    const parts = [];
    if (isPresent(km)) parts.push(`${km}км`);
    if (isPresent(pk)) parts.push(`${pk}пк`);
    if (isPresent(zv)) parts.push(`${zv}зв`);
    return parts.join(' ');
  };

  const startPart = createCoordPart(startKm, startPk, startZv);
  const finishPart = createCoordPart(finishKm, finishPk, finishZv);

  if (startPart && finishPart) {
    return `${startPart} - ${finishPart}`;
  } else if (startPart) {
    return startPart;
  }
  return 'Координаты отсутствуют';
};

const loadInspectionsWrapper = async ({ page, limit, filters: filterValues }) => {
  try {
    const objLocation = localStorage.getItem('objLocation');
    if (!objLocation) {
      return { total: 0, data: [] };
    }

    const selectedDate = filterValues.date ? formatDateToString(filterValues.date) : formatDateToString(new Date());
    const periodTypeId = filterValues.periodType?.value ?? 41;

    const records = await loadPlanCorrectional(selectedDate, periodTypeId);
    const totalRecords = records.length;
    const start = (page - 1) * limit;
    const end = page * limit;

    const sliced = records.slice(start, end).map((r, index) => ({
      index: null,
      id: r.id,
      objWorkPlan: r.objWorkPlan,
      name: r.nameLocationClsSection,
      work: r.nameClsWork,
      fullNameWork: r.fullNameWork,
      coordinates: formatCoordinates(r.StartKm, r.StartPicket, null, r.FinishKm, r.FinishPicket, null),
      object: r.fullNameObject,
      planDateStart: r.PlanDateStart,
      planDateEnd: r.PlanDateEnd,
      location: r.nameSection,
      description: r.description,
      rawData: r,
      fullNameTask: r.fullNameTask,
      valuePlan: r.ValuePlan,
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
    console.error('Ошибка при загрузке данных для планирования ресурсов:', e);
    return { total: 0, data: [] };
  }
};

// Функция для условного форматирования строки
const getRowClassFn = (row) => {
  return {
    'row-has-defects': row.hasDefects,
  };
};

const columns = [
  { key: 'id', label: '№', hide: true },
  { key: 'objWorkPlan', label: 'ссылка на план' },
  { key: 'fullNameWork', label: 'Наименование работы' },
  { key: 'name', label: 'Участок' },
  { key: 'location', label: 'Место' },
  { key: 'object', label: 'Объект' },
  { key: 'coordinates', label: 'Координаты' },
  { key: 'fullNameTask', label: 'Задача' },
  { key: 'valuePlan', label: 'Объем (план)' },
  { key: 'planDateStart', label: 'Начало (план)' },
  { key: 'planDateEnd', label: 'Конец (план)' },
  { key: 'description', label: 'Причина отклонения от плана' },
];

const tableActions = computed(() => [
  {
    label: 'Добавить запись',
    icon: 'Plus',
    onClick: () => {
      router.push({ name: 'ResourcePlanningRecord' });
    },
    show: canInsert.value,
  },
  {
    label: 'Экспорт',
    icon: 'Download',
    onClick: () => console.log('Экспортирование инспекций...'),
    show: true,
  },
].filter(action => action.show));
</script>