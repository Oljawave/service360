<template>
  <div class="railway-section-wrapper">
    <div class="railway-section">
    <div class="status-header">
      <div>
        <h2 class="railway-title">Оценка состояния пути на {{ currentDate }}</h2>
        <p class="railway-subtitle">Средний балл {{ averageScore }}</p>
      </div>
      <div class="status-legend">
        <div
          class="legend-item"
          :class="{ 'legend-item-active': selectedLegends.includes('excellent'), 'legend-item-inactive': selectedLegends.length > 0 && !selectedLegends.includes('excellent') }"
          @click="toggleLegend('excellent')"
        >
          <div class="legend-color" style="background-color: #10b981;"></div>
          <span class="legend-text">{{ statusStats.excellent }} км  Отлично ≤ 25</span>
        </div>
        <div
          class="legend-item"
          :class="{ 'legend-item-active': selectedLegends.includes('good'), 'legend-item-inactive': selectedLegends.length > 0 && !selectedLegends.includes('good') }"
          @click="toggleLegend('good')"
        >
          <div class="legend-color" style="background-color: #84cc16;"></div>
          <span class="legend-text">{{ statusStats.good }} км  Хорошо ≤ 80</span>
        </div>
        <div
          class="legend-item"
          :class="{ 'legend-item-active': selectedLegends.includes('satisfactory'), 'legend-item-inactive': selectedLegends.length > 0 && !selectedLegends.includes('satisfactory') }"
          @click="toggleLegend('satisfactory')"
        >
          <div class="legend-color" style="background-color: #f97316;"></div>
          <span class="legend-text">{{ statusStats.satisfactory }} км  Удовл. ≤ 180</span>
        </div>
        <div
          class="legend-item"
          :class="{ 'legend-item-active': selectedLegends.includes('poor'), 'legend-item-inactive': selectedLegends.length > 0 && !selectedLegends.includes('poor') }"
          @click="toggleLegend('poor')"
        >
          <div class="legend-color" style="background-color: #ef4444;"></div>
          <span class="legend-text">{{ statusStats.poor }} км  Неудовл. > 180</span>
        </div>
      </div>
    </div>

    <div class="railway-container">
      <div class="stations-row">
        <div class="station-info">
          <div class="station-name">{{ edgeStations.startStation.name }}</div>
        </div>
        <div class="station-info">
          <div class="station-name">{{ edgeStations.endStation.name }}</div>
        </div>
      </div>

      <div class="railway-slider">
        <div
          ref="railwayTrackRef"
          class="railway-track"
          :class="{ 'is-dragging': isDragging, 'is-zoomable': zoomLevel > MIN_ZOOM }"
          @mousedown="handleMouseDown"
        >

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
              <div v-if="hoveredSegmentKm === segment.km && segment.status" class="segment-tooltip">
                <div class="tooltip-row"><strong>Состояние:</strong> {{ segment.status }}</div>
                <div class="tooltip-row"><strong>Балл:</strong> {{ segment.paramsLimit }}</div>
                <div class="tooltip-row"><strong>Километр:</strong> {{ segment.km }} км</div>
              </div>
            </Transition>
          </div>

          <div class="track-marker start-point" :style="{ left: '0%' }"></div>

          <div
            v-for="station in visibleStations"
            :key="station.id"
            class="track-marker intermediate-station"
            :style="{ left: station.position }"
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
        <span
          v-for="label in distanceLabels"
          :key="label.km"
          class="distance-label"
          :style="{ left: label.position }"
        >
          {{ label.label }}
        </span>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

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
const selectedLegends = ref([]);

const zoomLevel = ref(1);
const panOffset = ref(0);
const railwayTrackRef = ref(null);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartOffset = ref(0);

const MIN_ZOOM = 1;
const MAX_ZOOM = 20;
const ZOOM_SPEED = 0.1;
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

const toggleLegend = (legendType) => {
  const index = selectedLegends.value.indexOf(legendType);
  if (index > -1) {
    selectedLegends.value.splice(index, 1);
  } else {
    selectedLegends.value.push(legendType);
  }
};

const getSegmentColor = (paramsLimit) => {
  if (paramsLimit <= 25) return '#10b981'; // зеленый
  if (paramsLimit <= 80) return '#84cc16'; // салатовый
  if (paramsLimit <= 180) return '#f97316'; // оранжевый
  return '#ef4444'; // красный
};

const getSegmentStatus = (paramsLimit) => {
  if (paramsLimit <= 25) return 'Отлично';
  if (paramsLimit <= 80) return 'Хорошо';
  if (paramsLimit <= 180) return 'Удовлетворительно';
  return 'Неудовлетворительно';
};

const getSegmentStatusType = (paramsLimit) => {
  if (paramsLimit <= 25) return 'excellent';
  if (paramsLimit <= 80) return 'good';
  if (paramsLimit <= 180) return 'satisfactory';
  return 'poor';
};

