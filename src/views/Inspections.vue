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
  />
    <!-- @row-dblclick="onRowDoubleClick" -->
  <WorkCardInfoModal
    v-if="showWorkCardInfoModal"
    :record="selectedRecord"
    :inspectionId="selectedRecord?.rawData?.id"
    :section="selectedRecord?.name"
    :date="selectedRecord?.factDate"
    :sectionId="selectedRecord?.rawData?.objLocationClsSection"
    :sectionPv="selectedRecord?.rawData?.pvLocationClsSection"
    @close="showWorkCardInfoModal = false"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TableWrapper from '@/components/layout/Table/TableWrapper.vue';
import { loadInspections } from '@/api/inspectionApi';
import { loadPeriodTypes } from '@/api/periodApi';
import WorkStatus from '@/components/ui/WorkStatus.vue';
import WorkCardInfoModal from '@/modals/WorkCardInfoModal.vue';

const router = useRouter();

const limit = 10;
const tableWrapperRef = ref(null);

// Новые реактивные переменные для модального окна
const showWorkCardInfoModal = ref(false);
const selectedRecord = ref(null);

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
      work: r.fullNameWork,
      name: r.nameLocationClsSection, // Участок
      location: r.nameSection,
      object: r.fullNameObject,
      coordinates: `${r.StartKm} км ${r.StartPicket} пк - ${r.FinishKm} км ${r.FinishPicket} пк`,
      planDate: r.PlanDateEnd,
      factDate: r.FactDateEnd, // Фактическая дата
      inspector: r.fullNameUser,
      deviation: r.nameDeviationDefect,
      reason: r.ReasonDeviation,
      rawData: r, // Сырые данные содержат ID инспекции (r.id) и координаты
      objWork: r.objWork,
      objObject: r.objObject,
      status: {
        showCheck: r.ActualDateEnd !== '0000-01-01',
        showMinus: r.ActualDateEnd === '0000-01-01',
        showHammer: r.nameFlagDefect === 'да',
        showRuler: r.nameFlagParameter === 'да',
      },
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
  
  selectedRecord.value = row;
  
  // Проверяем, что ID инспекции существует
  if (!row.rawData?.id) {
    console.warn('Отсутствует ID инспекции. Открытие окна Defect/Parameters невозможно.');
    return;
  }
  
  // Открываем модальное окно WorkCardInfoModal.vue
  showWorkCardInfoModal.value = true;
};

const columns = [
  { key: 'index', label: '№' },
  { key: 'work', label: 'Наименование работы' },
  { key: 'name', label: 'Участок' },
  { key: 'location', label: 'Место' },
  { key: 'object', label: 'Объект' },
  { key: 'coordinates', label: 'Координаты' },
  { key: 'planDate', label: 'Плановая дата' },
  { key: 'factDate', label: 'Фактическая дата' },
  { key: 'status', label: 'Статус работы', component: WorkStatus,}
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
  },
];
</script>