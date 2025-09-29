<template>
  <component :is="iconComponent" class="icon" :style="{ color: props.color }" />
</template>

<script setup>
import * as icons from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  name: String,
  color: {
    type: String,
    default: '#4a5568' // Цвет по умолчанию
  }
})

// Пробуем найти иконку по имени, если не находим, используем AlertCircle (как запасной вариант)
const iconComponent = computed(() => icons[props.name] || icons['AlertCircle'])
</script>

<style scoped>
.icon {
  width: 20px;
  height: 20px;
  margin-right: 0.5rem;
  /* Цвет теперь устанавливается через props (inline style) для динамичности */
  /* Но можно задать основные стили тут */
  flex-shrink: 0; /* Важно, чтобы иконка не сжималась */
}
</style>