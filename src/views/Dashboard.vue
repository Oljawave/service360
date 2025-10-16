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
const selectedEvent = ref(null);

const kpi = ref({
  newIncidents: 0,
  worksToday: 0,
  overdueWorks: 0,
  openIncidents: 0,
});

const dayEvents = ref([]);
const activityTitle = ref('План работ на день');

const goToWorkPlan = () => {
  router.push({ name: 'Inspections' });
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
    // Простое правило для склонения
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
</style>