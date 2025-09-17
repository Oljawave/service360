<template>
  <div class="existing-data-block">
    <p class="warning-text">
      По данной работе в Журнал осмотров/проверок уже внесена следующая информация:
    </p>
    <div class="data-table">
      <div class="data-row header-row">
        <span class="data-cell number-cell">№</span>
        <span class="data-cell date-cell">ДАТА</span>
        <span class="data-cell coords-cell">КООРДИНАТЫ</span>
      </div>
      <div v-if="existingRecords.length === 0" class="data-row empty-row">
        <span class="data-cell" colspan="3">Нет ранее внесенных записей</span>
      </div>
      <div v-else v-for="(item, index) in existingRecords" :key="index" class="data-row">
        <span class="data-cell number-cell">{{ index + 1 }}</span>
        <span class="data-cell date-cell">{{ item.date }}</span>
        <span class="data-cell coords-cell">{{ item.coordinates }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  existingRecords: {
    type: Array,
    default: () => []
  }
});
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

.data-table {
  background-color: transparent;
  font-size: 14px;
}

.data-row {
  display: grid;
  grid-template-columns: 60px 140px 1fr;
  gap: 24px;
  padding: 8px 0;
  border-bottom: 1px solid #e8d5b7;
  align-items: center;
}

.data-row.header-row {
  font-weight: 600;
  color: #8b4513;
  border-bottom: 2px solid #d4ba8a;
  padding-bottom: 12px;
  margin-bottom: 4px;
}

.data-row:not(.header-row) {
  color: #2d3748;
}

.data-row:last-child {
  border-bottom: none;
}

.data-cell {
  padding: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.number-cell {
  text-align: left;
  font-weight: 500;
}

.date-cell {
  text-align: left;
}

.coords-cell {
  text-align: left;
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