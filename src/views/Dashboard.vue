<template>
  <div class="dashboard-page">
    <h1 class="page-title">Главная</h1>

    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-value">{{ kpi.newIncidents }}</span>
        <span class="kpi-label">Новые инциденты сегодня</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-value">{{ kpi.worksToday }}</span>
        <span class="kpi-label">Работы на сегодня</span>
      </div>
      <div class="kpi-card overdue">
        <span class="kpi-value">{{ kpi.overdueWorks }}</span>
        <span class="kpi-label">Просроченные работы</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-value">{{ kpi.openIncidents }}</span>
        <span class="kpi-label">Всего открытых инцидентов</span>
      </div>
    </div>

    <div class="quick-actions">
      <h2 class="section-title">Быстрые действия</h2>
      <div class="actions-container">
        <MainButton label="Добавить инцидент" @click="isAddIncidentModalOpen = true" />
        <MainButton label="Запланировать работу" @click="isPlanWorkModalOpen = true" />
        <MainButton label="Журнал осмотров" @click="goToWorkPlan" variant="secondary" />
      </div>
    </div>

    <div class="main-grid">
      <div class="widget-card">
        <h2 class="section-title">Календарь работ</h2>
        <CalendarWidget />
      </div>

      <div class="widget-card">
        <h2 class="section-title">Последние события</h2>
        <ul class="activity-feed">
          <li v-for="event in activityFeed" :key="event.id" class="feed-item">
            <div class="feed-icon" :class="event.type">
              <UiIcon :name="event.type === 'incident' ? 'AlertTriangle' : 'Tool'" />
            </div>
            <div class="feed-content">
              <p class="feed-description">{{ event.description }}</p>
              <span class="feed-time">{{ event.time }}</span>
            </div>
          </li>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MainButton from '@/components/ui/MainButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import ModalAddIncident from '@/modals/ModalAddIncident.vue';
import ModalPlanWork from '@/modals/ModalPlanWork.vue';
import CalendarWidget from '@/components/ui/CalendarWidget.vue';

const router = useRouter();

const isAddIncidentModalOpen = ref(false);
const isPlanWorkModalOpen = ref(false);

// TODO: Заменить на реальные данные из API
const kpi = ref({
  newIncidents: 3,
  worksToday: 12,
  overdueWorks: 2,
  openIncidents: 48,
});

// TODO: Заменить на реальные данные из API
const activityFeed = ref([
  { id: 1, type: 'incident', description: "Новый инцидент 'Обрыв кабеля' на ПЧ-5", time: '15 минут назад', icon: 'AlertTriangle' },
  { id: 2, type: 'work', description: "Работа 'Осмотр пути' завершена", time: '1 час назад', icon: 'Tool' },
  { id: 3, type: 'work', description: "Запланирована работа 'Замена шпал'", time: '3 часа назад', icon: 'Tool' },
  { id: 4, type: 'incident', description: "Инцидент 'Неисправность светофора' закрыт", time: 'Вчера', icon: 'AlertTriangle' },
]);

const goToWorkPlan = () => {
  router.push({ name: 'Inspections' });
};

// Функция goToWorkPlanWithDate удалена, т.к. она теперь внутри CalendarWidget.vue

const refreshData = () => {
  // TODO: Добавить логику обновления данных на дашборде после закрытия модальных окон
  console.log('Dashboard data should be refreshed');
};

onMounted(() => {
  // generateCalendar() удалена, т.к. логика календаря теперь в CalendarWidget
  // TODO: Загрузить реальные данные для KPI и ленты событий
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
.page-title { font-size: 24px; font-weight: 600; color: #1a202c; margin-bottom: 24px; }
.section-title { font-size: 18px; font-weight: 600; color: #2d3748; margin-bottom: 16px; }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 32px; }
.kpi-card { background: white; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.kpi-value { font-size: 36px; font-weight: 700; color: #2b6cb0; }
.kpi-label { font-size: 14px; color: #718096; margin-top: 8px; }
.kpi-card.overdue .kpi-value { color: #c53030; }

.quick-actions { margin-bottom: 32px; }
.actions-container { display: flex; gap: 16px; }

.main-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; }
.widget-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

/* Все стили, относящиеся к старому календарю, удалены */

.activity-feed { list-style: none; padding: 0; margin: 0; }
.feed-item { display: flex; align-items: flex-start; gap: 16px; padding: 12px 0; }
.feed-item:not(:last-child) { border-bottom: 1px solid #e2e8f0; }
.feed-icon { flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.feed-icon.incident { background-color: #fed7d7; color: #c53030; }
.feed-icon.work { background-color: #c3dafe; color: #2c5282; }
.feed-icon .icon { width: 18px; height: 18px; }
.feed-content { flex-grow: 1; }
.feed-description { font-size: 14px; color: #2d3748; margin: 0 0 4px; }
.feed-time { font-size: 12px; color: #a0aec0; }
</style>