<template>
  <div class="existing-data-block">
    <p class="warning-text">
      {{ getWarningText() }}
    </p>
    <div class="data-table-scroll">
      <div class="data-table">
        <div class="data-row header-row" :class="getHeaderClass()">
          <span class="data-cell number-cell">№</span>

          <template v-if="dataType === 'planning'">
            <span class="data-cell task-cell">ЗАДАЧА</span> 
            <span class="data-cell volume-plan-cell">ОБЪЕМ</span>
            <span class="data-cell start-date-plan-cell">НАЧАЛО</span>
            <span class="data-cell end-date-plan-cell">КОНЕЦ</span>
          </template>
          
          <template v-else-if="dataType === 'materials'">
            <span class="data-cell material-cell">МАТЕРИАЛ</span>
            <span class="data-cell unit-cell">ЕД. ИЗМ.</span>
            <span class="data-cell volume-material-cell">ОБЪЕМ</span>
          </template>

          <template v-else-if="dataType === 'externalServices'">
            <span class="data-cell service-cell">СЕРВИС</span>
            <span class="data-cell volume-service-cell">ОБЪЕМ</span>
          </template>

          <template v-else>
            <span class="data-cell date-cell">ДАТА</span>
            <span class="data-cell coords-cell">КООРДИНАТЫ</span>
          </template>

          <span v-if="dataType === 'defects'" class="data-cell defect-cell">ДЕФЕКТ</span>
          <span v-if="dataType === 'parameters'" class="data-cell component-cell">КОМПОНЕНТ</span>
          <span v-if="dataType === 'parameters'" class="data-cell parameter-cell">ПАРАМЕТР</span>
          <span v-if="dataType === 'parameters'" class="data-cell value-cell">ЗНАЧЕНИЕ</span>
        </div>
        <div v-if="existingRecords.length === 0" class="data-row empty-row">
        </div>
        <div v-else v-for="(item, index) in sortedRecords" :key="item.id || index" class="data-row">
          <span class="data-cell number-cell">{{ index + 1 }}</span>

          <template v-if="dataType === 'planning'">
            <span class="data-cell task-cell">{{ item.task || '—' }}</span>
            <span class="data-cell volume-plan-cell">{{ item.volumePlan || '—' }}</span>
            <span class="data-cell start-date-plan-cell">{{ item.startDatePlan || '—' }}</span>
            <span class="data-cell end-date-plan-cell">{{ item.endDatePlan || '—' }}</span>
          </template>

          <template v-else-if="dataType === 'materials'">
            <span class="data-cell material-cell">{{ item.material || '—' }}</span>
            <span class="data-cell unit-cell">{{ item.unit || '—' }}</span>
            <span class="data-cell volume-material-cell">{{ item.volume || '—' }}</span>
          </template>

          <template v-else-if="dataType === 'externalServices'">
            <span class="data-cell service-cell">{{ item.service || '—' }}</span>
            <span class="data-cell volume-service-cell">{{ item.volume || '—' }}</span>
          </template>

          <template v-else>
            <span class="data-cell date-cell">{{ item.date }}</span>
            <span class="data-cell coords-cell">{{ item.coordinates }}</span>
          </template>

          <span v-if="dataType === 'defects'" class="data-cell defect-cell">{{ item.defect }}</span>
          <span v-if="dataType === 'parameters'" class="data-cell component-cell">{{ item.component }}</span>
          <span v-if="dataType === 'parameters'" class="data-cell parameter-cell">{{ item.parameter }}</span>
          <span v-if="dataType === 'parameters'" class="data-cell value-cell">{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  existingRecords: {
    type: Array,
    default: () => []
  },
  dataType: {
    type: String,
    default: 'info', 
    validator: (value) => ['info', 'defects', 'parameters', 'planning', 'materials', 'externalServices'].includes(value)
  }
});

const sortedRecords = computed(() => {
  return [...props.existingRecords].sort((a, b) => {
    const idA = a.id || 0;
    const idB = b.id || 0;
    return idA - idB;
  });
});

const getWarningText = () => {
  switch (props.dataType) {
    case 'defects':
      return 'Внесенные дефекты';
    case 'parameters':
      return 'Внесенные параметры';
    case 'planning':
      return 'Внесенные плановые записи';
    case 'materials':
      return 'Внесенные плановые материалы';
    case 'externalServices':
      return 'Внесенные услуги сторонних организаций';
    default:
      return 'Внесенные осмотры/проверки';
  }
};

const getHeaderClass = () => {
  switch (props.dataType) {
    case 'defects':
      return 'defects-header';
    case 'parameters':
      return 'parameters-header';
    case 'planning':
      return 'planning-header';
    case 'materials':
      return 'materials-header';
    case 'externalServices':
      return 'external-services-header';
    default:
      return '';
  } 
};

const getColspan = () => {
  switch (props.dataType) {
    case 'defects':
      return 4; 
    case 'parameters':
      return 6;
    case 'planning':
      return 5;
    case 'materials':
      return 4;
    case 'externalServices':
      return 3;
    default:
      return 3;
  }
};
</script>

<style scoped>
.existing-data-block {
  background-color: #fff8e1;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid #f5d05f;
}

