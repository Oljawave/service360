<template>
  <div class="railway-section-wrapper">
    <div class="railway-section">
    <div class="status-header">
      <div>
        <h2 class="railway-title">Оценка состояния пути на {{ currentDate }}</h2>
        <p class="railway-subtitle">Средний балл {{ averageScore }}</p>
      </div>
      <div class="status-legend">
        <div class="legend-item">
          <div class="legend-color" style="background-color: #10b981;"></div>
          <span class="legend-text">{{ statusStats.excellent }} км  Отлично ≤ 25</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #84cc16;"></div>
          <span class="legend-text">{{ statusStats.good }} км  Хорошо ≤ 80</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #f97316;"></div>
          <span class="legend-text">{{ statusStats.satisfactory }} км  Удовл. ≤ 180</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #ef4444;"></div>
          <span class="legend-text">{{ statusStats.poor }} км  Неудовл. > 180</span>
        </div>
      </div>
    </div>

    <div class="railway-container">
      <div class="stations-row">
        <div class="station-info">
          <div class="station-name">Станция Шар</div>
        </div>
        <div class="station-info">
          <div class="station-name">Станция НУК</div>
        </div>
      </div>

      <div class="railway-slider">
        <div class="railway-track">
          <!-- Пунктирные сегменты -->
          <div
            v-for="segment in railwaySegments"
            :key="segment.km"
            class="railway-segment"
            :style="{
              left: segment.startPercent + '%',
              width: segment.widthPercent + '%',
              backgroundColor: segment.color
            }"
            @mouseenter="hoveredSegmentKm = segment.km"
            @mouseleave="hoveredSegmentKm = null"
          >
            <Transition name="tooltip-fade">
              <div v-if="hoveredSegmentKm === segment.km && segment.paramsLimit !== null && segment.paramsLimit !== undefined" class="segment-tooltip">
                <div class="tooltip-header">Километр: {{ segment.finishKm }} км</div>
                <div class="tooltip-body">
                  <div class="tooltip-item">
                    <strong>Состояние</strong>
                    <span>{{ segment.status }}</span>
                  </div>
                  <div class="tooltip-item"><strong>Балл</strong><span>{{ segment.paramsLimit }}</span></div>
                </div>
              </div>
            </Transition>
          </div>

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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Принимаем данные от родительского компонента
const props = defineProps({
  intermediateStations: {
    type: Array,
    required: true,
  },
  statusSegments: {
    type: Array,
    default: () => [],
  },
});

const TOTAL_RAIL_LENGTH_KM = 151;

const hoveredStationId = ref(null);
const hoveredSegmentKm = ref(null);

// Форматируем текущую дату
const currentDate = computed(() => {
  const today = new Date();
  return today.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
});

const formatStationCoords = (kmValue) => {
  if (kmValue === null || kmValue === undefined) return '';
  const km = Math.floor(kmValue);
  const pk = Math.round((kmValue - km) * 10);
  return `${km}км ${pk}пк`;
};

// Определяем цвет сегмента на основе ParamsLimit
const getSegmentColor = (paramsLimit) => {
  if (paramsLimit <= 25) return '#10b981'; // зеленый
  if (paramsLimit <= 80) return '#84cc16'; // салатовый
  if (paramsLimit <= 180) return '#f97316'; // оранжевый
  return '#ef4444'; // красный
};

// Определяем статус на основе ParamsLimit
const getSegmentStatus = (paramsLimit) => {
  if (paramsLimit <= 25) return 'Отлично';
  if (paramsLimit <= 80) return 'Хорошо';
  if (paramsLimit <= 180) return 'Удовлетворительно';
  return 'Неудовлетворительно';
};

// Создаем массив всех километровых сегментов с учетом данных о состоянии
const railwaySegments = computed(() => {
  const segments = [];

  // Создаем Map для быстрого поиска данных по километру
  const statusMap = new Map();
  props.statusSegments.forEach(segment => {
    const startKm = Math.floor(segment.StartKm || 0);
    const finishKm = Math.floor(segment.FinishKm || 0);

    // Заполняем все километры в диапазоне
    for (let km = startKm; km <= finishKm; km++) {
      statusMap.set(km, segment);
    }
  });

  // Создаем сегменты для каждого километра
  for (let km = 0; km < TOTAL_RAIL_LENGTH_KM; km++) {
    const startPercent = (km / TOTAL_RAIL_LENGTH_KM) * 100;
    const endPercent = ((km + 1) / TOTAL_RAIL_LENGTH_KM) * 100;
    const totalWidth = endPercent - startPercent;

    // Делаем сегмент уже, оставляя промежуток (95% ширины, 5% - промежуток)
    const widthPercent = totalWidth * 0.95;

    const statusData = statusMap.get(km);
    const color = statusData ? getSegmentColor(statusData.ParamsLimit) : '#cbd5e1'; // серый по умолчанию

    segments.push({
      km,
      startPercent,
      widthPercent,
      color,
      paramsLimit: statusData?.ParamsLimit,
      finishKm: statusData?.FinishKm,
      status: statusData ? getSegmentStatus(statusData.ParamsLimit) : null,
    });
  }

  return segments;
});

// Вычисляем статистику по категориям
const statusStats = computed(() => {
  const stats = {
    excellent: 0, // ≤ 25
    good: 0,      // ≤ 80
    satisfactory: 0, // ≤ 180
    poor: 0,      // > 180
    totalScore: 0,
    count: 0,
  };

  railwaySegments.value.forEach(segment => {
    if (segment.paramsLimit !== undefined && segment.paramsLimit !== null) {
      stats.count++;
      stats.totalScore += segment.paramsLimit;

      if (segment.paramsLimit <= 25) {
        stats.excellent++;
      } else if (segment.paramsLimit <= 80) {
        stats.good++;
      } else if (segment.paramsLimit <= 180) {
        stats.satisfactory++;
      } else {
        stats.poor++;
      }
    }
  });

  return stats;
});

// Средний балл
const averageScore = computed(() => {
  if (statusStats.value.count === 0) return 0;
  return Math.round(statusStats.value.totalScore / statusStats.value.count);
});
</script>

<style scoped>
.railway-section-wrapper {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 32px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 24px;
}

.railway-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 4px;
}

.railway-subtitle {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.status-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-text {
  font-size: 13px;
  color: #4a5568;
  white-space: nowrap;
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
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
}

.railway-slider {
  background: #e8edf2;
  border-radius: 50px;
  padding: 20px 24px;
  margin-bottom: 12px;
}

.railway-track {
  position: relative;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
}

.railway-segment {
  position: absolute;
  height: 6px;
  border-radius: 1px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.railway-segment:hover {
  transform: scaleY(1.3);
  z-index: 10;
}

.segment-tooltip {
  position: absolute;
  bottom: 20px;
  left: 50%;
  width: 240px;
  transform: translateX(-50%);
  background-color: white;
  color: #1a202c;
  border-radius: 8px;
  font-size: 13px;
  white-space: normal;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  z-index: 25;
  pointer-events: none;
}

.segment-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -6px;
  border-width: 6px;
  border-style: solid;
  border-color: white transparent transparent transparent;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
}

.tooltip-header {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.tooltip-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tooltip-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.tooltip-item strong {
  font-weight: 600;
  color: #4a5568;
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
}

@media (max-width: 480px) {
  .railway-section {
    padding: 20px 16px;
  }

  .railway-slider {
    padding: 14px 16px;
  }

  .distance-labels {
    padding: 0 8px;
  }

  .station-label {
    font-size: 8px;
  }
}
</style>
