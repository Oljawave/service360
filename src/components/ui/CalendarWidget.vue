<template>
  <div class="calendar-widget">
    <n-calendar
      v-model:value="calendarValue"
      :is-date-disabled="isDateDisabled"
      :on-panel-change="handlePanelChange"
      @update:value="handleUpdateValue"
    >
      <template #default="{ year, month, date: fullDate }">
        <div class="calendar-day-content-wrapper">
          <span
            v-if="getEventCount(fullDate) > 0 && isCurrentMonthDay(fullDate)"
            class="event-count"
            @click.stop="goToWorkPlanWithDate(fullDate)"
          >
            {{ getEventCount(fullDate) }}
          </span>
        </div>
      </template>
    </n-calendar>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { NCalendar } from 'naive-ui';
import { format, isSameMonth, startOfMonth } from 'date-fns';

const router = useRouter();

const calendarValue = ref(Date.now()); // Текущая дата
const currentPanelMonth = ref(new Date(Date.now())); // Отслеживаем месяц, который отображается в календаре

watch(calendarValue, (newValue) => {
  currentPanelMonth.value = startOfMonth(new Date(newValue));
}, { immediate: true });


// TODO: Загружать реальные данные о работах по дням
// Ключ: 'ГГГГ-ММ-ДД', Значение: количество событий
const mockEvents = ref({
  // Пример моковых данных для текущего месяца (октябрь 2025 года)
  [`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-10`]: 2,
  [`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-15`]: 5,
  [`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-28`]: 1,
});

const isCurrentMonthDay = (dateObject) => {
  return isSameMonth(dateObject, currentPanelMonth.value);
};

const getEventCount = (dateObject) => {
  if (!(dateObject instanceof Date) || isNaN(dateObject)) {
    return 0;
  }
  const dateString = format(dateObject, 'yyyy-MM-dd');
  return mockEvents.value[dateString] || 0;
};

const isDateDisabled = (date) => {
  return false;
};

const handleUpdateValue = (timestamp) => {
  const selectedDate = new Date(timestamp);
  // dateString здесь не нужен, т.к. goToWorkPlanWithDate форматирует дату
  goToWorkPlanWithDate(selectedDate); // Передаем полный объект Date
};

const handlePanelChange = (date) => {
  currentPanelMonth.value = startOfMonth(new Date(date));
  // TODO: Загрузить реальные данные для нового месяца
};

const goToWorkPlanWithDate = (dateObject) => {
  const formattedDate = dateObject instanceof Date ? format(dateObject, 'yyyy-MM-dd') : dateObject;
  router.push({ name: 'Inspections', query: { date: formattedDate } });
};
</script>

<style scoped>
.calendar-widget {
  padding: 0;
}

/* Deep selectors to override Naive UI NCalendar styles */
.calendar-widget :deep(.n-calendar) {
  --n-body-padding: 0 !important; /* Убираем внутренний отступ */
  --n-border: none !important; /* Убираем бордер */
  --n-header-padding: 0 !important; /* Убираем отступы для хедера, чтобы управлять ими вручную */
  --n-font-size: 14px !important;
  font-family: system-ui; /* Применяем общий шрифт */
}

/* Header (месяц и год, кнопки навигации) */
.calendar-widget :deep(.n-calendar-header) {
  display: flex;
  justify-content: space-between;
  align-items: center; 
  padding: 8px 10px; /* Добавляем горизонтальные отступы */
  margin-bottom: 10px; /* Отступ под хедером */
}

.calendar-widget :deep(.n-calendar-header__title) {
  font-size: 18px; /* Чуть крупнее */
  font-weight: 600; /* Более жирный */
  color: #2d3748;
}

.calendar-widget :deep(.n-calendar-header__next-month),
.calendar-widget :deep(.n-calendar-header__prev-month),
.calendar-widget :deep(.n-calendar-header__next-year),
.calendar-widget :deep(.n-calendar-header__prev-year) {
  padding: 0 8px; /* Уменьшаем padding для кнопок */
}

/* Скрываем кнопки переключения года, если они не нужны */
.calendar-widget :deep(.n-calendar-header__next-year),
.calendar-widget :deep(.n-calendar-header__prev-year) {
  display: none;
}

/* Weekdays (Пн, Вт, Ср...) */
.calendar-widget :deep(.n-calendar-dates__weekdays) {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0;
  margin-bottom: 8px; /* Увеличиваем отступ между названиями дней и числами */
}

.calendar-widget :deep(.n-calendar-dates__weekday) {
  font-size: 12px; /* Чуть меньше */
  font-weight: 500;
  color: #718096;
  text-align: center;
  line-height: 24px; /* Фиксированная высота */
}

/* Weekends in weekdays (Сб, Вс) */
.calendar-widget :deep(.n-calendar-dates__weekday:nth-child(6)), /* Суббота */
.calendar-widget :deep(.n-calendar-dates__weekday:nth-child(7)) { /* Воскресенье */
  color: #e53e3e; /* Красный цвет для выходных */
}

