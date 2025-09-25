<template>
  <tr class="data-row" @dblclick="$emit('dblclick', row)">
    <td v-for="(col, i) in columns" :key="col.key" class="cell">
      <template v-if="col.component">
        <component :is="col.component" v-bind="row[col.key]" /> 
      </template>
      <template v-else-if="i === 0">
        <span class="index-icon-wrap">
          <span class="row-index">{{ fullIndex }}</span>
          <span
            v-if="hasChildren"
            @click.stop="toggleExpand"
            class="expand-icon"
          >
            <UiIcon :name="isExpanded ? 'ChevronDown' : 'ChevronRight'" />
          </span>
        </span>
        <span class="cell-content">{{ row[col.key] }}</span>
      </template>
      <template v-else>
        {{ row[col.key] }}
      </template>
    </td>
  </tr>

  <template v-if="isExpanded && hasChildren">
    <TableRow
      v-for="(child, i) in children"
      :key="child.id"
      :row="child"
      :columns="columns"
      :childrenMap="childrenMap"
      :expandedRows="expandedRows"
      :toggleRowExpand="toggleRowExpand"
      :parentIndex="`${fullIndex}.${i + 1}`"
      @dblclick="$emit('dblclick', $event)"
    />
  </template>
</template>

<script setup>
import { computed } from 'vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import TableRow from './TableRow.vue';

const props = defineProps({
  row: Object,
  columns: Array,
  expandedRows: Array,
  toggleRowExpand: Function,
  childrenMap: Object,
  parentIndex: {
    type: String,
    default: '',
  },
});

const children = computed(() => props.childrenMap?.[props.row.id] || []);
const hasChildren = computed(() => children.value.length > 0);
const isExpanded = computed(() => props.expandedRows.includes(props.row.id));

const emits = defineEmits(['dblclick']);

const toggleExpand = () => {
  props.toggleRowExpand(props.row.id);
};

const fullIndex = computed(() => {
  if (props.parentIndex) return props.parentIndex;
  return props.row._rowNumber?.toString() || '';
});
</script>

<style scoped>
/* Ваши стили, без изменений */
.index-icon-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cell-content {
  margin-left: 8px;
}

.data-row {
  transition: background 0.2s;
  cursor: pointer;
}
.data-row:hover {
  background-color: #f9fafb;
}
.cell {
  padding: 14px 16px;
  font-size: 14px;
  color: #1a202c;
  vertical-align: middle;
}
.index-icon-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.row-index {
  font-weight: 500;
}
.expand-icon {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
</style>