.warning-text {
  font-size: 14px;
  color: #8b4513;
  margin-bottom: 16px;
  font-weight: 500;
}

.data-table-scroll {
  max-height: 200px;
  overflow-y: auto;
  overflow-x: auto;
}

.data-table {
  background-color: transparent;
  font-size: 14px;
  min-width: fit-content;
}

.data-row {
  display: grid;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid #e8d5b7;
  align-items: center;
  min-width: fit-content;
}


/* --- СТИЛИ ДЛЯ ЗАГОЛОВКОВ (HEADER ROW STYLES) --- */
/* INFO Header (Default) - Для заголовка без специального класса */
.data-row.header-row:not(.defects-header):not(.parameters-header):not(.planning-header):not(.materials-header):not(.external-services-header) {
  grid-template-columns: 60px 140px 200px; /* № | ДАТА | КООРДИНАТЫ */
}

/* DEFECTS Header */
.data-row.defects-header {
  grid-template-columns: 60px 140px 200px 200px;
}

/* PARAMETERS Header */
.data-row.parameters-header {
  grid-template-columns: 60px 140px 200px 150px 150px 100px;
}

/* PLANNING Header */
.data-row.planning-header {
  grid-template-columns: 60px 205px 80px 110px 110px; /* № | ЗАДАЧА | Объем | Начало | Конец */
}

/* MATERIALS Header */
.data-row.materials-header {
  grid-template-columns: 60px 250px 150px 100px; /* № | МАТЕРИАЛ | ЕД. ИЗМ. | ОБЪЕМ */
}

/* EXTERNAL SERVICES Header */
.data-row.external-services-header {
  grid-template-columns: 60px 300px 100px; /* № | СЕРВИС | ОБЪЕМ */
}

/* --- ОБЩИЕ СТИЛИ ЗАГОЛОВКОВ --- */
.data-row.header-row {
  position: sticky;
  top: 0;
  background-color: #fff8e1;
  z-index: 10;
  font-weight: 600;
  color: #8b4513;
  border-bottom: 2px solid #d4ba8a;
  padding-bottom: 12px;
  margin-bottom: 4px;
}

/* --- СТИЛИ ДЛЯ СТРОК ДАННЫХ (DATA ROW STYLES) --- */

/* INFO Data Row - Определяется наличием date-cell, но отсутствием специфичных ячеек */
.data-row:not(.header-row):not(.empty-row):has(.date-cell):not(:has(.defect-cell)):not(:has(.component-cell)) {
    grid-template-columns: 60px 140px 200px; /* № | ДАТА | КООРДИНАТЫ */
}

/* DEFECTS Data Row */
.data-row:not(.header-row):not(.empty-row):has(.defect-cell) {
  /* Важно: эти строки содержат и date-cell, и defect-cell, но этот селектор более специфичен */
  grid-template-columns: 60px 140px 200px 200px;
  
  /* Отображаем скрытые ячейки для этого типа */
  .date-cell, .coords-cell, .defect-cell { display: block; }
}

/* PARAMETERS Data Row */
.data-row:not(.header-row):not(.empty-row):has(.component-cell) {
  /* Важно: эти строки содержат и date-cell, и component-cell, но этот селектор более специфичен */
  grid-template-columns: 60px 140px 200px 150px 150px 100px;

  /* Отображаем скрытые ячейки для этого типа */
  .date-cell, .coords-cell, .component-cell, .parameter-cell, .value-cell { display: block; }
}

/* PLANNING Data Row */
.data-row:not(.header-row):not(.empty-row):has(.task-cell) {
  grid-template-columns: 40px 230px 80px 110px 110px; /* № | ЗАДАЧА | Объем | Начало | Конец */

  /* Отображаем скрытые ячейки для этого типа */
  .task-cell, .volume-plan-cell, .start-date-plan-cell, .end-date-plan-cell { display: block; }
}

/* MATERIALS Data Row */
.data-row:not(.header-row):not(.empty-row):has(.material-cell) {
  grid-template-columns: 60px 250px 150px 100px; /* № | МАТЕРИАЛ | ЕД. ИЗМ. | ОБЪЕМ */

  /* Отображаем скрытые ячейки для этого типа */
  .material-cell, .unit-cell, .volume-material-cell { display: block; }
}

/* EXTERNAL SERVICES Data Row */
.data-row:not(.header-row):not(.empty-row):has(.service-cell) {
  grid-template-columns: 60px 300px 100px; /* № | СЕРВИС | ОБЪЕМ */

  /* Отображаем скрытые ячейки для этого типа */
  .service-cell, .volume-service-cell { display: block; }
}

/* --- ОБЩИЕ СТИЛИ ЯЧЕЕК --- */
.data-row:not(.header-row) {
  color: #2d3748;
}

.data-row:last-child {
  border-bottom: none;
}

.data-cell {
  padding: 0;
  white-space: normal;
  overflow: hidden;
  word-wrap: break-word;
  line-height: 1.3;
}

.number-cell {
  text-align: left;
  font-weight: 500;
}

.empty-row {
  grid-template-columns: 1fr;
  text-align: center;
  color: #8b4513;
  font-style: italic;
  padding: 16px 0;
}

.empty-row .data-cell {
  text-align: center;
}
</style>