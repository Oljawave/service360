<template>
  <div class="status-header">
    <div>
      <h2 class="railway-title">{{ title }}</h2>
      <p class="railway-subtitle">Средний балл {{ averageScore }}</p>
    </div>
    <div class="status-legend">
      <RailwayLegendItem
        color="#10b981"
        :text="`${statusStats.excellent} км  Отлично ≤ 25`"
        :is-active="selectedLegends.includes('excellent')"
        :is-inactive="selectedLegends.length > 0 && !selectedLegends.includes('excellent')"
        @click="emit('toggleLegend', 'excellent')"
      />
      <RailwayLegendItem
        color="#84cc16"
        :text="`${statusStats.good} км  Хорошо ≤ 80`"
        :is-active="selectedLegends.includes('good')"
        :is-inactive="selectedLegends.length > 0 && !selectedLegends.includes('good')"
        @click="emit('toggleLegend', 'good')"
      />
      <RailwayLegendItem
        color="#f97316"
        :text="`${statusStats.satisfactory} км  Удовл. ≤ 180`"
        :is-active="selectedLegends.includes('satisfactory')"
        :is-inactive="selectedLegends.length > 0 && !selectedLegends.includes('satisfactory')"
        @click="emit('toggleLegend', 'satisfactory')"
      />
      <RailwayLegendItem
        color="#ef4444"
        :text="`${statusStats.poor} км  Неудовл. > 180`"
        :is-active="selectedLegends.includes('poor')"
        :is-inactive="selectedLegends.length > 0 && !selectedLegends.includes('poor')"
        @click="emit('toggleLegend', 'poor')"
      />
    </div>
  </div>
</template>

<script setup>
import RailwayLegendItem from './RailwayLegendItem.vue';

defineProps({
  title: String,
  averageScore: Number,
  statusStats: Object,
  selectedLegends: Array
});

const emit = defineEmits(['toggleLegend']);
</script>

<style scoped>
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 24px;
}

.railway-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 4px;
}

.railway-subtitle {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.status-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
</style>
