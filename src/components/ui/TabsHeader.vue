<template>
  <div class="tabs-header">
    <button
      v-for="tab in tabs"
      :key="tab.name"
      class="tab"
      :class="{ 'active': tab.name === modelValue }"
      @click="selectTab(tab.name)"
    >
      <UiIcon :name="tab.icon" />
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import UiIcon from './UiIcon.vue';

const props = defineProps({
  tabs: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const selectTab = (tabName) => {
  emit('update:modelValue', tabName);
};
</script>

<style scoped>
.tabs-header {
  display: grid;
  /* Создаем до 3-х колонок, каждая занимает равное пространство */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  justify-items: center; /* Центрируем содержимое (кнопки) внутри ячеек грида */
  gap: 8px; /* Добавляем небольшой отступ между вкладками */
  border-bottom: 1px solid #e0e6ed;
  margin-bottom: 16px;
}

.tab {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #718096;
  background-color: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab:hover {
  color: #2d3748;
}

.tab.active {
  color: #3182ce;
  border-bottom-color: #3182ce;
}

.tab .icon {
  margin-right: 8px;
}
</style>
