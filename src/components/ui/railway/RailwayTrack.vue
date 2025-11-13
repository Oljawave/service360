<template>
  <div class="railway-slider">
    <div
      ref="railwayTrackRef"
      class="railway-track"
      :class="{ 'is-dragging': isDragging, 'is-zoomable': isZoomable }"
      @mousedown="emit('mousedown', $event)"
    >
      <div
        v-for="segment in segments"
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
          <div v-if="hoveredStationId === station.id" class="station-tooltip">{{ station.kmLabel }}</div>
        </Transition>
      </div>

      <div class="track-marker end-point" :style="{ left: '100%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  segments: Array,
  visibleStations: Array,
  isDragging: Boolean,
  isZoomable: Boolean
});

const emit = defineEmits(['mousedown']);

const hoveredSegmentKm = ref(null);
const hoveredStationId = ref(null);
const railwayTrackRef = ref(null);

defineExpose({ railwayTrackRef });
</script>

<style scoped>
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

.tooltip-fade-enter-active, .tooltip-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-fade-enter-from, .tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(5px);
}

.tooltip-fade-enter-to, .tooltip-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

@media (max-width: 768px) {
  .railway-slider {
    padding: 16px 20px;
  }

  .station-label {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .railway-slider {
    padding: 14px 16px;
  }

  .station-label {
    font-size: 8px;
  }
}
</style>
