<template>
  <div class="railway-section-wrapper">
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
          
          <TransitionGroup name="marker-fade">
            <div 
              v-for="cluster in clusteredIncidents" 
              :key="cluster.id"
              class="track-marker incident-point" 
              :class="getClusterClass(cluster)" 
              :style="{ left: cluster.position + '%' }" 
              :title="cluster.title" 
              @click="handleIncidentClick(cluster, $event)"
            >
              <span v-if="cluster.count > 1" class="cluster-count">{{ cluster.count }}</span>
            </div>
          </TransitionGroup>

          <Transition name="tooltip-fade">
            <div v-if="selectedIncident" class="incident-tooltip" :style="getTooltipStyle(selectedIncident)" :class="getTooltipPositionClass(selectedIncident)" @click.stop>
                  <div class="tooltip-header">
                    {{ selectedIncident.count > 1 ? `КЛАСТЕР: ${selectedIncident.count} Инцидентов` : selectedIncident.rawData.nameCls }}
                  </div>
                  <div class="tooltip-body">
                    <div class="tooltip-item">
                      <strong>Координаты:</strong> 
                      {{ formatIncidentCoords(selectedIncident) }}
                    </div>
                    <div class="tooltip-item description" v-if="selectedIncident.count === 1">
                      <strong>Описание:</strong>
                      <p :class="{ 'text-collapsed': !isDescriptionExpanded }">
                        {{ selectedIncident.rawData.Description || 'Описание отсутствует' }}
                      </p>
                      <button 
                        v-if="isDescriptionLong(selectedIncident.rawData.Description)"
                        class="expand-btn"
                        @click="toggleDescription"
                      >
                        {{ isDescriptionExpanded ? 'Скрыть' : 'Ещё' }}
                      </button>
                    </div>
                    <div class="tooltip-item" v-if="selectedIncident.count > 1">
                      <strong>Типы инцидентов в кластере:</strong>
                      <ul>
                        <li v-for="item in selectedIncident.rawData" :key="item.id">
                          {{ item.nameCls }} ({{ formatIncidentCoords({ rawData: item }) }})
                        </li>
                      </ul>
                      <p class="cluster-tip">Для просмотра деталей откройте таблицу инцидентов.</p>
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
    <div v-if="isLoading" class="map-loading-overlay">
      <div class="spinner"></div>
      <span>Обновление данных на карте...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Общая длина линии для расчета процентов
