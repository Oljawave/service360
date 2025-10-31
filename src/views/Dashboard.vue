<template>
  <div class="dashboard-page">
    <h1 class="page-title">Добро пожаловать в Service 360</h1>

    <div class="kpi-grid">
      <KpiCard :value="kpi.newIncidents" label="Новые инциденты сегодня" />
      <KpiCard :value="kpi.worksToday" label="Работы на сегодня" />
      <KpiCard :value="kpi.overdueWorks" label="Просроченные работы" variant="overdue" />
      <KpiCard :value="kpi.openIncidents" label="Всего открытых инцидентов" />
    </div>

    <div class="quick-actions">
      <h2 class="section-title">Быстрые действия</h2>
      <div class="actions-container">
        <DashboardButton 
          label="Добавить инцидент" 
          iconName="BookOpen" 
          iconColor="#2B6CB0"
          @click="isAddIncidentModalOpen = true" 
        />
        <DashboardButton 
          label="Запланировать работу" 
          iconName="Calendar" 
          iconColor="#2B6CB0"
          @click="isPlanWorkModalOpen = true" 
        />
        <DashboardButton 
          label="Журнал осмотров" 
          iconName="ClipboardList" 
          iconColor="#2B6CB0"
          @click="goToWorkPlan" 
        />
      </div>
    </div>

    <div class="railway-section">
      <h2 class="railway-title">Железнодорожная линия</h2>
      <p class="railway-subtitle">Нажмите на маркер инцидента для просмотра подробной информации</p>
      
      <div class="railway-container">
        <div class="stations-row">
          <div class="station-info">
            <div class="station-name">Станция Шар</div>
            <div class="station-km">0 км</div>
          </div>
          <div class="station-info">
            <div class="station-name">Станция НУК</div>
            <div class="station-km">151 км</div>
          </div>
        </div>
        
        <div class="railway-slider">
          <div class="railway-track">
            <div class="track-marker start-point" :style="{ left: '0%' }"></div>
            
            <div 
              v-for="station in intermediateStations" 
              :key="station.id"
              class="track-marker intermediate-station" 
              :style="{ left: station.position + '%' }"
              @mouseenter="hoveredStationId = station.id"
              @mouseleave="hoveredStationId = null"
            >
              <div class="station-marker"></div>
              <div class="station-label">{{ station.name }}</div>
              <Transition name="tooltip-fade">
                <div v-if="hoveredStationId === station.id" class="station-tooltip">{{ formatStationCoords(station.km) }}</div>
              </Transition>
            </div>
            
            <div 
              v-for="incident in railwayIncidents" 
              :key="incident.id"
              class="track-marker incident-point"
              :class="incident.color"
              :style="{ left: incident.position + '%' }"
              :title="incident.title"
              @click="handleIncidentClick(incident)"
            ></div>
            
            <div class="track-marker end-point" :style="{ left: '100%' }"></div>
          </div>
        </div>
        
        <div class="distance-labels">
          <span class="distance-label">0км</span>
          <span class="distance-label">25км</span>
          <span class="distance-label">50км</span>
          <span class="distance-label">75км</span>
          <span class="distance-label">100км</span>
          <span class="distance-label">125км</span>
          <span class="distance-label">151км</span>
        </div>
      </div>
    </div>

    <div class="main-grid">
      <div class="widget-card no-padding">
        <CalendarWidget @date-selected="handleDateSelected" />
      </div>

      <div class="widget-card">
        <h2 class="section-title">{{ activityTitle }}</h2>
        <ul class="activity-feed">
          <li v-for="event in dayEvents" :key="event.id" class="feed-item" @dblclick.prevent="handleEventDoubleClick(event)">
            <div class="feed-icon work">
              <UiIcon name="ClipboardList" color="#2b6cb0" style="margin-right: 1px;" />
            </div>
            <div class="feed-content">
              <p class="feed-description">{{ event.fullNameWork }}</p> 
              <p class="feed-time" :class="{ 'overdue': isOverdue(event.PlanDateEnd) }">{{ getDaysRemainingText(event.PlanDateEnd) }}</p>
            </div>
          </li>
          <li v-if="!dayEvents.length" class="feed-item-empty">На выбранную дату работ не запланировано.</li>
        </ul>
      </div>
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
      @save="handlePlanUpdated" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DashboardButton from '@/components/ui/DashboardButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import ModalAddIncident from '@/modals/ModalAddIncident.vue';
import ModalPlanWork from '@/modals/ModalPlanWork.vue';
import ModalEditPlan from '@/modals/ModalEditPlan.vue';
import KpiCard from '@/components/ui/KpiCard.vue';
import { loadIncidents } from '@/api/incidentApi.js';
import { loadWorkPlan } from '@/api/planApi.js';
import CalendarWidget from '@/components/ui/CalendarWidget.vue';

const router = useRouter();

const isAddIncidentModalOpen = ref(false);
const isPlanWorkModalOpen = ref(false);
const isEditPlanModalOpen = ref(false);
const hoveredStationId = ref(null);
const selectedEvent = ref(null);

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

const railwayIncidents = ref([
  { id: 1, position: 16.5, color: 'red-marker', title: 'Инцидент на 25км', km: 25 },
  { id: 2, position: 33, color: 'yellow-marker', title: 'Инцидент на 50км', km: 50 },
  { id: 3, position: 49.5, color: 'green-marker', title: 'Инцидент на 75км', km: 75 },
  { id: 4, position: 82.5, color: 'red-marker', title: 'Инцидент на 125км', km: 125 },
]);

