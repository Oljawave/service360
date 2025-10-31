<template>
  <div class="railway-section">
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
              <div v-if="hoveredStationId === station.id" class="station-tooltip">
                {{ formatStationCoords(station.km) }}
              </div>
            </Transition>
          </div>

          <div 
            v-for="incident in railwayIncidents" 
            :key="incident.id"
            class="track-marker incident-point"
            :class="incident.color"
            :style="{ left: incident.position + '%' }"
            :title="incident.title"
            @click="handleIncidentClick(incident)"
          ></div>

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
import { ref } from 'vue';

const props = defineProps({
  intermediateStations: { type: Array, required: true },
  railwayIncidents: { type: Array, required: true },
});

const emits = defineEmits(['incident-click']);

const hoveredStationId = ref(null);

const formatStationCoords = (kmValue) => {
  if (kmValue === null || kmValue === undefined) return '';
  const km = Math.floor(kmValue);
  const pk = Math.round((kmValue - km) * 10);
  return `${km}км ${pk}пк`;
};

const handleIncidentClick = (incident) => {
  emits('incident-click', incident);
};
</script>

<style scoped>
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
  max-width: 1400px;
  margin: 0 auto;
}
.stations-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 0 8px;
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
.incident-point {
  width: 10px;
  height: 10px;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 10;
}
.incident-point:hover {
  transform: translate(-50%, -50%) scale(1.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  z-index: 15;
}
.red-marker { background-color: #ef4444; }
.yellow-marker { background-color: #eab308; }
.green-marker { background-color: #22c55e; }
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
</style>