const TOTAL_RAIL_LENGTH_KM = 151;
// Порог кластеризации в процентах (0.01 = 1% от общей длины линии)
// 1% от 151 км = 1.51 км. Это 15 пикетов.
const CLUSTER_THRESHOLD_PERCENT = 1.5; 

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
  isLoading: {
    type: Boolean,
    default: false,
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

// **ЛОГИКА КЛАСТЕРИЗАЦИИ**
const clusteredIncidents = computed(() => {
  if (!props.railwayIncidents || props.railwayIncidents.length === 0) {
    return [];
  }

  // 1. Сортируем инциденты по позиции
  const sortedIncidents = [...props.railwayIncidents].sort((a, b) => a.position - b.position);
  
  const clusters = [];
  let currentCluster = null;

  sortedIncidents.forEach(incident => {
    if (!currentCluster) {
      // Инициализируем новый кластер первым инцидентом
      currentCluster = {
        id: incident.id,
        position: incident.position,
        color: incident.color,
        title: incident.title,
        count: 1,
        // Сохраняем все данные, чтобы показать их в тултипе
        rawData: [incident.rawData], 
      };
      clusters.push(currentCluster);
      return;
    }

    // Проверяем расстояние между текущим инцидентом и центром текущего кластера
    const distance = incident.position - currentCluster.position;

    if (distance <= CLUSTER_THRESHOLD_PERCENT) {
      // 2. Инцидент находится близко, добавляем его в текущий кластер
      currentCluster.count++;
      currentCluster.rawData.push(incident.rawData);
      
      // Обновляем позицию кластера (используем среднее для центрирования)
      const totalPosition = currentCluster.rawData.reduce((sum, item) => 
        sum + ((item.StartKm || 0) + (item.StartPicket / 10 || 0)), 0);
      
      const avgKm = totalPosition / currentCluster.count;
      currentCluster.position = (avgKm / TOTAL_RAIL_LENGTH_KM) * 100;

      // Обновляем цвет кластера (приоритет: Красный > Желтый > Зеленый)
      if (incident.color === 'red-marker') {
        currentCluster.color = 'red-marker';
      } else if (incident.color === 'yellow-marker' && currentCluster.color !== 'red-marker') {
        currentCluster.color = 'yellow-marker';
      }
      
      currentCluster.title = `${currentCluster.count} инцидентов в кластере`;
    } else {
      // 3. Инцидент слишком далек, начинаем новый кластер
      currentCluster = {
        id: incident.id,
        position: incident.position,
        color: incident.color,
        title: incident.title,
        count: 1,
        rawData: [incident.rawData],
      };
      clusters.push(currentCluster);
    }
  });

  return clusters.map(cluster => ({
    ...cluster,
    // Для кластеров возвращаем полный массив rawData, 
    // для одиночных инцидентов - первый элемент массива
    rawData: cluster.count > 1 ? cluster.rawData : cluster.rawData[0]
  }));
});

/**
 * Возвращает класс CSS для маркера инцидента/кластера.
 * Для кластера добавляет специальный класс 'cluster-marker'.
 */
const getClusterClass = (cluster) => {
  return {
    [cluster.color]: true,
    'cluster-marker': cluster.count > 1
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
  const pk = Math.round((kmValue - km) * 10); 
  return `${km}км ${pk}пк`;
};

const formatIncidentCoords = (incident) => {
  // Если это кластер (count > 1)
  if (incident.count > 1) {
    // Находим минимальные и максимальные координаты в кластере
    const startPositions = incident.rawData.map(item => convertKmPkToTotalKm(item.StartKm, item.StartPicket));
    const minKmTotal = Math.min(...startPositions);
    const maxKmTotal = Math.max(...startPositions);
    
    const minKm = Math.floor(minKmTotal);
    const minPk = Math.round((minKmTotal - minKm) * 10);
    const maxKm = Math.floor(maxKmTotal);
    const maxPk = Math.round((maxKmTotal - maxKm) * 10);

    return `от ${minKm}км ${minPk}пк до ${maxKm}км ${maxPk}пк`;
  } 
  // Если это одиночный инцидент
  else {
    const incidentData = incident.rawData;
    return `${incidentData.StartKm || 0}км ${incidentData.StartPicket || 0}пк`;
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
 */
const getTooltipPositionClass = (incident) => {
  const position = incident.position;
  
  if (position < 40) {
    return 'tooltip-right'; 
  }
  else if (position > 60) {
    return 'tooltip-left'; 
  }
  return 'tooltip-center';
};

const handleIncidentClick = (cluster, event) => {
  if (selectedIncident.value && selectedIncident.value.id === cluster.id) {
    selectedIncident.value = null; // Закрыть тултип при повторном клике
    isDescriptionExpanded.value = false;
  } else {
    // В selectedIncident.value мы сохраняем объект кластера
    selectedIncident.value = cluster;
    isDescriptionExpanded.value = false; 
  }
  emit('incident-click', cluster);
};
</script>

<style scoped>
/* ВСЕ СТИЛИ ИЗ БЛОКА .railway-section */
.railway-section-wrapper {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 32px;
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

/* --- Анимация для маркеров --- */
.marker-fade-enter-active {
  transition: all 0.3s ease-out;
  transition-delay: 0.15s; /* Небольшая задержка перед появлением */
}
.marker-fade-leave-active {
  transition: all 0.15s ease-in;
  position: absolute; /* Важно для плавного удаления */
}

.marker-fade-enter-from,
.marker-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}

/* --- СТИЛИ ДЛЯ ИНЦИДЕНТОВ/КЛАСТЕРОВ --- */
.incident-point {
  width: 10px;
  height: 10px;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 16;
  /* Добавляем флекс-контейнер для центрирования числа */
  display: flex;
  align-items: center;
  justify-content: center;
} 

/* Стили для маркера кластера */
.incident-point.cluster-marker {
  width: 24px;
  height: 24px;
  border-width: 4px;
}

.cluster-count {
  font-size: 11px;
  font-weight: 700;
  color: white;
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

.tooltip-item ul {
  padding-left: 15px;
  margin-top: 4px;
  list-style: disc;
}

.tooltip-item li {
  margin-bottom: 4px;
}

.cluster-tip {
  margin-top: 8px;
  color: #9f7aea;
  font-weight: 500;
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

/* Цветовые классы для точек */
.red-marker {
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

.yellow-marker {
  background-color: #eab308;
  animation: pulse-yellow 2s infinite;
}

@keyframes pulse-yellow {
  0% {
    box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(234, 179, 8, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(234, 179, 8, 0);
  }
}

.orange-marker {
  background-color: #FB8C00;
  animation: pulse-orange 2s infinite;
}

@keyframes pulse-orange {
  0% {
    box-shadow: 0 0 0 0 rgba(251, 140, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(251, 140, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(251, 140, 0, 0);
  }
}

.purple-marker {
  background-color: #8E24AA;
  animation: pulse-purple 2s infinite;
}

@keyframes pulse-purple {
  0% {
    box-shadow: 0 0 0 0 rgba(142, 36, 170, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(142, 36, 170, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(142, 36, 170, 0);
  }
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

.map-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 18; /* Ниже чем тултип, но выше карты */
  border-radius: 12px;
  transition: opacity 0.2s ease;
  gap: 16px;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #3182ce;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
    /* Меняем размер только одиночных точек, кластеры имеют фиксированный размер */
    width: 18px; 
    height: 18px;
  }
  .track-marker.cluster-marker {
    width: 24px;
    height: 24px;
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