const railwaySegments = computed(() => {
  const segments = [];
  const { startKm: viewStartKm, endKm: viewEndKm } = visibleRange.value;

  const statusMap = new Map();
  props.statusSegments.forEach(segment => {
    const startKm = Math.floor(segment.StartKm || 0);
    const finishKm = Math.floor(segment.FinishKm || 0);

    for (let km = startKm; km <= finishKm; km++) {
      statusMap.set(km, segment);
    }
  });

  const startKmFloor = Math.floor(viewStartKm);
  const endKmCeil = Math.ceil(viewEndKm);

  for (let km = startKmFloor; km <= endKmCeil && km <= TOTAL_RAIL_LENGTH_KM; km++) {
    const segmentStart = Math.max(km, viewStartKm);
    const segmentEnd = Math.min(km + 1, viewEndKm);

    if (segmentEnd <= segmentStart) continue;

    const startPercent = ((segmentStart - viewStartKm) / (viewEndKm - viewStartKm)) * 100;
    const endPercent = ((segmentEnd - viewStartKm) / (viewEndKm - viewStartKm)) * 100;
    const totalWidth = endPercent - startPercent;

  
    const widthPercent = totalWidth * 0.95;

    const statusData = statusMap.get(km);
    const color = statusData ? getSegmentColor(statusData.ParamsLimit) : '#cbd5e1'; 
    const statusType = statusData ? getSegmentStatusType(statusData.ParamsLimit) : null;


    if (selectedLegends.value.length > 0 && statusType && !selectedLegends.value.includes(statusType)) {
      continue;
    }

    segments.push({
      km,
      startPercent,
      widthPercent,
      color,
      paramsLimit: statusData?.ParamsLimit,
      finishKm: statusData?.FinishKm,
      status: statusData ? getSegmentStatus(statusData.ParamsLimit) : null,
      statusType,
    });
  }

  return segments;
});

const statusStats = computed(() => {
  const stats = {
    excellent: 0, 
    good: 0,      
    satisfactory: 0, 
    poor: 0,   
    totalScore: 0,
    count: 0,
  };

  const { startKm: viewStartKm, endKm: viewEndKm } = visibleRange.value;


  props.statusSegments.forEach(segment => {
    const segStartKm = segment.StartKm || 0;

    if (segStartKm >= viewStartKm && segStartKm < viewEndKm) {
      if (segment.ParamsLimit !== undefined && segment.ParamsLimit !== null) {
        stats.count++;
        stats.totalScore += segment.ParamsLimit;

        if (segment.ParamsLimit <= 25) {
          stats.excellent++;
        } else if (segment.ParamsLimit <= 80) {
          stats.good++;
        } else if (segment.ParamsLimit <= 180) {
          stats.satisfactory++;
        } else {
          stats.poor++;
        }
      }
    }
  });

  return stats;
});

const averageScore = computed(() => {
  if (statusStats.value.count === 0) return 0;
  return Math.round(statusStats.value.totalScore / statusStats.value.count);
});

const visibleRange = computed(() => {
  const visibleWidth = TOTAL_RAIL_LENGTH_KM / zoomLevel.value;
  const maxOffset = TOTAL_RAIL_LENGTH_KM - visibleWidth;
  const actualOffset = Math.max(0, Math.min(maxOffset, (panOffset.value / 100) * TOTAL_RAIL_LENGTH_KM));

  return {
    startKm: actualOffset,
    endKm: actualOffset + visibleWidth,
    visibleWidth
  };
});

const handleWheel = (event) => {
  event.preventDefault();

  const delta = -Math.sign(event.deltaY);
  const newZoom = zoomLevel.value + delta * ZOOM_SPEED * zoomLevel.value;


  const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

  if (clampedZoom !== zoomLevel.value) {

    const rect = railwayTrackRef.value.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mousePercent = mouseX / rect.width;

    const oldVisibleWidth = TOTAL_RAIL_LENGTH_KM / zoomLevel.value;
    const newVisibleWidth = TOTAL_RAIL_LENGTH_KM / clampedZoom;

    const currentStartKm = (panOffset.value / 100) * TOTAL_RAIL_LENGTH_KM;
    const mouseKm = currentStartKm + oldVisibleWidth * mousePercent;

    const newStartKm = mouseKm - newVisibleWidth * mousePercent;
    const maxOffset = TOTAL_RAIL_LENGTH_KM - newVisibleWidth;
    const clampedStartKm = Math.max(0, Math.min(maxOffset, newStartKm));

    zoomLevel.value = clampedZoom;
    panOffset.value = (clampedStartKm / TOTAL_RAIL_LENGTH_KM) * 100;
  }
};

const handleMouseDown = (event) => {
  if (zoomLevel.value > MIN_ZOOM) {
    isDragging.value = true;
    dragStartX.value = event.clientX;
    dragStartOffset.value = panOffset.value;
    event.preventDefault();
  }
};

