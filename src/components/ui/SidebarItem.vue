<template>
  <router-link :to="to" class="sidebar-item" :class="{ active: isActive, 'is-collapsed': isCollapsed }">
    <UiIcon :name="icon" class="icon" />
    <span class="label">{{ label }}</span>
  </router-link>
</template>

<script setup>
import UiIcon from '../ui/UiIcon.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  label: String,
  to: String,
  icon: String,
  isCollapsed: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()

const isActive = computed(() => {
  return route.path.startsWith(props.to)
})
</script>

<style scoped>
.sidebar-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #4a5568;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
  font-size: 14px;
}

.sidebar-item .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #4a5568;
  transition: color 0.2s;
  margin-right: 16px;
}

.sidebar-item.is-collapsed .icon {
  margin-right: 0;
}

.sidebar-item.is-collapsed .label {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background-color: #ffffff;
  color: #2d3748;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  white-space: nowrap;
  margin-left: 12px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.sidebar-item:hover {
  background: #edf2f7;
  color: #2b6cb0;
}

.sidebar-item.is-collapsed:hover .label {
  opacity: 1;
}

.active {
  background: #e6f0fb;
  color: #2b6cb0;
  font-weight: 500;
}

.active .icon {
  color: #2b6cb0;
}
</style>