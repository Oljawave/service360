<template>
  <div class="dashboard-page">
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      Загрузка данных...
    </div>

    <template v-else>
    <DashboardHeader 
      :selected-farm="selectedFarm"
      :farms="farms"
      :weather-temp="weatherTemp"
      :weather-icon-name="weatherIconName"
      :weather-icon-color="weatherIconColor"
      :current-date="currentDate"
      @select-farm="selectFarm"
    />

    <div class="kpi-grid">
      <KpiCard :value="kpi.newIncidents" label="Новые инциденты сегодня" />
      <KpiCard :value="kpi.speedRestrictions" label="Ограничение скорости" />
      <KpiCard :value="kpi.overdueWorks" label="Просроченные работы" variant="overdue" />
      <KpiCard :value="kpi.openIncidents" label="Всего открытых инцидентов" />
    </div>

    <RailwaySection 
      :intermediate-stations="intermediateStations"
      :railway-incidents="railwayIncidents"
      @incident-click="handleIncidentClick"
    />

    <QuickActions 
      @add-incident="isAddIncidentModalOpen = true"
      @plan-work="isPlanWorkModalOpen = true"
      @go-to-inspections="goToWorkPlan"
    />

    <div class="main-grid">
      <div class="widget-card no-padding">
        <CalendarWidget 
          :selected-farm-id="selectedFarmId"
          @date-selected="handleDateSelected" 
        />
      </div>

      <WorkPlanWidget
        :activity-title="activityTitle"
        :day-events="dayEvents"
        @event-double-click="handleEventDoubleClick"
      />
    </div>

    <ModalAddIncident
      v-if="isAddIncidentModalOpen"
      @close="isAddIncidentModalOpen = false"
      @update-table="refreshData"
    />
    <ModalPlanWork
      v-if="isPlanWorkModalOpen"
      @close="isPlanWorkModalOpen = false"
      @update-table="refreshData"
    />
    <ModalEditPlan
      v-if="isEditPlanModalOpen"
      :rowData="selectedEvent"
      @close="isEditPlanModalOpen = false"
      @save="handlePlanUpdated"
    />
    </template>
  </div>
</template>

<script setup>  
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DashboardHeader from '@/components/ui/DashboardHeader.vue';
import QuickActions from '@/components/ui/QuickActions.vue';
import WorkPlanWidget from '@/components/ui/WorkPlanWidget.vue';
import ModalAddIncident from '@/modals/ModalAddIncident.vue';
import ModalPlanWork from '@/modals/ModalPlanWork.vue';
import ModalEditPlan from '@/modals/ModalEditPlan.vue';
import KpiCard from '@/components/ui/KpiCard.vue';
import CalendarWidget from '@/components/ui/CalendarWidget.vue';
import { loadDepartments, loadWorkPlanForKpi, loadIncidentsForKpi } from '@/api/dashboardApi.js';
import RailwaySection from '@/components/ui/RailwaySection.vue';

const router = useRouter();

const isAddIncidentModalOpen = ref(false);
const isPlanWorkModalOpen = ref(false);
const isEditPlanModalOpen = ref(false);
const isLoading = ref(true);
const selectedEvent = ref(null);

const selectedFarm = ref('Все хозяйства');
const selectedFarmId = ref(null);
const farms = ref(['Все хозяйства']);
const departmentsMap = ref({});

const RAILWAY_TOTAL_KM = 151;

const weatherTemp = ref('Загрузка...'); 
const currentDate = ref('Загрузка...'); 
const weatherIconName = ref('Sun');
const weatherIconColor = ref('#f6ad55');

const API_KEY = 'b68cfdf8a6b6640730e7fec49b793661'; 
const ALMATY_TIMEZONE = 'Asia/Almaty';
const UST_KAMENOGORSK_CITY_ID = '1520316'; 

const kpi = ref({
  newIncidents: 0,
  speedRestrictions: 0,
  overdueWorks: 0,
  openIncidents: 0,
});

const dayEvents = ref([]);
const activityTitle = ref('План работ на день');

const intermediateStations = ref([
  { id: 's1', name: 'Сарыжал', position: 12.58, km: 19.2 },
  { id: 's2', name: 'Шалабай', position: 31.26, km: 47.7 },
  { id: 's3', name: 'Бурсак', position: 46.52, km: 70.3 },
  { id: 's4', name: 'Екаша', position: 58.51, km: 88.4 },
  { id: 's5', name: 'Айыртау', position: 75.83, km: 114.5 },
  { id: 's6', name: 'Улан', position: 88.41, km: 133.7 },
]);

