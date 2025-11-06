<template>
  <div class="resource-edit-section">
    <div class="section-header">
      <h3 class="section-title">{{ title }}</h3>
      <!-- Кнопка "Добавить строку" для не-исполнителей -->
      <button v-if="!isPerformer" class="add-row-button" @click="addNewRow">
        <Plus :size="18" />
        Добавить строку
      </button>
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
          <!-- Существующие строки -->
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
              <!-- Наименование -->
              <td>{{ getNameLabel(row.name) }}</td>

              <!-- Не-исполнитель: Ед. изм., План, Факт (с инпутом), Действия -->
              <td v-if="!isPerformer">{{ getUnitLabel(row.unit) }}</td>
              <td v-if="!isPerformer">{{ row.plan }}</td>
              <td v-if="!isPerformer" class="fact-input-cell">
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
                  :class="['icon-button', 'save']"
                  @click.stop="saveFact(index)"
                  title="Сохранить факт"
                >
                  <Check :size="18" />
                </button>
              </td>

              <!-- Исполнитель: Количество человек (План/Факт) -->
              <td v-if="isPerformer" class="plan-fact-cell">
                <div class="plan-fact-data">
                  <span>План: {{ row.planCount }}</span>
                  <span>Факт: {{ row.factCount }}</span>
                </div>
              </td>

              <!-- Исполнитель: Время (План/Факт) -->
              <td v-if="isPerformer" class="plan-fact-cell">
                <div class="plan-fact-data">
                  <span>План: {{ row.planHours }}</span>
                  <span>Факт: {{ row.factHours }}</span>
                </div>
              </td>
            </tr>

            <!-- Раскрывающаяся секция для исполнителей -->
            <tr v-if="isPerformer && row.expanded" class="expanded-row">
              <!-- colspan="4" так как у нас 4 колонки: '', 'Наименование', 'Количество человек', 'Время' -->
              <td colspan="4" class="expanded-content">
                <div class="performers-detail">
                  <div class="performers-header">
                    <span class="performers-title">Список исполнителей (Факт):</span>
                  </div>
                  
                  <div class="performers-list">
                    <!-- Список существующих исполнителей -->
                    <div
                      v-for="(performer, pIndex) in row.performers"
                      :key="`${row.id || index}-${pIndex}`"
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
                          @update:modelValue="updateExistingPerformer(index, pIndex, 'name', $event)"
                        />
                        <AppNumberInput
                          label="Часы работы"
                          :modelValue="performer.time"
                          :min="0"
                          :max="row.planHours"
                          placeholder="0"
                          @update:modelValue="updateExistingPerformer(index, pIndex, 'time', $event)"
                        />
                        <div class="performer-actions">
                          <!-- Галочка/Кнопка сохранения -->
                          <button
                            :class="['icon-button', 'save']"
                            @click.stop="savePerformerDetails(index, pIndex)"
                            title="Сохранить"
                          >
                            <Check :size="18" />
                          </button>
                          <!-- Кнопка удаления -->
                          <button
                            :class="['icon-button', 'delete']"
                            @click.stop="deletePerformer(index, pIndex)"
                            title="Удалить исполнителя"
                          >
                            <Trash2 :size="18" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ЕДИНСТВЕННАЯ ФОРМА ДЛЯ ДОБАВЛЕНИЯ НОВОГО ИСПОЛНИТЕЛЯ (ВСЕГДА ПРИСУТСТВУЕТ ПРИ EXPANDED) -->
                  <div 
                    v-if="row.newPerformer" 
                    class="performer-item new-performer-item"
                  >
                    <!-- Иконка плюса вместо номера -->
                    <div class="performer-number is-plus">
                      <Plus :size="18" />
                    </div>
                    <div class="performer-fields">
                       <AppDropdown
                          label="ФИО исполнителя"
                          :id="`new-performer-name-${index}`"
                          v-model="row.newPerformer.name"
                          :options="performerNameOptions"
                          placeholder="Выберите исполнителя"
                        />
                        <AppNumberInput
                          label="Часы работы"
                          :modelValue="row.newPerformer.time"
                          :min="0"
                          :max="row.planHours"
                          placeholder="0"
                          @update:modelValue="row.newPerformer.time = $event"
                        />
                      <div class="performer-actions">
                        <!-- Кнопка сохранения новой записи -->
                        <button
                          :class="['icon-button', 'save']"
                          @click.stop="saveNewPerformer(index)"
                          title="Сохранить нового исполнителя"
                          :disabled="!isNewPerformerValid(row.newPerformer)"
                        >
                          <Check :size="18" />
                        </button>
                        <!-- Кнопка отмены/удаления формы добавления -->
                        <button
                          :class="['icon-button', 'delete']"
                          @click.stop="cancelNewPerformer(index)"
                          title="Очистить форму"
                        >
                          <Trash2 :size="18" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </td>
            </tr>
          </template>

          <!-- Новая строка для добавления (только для не-исполнителей) -->
          <tr v-if="newRow && !isPerformer" class="new-row">
            <td>
              <AppDropdown
                :id="`new-name`"
                v-model="newRow.name"
                :options="nameOptions"
                placeholder="Выберите наименование"
              />
            </td>
            <td>
              <AppDropdown
                :id="`new-unit`"
                v-model="newRow.unit"
                :options="unitOptions"
                placeholder="Выберите ед. изм."
              />
            </td>
            <td class="plan-empty">—</td>
            <td>
              <AppNumberInput
                :modelValue="newRow.fact"
                :min="0"
                placeholder="0"
                @update:modelValue="newRow.fact = $event"
              />
            </td>
            <td class="actions-column">
              <button
                :class="['icon-button', 'save']"
                @click.stop="saveNewRow"
                title="Сохранить"
                :disabled="!isNewRowValid"
              >
                <Check :size="18" />
              </button>
              <button
                :class="['icon-button', 'delete']"
                @click.stop="cancelNewRow"
                title="Удалить"
              >
                <Trash2 :size="18" />
              </button>
            </td>
          </tr>

          <tr v-if="existingRows.length === 0 && !newRow">
            <td :colspan="isPerformer ? 4 : 5" class="empty-state">
              Нет данных для отображения.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { Check, ChevronRight, Plus, Trash2 } from 'lucide-vue-next';
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