const handleMouseMove = (event) => {
  if (isDragging.value && railwayTrackRef.value) {
    const rect = railwayTrackRef.value.getBoundingClientRect();
    const deltaX = event.clientX - dragStartX.value;
    const deltaPercent = -(deltaX / rect.width) * (100 / zoomLevel.value);

    const newOffset = dragStartOffset.value + deltaPercent;
    const maxOffset = ((TOTAL_RAIL_LENGTH_KM - visibleRange.value.visibleWidth) / TOTAL_RAIL_LENGTH_KM) * 100;

    panOffset.value = Math.max(0, Math.min(maxOffset, newOffset));
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
};

const visibleStations = computed(() => {
  const { startKm, endKm, visibleWidth } = visibleRange.value;

  return props.intermediateStations
    .filter(station => {
      const stationKm = station.km || 0;
      return stationKm >= startKm && stationKm <= endKm;
    })
    .map(station => {
      const stationKm = station.km || 0;
      const position = ((stationKm - startKm) / visibleWidth) * 100;
      return {
        ...station,
        position: `${position}%`
      };
    });
});

const edgeStations = computed(() => {
  const { startKm, endKm } = visibleRange.value;

  const allStations = [
    { km: 0, name: 'Станция Шар' },
    ...props.intermediateStations,
    { km: TOTAL_RAIL_LENGTH_KM, name: 'Станция НУК' }
  ];

  let startStation = allStations[0];
  let endStation = allStations[allStations.length - 1];

  for (let i = 0; i < allStations.length; i++) {
    if (allStations[i].km <= startKm) {
      startStation = allStations[i];
    }
    if (allStations[i].km >= endKm) {
      endStation = allStations[i];
      break;
    }
  }

  return { startStation, endStation };
});

const distanceLabels = computed(() => {
  const { startKm, endKm, visibleWidth } = visibleRange.value;
  const labels = [];


  let step;
  if (visibleWidth > 100) {
    step = 25;
  } else if (visibleWidth > 50) {
    step = 10;
  } else if (visibleWidth > 20) {
    step = 5;
  } else if (visibleWidth > 10) {
    step = 2;
  } else {
    step = 1;
  }

  const firstLabel = Math.ceil(startKm / step) * step;

  for (let km = firstLabel; km <= endKm; km += step) {
    const position = ((km - startKm) / visibleWidth) * 100;
    if (position >= 0 && position <= 100) {
      labels.push({
        km,
        position: `${position}%`,
        label: `${Math.round(km)}км`
      });
    }
  }

  if (labels.length === 0 || labels[0].km > startKm + 0.5) {
    labels.unshift({
      km: startKm,
      position: '0%',
      label: `${Math.round(startKm)}км`
    });
  }

  if (labels.length === 0 || labels[labels.length - 1].km < endKm - 0.5) {
    labels.push({
      km: endKm,
      position: '100%',
      label: `${Math.round(endKm)}км`
    });
  }

  return labels;
});

onMounted(() => {
  if (railwayTrackRef.value) {
    railwayTrackRef.value.addEventListener('wheel', handleWheel, { passive: false });
  }
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
  if (railwayTrackRef.value) {
    railwayTrackRef.value.removeEventListener('wheel', handleWheel);
  }
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
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
  align-items: center;
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
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 6px 10px;
  border-radius: 6px;
}

.legend-item:hover {
  background-color: #f7fafc;
}

.legend-item-active {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
}

.legend-item-inactive {
  opacity: 0.4;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-text {
  font-size: 14px;
  color: #1a202c;
  white-space: nowrap;
  font-weight: 400;
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
  cursor: default;
  user-select: none;
}

.railway-track.is-zoomable {
  cursor: grab;
}

.railway-track.is-dragging {
  cursor: grabbing;
}

.railway-segment {
  position: absolute;
  height: 6px;
  border-radius: 1px;
  transition: all 0.3s ease;
  cursor: pointer;
  z-index: 2;
}

.railway-segment:hover {
  height: 8px;
  top: -1px;
  z-index: 10;
}

.segment-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 12px;
  background-color: #2d3748;
  color: white;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  z-index: 30;
  pointer-events: none;
}

.segment-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #2d3748 transparent transparent transparent;
}

.tooltip-row {
  margin: 3px 0;
  line-height: 1.4;
}

.tooltip-row:first-child {
  margin-top: 0;
}

.tooltip-row:last-child {
  margin-bottom: 0;
}

.tooltip-row strong {
  font-weight: 600;
  margin-right: 4px;
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
  position: relative;
  height: 20px;
  padding: 0 12px;
}

.distance-label {
  position: absolute;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  transform: translateX(-50%);
  transition: all 0.3s ease;
  white-space: nowrap;
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
