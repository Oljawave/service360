<template>
  <header class="navbar">
    <div class="navbar-left">
      <SearchBox :collapsed="collapsedSearch" />
    </div>

    <div class="navbar-right">
      <div class="lang-select" @click="toggleLangMenu">
        {{ currentLang }}
        <UiIcon name="ChevronDown" class="icon" />
        <div v-if="langMenuOpen" class="lang-dropdown">
          <div
            v-for="lang in languages"
            :key="lang"
            class="lang-item"
            @click.stop="setLanguage(lang)"
          >
            {{ lang }}
          </div>
        </div>
      </div>

      <button class="notif-btn">
        <UiIcon name="Bell" class="icon" />
      </button>

      <UserAvatar :initials="'ОГ'" />
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import UiIcon from '../ui/UiIcon.vue'
import SearchBox from '../ui/SearchBox.vue'
import UserAvatar from '../ui/UserAvatar.vue'


const collapsedSearch = ref(false)
const currentLang = ref(localStorage.getItem('lang') || 'РУС')
const languages = ['РУС', 'ҚАЗ', 'ENG']
const langMenuOpen = ref(false)

const toggleLangMenu = () => {
  langMenuOpen.value = !langMenuOpen.value
}

const setLanguage = (lang) => {
  currentLang.value = lang
  localStorage.setItem('lang', lang)
  langMenuOpen.value = false
}

const handleResize = () => {
  collapsedSearch.value = window.innerWidth < 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-select')) {
      langMenuOpen.value = false
    }
  })
})


onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', () => (langMenuOpen.value = false))
})
</script>


<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  height: 60px;
  min-height: 60px;
  max-height: 60px;
  box-sizing: border-box;
  flex-shrink: 0;
}


.navbar-left {
  flex: 1;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.lang-select {
  font-family: 'SF Pro Text';
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
  position: relative;
  user-select: none;
}

.lang-select .icon {
  width: 14px;
  height: 14px;
  margin-left: 4px;
  color: #4a5568;
}

.lang-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 60px;
}

.lang-item {
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  color: #4a5568;
}

.lang-item:hover {
  background: #edf2f7;
  color: #2b6cb0;
}

.notif-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-btn .icon {
  width: 20px;
  height: 20px;
  color: #4a5568;
  transition: color 0.2s;
}

.notif-btn:hover .icon {
  color: #2b6cb0;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e6f0fb;
  color: #2b6cb0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
</style>
