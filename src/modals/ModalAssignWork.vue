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
        @update:value="onIncidentTypeChange"
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

      <AppDropdown
        id="criticality"
        label="Критичность"
        placeholder="Выберите критичность"
        v-model="form.criticality"
        :options="criticalityOptions"
        :loading="loadingCriticality"
        :required="true"
      />

      <AppDropdown
        id="section"
        label="Участок"
        placeholder="Выберите участок"
        v-model="form.section"
        :options="sectionOptions"
        :loading="loadingSections"
        :required="true"
      />

      <AppDatePicker
        id="completionDate"
        label="Дата завершения"
        placeholder="Выберите дату"
        v-model="form.completionDate"
        :is-date-disabled="isDateDisabled" :required="true"
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
import { fetchWorks, fetchLocationByCoords } from '@/api/planWorkApi' 
import { assignWorkToIncident, loadCriticalityLevels } from '@/api/incidentApi'

const props = defineProps({
  incidents: { type: Array, default: () => [] }
});

const incidentOptions = computed(() => {
  if (!props.incidents) return [];
  return props.incidents
    .filter(incident => !incident.rawData?.objWorkPlan)
    .map(incident => ({
      label: `${incident.id} - ${incident.name} - ${incident.object}`,
      value: incident.id,
      fullIncidentData: incident.rawData
    }));
});

const isDateDisabled = (timestamp) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Устанавливаем время на начало дня
  return timestamp < today.getTime();
};

const emit = defineEmits(['close', 'assign-work'])
const notificationStore = useNotificationStore()

const form = ref({
  incidentType: null,
  workType: null,
  completionDate: null,
  criticality: null,
  section: null,
})

const workTypeOptions = ref([])
const loadingWorks = ref(false)
const criticalityOptions = ref([])
const loadingCriticality = ref(false)
const sectionOptions = ref([])
const loadingSections = ref(false)

const onIncidentTypeChange = async (selectedIncidentValue) => {
  form.value.criticality = null;
  form.value.section = null;
  sectionOptions.value = [];

  if (!selectedIncidentValue) return;

  const selectedIncidentOption = incidentOptions.value.find(opt => opt.value === selectedIncidentValue);
  if (!selectedIncidentOption || !selectedIncidentOption.fullIncidentData) return;

  const incidentData = selectedIncidentOption.fullIncidentData;

  // Устанавливаем критичность из данных инцидента
  if (incidentData.fvCriticality) {
    const foundCriticality = criticalityOptions.value.find(
      c => c.value === incidentData.fvCriticality
    );
    if (foundCriticality) {
      form.value.criticality = foundCriticality;
    }
  }

  // Загружаем участки на основе координат инцидента
  const coords = {
    coordStartKm: incidentData.StartKm,
    coordStartPk: incidentData.StartPicket,
    coordEndKm: incidentData.FinishKm,
    coordEndPk: incidentData.FinishPicket,
  };

  if (coords.coordStartKm !== null && coords.coordEndKm !== null) {
    await loadSections(coords);
  }
};

const loadSections = async (coords) => {
  form.value.section = null;
  sectionOptions.value = [];

  if (coords.coordStartKm === null || coords.coordEndKm === null) {
    return;
  }

  loadingSections.value = true;
  try {
    // workId = 0 для инцидентов при получении участков
    const sections = await fetchLocationByCoords(
      0, // workId
      coords.coordStartKm,
      coords.coordEndKm,
      coords.coordStartPk || 0,
      coords.coordEndPk || 0
    );

    if (Array.isArray(sections) && sections.length > 0) {
      sectionOptions.value = sections.map(s => ({
        label: s.name || s.label,
        value: s.id || s.value,
        pv: s.pv,
        fullRecord: s
      }));

      // Если только один участок, выбираем его автоматически
      if (sections.length === 1) {
        form.value.section = sectionOptions.value[0];
      }
    } else {
      notificationStore.showNotification('Не найден участок по указанным координатам выбранного инцидента', 'warning');
    }
  } catch (error) {
    console.error('Ошибка при загрузке участков:', error);
    notificationStore.showNotification('Ошибка при загрузке участков', 'error');
  } finally {
    loadingSections.value = false;
  }
};

onMounted(async () => {
  try {
    loadingWorks.value = true
    loadingCriticality.value = true
    const [works, criticalityLevels] = await Promise.all([
      fetchWorks(),
      loadCriticalityLevels()
    ]);

    workTypeOptions.value = works;
    criticalityOptions.value = criticalityLevels;

    if (works.length === 0) {
      notificationStore.showNotification('Нет доступных работ для выбора', 'warning');
    } else {
      // notificationStore.showNotification('Нет доступных работ для выбора', 'warning')
    }
  } catch (error) {
    notificationStore.showNotification('Ошибка при загрузке данных', 'error');
  } finally {
    loadingWorks.value = false
    loadingCriticality.value = false;
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
  if (!form.value.criticality || !form.value.criticality.value) {
    notificationStore.showNotification('Не выбрана Критичность', 'error')
    return false
  }
  if (!form.value.section || !form.value.section.value) {
    notificationStore.showNotification('Не выбран Участок', 'error')
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
  
  const selectedIncidentOption = incidentOptions.value.find(
    inc => inc.value === form.value.incidentType.value
  );

  const selectedWorkOption = workTypeOptions.value.find(
      work => work.value === form.value.workType.value
  );

  const selectedCriticality = form.value.criticality;
  const selectedSection = form.value.section;

  const completionDate = form.value.completionDate;

  if (!selectedIncidentOption || !selectedIncidentOption.fullIncidentData) {
    notificationStore.showNotification('Не удалось найти данные выбранного инцидента.', 'error');
    return;
  }
  
  if (!selectedWorkOption) {
    notificationStore.showNotification('Не удалось найти данные выбранной работы.', 'error');
    return;
  }

  if (!selectedCriticality) {
    notificationStore.showNotification('Не удалось найти данные выбранной критичности.', 'error');
    return;
  }

  if (!selectedSection) {
    notificationStore.showNotification('Не удалось найти данные выбранного участка.', 'error');
    return;
  }
  
  try {
      await assignWorkToIncident(
        selectedIncidentOption.fullIncidentData,
        selectedWorkOption,
        completionDate,
        selectedCriticality,
        selectedSection
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