const railwayIncidents = ref([]); 

const goToWorkPlan = () => {
  router.push({ name: 'Inspections' });
};

const selectFarm = async (farm) => {
  selectedFarm.value = farm;
  
  if (farm === 'Все хозяйства') {
    selectedFarmId.value = null;
  } else {
    selectedFarmId.value = departmentsMap.value[farm];
  }
  
  console.log('Выбрано хозяйство:', farm, 'ID:', selectedFarmId.value);
  
  isLoading.value = true;
  await loadKpiData();
  await loadRailwayIncidents(selectedFarmId.value); // Обновляем инциденты на карте
  
  // CalendarWidget обновится автоматически через watch, но мы дадим ему время
  setTimeout(() => isLoading.value = false, 500); // Небольшая задержка для ререндера календаря
};

const formatDateToString = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const mapOpenWeatherIcon = (iconCode) => {
  const map = {
    '01d': { name: 'Sun', color: '#f6ad55' },
    '01n': { name: 'Moon', color: '#63b3ed' },
    '02d': { name: 'CloudSun', color: '#ecc94b' },
    '02n': { name: 'CloudMoon', color: '#a0aec0' },
    '03d': { name: 'Cloud', color: '#718096' },
    '03n': { name: 'Cloud', color: '#718096' },
    '04d': { name: 'CloudDrizzle', color: '#4a5568' },
    '04n': { name: 'CloudDrizzle', color: '#4a5568' },
    '09d': { name: 'CloudRain', color: '#63b3ed' },
    '09n': { name: 'CloudRain', color: '#63b3ed' },
    '10d': { name: 'CloudRain', color: '#63b3ed' },
    '10n': { name: 'CloudRain', color: '#63b3ed' },
    '11d': { name: 'CloudLightning', color: '#9f7aea' },
    '11n': { name: 'CloudLightning', color: '#9f7aea' },
    '13d': { name: 'CloudSnow', color: '#e2e8f0' },
    '13n': { name: 'CloudSnow', color: '#e2e8f0' },
    '50d': { name: 'Mist', color: '#a0aec0' },
    '50n': { name: 'Mist', color: '#a0aec0' },
  };
  return map[iconCode] || { name: 'Sun', color: '#f6ad55' };
};

const fetchWeather = async () => {
  if (!API_KEY) {
    weatherTemp.value = 'Нет API ключа';
    weatherIconName.value = 'AlertCircle';
    weatherIconColor.value = '#c53030';
    return;
  }
  
  const url = `https://api.openweathermap.org/data/2.5/weather?id=${UST_KAMENOGORSK_CITY_ID}&appid=${API_KEY}&units=metric&lang=ru`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    
    const temp = Math.round(data.main.temp);
    const iconCode = data.weather[0].icon;

    weatherTemp.value = `${temp}°C`;
    const iconMapping = mapOpenWeatherIcon(iconCode);
    weatherIconName.value = iconMapping.name;
    weatherIconColor.value = iconMapping.color;
  } catch (error) {
    console.error("Ошибка при получении погоды:", error);
    weatherTemp.value = '—°C';
    weatherIconName.value = 'AlertCircle';
    weatherIconColor.value = '#c53030';
  }
};

const fetchAlmatyDate = () => {
  try {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: ALMATY_TIMEZONE,
    };
    const nowInAlmaty = new Date().toLocaleDateString('ru-RU', options);
    currentDate.value = nowInAlmaty;
  } catch (error) {
    console.error("Ошибка при получении даты:", error);
    currentDate.value = 'Дата недоступна';
  }
};

const fetchFarms = async () => {
  try {
    const departments = await loadDepartments();
    
    const depsMap = {};
    departments.forEach(dep => {
      depsMap[dep.name] = dep.id;
    });
    departmentsMap.value = depsMap;
    
    farms.value = ['Все хозяйства', ...departments.map(dep => dep.name)];
  } catch (error) {
    console.error("Не удалось загрузить список хозяйств:", error);
  }
};

