<template>
  <div class="railway-section-wrapper">
    <div class="railway-section">
      <RailwayStatusHeader
        :title="`Оценка состояния пути`"
        :average-score="averageScore"
        :status-stats="statusStats"
        :selected-legends="selectedLegends"
        @toggle-legend="toggleLegend"
      />

      <div class="railway-container">
        <RailwayStationsRow
          :start-station="edgeStations.startStation.name"
          :end-station="edgeStations.endStation.name"
        />

        <RailwayTrack
          ref="trackComponent"
          :segments="railwaySegments"
          :visible-stations="visibleStationsWithLabels"
          :is-dragging="isDragging"
          :is-zoomable="zoomLevel > MIN_ZOOM"
          @mousedown="handleMouseDown"
        />

        <RailwayDistanceLabels :labels="distanceLabels" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import RailwayStatusHeader from './railway/RailwayStatusHeader.vue';
import RailwayStationsRow from './railway/RailwayStationsRow.vue';
import RailwayTrack from './railway/RailwayTrack.vue';
import RailwayDistanceLabels from './railway/RailwayDistanceLabels.vue';

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

const selectedLegends = ref([]);

const zoomLevel = ref(1);
const panOffset = ref(0);
const trackComponent = ref(null);
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
  if (paramsLimit <= 25) return '#10b981';
  if (paramsLimit <= 80) return '#84cc16';
  if (paramsLimit <= 180) return '#f97316';
  return '#ef4444';
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

const visibleStationsWithLabels = computed(() => {
  return visibleStations.value.map(station => ({
    ...station,
    kmLabel: formatStationCoords(station.km)
  }));
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

const handleWheel = (event) => {
  event.preventDefault();

  const delta = -Math.sign(event.deltaY);
  const newZoom = zoomLevel.value + delta * ZOOM_SPEED * zoomLevel.value;

  const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

  if (clampedZoom !== zoomLevel.value) {
    const trackRef = trackComponent.value?.railwayTrackRef;
    if (!trackRef) return;

    const rect = trackRef.getBoundingClientRect();
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
  if (isDragging.value && trackComponent.value?.railwayTrackRef) {
    const rect = trackComponent.value.railwayTrackRef.getBoundingClientRect();
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

onMounted(() => {
  const trackRef = trackComponent.value?.railwayTrackRef;
  if (trackRef) {
    trackRef.addEventListener('wheel', handleWheel, { passive: false });
  }
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
  const trackRef = trackComponent.value?.railwayTrackRef;
  if (trackRef) {
    trackRef.removeEventListener('wheel', handleWheel);
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

.railway-container {
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .railway-section {
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .railway-section {
    padding: 20px 16px;
  }
}
</style>