const goToWorkPlan = () => {
  router.push({ name: 'Inspections' });
};

const formatStationCoords = (kmValue) => {
  if (kmValue === null || kmValue === undefined) return '';
  const km = Math.floor(kmValue);
  const pk = Math.round((kmValue - km) * 10);
  return `${km}км ${pk}пк`;
};

const formatDateToString = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysRemainingText = (planDateEnd) => {
  if (!planDateEnd) return '';

  const endDate = new Date(planDateEnd.split('T')[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Просрочено на ${Math.abs(diffDays)} дн.`;
  } else if (diffDays === 0) {
    return 'Завершается сегодня';
  } else {
    const lastDigit = diffDays % 10;
    const lastTwoDigits = diffDays % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return `Осталось ${diffDays} дней`;
    if (lastDigit === 1) return `Осталось ${diffDays} день`;
    if ([2, 3, 4].includes(lastDigit)) return `Осталось ${diffDays} дня`;
    return `Осталось ${diffDays} дней`;
  }
};

const isOverdue = (planDateEnd) => {
  if (!planDateEnd) return false;

  const endDate = new Date(planDateEnd.split('T')[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  return diffTime < 0;
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
    console.error("Ошибка при загрузке данных для KPI:", error);
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
    console.error(`Ошибка при загрузке работ на ${dateStr}:`, error);
    dayEvents.value = [];
  }
};

const refreshData = () => {
  loadKpiData();
  const todayStr = formatDateToString(new Date());
  handleDateSelected(todayStr);
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
  loadKpiData();
});
</script>

<style scoped>
.dashboard-page {
  padding: 24px;
  background: #f7fafc;
  height: 100%;
  overflow-y: auto;
  font-family: system-ui;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 24px;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.quick-actions {
  margin-bottom: 32px;
}
.actions-container {
  display: flex;
  gap: 16px;
}

.railway-section {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 32px;
}

.railway-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 8px;
}

.railway-subtitle {
  font-size: 14px;
  color: #718096;
  margin-bottom: 48px;
}

.railway-container {
  max-width: 1400px;
  margin: 0 auto;
}

.stations-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 0 8px;
}

.stations-row .station-info:first-child {
  text-align: left;
}

.stations-row .station-info:last-child {
  text-align: right;
}

.station-name {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
}

.station-km {
  font-size: 12px;
  color: #a0aec0;
}

.railway-slider {
  background: #e8edf2;
  border-radius: 50px;
  padding: 20px 24px;
  margin-bottom: 12px;
}

.railway-track {
  position: relative;
  height: 4px;
  background: #94a3b8;
  border-radius: 4px;
}

.track-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.start-point, .end-point {
  width: 8px;
  height: 8px;
  background-color: #475569;
  cursor: default;
}

.start-point {
  left: 0;
}

.end-point {
  left: 100%;
}

.intermediate-station {
  cursor: pointer;
  z-index: 5;
  position: relative;
}

.station-marker {
  width: 8px;
  height: 8px;
  background-color: #475569;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.station-label {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #64748b;
  white-space: nowrap;
  font-weight: 500;
}
.station-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  background-color: #2d3748;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  z-index: 20;
  pointer-events: none;
}

.station-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #2d3748 transparent transparent transparent;
}

.tooltip-fade-enter-active, .tooltip-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.tooltip-fade-enter-from, .tooltip-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(5px); }
.tooltip-fade-enter-to, .tooltip-fade-leave-from { opacity: 1; transform: translateX(-50%) translateY(0); }

.incident-point {
  width: 10px;
  height: 10px;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 10;
}

.incident-point:hover {
  transform: translate(-50%, -50%) scale(1.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  z-index: 15;
}

.red-marker {
  background-color: #ef4444;
}

.yellow-marker {
  background-color: #eab308;
}

.green-marker {
  background-color: #22c55e;
}

.distance-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 12px;
}

.distance-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
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

.activity-feed {
  list-style: none;
  padding: 0;
  margin: 0;
}
.feed-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 12px;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.feed-item:not(:last-child) {
  border-bottom: 1px solid #e2e8f0;
}
.feed-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.feed-icon.incident {
  background-color: #fed7d7;
  color: #c53030;
}
.feed-icon.work {
  background-color: #c3dafe;
  color: #2c5282;
}
.feed-icon .icon {
  width: 18px;
  height: 18px;
  margin-right: 0;
}
.feed-item:hover {
  background-color: #f7fafc;
  border-radius: 8px;
}

.feed-content {
  flex-grow: 1;
}
.feed-description {
  font-size: 14px;
  color: #2d3748;
  margin: 0 0 4px;
}
.feed-time {
  font-size: 12px;
  color: #a0aec0;
  margin: 0;
}
.feed-time.overdue {
  color: #c53030;
}

.feed-item-empty {
  font-size: 14px;
  color: #718096;
  padding: 16px 0;
}

@media (max-width: 768px) {
  .railway-section {
    padding: 24px;
  }
  
  .railway-slider {
    padding: 16px 20px;
  }
  
  .distance-labels {
    font-size: 10px;
  }
  
  .station-name {
    font-size: 13px;
  }
  
  .station-label {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  
  .railway-section {
    padding: 20px 16px;
  }
  
  .railway-slider {
    padding: 14px 16px;
  }
  
  .track-marker.incident-point {
    width: 18px;
    height: 18px;
  }
  
  .distance-labels {
    padding: 0 8px;
  }
  
  .station-label {
    font-size: 8px;
  }
}
</style>