const loadKpiData = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDateToString(today);
    const periodTypeAll = 11;

    const objLocationParam = selectedFarmId.value;

    // Новые инциденты сегодня: periodType=71, без status и event
    const newIncidentsPromise = loadIncidentsForKpi(todayStr, 71, objLocationParam, null, null);

    // Ограничение скорости: periodType=11, event=1157
    const speedRestrictionsPromise = loadIncidentsForKpi(todayStr, 11, objLocationParam, null, 1157);

    // Всего открытых инцидентов: periodType=11, status=1
    const openIncidentsPromise = loadIncidentsForKpi(todayStr, 11, objLocationParam, 1, null);

    // Просроченные работы
    const allWorksPromise = loadWorkPlanForKpi(todayStr, null, objLocationParam);

    const [newIncidents, speedRestrictions, openIncidents, allWorks] = await Promise.all([
      newIncidentsPromise,
      speedRestrictionsPromise,
      openIncidentsPromise,
      allWorksPromise
    ]);

    kpi.value.newIncidents = newIncidents.length;
    kpi.value.speedRestrictions = speedRestrictions.length;
    kpi.value.openIncidents = openIncidents.length;

    const overdue = allWorks.filter(work => {
      const planDate = new Date(work.PlanDateEnd.split('T')[0]);
      return planDate < today;
    });
    kpi.value.overdueWorks = overdue.length;
  } catch (error) {
    console.error("Ошибка при загрузке KPI:", error);
  }
};

const processIncidents = (rawIncidents) => {
  return rawIncidents.map(incident => {
    const startKmValue = (incident.StartKm || 0) + (incident.StartPicket / 10 || 0);
    const position = (startKmValue / RAILWAY_TOTAL_KM) * 100;

    let color = 'red-marker';
    const statusName = incident.nameStatus ? incident.nameStatus.toLowerCase() : '';

    if (statusName.includes('зарегистрирован')) color = 'red-marker'; 
    else if (statusName.includes('в работе')) color = 'yellow-marker'; 
    else if (statusName.includes('завершен') || statusName.includes('закрыт')) color = 'green-marker';

    const description = incident.Description || incident.name;
    const title = `${incident.nameCls}: ${description} (${startKmValue.toFixed(2)}км)`;

    return {
      id: incident.id,
      position: position,
      color: color,
      title: title,
      km: startKmValue,
      rawData: incident,
    };
  });
};

const loadRailwayIncidents = async (farmId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDateToString(today);
    
    // Используем periodType 71 (Новые инциденты сегодня)
    const rawIncidents = await loadIncidentsForKpi(todayStr, 71, farmId, null, null); 
    railwayIncidents.value = processIncidents(rawIncidents);
  } catch (error) {
    console.error("Ошибка при загрузке инцидентов:", error);
    railwayIncidents.value = [];
  }
};

const handleDateSelected = async (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    activityTitle.value = 'План работ на сегодня';
  } else {
    activityTitle.value = `План работ на ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
  }

  try {
    // Используем periodType 71 для выбранной даты
    const works = await loadWorkPlanForKpi(dateStr, 71, selectedFarmId.value);
    dayEvents.value = works;
  } catch (error) {
    console.error(`Ошибка при загрузке работ:`, error);
    dayEvents.value = [];
  }
};

const refreshData = () => {
  isLoading.value = true;
  loadKpiData();
  const todayStr = formatDateToString(new Date());
  handleDateSelected(todayStr);
  loadRailwayIncidents(selectedFarmId.value); // Передаем текущий farmId
  fetchWeather();
  fetchAlmatyDate();
  isLoading.value = false;
};

const handleEventDoubleClick = (event) => {
  selectedEvent.value = {
    id: event.id,
    objWork: event.objWork,
    objObject: event.objObject,
    objLocationClsSection: event.objLocationClsSection,
    planDate: event.PlanDateEnd,
    StartKm: event.StartKm,
    StartPicket: event.StartPicket,
    FinishKm: event.FinishKm,
    FinishPicket: event.FinishPicket,
    rawData: event,
  };
  isEditPlanModalOpen.value = true;
};

const handlePlanUpdated = () => {
  isEditPlanModalOpen.value = false;
  refreshData();
};

const handleIncidentClick = (incident) => {
  console.log('Clicked incident:', incident);
};

onMounted(() => {
  fetchFarms().then(() => {
    refreshData();
  });
});
</script>

<style scoped>
.dashboard-page {
  padding: 24px;
  background: #f7fafc;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden; 
  font-family: system-ui;
}

.kpi-grid {
  display: grid;
  /* Адаптировано, чтобы показать 4 карточки, если они одинаковой ширины */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
  gap: 24px;
  margin-bottom: 32px;
}

.main-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.widget-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  max-width: 100%;
  overflow-x: auto;
}

.widget-card.no-padding {
  padding: 0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  font-size: 16px;
  color: #4a5568;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #3182ce;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>