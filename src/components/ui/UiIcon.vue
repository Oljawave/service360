<template>
  <component :is="iconComponent" class="icon" />
</template>

<script setup>
import * as icons from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({ name: String })

const iconComponent = computed(() => icons[props.name] || icons['AlertCircle'])
</script>

<style scoped>
.icon {
  width: 20px;
  height: 20px;
  margin-right: 0.5rem;
  flex-shrink: 0;
  color: #4a5568; /* Цвет по умолчанию теперь в CSS */
}
</style>