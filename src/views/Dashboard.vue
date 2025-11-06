<template>
  <div class="dashboard-page">
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
      <KpiCard :value="kpi.worksToday" label="Работы на сегодня" />
      <KpiCard :value="kpi.overdueWorks" label="Просроченные работы" variant="overdue" />
      <KpiCard :value="kpi.openIncidents" label="Всего открытых инцидентов" />
    </div>

    <QuickActions 
      @add-incident="isAddIncidentModalOpen = true"
      @plan-work="isPlanWorkModalOpen = true"
      @go-to-inspections="goToWorkPlan"
    />

    <RailwaySection 
      :intermediate-stations="intermediateStations"
      :railway-incidents="railwayIncidents"
      @incident-click="handleIncidentClick"
    />

    <div class="main-grid">
      <div class="widget-card no-padding">
        <CalendarWidget @date-selected="handleDateSelected" />
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
import { loadIncidents } from '@/api/incidentApi.js';
import { loadWorkPlan } from '@/api/planApi.js';
import CalendarWidget from '@/components/ui/CalendarWidget.vue';
import { loadDepartments } from '@/api/dashboardApi.js';
import RailwaySection from '@/components/ui/RailwaySection.vue';

const router = useRouter();

const isAddIncidentModalOpen = ref(false);
const isPlanWorkModalOpen = ref(false);
const isEditPlanModalOpen = ref(false);
const selectedEvent = ref(null);

const selectedFarm = ref('Все хозяйства');
const farms = ref(['Все хозяйства']);

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
  worksToday: 0,
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

const selectFarm = (farm) => {
  selectedFarm.value = farm;
  console.log('Выбрано хозяйство:', farm);
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
    // Преобразуем массив объектов в массив строк и добавляем опцию "Все хозяйства"
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
    const periodTypeToday = 71;
    const periodTypeAll = 11;

    const [incidentsToday, worksToday, allWorks, allIncidents] = await Promise.all([
      loadIncidents(todayStr, periodTypeToday),
      loadWorkPlan(todayStr, periodTypeToday),
      loadWorkPlan(todayStr, periodTypeAll),
      loadIncidents(todayStr, periodTypeAll)
    ]);

    kpi.value.newIncidents = incidentsToday.length;
    kpi.value.worksToday = worksToday.length;
    kpi.value.openIncidents = allIncidents.length;

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

const loadRailwayIncidents = async () => {
  try {
    const todayStr = formatDateToString(new Date()); 
    const rawIncidents = await loadIncidents(todayStr, 11); 
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
    const works = await loadWorkPlan(dateStr, 71);
    dayEvents.value = works;
  } catch (error) {
    console.error(`Ошибка при загрузке работ:`, error);
    dayEvents.value = [];
  }
};

const refreshData = () => {
  loadKpiData();
  const todayStr = formatDateToString(new Date());
  handleDateSelected(todayStr);
  loadRailwayIncidents();
  fetchWeather();
  fetchAlmatyDate();
  fetchFarms();
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
  refreshData();
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
</style>