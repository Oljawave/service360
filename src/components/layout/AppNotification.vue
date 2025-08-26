<template>
  <transition name="fade">
    <div class="notification" :class="type" v-if="visible">
      <span>{{ message }}</span>
      <button @click="visible = false">✕</button>
    </div>
  </transition>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '@/stores/notificationStore'

const store = useNotificationStore()
const { message, type, visible } = storeToRefs(store) 
</script>


<style scoped>
.notification {
  position: fixed;
  right: 20px;
  bottom: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  background-color: #38a169;
}

.notification.error {
  background-color: #e53e3e;
}

button {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
