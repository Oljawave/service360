<template>
  <div class="railway-section">
    <div v-if="selectedIncident" class="overlay" @click="selectedIncident = null"></div>
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
          
          <!-- Отрисовка маркеров инцидентов -->
          <template v-for="incident in railwayIncidents" :key="incident.id">
            <div v-if="isSegment(incident)" class="incident-segment-wrapper" :style="getSegmentStyle(incident)" :title="incident.title" @click="handleIncidentClick(incident, $event)">
              <div class="incident-segment" :class="incident.color.replace('-marker', '-segment')"></div>
              <div class="segment-start-point track-marker incident-point" :class="incident.color"></div>
              <div class="segment-end-point track-marker incident-point" :class="incident.color"></div>
            </div>
            <div v-else class="track-marker incident-point" :class="incident.color" :style="{ left: incident.position + '%' }" :title="incident.title" @click="handleIncidentClick(incident, $event)"></div>
          </template>

          <!-- Единственный экземпляр тултипа, который будет отображаться поверх всего -->
          <Transition name="tooltip-fade">
            <div v-if="selectedIncident" class="incident-tooltip" :style="getTooltipStyle(selectedIncident)" :class="getTooltipPositionClass(selectedIncident)" @click.stop>
                  <div class="tooltip-header">{{ selectedIncident.rawData.nameCls }}</div>
                  <div class="tooltip-body">
                    <div class="tooltip-item"><strong>Координаты:</strong> {{ formatIncidentCoords(selectedIncident.rawData) }}</div>
                    <div class="tooltip-item description">
                      <strong>Описание:</strong>
                      <p :class="{ 'text-collapsed': !isDescriptionExpanded }">
                        {{ selectedIncident.rawData.Description }}
                      </p>
                      <button 
                        v-if="isDescriptionLong(selectedIncident.rawData.Description)"
                        class="expand-btn"
                        @click="toggleDescription"
                      >
                        {{ isDescriptionExpanded ? 'Скрыть' : 'Ещё' }}
                      </button>
                    </div>
                  </div>
                </div>
          </Transition>

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
</template>

<script setup>
import { ref, computed } from 'vue';

// Общая длина линии для расчета процентов
const TOTAL_RAIL_LENGTH_KM = 151;

// Принимаем данные от родительского компонента
const props = defineProps({
  intermediateStations: {
    type: Array,
    required: true,
  },
  railwayIncidents: {
    type: Array,
    required: true,
  },
});

// Определяем события, которые может излучать компонент
const emit = defineEmits(['incident-click']);

const hoveredStationId = ref(null);
const selectedIncident = ref(null);
const isDescriptionExpanded = ref(false);

/**
 * Преобразует координаты КМ и ПК в общую длину в километрах.
 * (1 пикет = 0.1 км)
 */
const convertKmPkToTotalKm = (km, pk) => {
  return (km || 0) + (pk || 0) / 10;
};

/**
 * Преобразует координаты КМ и ПК в процентное положение на линии.
 */
const convertKmPkToPercentage = (km, pk) => {
  const totalKm = convertKmPkToTotalKm(km, pk);
  return (totalKm / TOTAL_RAIL_LENGTH_KM) * 100;
};

/**
 * Определяет, является ли инцидент сегментом (линией).
 * Инцидент считается сегментом, если у него есть конечные координаты
 * и конечная точка находится дальше начальной.
 */
const isSegment = (incident) => {
  if (!incident.rawData || incident.rawData.FinishKm === undefined || incident.rawData.FinishKm === null) {
    return false;
  }
  
  const startKmTotal = convertKmPkToTotalKm(incident.rawData.StartKm, incident.rawData.StartPicket);
  const finishKmTotal = convertKmPkToTotalKm(incident.rawData.FinishKm, incident.rawData.FinishPicket);
  
  // Убеждаемся, что это действительно участок, а не одна точка
  return finishKmTotal > startKmTotal;
};

/**
 * Рассчитывает CSS-стили (left и width) для сегмента.
 */
const getSegmentStyle = (incident) => {
  const { StartKm, StartPicket, FinishKm, FinishPicket } = incident.rawData;
  
  const startPercent = convertKmPkToPercentage(StartKm, StartPicket);
  const finishPercent = convertKmPkToPercentage(FinishKm, FinishPicket);
  
  const widthPercent = finishPercent - startPercent;
  
  return {
    left: `${startPercent}%`,
    width: `${widthPercent}%`,
  };
};

/**
 * Рассчитывает позиционирование для тултипа.
 */
const getTooltipStyle = (incident) => {
  if (!incident) return {};

  const positionClass = getTooltipPositionClass(incident);
  const incidentPosition = incident.position;

  if (positionClass === 'tooltip-center') {
    return { left: `${incidentPosition}%` };
  }
  if (positionClass === 'tooltip-right') {
    return { left: `${incidentPosition}%` };
  }
  if (positionClass === 'tooltip-left') {
    return { right: `${100 - incidentPosition}%` };
  }
};

const formatStationCoords = (kmValue) => {
  if (kmValue === null || kmValue === undefined) return '';
  const km = Math.floor(kmValue);
  // Расчет пикета: остаток км * 10 (потому что 1км = 10пк)
  const pk = Math.round((kmValue - km) * 10); 
  return `${km}км ${pk}пк`;
};