const emit = defineEmits(['update:rows', 'save-row', 'add-row']);

const existingRows = ref([]);
const newRow = ref(null);

/**
 * Рассчитывает фактические значения по количеству и часам
 * на основе детального списка исполнителей.
 */
const calculatePerformerFacts = (performers = []) => {
    // Факт по количеству: просто количество строк в списке исполнителей
    const factCount = performers.length;
    // Факт по часам: сумма часов работы всех исполнителей
    const factHours = performers.reduce((sum, p) => sum + (p.time || 0), 0);
    return { factCount, factHours };
};

const initializeNewPerformer = () => ({ name: null, time: 0 });

const initializeExistingRows = (rows) => {
  if (props.isPerformer) {
    return rows.map((row) => {
        // Используем ТОЛЬКО существующие детали исполнителей.
        const performers = row.performerDetails && row.performerDetails.length > 0 
            ? row.performerDetails
            : []; 

        const { factCount, factHours } = calculatePerformerFacts(performers);

        return {
            id: row.id,
            name: row.name,
            planCount: row.plan || 0, 
            planHours: row.hours || 0, 
            factCount: row.factCount || factCount,
            factHours: row.factHours || factHours,
            expanded: false,
            performers: performers,
            // Инициализируем newPerformer только при раскрытии, 
            // но в toggleRow мы будем его создавать сразу.
            newPerformer: null, 
        }
    });
  } else {
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      ...row,
      fact: row.fact || 0,
      idValue: row.idValue,
      idUser: row.idUser,
      idUpdatedAt: row.idUpdatedAt,
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
  const row = existingRows.value[index];
  row.expanded = !row.expanded;
  
  if (props.isPerformer) {
    if (row.expanded) {
      // Инициализируем форму добавления, когда строка раскрывается
      if (!row.newPerformer) {
        row.newPerformer = initializeNewPerformer();
      }
    } else {
      // Сбрасываем форму добавления при закрытии
      row.newPerformer = null;
    }
  }
};

const updateExistingRow = (index, value) => {
  existingRows.value[index].fact = value;
  emit('update:rows', [...existingRows.value]);
};

const saveFact = (index) => {
  emit('save-row', {
    index,
    row: existingRows.value[index],
    isExisting: true,
  });
};

/**
 * Обновляет поля factCount и factHours в основной строке
 * на основе текущего списка исполнителей.
 */
const updatePerformerFacts = (rowIndex) => {
    const row = existingRows.value[rowIndex];
    const { factCount, factHours } = calculatePerformerFacts(row.performers);
    row.factCount = factCount;
    row.factHours = factHours;
};

// --- Логика для существующих исполнителей ---

const updateExistingPerformer = (rowIndex, performerIndex, field, value) => {
  const row = existingRows.value[rowIndex];
  row.performers[performerIndex][field] = value;
  emit('update:rows', [...existingRows.value]);
};


// Функция для сохранения деталей существующего исполнителя 
const savePerformerDetails = (rowIndex, performerIndex) => {
  updatePerformerFacts(rowIndex); // Обновляем факт перед сохранением
  emit('save-row', {
    index: rowIndex,
    row: existingRows.value[rowIndex],
    isExisting: true,
    performerIndex, 
  });
};

// Функция для удаления исполнителя
const deletePerformer = (rowIndex, performerIndex) => {
  const row = existingRows.value[rowIndex];
  row.performers.splice(performerIndex, 1);
  
  updatePerformerFacts(rowIndex);
  emit('update:rows', [...existingRows.value]);
  // Опционально: можно вызвать save-row для сохранения изменений в базе
  // emit('save-row', { index: rowIndex, row: existingRows.value[rowIndex], isExisting: true });
};


// --- Логика для добавления нового исполнителя ---

const isNewPerformerValid = (performer) => {
    return performer && performer.name && performer.time !== null && performer.time >= 0;
};

// Сохраняет нового исполнителя
const saveNewPerformer = (rowIndex) => {
    const row = existingRows.value[rowIndex];
    if (!isNewPerformerValid(row.newPerformer)) return;

    // Добавляем нового исполнителя в список
    row.performers.push({ ...row.newPerformer });

    // Очищаем форму добавления, оставляя ее на месте
    row.newPerformer = initializeNewPerformer();
    
    updatePerformerFacts(rowIndex);
    emit('update:rows', [...existingRows.value]);

    // Опционально: можно вызвать save-row для сохранения изменений в базе
    // emit('save-row', { index: rowIndex, row: existingRows.value[rowIndex], isExisting: true });
};

// Отменяет добавление нового исполнителя (очищает форму)
const cancelNewPerformer = (rowIndex) => {
    existingRows.value[rowIndex].newPerformer = initializeNewPerformer();
};


// --- Функции для новой строки (для не-исполнителей) ---
const addNewRow = () => {
  if (!newRow.value) {
    newRow.value = {
      name: null,
      unit: null,
      fact: 0,
    };
  }
};

const isNewRowValid = computed(() => {
  return newRow.value && newRow.value.name && newRow.value.unit;
});

const saveNewRow = () => {
  if (!isNewRowValid.value) return;

  emit('add-row', {
    name: newRow.value.name,
    unit: newRow.value.unit,
    fact: newRow.value.fact || 0,
  });

  newRow.value = null;
};

const cancelNewRow = () => {
  newRow.value = null;
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

.add-row-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #eff6ff; /* Light blue background */
  color: #3b82f6; /* Blue text and icon */
  border: 1px solid #3b82f6; /* Blue border */
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-row-button:hover:not(:disabled) {
  background: #dbeafe; /* Slightly darker blue on hover */
  border-color: #2563eb;
}

.add-row-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.add-row-button.small {
  padding: 8px 12px;
  font-size: 13px;
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

.plan-empty {
  text-align: center;
  color: #94a3b8;
}

/* Колонки */
.resource-table .expand-column {
  width: 5%;
  text-align: center;
}

.resource-table .name-column {
  width: 35%; 
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

/* Ячейки для исполнителей с план/факт */
.plan-fact-cell {
  vertical-align: top;
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}

.plan-fact-data {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}

.plan-fact-data span:first-child {
  color: #475569; /* Цвет для плана */
}

.plan-fact-data span:last-child {
  font-weight: 600;
  color: #1e293b; /* Цвет для факта */
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

/* Сбрасываем лишний padding для ячейки с раскрытым контентом */
.expanded-row td[colspan="4"] {
  padding: 0 !important; 
}

.expanded-content {
  padding: 16px !important;
}

.performers-detail {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
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
  margin-bottom: 16px; /* Отступ перед формой добавления */
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

.new-performer-item {
  /* Убираем синий пунктир и делаем фон белым */
  background: #fff;
  border: 1px solid #e2e8f0; 
  /* Добавляем небольшой отступ сверху, если нет существующих строк */
  margin-top: 16px;
}

.performer-number {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  min-width: 24px;
  padding-top: 8px;
}

.performer-number.is-plus {
    color: #3b82f6; /* Синий цвет для иконки плюса */
}

.performer-fields {
  flex: 1;
  display: grid;
  grid-template-columns: 3fr 2fr 100px; /* ФИО, Часы, Действия */
  gap: 16px;
  align-items: start;
}

.performer-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 8px; /* Выравнивание с инпутами */
}

/* Удаляем контейнер для кнопки "Добавить строку", т.к. форма теперь всегда есть */
/* .add-performer-row {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed #e2e8f0;
    text-align: right;
} */


/* Кнопки действий */
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
  margin-left: 4px;
}

.icon-button.save {
  background: #f3f4f6;
  color: #6b7280;
}

.icon-button.save:hover:not(:disabled) {
  background: #3b82f6;
  color: white;
}

.icon-button.save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-button.delete {
  background: #fef2f2;
  color: #dc2626;
}

.icon-button.delete:hover {
  background: #dc2626;
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
  .performer-actions {
      justify-content: flex-start;
  }
}
</style>
