<template>
  <div class="header-content">
    <div class="title-and-select">
      <div class="farm-select-wrapper">
        <div 
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
      <div class="weather-display" @mouseenter="showWeatherTooltip = true" @mouseleave="showWeatherTooltip = false">
        <UiIcon :name="weatherIconName" :color="weatherIconColor" style="margin-right: 4px;"/> 
        <span class="weather-temp">{{ weatherTemp }}</span>
        <div v-if="showWeatherTooltip" class="weather-tooltip">Погода в г. Оскемен</div>
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
});

const emit = defineEmits(['selectFarm']);

const isFarmDropdownOpen = ref(false);
const showWeatherTooltip = ref(false);

const toggleFarmMenu = () => {
  if (!isFarmDropdownOpen.value) {
    document.addEventListener('click', closeFarmMenuOnOutsideClick, { once: true });
  }
  isFarmDropdownOpen.value = !isFarmDropdownOpen.value;
};

const selectFarm = (farm) => {
  emit('selectFarm', farm);
  isFarmDropdownOpen.value = false;
};

const closeFarmMenuOnOutsideClick = (event) => {
  const dropdownElement = document.querySelector('.farm-select');
  if (dropdownElement && !dropdownElement.contains(event.target)) {
    isFarmDropdownOpen.value = false;
  }
};
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
  gap: 8px;
}

.weather-temp {
  font-weight: 600;
  color: #2d3748;
  border-right: 1px solid #e2e8f0;
  padding-right: 8px;
}

.weather-display {
  position: relative;
  display: flex;
  align-items: center;
  cursor: help;
}

.weather-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background-color: #2d3748;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  z-index: 100;
}

.weather-tooltip::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: transparent transparent #2d3748 transparent;
}

.date-text {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
  white-space: nowrap;
}
</style>