<template>
  <div class="table-wrapper">
    <h2 class="title">{{ title }}</h2>

    <div class="controls-header">
      <div class="filters" v-if="showFilters">
        <AppDatePicker
          v-if="datePickerConfig"
          :modelValue="filters.date"
          :label="datePickerConfig.label"
          :placeholder="datePickerConfig.placeholder"
          @update:modelValue="updateFilter('date', $event)"
        />

        <AppDropdown
          v-if="dropdownConfig"
          :modelValue="filters.periodType"
          :label="dropdownConfig.label"
          :options="dropdownConfig.options"
          :placeholder="dropdownConfig.placeholder"
          @update:modelValue="updateFilter('periodType', $event)"
        />
      </div>
      <TableActions :actions="actions" />
    </div>

    <BaseTable
      :columns="columns"
      :rows="pagedRows"
      :loading="loading"
      :expanded-rows="expandedRows"
      :toggle-row-expand="toggleRowExpand"
      :children-map="childrenMap"
      :activeFilters="activeFilters"
      :sortKey="sortKey"
      :sortDirection="sortDirection"
      :getRowClassFn="getRowClassFn"
      @row-dblclick="handleRowDoubleClick" @toggle-filter="toggleFilter"
      @sort="handleSort"
    >
      <template #filter="{ column }">
        <ColumnFilter
          v-if="openFilter === column.key"
          :column-key="column.key"
          :column-label="column.label"
          :initial-value="columnFilters[column.key] || ''"
          @filter="applyColumnFilter"
          @close="closeFilter"
        />
      </template>
    </BaseTable>
    <div class="table-footer">
      <div class="record-summary">{{ recordSummary }}</div>
      <Pagination
        :total="filteredRows.length"
        :page="page"
        :limit="limit"
        @change-page="setPage"
      />
    </div>

    <slot
      name="modals"
      :selectedRow="selectedRow"
      :showEditModal="showEditModal"
      :closeModals="closeModals"
      :onSave="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import TableActions from './TableActions.vue';
import BaseTable from './BaseTable.vue';
import Pagination from './Pagination.vue';
import ColumnFilter from './ColumnFilter.vue';
import AppDatePicker from '@/components/ui/FormControls/AppDatePicker.vue';
import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue';

const props = defineProps({
  title: String,
  columns: Array,
  limit: { type: Number, default: 6 },
  actions: { type: Array, required: true },
  loadFn: { type: Function, required: true },
  datePickerConfig: Object,
  dropdownConfig: Object,
  showFilters: { type: Boolean, default: true },
  filters: {
    type: Object,
    default: () => ({}),
  },
  // НОВЫЙ ПРОПС
  getRowClassFn: {
    type: Function,
    default: () => ({}),
  }
});

const emit = defineEmits(['update:filters', 'row-dblclick']);

