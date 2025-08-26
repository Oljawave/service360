<template>
  <div class="actions">
    <button
      v-for="(action, index) in actions"
      :key="index"
      class="action-btn"
      @click="action.onClick"
    >
      <UiIcon :name="action.icon" />
      {{ action.label }}
    </button>
  </div>
</template>

<script setup>
import UiIcon from '@/components/ui/UiIcon.vue'

const props = defineProps({
  actions: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: -12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 14px;
  color: #1a202c;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #edf2f7;
}
</style>