const formatIncidentCoords = (incidentData) => {
  if (!incidentData) return 'Нет данных';
  const { StartKm, StartPicket, FinishKm, FinishPicket } = incidentData;
  // Для сегментов показываем обе точки, для точек - только начальную
  if (isSegment({ rawData: incidentData })) {
    const start = `${StartKm || 0}км ${StartPicket || 0}пк`;
    const end = `${FinishKm || 0}км ${FinishPicket || 0}пк`;
    return `${start} - ${end}`;
  } else {
    return `${StartKm || 0}км ${StartPicket || 0}пк`;
  }
};

/**
 * Определяет, нужно ли показывать кнопку "Ещё" для описания
 */
const isDescriptionLong = (description) => {
  if (!description) return false;
  return description.length > 100;
};

/**
 * Переключает развёрнутое/свёрнутое состояние описания
 */
const toggleDescription = () => {
  isDescriptionExpanded.value = !isDescriptionExpanded.value;
};

/**
 * Определяет позицию тултипа в зависимости от положения инцидента
 * Возвращает класс для CSS
 */
const getTooltipPositionClass = (incident) => {
  const position = incident.position;
  
  // Если инцидент в левой части (0-40%), показываем тултип справа
  if (position < 40) {
    return 'tooltip-right'; // Будет позиционироваться от left
  }
  // Если в правой части (60-100%), показываем слева
  else if (position > 60) {
    return 'tooltip-left'; // Будет позиционироваться от right
  }
  // В центре (40-60%) показываем сверху по центру (default)
  return 'tooltip-center';
};

const handleIncidentClick = (incident, event) => {
  if (selectedIncident.value && selectedIncident.value.id === incident.id) {
    selectedIncident.value = null; // Закрыть тултип при повторном клике
    isDescriptionExpanded.value = false;
  } else {
    selectedIncident.value = incident;
    isDescriptionExpanded.value = false; // Сбрасываем состояние при открытии нового
  }
  emit('incident-click', incident);
};
</script>

<style scoped>
/* ВСЕ СТИЛИ ИЗ БЛОКА .railway-section */

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
  width: 100%;
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

/* --- ИЗМЕНЕНИЯ Z-INDEX ЗДЕСЬ --- */
.incident-point {
  width: 10px;
  height: 10px;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 16;
} 

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 19;
}

.incident-tooltip {
  position: absolute;
  width: 320px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  z-index: 20;
  color: #1a202c;
  text-align: left;
  cursor: default;
}

/* Позиционирование тултипа по центру (по умолчанию - сверху) */
.incident-tooltip.tooltip-center {
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
}

.incident-tooltip.tooltip-center::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -8px;
  border-width: 8px;
  border-style: solid;
  border-color: white transparent transparent transparent;
}

/* Позиционирование тултипа справа */
.incident-tooltip.tooltip-right {
  bottom: 50%;
  transform: translateY(50%); /* Центрируем по вертикали */
  margin-left: 12px; /* Отступ от маркера */
}

.incident-tooltip.tooltip-right::after {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  margin-top: -8px;
  border-width: 8px;
  border-style: solid;
  border-color: transparent white transparent transparent;
}

/* Позиционирование тултипа слева */
.incident-tooltip.tooltip-left {
  bottom: 50%;
  transform: translateY(50%); /* Центрируем по вертикали */
  margin-right: 12px; /* Отступ от маркера */
}

.incident-tooltip.tooltip-left::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 50%;
  margin-top: -8px;
  border-width: 8px;
  border-style: solid;
  border-color: transparent transparent transparent white;
}

.tooltip-header {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.tooltip-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tooltip-item {
  font-size: 13px;
  line-height: 1.5;
}

.tooltip-item strong {
  font-weight: 500;
  color: #718096;
  display: block;
  margin-bottom: 2px;
}

.tooltip-item.description p {
  margin: 0;
  max-height: 120px;
  overflow-y: auto;
  transition: max-height 0.3s ease;
}

.tooltip-item.description p.text-collapsed {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.expand-btn {
  background: none;
  border: none;
  color: #2b6cb0;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 4px;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.expand-btn:hover {
  color: #1a4d8f;
}

/* --- СТИЛИ ДЛЯ ЛИНИЙ ИНЦИДЕНТОВ --- */

/* Оболочка для сегмента */
.incident-segment-wrapper {
  position: absolute;
  top: 50%; 
  transform: translateY(-50%);
  height: 16px;
  cursor: pointer;
  z-index: 8; 
}

/* Сама линия инцидента */
.incident-segment {
  position: absolute;
  top: 34%;
  left: 0;
  width: 100%;
  height: 4px; 
  border-radius: 4px;
}

/* Точка-маркер в начале сегмента */
.segment-start-point {
  left: 0;
  z-index: 12;
  pointer-events: none;
}

/* Точка-маркер в конце сегмента */
.segment-end-point {
  left: 100%;
  z-index: 12;
  pointer-events: none;
}
.red-segment {
  background-color: #ef4444;
  animation: pulse-red-segment 2s infinite;
}

.yellow-segment {
  background-color: #eab308;
}

.green-segment {
  background-color: #22c55e;
}

/* Цветовые классы для точек (точек/начала сегмента) */
.red-marker, .segment-start-point.red-marker {
  background-color: #ef4444;
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

@keyframes pulse-red-segment {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.yellow-marker, .segment-start-point.yellow-marker {
  background-color: #eab308;
}

.green-marker, .segment-start-point.green-marker {
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
  
  .incident-tooltip {
    width: 280px;
  }
}

@media (max-width: 480px) {
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
  
  .incident-tooltip {
    width: 260px;
  }
}
</style>