const rows = ref([]);
const childrenMap = ref({});
const expandedRows = ref([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const selectedRow = ref(null);
const showEditModal = ref(false);

const columnFilters = ref({});
const openFilter = ref(null);

const sortKey = ref('id'); // Установка сортировки по умолчанию по 'id'
const sortDirection = ref('asc'); // Установка направления сортировки по умолчанию 'asc'

const activeFilters = computed(() => {
  const active = {};
  Object.keys(columnFilters.value).forEach(key => {
    active[key] = columnFilters.value[key] && columnFilters.value[key].trim().length > 0;
  });
  return active;
});

// New computed property: Sorts the rows and then applies column filters
const sortedAndFilteredRows = computed(() => {
  let processedRows = [...rows.value];

  // 1. Apply Sorting
  if (sortKey.value) {
    processedRows.sort((a, b) => {
      const aValue = a[sortKey.value];
      const bValue = b[sortKey.value];
      let comparison = 0;

      if (aValue > bValue) {
        comparison = 1;
      } else if (aValue < bValue) {
        comparison = -1;
      }
      
      return sortDirection.value === 'desc' ? comparison * -1 : comparison;
    });
  }

  // 2. Apply Column Filters
  Object.keys(columnFilters.value).forEach(columnKey => {
    const filterValue = columnFilters.value[columnKey];
    if (filterValue && filterValue.trim()) {
      processedRows = processedRows.filter(row => {
        const cellValue = row[columnKey];
        if (cellValue == null) return false;
        return String(cellValue).toLowerCase().includes(filterValue.toLowerCase().trim());
      });
    }
  });

  return processedRows;
});

const filteredRows = computed(() => sortedAndFilteredRows.value);

const pagedRows = computed(() => {
  const start = (page.value - 1) * props.limit;
  const end = start + props.limit; // Correct calculation for slice end
  
  return filteredRows.value.slice(start, end).map((row, i) => ({
    ...row,
    // Присваиваем индекс, только если его нет в исходных данных.
    // Это предотвращает добавление ненужных индексов в таблицы,
    // где первая колонка - это данные, а не номер.
    index: row.index === undefined ? start + i + 1 : row.index,
  }));
});

const recordSummary = computed(() => {
  const start = (page.value - 1) * props.limit + 1;
  const end = Math.min(start + props.limit - 1, filteredRows.value.length);
  const total = filteredRows.value.length;
  if (total === 0) {
    return 'Показано 0 записей';
  }
  return `Показано ${start}–${end} из ${total} записей`;
});

const updateFilter = (key, value) => {
  const newFilters = { ...props.filters, [key]: value };
  emit('update:filters', newFilters);

  setTimeout(() => {
    page.value = 1;
    loadData();
  }, 100);
};

// 👇 UPDATED: This function now sets the state to open the modal
const handleRowDoubleClick = (row) => {
  // Use a shallow copy to ensure reactivity and prevent direct mutation of the table row
  const plainRow = JSON.parse(JSON.stringify(row)); 
  selectedRow.value = plainRow;
  showEditModal.value = true;
  emit('row-dblclick', plainRow); // Emit the event to the parent for flexibility
};

const closeModals = () => {
  showEditModal.value = false;
  selectedRow.value = null;
};

const toggleRowExpand = (rowId) => {
  const index = expandedRows.value.indexOf(rowId);
  if (index > -1) {
    expandedRows.value.splice(index, 1);
  } else {
    expandedRows.value.push(rowId);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await props.loadFn({
      page: 1,
      limit: 999999, // Load all data for local filtering/sorting
      filters: props.filters,
    });

    rows.value = data;
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
  } finally {
    loading.value = false;
  }
};

const setPage = (p) => {
  page.value = p;
};

const handleSave = async () => {
  closeModals();
  await loadData();
};

const refreshTable = () => {
  loadData();
};

const handleSort = (key) => {
  if (sortKey.value === key) {
    // If the same column is clicked
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc';
    } else {
      // Third click resets sorting to default (id, asc)
      sortKey.value = 'id'; 
      sortDirection.value = 'asc';
    }
  } else {
    // New column clicked
    sortKey.value = key;
    sortDirection.value = 'asc';
  }
  page.value = 1; // Reset to first page after sorting
};

defineExpose({
  refreshTable
});

const toggleFilter = (columnKey) => {
  openFilter.value = openFilter.value === columnKey ? null : columnKey;
};

const closeFilter = () => {
  openFilter.value = null;
};

const applyColumnFilter = ({ columnKey, value }) => {
  columnFilters.value[columnKey] = value;
  page.value = 1;
};

const handleClickOutside = (event) => {
  if (openFilter.value && !event.target.closest('.header-cell-container')) {
    closeFilter();
  }
};

onMounted(() => {
  loadData();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.table-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin: 24px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: calc(100vh - 100px);
  box-sizing: border-box;
}

.controls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.filters {
  display: flex;
  gap: 16px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-summary {
  font-size: 14px;
  color: #6b7280;
}
</style>