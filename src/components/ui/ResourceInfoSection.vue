<template>
  <div class="info-section">
    <div class="info-block work-details">
      <p class="info-item">
        <span class="label-strong">Задача:</span>
        {{ recordData.taskName }}
      </p>
      <p class="info-item">
        <span class="label-strong">Работа:</span>
        {{ recordData.workName }}
      </p>
      <p class="info-item">
        <span class="label-strong">Участок:</span>
        {{ recordData.section }}
      </p>
      <p class="info-item">
        <span class="label-strong">Место:</span>
        {{ recordData.place }}
      </p>
      <p class="info-item">
        <span class="label-strong">Объект:</span>
        {{ recordData.objectName }}
      </p>
      <p class="info-item">
        <span class="label-strong">Координаты:</span>
        {{ recordData.coordinates }}
      </p>
    </div>

    <div class="info-block plan-fact-container">
      <div class="plan-fact-group volume-group">
        <div class="group-header">
          <span class="group-title">Объем:</span>
          <span class="volume-short-fact">План: {{ recordData.volume || '-' }} / Факт: {{ recordData.volumeFact || '-' }}</span>
        </div>
      </div>

      <hr class="divider" />

      <div class="dates-section-like-image">
        <div class="date-column start-date-column">
          <span class="date-header">Начало:</span>
          <div class="date-details-row">
            <span class="date-label">План:</span>
            <span class="date-value">{{ recordData.startDate || '-' }}</span>
          </div>
          <div class="date-details-row">
            <span class="date-label">Факт:</span>
            <span class="date-value">{{ recordData.startDateFact || '-' }}</span>
          </div>
        </div>
        
        <hr class="vertical-divider" />

        <div class="date-column end-date-column">
          <span class="date-header">Конец:</span>
          <div class="date-details-row">
            <span class="date-label">План:</span>
            <span class="date-value">{{ recordData.endDate || '-' }}</span>
          </div>
          <div class="date-details-row">
            <span class="date-label">Факт:</span>
            <span class="date-value">{{ recordData.endDateFact || '-' }}</span>
          </div>
        </div>
      </div>

      <button class="start-task-button">
        Начать задачу
      </button>
    </div>
  </div>
</template>

<script setup>
import { Box as BoxIcon, Calendar as CalendarIcon } from 'lucide-vue-next'; 

defineProps({
  recordData: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>

.info-section {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(300px, 0.7fr);
  gap: 48px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.work-details .info-item {
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
  display: flex;
  align-items: center;
}

.label-strong {
  font-weight: 600;
  color: #2d3748;
  min-width: 100px;
}

.plan-fact-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-left: 1px solid #e2e8f0;
  padding-left: 24px;
}

.volume-group {
    margin-bottom: 0; 
}
.plan-fact-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
  justify-content: space-between; 
}

.icon {
  width: 18px;
  height: 18px;
  color: #718096;
}

.group-title {
  font-weight: 600;
  color: #2d3748;
}

.volume-short-fact {
    font-size: 14px;
    font-weight: normal;
    color: #2d3748;
}

.dates-section-like-image {
    display: flex;
    justify-content: space-between;
    align-items: flex-start; 
    gap: 24px;
    margin-top: 16px;
    font-size: 14px;
    color: #4a5568;
}

.date-column {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 4px;
}

.date-header {
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 4px;
}

.date-details-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    line-height: 1.4;
}

.date-label {
    font-weight: normal;
    color: #4a5568;
    margin-right: 12px;
}

.date-value {
    font-weight: 600; 
    color: #2d3748;
    white-space: nowrap; 
}

.vertical-divider {
    border: none;
    border-left: 1px solid #e2e8f0;
    height: 100px; 
    margin: 0 12px;
    align-self: stretch; 
}

.divider {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 0 -24px;
}

.start-task-button {
  width: 100%;
  padding: 11px 16px; 
  background-color: #eff6ff; 
  color: #3b82f6; 
  border: 1px solid #3b82f6;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.start-task-button:hover {
  background-color: #dbeafe; 
  border-color: #2563eb;
}

@media (max-width: 900px) {
  .info-section {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .plan-fact-container {
    border-left: none;
    border-top: 1px solid #e2e8f0;
    padding-left: 0;
    padding-top: 24px;
    margin-top: 24px;
    gap: 16px;
  }

  .divider {
    margin: 0 -16px;
  }

  .dates-section-like-image {
    flex-direction: column;
    gap: 24px;
    margin-top: 16px;
  }
  
  .vertical-divider {
      display: block; 
      border-left: none;
      border-top: 1px solid #e2e8f0;
      height: auto;
      width: 100%;
      margin: 0;
  }
}
</style>