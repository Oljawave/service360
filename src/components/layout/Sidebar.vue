<template>
  <aside :class="['sidebar', { collapsed: sidebar.collapsed }]">
    <div class="logo-section">
      <img v-if="!sidebar.collapsed" src="@/assets/img/logo.png" alt="Service 360" class="logo-img" />
      <button class="panel-btn" @click="sidebar.toggle">
        <UiIcon :name="sidebar.collapsed ? 'PanelLeftOpen' : 'PanelLeft'" class="icon" />
      </button>
    </div>

    <nav class="nav-links">
      <SidebarItem
        v-for="item in items"
        :key="item.path"
        :icon="item.icon"
        :label="item.label"
        :to="item.path"
        :is-collapsed="sidebar.collapsed"
      />
    </nav>
  </aside>
</template>

<script setup>
import SidebarItem from '../ui/SidebarItem.vue'
import UiIcon from '../ui/UiIcon.vue'
import { onMounted, onBeforeUnmount } from 'vue'
import { useSidebarStore } from '@/stores/sidebar'

const sidebar = useSidebarStore()

const handleResize = () => {
  sidebar.setCollapsed(window.innerWidth < 768)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

const items = [
  // { label: 'Главная', path: '/', icon: 'Home' },
  { label: 'План работ', path: '/work-plan', icon: 'ClipboardList' },
  { label: 'Журнал осмотров и проверок', path: '/inspections', icon: 'BookOpen' },
  { label: 'Журнал параметров', path: '/parameters', icon: 'Ruler' },
  { label: 'Журнал неисправностей', path: '/defects', icon: 'AlertTriangle' },
  { label: 'Журнал событий и запросов на работы', path: '/incidents', icon: 'Cog' },
  { label: 'Обслуживаемые объекты', path: '/objects', icon: 'Folder' },
  { label: 'Организационная структура', path: '/organization', icon: 'FolderTree' },
]
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #F8FAFC;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
  min-height: 100vh;
  transition: width 0.3s ease, padding 0.3s ease;

}

.sidebar.collapsed {
  width: 60px;
  padding: 16px 4px;
}


.logo-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
  margin-bottom: 24px;
  padding: 0 8px;
}

.logo-img {
  height: 50px;
  object-fit: contain;
}

.panel-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.panel-btn .icon {
  width: 20px;
  height: 20px;
  color: #4a5568;
  transition: color 0.2s;
}

.panel-btn:hover .icon {
  color: #2b6cb0;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar.collapsed .sidebar-item {
  justify-content: center;
  padding: 12px 0;
}

.sidebar.collapsed .sidebar-item .label {
  display: none;
}

.sidebar-item .icon {
  width: 20px;
  height: 20px;
  color: #4a5568;
}

.sidebar-item:hover .icon {
  color: #2b6cb0;
}

.sidebar-item.active .icon {
  color: #2b6cb0;
}
</style>