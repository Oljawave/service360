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
          <p class="feed-description">{{ event.fullNameWork }}</p> 
          <p class="feed-time" :class="{ 'overdue': isOverdue(event.PlanDateEnd) }">
            {{ getDaysRemainingText(event.PlanDateEnd) }}
          </p>
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
  background-color: #c3dafe;
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