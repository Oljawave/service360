<template>
  <div class="resource-edit-section">
    <div class="section-header">
      <h3 class="section-title">{{ title }}</h3>
    </div>

    <div class="table-wrapper">
      <table class="resource-table">
        <thead>
          <tr>
            <th v-if="isPerformer" class="expand-column"></th>
            <th class="name-column">Наименование</th>
            <th v-if="!isPerformer" class="unit-column">Ед. измерения</th>
            <th v-if="isPerformer" class="count-column">Количество человек</th>
            <th v-if="isPerformer" class="time-column">Время</th>
            <th v-if="!isPerformer" class="plan-column">План</th>
            <th v-if="!isPerformer" class="fact-column">Факт</th>
            <th v-if="!isPerformer" class="actions-column"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, index) in existingRows" :key="row.id || index">
            <tr class="existing-row">
              <td v-if="isPerformer" class="expand-column">
                <button
                  class="expand-button"
                  @click="toggleRow(index)"
                  :title="row.expanded ? 'Свернуть' : 'Развернуть'"
                >
                  <ChevronRight :size="18" :class="{ rotated: row.expanded }" />
                </button>
              </td>
              <td>{{ getNameLabel(row.name) }}</td>
              <td v-if="!isPerformer">{{ getUnitLabel(row.unit) }}</td>
              <td v-if="isPerformer">{{ row.count }}</td>
              <td v-if="isPerformer">{{ row.hours }}</td>
              <td v-if="!isPerformer">{{ row.plan }}</td>
              <td v-if="!isPerformer">
                <AppNumberInput
                  :modelValue="row.fact"
                  :min="0"
                  placeholder="0"
                  @update:modelValue="updateExistingRow(index, $event)"
                  @click.stop
                  @mousedown.stop
                />
              </td>
              <td v-if="!isPerformer" class="actions-column">
                <button
                  :class="['icon-button', 'copy', { active: row.factMatchesPlan }]"
                  @click.stop="copyPlanToFact(index)"
                  title="Скопировать план в факт"
                >
                  <Check :size="18" />
                </button>
              </td>
            </tr>

            <!-- Раскрывающаяся секция для исполнителей -->
            <tr v-if="isPerformer && row.expanded" class="expanded-row">
              <td colspan="5" class="expanded-content">
                <div class="performers-detail">
                  <div class="performers-header">
                    <span class="performers-title">Список исполнителей:</span>
                  </div>
                  <div class="performers-list">
                    <div
                      v-for="(performer, pIndex) in row.performers"
                      :key="pIndex"
                      class="performer-item"
                    >
                      <div class="performer-number">{{ pIndex + 1 }}.</div>
                      <div class="performer-fields">
                        <AppDropdown
                          label="ФИО исполнителя"
                          :id="`performer-name-${index}-${pIndex}`"
                          v-model="performer.name"
                          :options="performerNameOptions"
                          placeholder="Выберите исполнителя"
                          @update:modelValue="updatePerformer(index, pIndex, 'name', $event)"
                        />
                        <AppNumberInput
                          label="Время (часы)"
                          :modelValue="performer.time"
                          :min="0"
                          :max="row.hours"
                          placeholder="0"
                          @update:modelValue="updatePerformer(index, pIndex, 'time', $event)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <tr v-if="existingRows.length === 0">
            <td :colspan="isPerformer ? 5 : 5" class="empty-state">
              Нет данных для отображения.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Check, ChevronRight } from 'lucide-vue-next';
import AppNumberInput from '@/components/ui/FormControls/AppNumberInput.vue';
import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue';

const props = defineProps({
  title: { type: String, required: true },
  rows: { type: Array, default: () => [] },
  nameOptions: { type: Array, default: () => [] },
  unitOptions: { type: Array, default: () => [] },
  isPerformer: { type: Boolean, default: false },
  performerNameOptions: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:rows', 'save-row']);

const existingRows = ref([]);

const initializeExistingRows = (rows) => {
  if (props.isPerformer) {
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      count: row.count || 0,
      hours: row.hours || 0,
      expanded: false,
      performers: Array.from({ length: row.count || 0 }, (_, i) => ({
        name: row.performerDetails?.[i]?.name || null,
        time: row.performerDetails?.[i]?.time || 0,
      })),
    }));
  } else {
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      unit: row.unit,
      plan: row.quantity !== undefined ? row.quantity : row.plan || 0,
      fact: row.fact || 0,
      factMatchesPlan: row.fact === (row.quantity ?? row.plan ?? 0),
    }));
  }
};

