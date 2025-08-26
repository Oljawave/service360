<template>
  <NaiveProvider>
    <div v-if="!isLoginPage" class="app-layout">
      <Sidebar />
      <div class="main-content">
        <Navbar />
        <router-view />
        <AppNotification />
      </div>
    </div>

    <div v-else class="login-layout">
      <router-view />
    </div>
  </NaiveProvider>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/layout/Sidebar.vue'
import Navbar from './components/layout/Navbar.vue'
import NaiveProvider from './naive.config.js'
import AppNotification from './components/layout/AppNotification.vue'

const route = useRoute()
const isLoginPage = computed(() => route.path === '/login')
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden; 
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; 
}

.login-layout {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
  overflow: hidden;
}
</style>
