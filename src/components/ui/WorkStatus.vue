<template>
  <div class="status-wrapper">
    <div
      v-if="showCheck || showMinus"
      class="icon-circle"
      :class="{ 'circle-green': showCheck, 'circle-red': showMinus }"
      :title="showCheck ? 'Работа выполнена' : 'Работа не выполнена'"
    >
      <UiIcon :name="showCheck ? 'Check' : 'Minus'" class="status-icon" />
    </div>

    <div
      v-if="showHammer"
      class="icon-circle circle-blue"
      title="Зарегистрированы неисправности"
    >
      <UiIcon name="Hammer" class="status-icon" />
    </div>

    <div
      v-if="showRuler"
      class="icon-circle circle-blue"
      title="Зарегистрированы параметры"
    >
      <UiIcon name="Ruler" class="status-icon" />
    </div>
  </div>
</template>

<script setup>
import UiIcon from '@/components/ui/UiIcon.vue';

const props = defineProps({
  showCheck: {
    type: Boolean,
    default: false,
  },
  showMinus: {
    type: Boolean,
    default: false,
  },
  showHammer: {
    type: Boolean,
    default: false,
  },
  showRuler: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.status-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.circle-green {
  background-color: #E9FFE4; 
}

.circle-red {
  background-color: #FEF2F2;
}

.circle-blue {
  background-color: #EFF6FF; 
}

.icon-circle :deep(.icon) {
  margin-right: 0;
  width: 18px;
  height: 18px;
}

.circle-green :deep(.icon) {
  color: #005F00;
}
.circle-red :deep(.icon) {
  color: #D70C0C;
}
.circle-blue :deep(.icon) {
  color: #2286C8;
}
</style>