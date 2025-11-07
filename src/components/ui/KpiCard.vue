<template>
  <div class="kpi-card" :class="variant">
    <span class="kpi-value">{{ value }}</span>
    <span class="kpi-label">{{ label }}</span>
  </div>
</template>

<script setup>
defineProps({
  value: {
    type: [String, Number],
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: '',
  },
});
</script>

<style scoped>
.kpi-card { 
  background: white; 
  border-radius: 8px; 
  padding: 24px; 
  display: flex; 
  flex-direction: column; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.04); 
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 2px solid transparent;
}
.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.08);
}
.kpi-value { font-size: 36px; font-weight: 500; color: #2b6cb0; }
.kpi-label { font-size: 14px; color: #718096; margin-top: 8px; }
.kpi-card.overdue .kpi-value { color: #c53030; }
.kpi-card.active-kpi {
  border-color: #3b82f6; /* Цвет рамки как у ResourceCard.vue */
  background: #eff6ff; /* Цвет фона как у ResourceCard.vue */
}
</style>