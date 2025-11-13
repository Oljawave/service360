<template>
  <div class="header-content">
    <div class="title-and-select">
      <div class="farm-select-wrapper">
        <div 
          ref="farmSelectRef"
          class="farm-select" 
          :aria-expanded="isFarmDropdownOpen"
          @click="toggleFarmMenu"
        >
          {{ selectedFarm }}
          <UiIcon :name="isFarmDropdownOpen ? 'ChevronUp' : 'ChevronDown'" color="#4a5568" class="icon" />
          <div v-if="isFarmDropdownOpen" class="farm-dropdown">
            <div
              v-for="farm in farms"
              :key="farm"
              class="farm-option"
              @click.stop="selectFarm(farm)"
            >
              {{ farm }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="weather-and-date">
      <button
        class="railway-status-toggle"
        :class="{ 'active': isRailwayStatusOpen }"
        @click="toggleRailwayStatus"
        @mouseenter="showRailwayLabel = true"
        @mouseleave="handleMouseLeave"
      >
        <UiIcon name="Route" :color="isRailwayStatusOpen ? '#3b82f6' : '#4a5568'" style="width: 16px; height: 16px; flex-shrink: 0;" />
        <Transition name="button-expand">
          <span v-if="showRailwayLabel || isRailwayStatusOpen" class="button-label">Состояние пути</span>
        </Transition>
      </button>
      <div class="weather-display" @mouseenter="showWeatherTooltip = true" @mouseleave="showWeatherTooltip = false">
        <UiIcon :name="weatherIconName" :color="weatherIconColor" style="margin-right: 4px;"/>
        <div class="weather-content">
          <span class="weather-temp">{{ weatherTemp }}</span>
          <Transition name="weather-expand">
            <span v-if="showWeatherTooltip" class="weather-location">в г. Оскемен</span>
          </Transition>
        </div>
      </div>
      <span class="date-text">{{ currentDate }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UiIcon from '@/components/ui/UiIcon.vue';

const props = defineProps({
  selectedFarm: String,
  farms: Array,
  weatherTemp: String,
  weatherIconName: String,
  weatherIconColor: String,
  currentDate: String,
  isRailwayStatusOpen: Boolean,
});

const emit = defineEmits(['selectFarm', 'toggleRailwayStatus']);

const isFarmDropdownOpen = ref(false);
const showWeatherTooltip = ref(false);
const showRailwayLabel = ref(false);
const farmSelectRef = ref(null); // Добавляем ref для доступа к DOM-элементу

// Функция для закрытия меню по клику вне элемента
const closeFarmMenuOnOutsideClick = (event) => {
  // Проверяем, не является ли целью клика сам элемент выпадающего списка или его потомок
  if (farmSelectRef.value && !farmSelectRef.value.contains(event.target)) {
    isFarmDropdownOpen.value = false;
    // Важно: Удаляем слушатель после закрытия
    document.removeEventListener('click', closeFarmMenuOnOutsideClick);
  }
};

const toggleFarmMenu = () => {
  if (isFarmDropdownOpen.value) {
    // Если меню открыто, закрываем его и удаляем слушатель
    isFarmDropdownOpen.value = false;
    document.removeEventListener('click', closeFarmMenuOnOutsideClick);
  } else {
    // Если меню закрыто, открываем его и добавляем слушатель
    isFarmDropdownOpen.value = true;
    // Добавляем слушатель, чтобы закрыть меню при следующем клике вне него
    // Используем setTimeout, чтобы клик, который открывает меню, не закрыл его сразу же
    setTimeout(() => {
        document.addEventListener('click', closeFarmMenuOnOutsideClick);
    }, 0);
  }
};

const selectFarm = (farm) => {
  emit('selectFarm', farm);
  isFarmDropdownOpen.value = false;
  // Важно: Удаляем слушатель после выбора
  document.removeEventListener('click', closeFarmMenuOnOutsideClick);
};

const toggleRailwayStatus = () => {
  emit('toggleRailwayStatus');
};

const handleMouseLeave = () => {
  // Скрываем текст только если кнопка не активна
  if (!props.isRailwayStatusOpen) {
    showRailwayLabel.value = false;
  }
};

// Дополнительный хук для очистки слушателя, если компонент будет уничтожен
import { onUnmounted } from 'vue';
onUnmounted(() => {
  document.removeEventListener('click', closeFarmMenuOnOutsideClick);
});

</script>

<style scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title-and-select {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.farm-select-wrapper {
  position: relative;
}

.farm-select {
  font-family: 'SF Pro Text', sans-serif;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
  position: relative;
  user-select: none;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.farm-select:hover {
  background-color: #f7fafc;
}

.farm-select .icon {
  width: 14px;
  height: 14px;
  margin-left: 4px;
  color: #4a5568;
  transition: transform 0.2s;
}

.farm-select[aria-expanded="true"] .icon {
  transform: rotate(180deg);
}

.farm-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  z-index: 20;
  min-width: 250px;
  padding: 4px 0;
}

.farm-option {
  padding: 8px 16px;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
  white-space: nowrap;
}

.farm-option:hover {
  background-color: #f7fafc;
}

.weather-and-date {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #718096;
  gap: 12px;
}

.railway-status-toggle {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  background: white;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  overflow: hidden;
}

.railway-status-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.08);
}

.railway-status-toggle.active {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
}

.button-label {
  font-size: 14px;
  color: #4a5568;
  white-space: nowrap;
  font-weight: 500;
}

.railway-status-toggle.active .button-label {
  color: #3b82f6;
}

/* Анимация раскрытия кнопки */
.button-expand-enter-active,
.button-expand-leave-active {
  transition: all 0.3s ease;
  max-width: 150px;
}

.button-expand-enter-from,
.button-expand-leave-to {
  opacity: 0;
  max-width: 0;
}

.button-expand-enter-to,
.button-expand-leave-from {
  opacity: 1;
  max-width: 150px;
}

.weather-display {
  display: flex;
  align-items: center;
  cursor: help;
}

.weather-content {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  border-right: 1px solid #e2e8f0;
  padding-right: 8px;
}

.weather-temp {
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
}

.weather-location {
  font-weight: 400;
  color: #4a5568;
  white-space: nowrap;
  font-size: 14px;
}

/* Анимация раскрытия */
.weather-expand-enter-active,
.weather-expand-leave-active {
  transition: all 0.3s ease;
  max-width: 200px;
}

.weather-expand-enter-from,
.weather-expand-leave-to {
  opacity: 0;
  max-width: 0;
  transform: translateX(-10px);
}

.weather-expand-enter-to,
.weather-expand-leave-from {
  opacity: 1;
  max-width: 200px;
  transform: translateX(0);
}

.date-text {
  font-size: 14px;
  color: #4a5568;
  white-space: nowrap;
}
</style>