existingRows.value = initializeExistingRows(props.rows);

watch(
  () => props.rows,
  (newRows) => {
    existingRows.value = initializeExistingRows(newRows);
  },
  { deep: true }
);

const getNameLabel = (value) => {
  const option = props.nameOptions.find((opt) => opt.value === value);
  return option ? option.label : value;
};

const getUnitLabel = (value) => {
  const option = props.unitOptions.find((opt) => opt.value === value);
  return option ? option.label : value;
};

const toggleRow = (index) => {
  existingRows.value[index].expanded = !existingRows.value[index].expanded;
};

const updateExistingRow = (index, value) => {
  existingRows.value[index].fact = value;
  existingRows.value[index].factMatchesPlan =
    existingRows.value[index].fact === existingRows.value[index].plan;

  emit('update:rows', [...existingRows.value]);

  emit('save-row', {
    index,
    row: existingRows.value[index],
    isExisting: true,
  });
};

const copyPlanToFact = (index) => {
  existingRows.value[index].fact = existingRows.value[index].plan;
  existingRows.value[index].factMatchesPlan = true;

  emit('update:rows', [...existingRows.value]);
  emit('save-row', {
    index,
    row: existingRows.value[index],
    isExisting: true,
  });
};

const updatePerformer = (rowIndex, performerIndex, field, value) => {
  existingRows.value[rowIndex].performers[performerIndex][field] = value;

  emit('update:rows', [...existingRows.value]);
  emit('save-row', {
    index: rowIndex,
    row: existingRows.value[rowIndex],
    isExisting: true,
  });
};
</script>

<style scoped>
.resource-edit-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.resource-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  table-layout: fixed;
}

.resource-table thead {
  background: #f9fafb;
}

.resource-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
}

.resource-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.resource-table tbody tr:last-child td {
  border-bottom: none;
}

.existing-row {
  background: #ffffff;
}

.existing-row:hover {
  background: #f9fafb;
}

.resource-table tbody tr:hover {
  background: #f9fafb;
}

/* Колонки */
.resource-table .expand-column {
  width: 5%;
  text-align: center;
}

.resource-table .name-column {
  width: 40%;
}

.resource-table .unit-column {
  width: 15%;
}

.resource-table .count-column {
  width: 20%;
}

.resource-table .time-column {
  width: 20%;
}

.resource-table .plan-column,
.resource-table .fact-column {
  width: 15%;
}

.resource-table .actions-column {
  width: 10%;
  text-align: right;
}

/* Кнопка раскрытия */
.expand-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  color: #64748b;
}

.expand-button:hover {
  background: #f1f5f9;
}

.expand-button svg {
  transition: transform 0.2s;
}

.expand-button svg.rotated {
  transform: rotate(90deg);
}

/* Раскрывающаяся секция */
.expanded-row {
  background: #f8fafc;
}

.expanded-row:hover {
  background: #f8fafc;
}

.expanded-content {
  padding: 16px !important;
}

.performers-detail {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.performers-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.performers-title {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.performers-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.performer-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.performer-number {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  min-width: 24px;
  padding-top: 8px;
}

.performer-fields {
  flex: 1;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  align-items: start;
}

/* ИСПРАВЛЕНО ВЫРАВНИВАНИЕ */
td.actions-column {
  text-align: right;
  vertical-align: middle;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  vertical-align: middle;
}

.icon-button.copy {
  background: #f3f4f6;
  color: #6b7280;
}

.icon-button.copy:hover {
  background: #3b82f6;
  color: white;
}

.icon-button.copy.active {
  background: #3b82f6;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 40px 16px !important;
  color: #94a3b8;
  font-size: 14px;
}

.resource-table :deep(label) {
  display: none;
}

.resource-table :deep(.form-group) {
  margin: 0;
}

.performer-fields :deep(label) {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
  font-weight: 500;
}

.performer-fields :deep(.form-group) {
  margin: 0;
}

@media (max-width: 768px) {
  .resource-edit-section {
    padding: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .resource-table {
    font-size: 13px;
    table-layout: auto;
  }

  .resource-table th,
  .resource-table td {
    padding: 8px 12px;
  }

  .resource-table .name-column,
  .resource-table .unit-column,
  .resource-table .plan-column,
  .resource-table .fact-column,
  .resource-table .actions-column,
  .resource-table .expand-column,
  .resource-table .count-column,
  .resource-table .time-column {
    width: auto;
  }

  .performer-fields {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>