/* Dates grid */
.calendar-widget :deep(.n-calendar-dates__panel) {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(40px, auto); /* Минимальная высота строки для дня */
  gap: 0; /* Убираем пробелы между ячейками */
  padding: 0;
}

/* Individual date cell */
.calendar-widget :deep(.n-calendar-cell) {
  box-sizing: border-box;
  width: 100%;
  height: 40px; /* Фиксированная высота ячейки */
  padding: 0; /* Убираем padding по умолчанию */
  position: relative;
  border: none; /* Убираем бордеры */
}

/* Стилизация внутреннего контента ячейки (который содержит число дня и ваш слот) */
.calendar-widget :deep(.n-calendar-cell__content) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  position: relative;
  padding: 0; /* Убираем внутренний padding */
}

/* Стилизация самого числа дня, которое выводит NCalendar (span с числом) */
.calendar-widget :deep(.n-calendar-cell__content > span) {
  font-size: 14px;
  font-weight: 400;
  color: #2d3748;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px; /* Фиксированная ширина для круга */
  height: 32px; /* Фиксированная высота для круга */
  border-radius: 50%; /* Для круглой формы выбранного дня */
  transition: background-color 0.2s, color 0.2s;
  /* Для наглядности, если нужно отцентрировать число */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}


/* Скрываем дни предыдущего/следующего месяца */
.calendar-widget :deep(.n-calendar-cell--not-current-month) {
  color: #cbd5e0 !important; /* Более светлый цвет */
  opacity: 1; /* Не меняем прозрачность */
  pointer-events: none; /* Делаем некликабельными */
}
/* Также делаем более светлым число дня */
.calendar-widget :deep(.n-calendar-cell--not-current-month .n-calendar-cell__content > span) {
    color: #cbd5e0 !important;
}


/* Selected day styling */
.calendar-widget :deep(.n-calendar-cell--selected .n-calendar-cell__content > span) {
  background-color: #2b6cb0; /* Синий фон как на изображении */
  color: white;
  font-weight: 600;
}

/* Ховер эффект для дней (если нужен) */
.calendar-widget :deep(.n-calendar-cell:not(.n-calendar-cell--selected):not(.n-calendar-cell--not-current-month):hover .n-calendar-cell__content > span) {
  background-color: #e2e8f0; /* Светло-серый фон при наведении */
  cursor: pointer;
}

/* Weekend dates (numbers) */
.calendar-widget :deep(.n-calendar-cell:nth-child(6) .n-calendar-cell__content > span), /* Суббота */
.calendar-widget :deep(.n-calendar-cell:nth-child(7) .n-calendar-cell__content > span), /* Воскресенье */
.calendar-widget :deep(.n-calendar-cell:nth-child(13) .n-calendar-cell__content > span), /* Суббота второй недели */
.calendar-widget :deep(.n-calendar-cell:nth-child(14) .n-calendar-cell__content > span), /* Воскресенье второй недели */
.calendar-widget :deep(.n-calendar-cell:nth-child(20) .n-calendar-cell__content > span), /* Суббота третьей недели */
.calendar-widget :deep(.n-calendar-cell:nth-child(21) .n-calendar-cell__content > span), /* Воскресенье третьей недели */
.calendar-widget :deep(.n-calendar-cell:nth-child(27) .n-calendar-cell__content > span), /* Суббота четвертой недели */
.calendar-widget :deep(.n-calendar-cell:nth-child(28) .n-calendar-cell__content > span), /* Воскресенье четвертой недели */
.calendar-widget :deep(.n-calendar-cell:nth-child(34) .n-calendar-cell__content > span), /* Суббота пятой недели */
.calendar-widget :deep(.n-calendar-cell:nth-child(35) .n-calendar-cell__content > span), /* Воскресенье пятой недели */
.calendar-widget :deep(.n-calendar-cell:nth-child(41) .n-calendar-cell__content > span), /* Суббота шестой недели */
.calendar-widget :deep(.n-calendar-cell:nth-child(42) .n-calendar-cell__content > span) { /* Воскресенье шестой недели */
  color: #e53e3e; /* Красный цвет для выходных */
}

/* Override selected day weekend color */
.calendar-widget :deep(.n-calendar-cell--selected .n-calendar-cell__content > span) {
  color: white !important; /* Цвет текста остается белым для выбранных выходных */
}


/* Event count styling */
/* calendar-day-content-wrapper - это наш кастомный элемент внутри слота */
.calendar-day-content-wrapper {
  position: absolute; /* Позиционируем относительно n-calendar-cell */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.event-count {
  font-size: 10px;
  background: #c53030;
  color: white;
  border-radius: 50%;
  padding: 2px 4px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 4px;
  right: 4px;
  cursor: pointer;
  z-index: 10;
  line-height: 1;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>