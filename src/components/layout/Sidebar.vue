<template>
  <aside :class="['sidebar', { collapsed: isCollapsed, 'mobile-open': sidebar.mobileOpen }]">
    <div class="logo-section">
      <img v-if="!isCollapsed" src="@/assets/img/logo.png" alt="Service 360" class="logo-img" />
      <button class="panel-btn desktop-only" @click="sidebar.toggle">
        <UiIcon :name="isCollapsed ? 'PanelLeftOpen' : 'PanelLeft'" class="icon" />
      </button>
    </div>

    <nav class="nav-links">
      <SidebarItem
        v-for="item in filteredItems"
        :key="item.path"
        :icon="item.icon"
        :label="item.label"
        :to="item.path"
        :is-collapsed="isCollapsed"
        @clicked="handleItemClick"
      />
    </nav>
  </aside>
</template>

<script setup>
import SidebarItem from '../ui/SidebarItem.vue'
import UiIcon from '../ui/UiIcon.vue'
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useSidebarStore } from '@/stores/sidebar'

const sidebar = useSidebarStore()

const isMobile = ref(window.innerWidth < 768);

const isCollapsed = computed(() => {
  // На мобильных устройствах сайдбар никогда не должен быть collapsed
  return isMobile.value ? false : sidebar.collapsed;
});

const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
  sidebar.setCollapsed(isMobile.value);
}

const handleItemClick = () => {
  if (isMobile.value && sidebar.mobileOpen) {
    sidebar.toggleMobile();
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

const allItems = [
  { label: 'Главная', path: '/main', icon: 'Home' },
  { label: 'План работ', path: '/work-plan', icon: 'ClipboardList', permission: 'plan' },
  { label: 'Журнал осмотров и проверок', path: '/inspections', icon: 'BookOpen', permission: 'ins' },
  { label: 'Журнал параметров', path: '/parameters', icon: 'Ruler', permission: 'par' },
  { label: 'Журнал неисправностей', path: '/defects', icon: 'AlertTriangle', permission: 'def' },
  { label: 'Журнал событий и запросов на работы', path: '/incidents', icon: 'Cog', permission: 'inc' },
  { label: 'Обслуживаемые объекты', path: '/objects', icon: 'Folder', permission: 'obj' },
  { label: 'Организационная структура', path: '/organization', icon: 'FolderTree', permission: 'org' },
]

const getUserPermissions = () => {
  const curUserString = localStorage.getItem('curUser')
  if (!curUserString) return new Set()

  try {
    const curUser = JSON.parse(curUserString)
    const target = curUser?.result?.target || ''
    const permissions = target.split(',').map(p => p.split(':')[0])
    return new Set(permissions)
  } catch (e) {
    console.error('Ошибка парсинга данных пользователя:', e)
    return new Set()
  }
}

const userPermissions = getUserPermissions()
const filteredItems = computed(() => 
  allItems.filter(item => !item.permission || userPermissions.has(item.permission))
)
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
.desktop-only {
  display: flex;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -250px;
    top: 0;
    height: 100%;
    z-index: 1000;
    transition: left 0.3s ease;
    width: 250px; /* Ensure it's not collapsed on mobile when open */
  }

  .sidebar:not(.mobile-open) {
    display: none;
  }
}

.sidebar.collapsed {
  width: 60px;
  padding: 16px 4px;
}


@media (max-width: 768px) {
  .sidebar.mobile-open {
    left: 0;
  }
  .desktop-only {
    display: none;
  }
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