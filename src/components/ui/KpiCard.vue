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
.kpi-card { background: white; border-radius: 8px; padding: 24px; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.kpi-value { font-size: 36px; font-weight: 500; color: #2b6cb0; }
.kpi-label { font-size: 14px; color: #718096; margin-top: 8px; }
.kpi-card.overdue .kpi-value { color: #c53030; }
</style>