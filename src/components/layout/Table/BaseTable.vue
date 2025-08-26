<template>
  <div class="table-container">
    <table class="styled-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" class="header-cell-container">
            <div class="header-cell">
              <span>{{ col.label }}</span>
              <!-- Показываем кнопку фильтра ТОЛЬКО если showFilters === true -->
              <button 
                v-if="showFilters"
                @click.stop="$emit('toggle-filter', col.key)" 
                :class="['filter-button', { active: activeFilters[col.key] }]"
                title="Фильтр"
              >
                <UiIcon name="Funnel" class="icon-muted" />
              </button>
            </div>
            <slot
              name="filter"
              :column="col"
            />
          </th>
        </tr>
      </thead>
      <tbody>
        <TableRow
          v-for="row in rows"
          :key="row.id || row.index"
          :row="row"
          :columns="columns"
          :expandedRows="expandedRows"
          :toggleRowExpand="toggleRowExpand"
          :childrenMap="childrenMap"
          @dblclick="$emit('row-dblclick', $event)"
        />
        <tr v-if="!rows.length && !loading">
          <td :colspan="columns.length" class="empty">Нет данных</td>
        </tr>
        <tr v-if="loading">
          <td :colspan="columns.length" class="loading">Загрузка...</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import TableRow from './TableRow.vue'
import UiIcon from '@/components/ui/UiIcon.vue'

const props = defineProps({
  columns: Array,
  rows: Array,
  loading: Boolean,
  expandedRows: Array,
  toggleRowExpand: Function,
  childrenMap: Object,
  activeFilters: Object,
  showFilters: { // 👈 новый пропс
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['row-dblclick', 'toggle-filter'])
</script>


<style scoped>
.table-container {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 70vh;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.styled-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #2d3748;
  min-width: 1200px;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #edf2f7;
}

.header-cell-container {
  position: sticky;
  top: 0;
  background: #f9fafb;
  font-size: 13px;
  color: #718096;
  font-weight: 500;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  text-transform: uppercase;
  z-index: 20;
}

.header-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.filter-button:hover {
  background-color: #edf2f7;
}

.filter-button.active {
  background-color: #3182ce;
}

.filter-button.active .icon-muted {
  color: white;
}

.icon-muted {
  color: #a0aec0;
  width: 16px;
  height: 16px;
  transition: color 0.2s;
}

.empty, .loading {
  text-align: center;
  padding: 20px 0;
  color: #718096;
}
</style>
