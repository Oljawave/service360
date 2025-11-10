<template>
  <div class="widget-card">
    <h2 class="section-title">{{ activityTitle }}</h2>
    <ul class="activity-feed">
      <li 
        v-for="event in dayEvents" 
        :key="event.id" 
        class="feed-item" 
        @dblclick.prevent="$emit('eventDoubleClick', event)"
      >
        <div class="feed-icon work">
          <UiIcon name="ClipboardList" color="#2b6cb0" style="margin-right: 1px;" />
        </div>
        <div class="feed-content">
          <div class="feed-header">
            <p v-if="hasCoordinates(event)" class="coordinates">{{ formatCoordinates(event) }}</p>
            <div class="status-badge" :class="getStatusClass(event)">
              <p class="feed-time">
                {{ getStatusText(event) }}
              </p>
            </div>
          </div>
          <p class="feed-description">{{ event.fullNameWork }}</p>
        </div>
      </li>
      <li v-if="!dayEvents.length" class="feed-item-empty">
        На выбранную дату работ не запланировано.
      </li>
    </ul>
  </div>
</template>

<script setup>
import UiIcon from '@/components/ui/UiIcon.vue';

const props = defineProps({
  activityTitle: String,
  dayEvents: Array,
});

defineEmits(['eventDoubleClick']);

const hasCoordinates = (event) => {
  const { StartKm, StartPicket, FinishKm, FinishPicket } = event;
  const hasStart = StartKm !== undefined && StartPicket !== undefined;
  const hasFinish = FinishKm !== undefined && FinishPicket !== undefined;
  return hasStart || hasFinish;
};

const formatCoordinates = (event) => {
  const { StartKm, StartPicket, FinishKm, FinishPicket } = event;
  const hasStart = StartKm !== undefined && StartPicket !== undefined;
  const hasFinish = FinishKm !== undefined && FinishPicket !== undefined;

  if (!hasStart && !hasFinish) {
    return '';
  }

  const startStr = hasStart ? `${StartKm}км ${StartPicket}пк` : '';
  const finishStr = hasFinish ? `${FinishKm}км ${FinishPicket}пк` : '';
  return `${startStr}${startStr && finishStr ? ' - ' : ''}${finishStr}`;
};

const getIsOverdue = (event) => {
  if (event.FactDateEnd && event.FactDateEnd !== '0000-01-01') return false;
  if (!event.PlanDateEnd) return false;

  const endDate = new Date(event.PlanDateEnd.split('T')[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return endDate.getTime() < today.getTime();
}

const getStatusText = (event) => {
  if (event.FactDateEnd && event.FactDateEnd !== '0000-01-01') {
    return 'Завершено';
  }

  if (!event.PlanDateEnd) return 'Срок не указан';

  const endDate = new Date(event.PlanDateEnd.split('T')[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return `Просрочено на ${Math.abs(diffDays)} дн.`;
  } else if (diffDays === 0) {
    return 'Сегодня';
  } else {
    const lastDigit = diffDays % 10;
    const lastTwoDigits = diffDays % 100;
    if (diffDays === 1) {
      return `Остался 1 день`;
    }
    return `Осталось ${diffDays} дн.`;
  }
};

const getStatusClass = (event) => {
  if (event.FactDateEnd && event.FactDateEnd !== '0000-01-01') {
    return 'completed';
  }

  if (!event.PlanDateEnd) return 'draft';

  if (getIsOverdue(event)) {
    return 'overdue';
  }
  
  return 'open';
};
</script>

<style scoped>
.widget-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
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

.feed-icon.work {
  background-color: #e6f0fb;
  color: #2c5282;
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
  margin: 0;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.coordinates {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin: 0;
  padding-right: 8px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 9999px;
  display: inline-block;
  flex-shrink: 0;
}

.feed-time {
  font-size: 12px;
  font-weight: 600;
  margin: 0;
  line-height: 1;
}

.status-badge.open {
  background-color: #e1efff;
  border: 1px solid #3182ce;
}

.status-badge.open .feed-time {
  color: #3182ce;
}

.status-badge.draft {
  background-color: #edf2f7;
  border: 1px solid #718096;
}

.status-badge.draft .feed-time {
  color: #4a5568;
}

.status-badge.overdue {
  background-color: #fff5f5; /* Светло-красный фон */
  border: 1px solid #e53e3e; /* Красная рамка */
}

.status-badge.overdue .feed-time {
  color: #c53030; /* Красный текст */
}

.status-badge.completed {
  background-color: #f0fff4;
  border: 1px solid #38a169;
}

.status-badge.completed .feed-time {
  color: #2fa22f;
}
.feed-item-empty {
  font-size: 14px;
  color: #718096;
  padding: 16px 0;
}
</style>