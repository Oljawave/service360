<template>
  <ModalWrapper
    title="Определение работы"
    @close="closeModal"
    @save="saveData"
  >
    <div class="form-section">
      <AppDropdown
        class="col-span-2"
        id="incidentType"
        label="Событие / запрос"
        placeholder="Выберите событие / запрос"
        v-model="form.incidentType"
        :options="incidentOptions"
        :required="true"
      />

      <AppDropdown
        class="col-span-2"
        id="workType"
        label="Работа"
        placeholder="Выберите работу"
        v-model="form.workType"
        :options="workTypeOptions"
        :loading="loadingWorks"
        :required="true"
      />

      <AppDatePicker
        id="completionDate"
        label="Дата завершения"
        placeholder="Выберите дату"
        v-model="form.completionDate"
        :required="true"
      />
    </div>
  </ModalWrapper>
</template>

<script setup>
import { ref, defineEmits, defineProps, computed, onMounted } from 'vue'
import ModalWrapper from '@/components/layout/Modal/ModalWrapper.vue'
import AppDropdown from '@/components/ui/FormControls/AppDropdown.vue'
import AppDatePicker from '@/components/ui/FormControls/AppDatePicker.vue'
import { useNotificationStore } from '@/stores/notificationStore'
import { fetchWorks } from '@/api/planWorkApi'
import { assignWorkToIncident } from '@/api/incidentApi'

const props = defineProps({
  incidents: { type: Array, default: () => [] }
});

const incidentOptions = computed(() => {
  if (!props.incidents) return [];
  return props.incidents
    .filter(incident => !incident.rawData?.objWorkPlan) // Показываем только инциденты, которым еще не назначена работа
    .map(incident => ({ label: incident.name, value: incident.id }));
});

const emit = defineEmits(['close', 'assign-work'])
const notificationStore = useNotificationStore()

const form = ref({
  incidentType: null,
  workType: null,
  completionDate: null,
})

const workTypeOptions = ref([])
const loadingWorks = ref(false)

onMounted(async () => {
  try {
    loadingWorks.value = true
    const works = await fetchWorks()
    if (Array.isArray(works) && works.length > 0) {
      workTypeOptions.value = works
    } else {
      notificationStore.showNotification('Нет доступных работ для выбора', 'warning')
    }
  } catch (error) {
    notificationStore.showNotification('Ошибка при загрузке видов работ', 'error')
  } finally {
    loadingWorks.value = false
  }
})

const validateForm = () => {
  if (!form.value.incidentType || !form.value.incidentType.value) {
    notificationStore.showNotification('Не выбрано Событие / запрос', 'error')
    return false
  }
  if (!form.value.workType || !form.value.workType.value) {
    notificationStore.showNotification('Не выбрана Работа', 'error')
    return false
  }
  if (!form.value.completionDate) {
    notificationStore.showNotification('Не выбрана Дата завершения', 'error')
    return false
  }

  return true
}

const saveData = async () => {
  if (!validateForm()) {
     return
  }
  
  const selectedIncident = props.incidents.find(
    inc => inc.id === form.value.incidentType.value
  );

  // Извлекаем полный объект работы из опций, используя его ID (value)
  const selectedWorkOption = workTypeOptions.value.find(
      work => work.value === form.value.workType.value
  );

  const completionDate = form.value.completionDate;

  if (!selectedIncident || !selectedIncident.rawData) {
    notificationStore.showNotification('Не удалось найти данные выбранного инцидента.', 'error');
    return;
  }
  
  if (!selectedWorkOption) {
    notificationStore.showNotification('Не удалось найти данные выбранной работы.', 'error');
    return;
  }
  
  try {
      await assignWorkToIncident(
        selectedIncident.rawData, 
        selectedWorkOption, // Передаем полный объект работы с pv, cls и value
        completionDate
      );

      notificationStore.showNotification('Работа успешно назначена', 'success')
      emit('assign-work')
      closeModal()
  } catch (error) {
      notificationStore.showNotification(error.message || 'Ошибка при назначении работы', 'error')
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.form-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
  gap: 16px;
  padding: 0 32px 32px;
  background-color: #f9fafb;
}

.col-span-2 {
  grid-column: span 2;
}
</style>