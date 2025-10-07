<template>
  <TableWrapper
    ref="tableWrapperRef"
    title="Обслуживаемые объекты"
    :columns="columns"
    :actions="tableActions"
    :limit="limit"
    :loadFn="loadObjectServed"
    @row-dblclick="onRowDoubleClick"
  >
    <template #modals="{ selectedRow, showEditModal, closeModals }">
      <ModalUpdateObject
        v-if="showEditModal"
        :rowData="selectedRow"
        @close="closeModals"        
        @save="() => handleTableUpdate(closeModals)"
        @deleted="() => handleTableUpdate(closeModals)"
      />
    </template>
  </TableWrapper>

  <ModalAddObject
    v-if="isAddObjectModalOpen"
    @close="closeModal"
    @update-table="() => handleTableUpdate(closeModal)"
  />
</template>

<script setup>
import { ref } from 'vue'
import TableWrapper from '@/components/layout/Table/TableWrapper.vue'
import ModalAddObject from '@/modals/ModalAddObject.vue'
import ModalUpdateObject from '@/modals/ModalUpdateObject.vue'
import { loadObjectServed } from '@/api/objectService'

const tableWrapperRef = ref(null)
const isAddObjectModalOpen = ref(false)

const closeModal = () => {
  isAddObjectModalOpen.value = false
}

const handleTableUpdate = (closeFn) => {
  tableWrapperRef.value?.refreshTable()
  closeFn()
}

const onRowDoubleClick = (row) => {
}

const tableActions = [
  {
    label: 'Добавить объект',
    icon: 'Plus',
    onClick: () => {
      isAddObjectModalOpen.value = true
    }
  },
  {
    label: 'Экспорт',
    icon: 'Download',
    onClick: () => console.log('Экспортирование...')
  },
  {
    label: 'Печать',
    icon: 'Printer',
    onClick: () => console.log('Печать...')
  }
]

const limit = 10

const columns = [
  { key: 'index', label: '№' },
  { key: 'type', label: 'Вид объекта' },
  { key: 'name', label: 'Наименование объекта' },
  { key: 'coords', label: 'Координаты' },
  { key: 'feature', label: 'Характеристика' },
  { key: 'location', label: 'Сведения о месте' },
  { key: 'replacement', label: 'Периодичность замены (год)' },
  { key: 'number', label: 'Номер объекта' },
  { key: 'installDate', label: 'Дата установки' },
  { key: 'createDate', label: 'Дата создания' },
  { key: 'updateDate', label: 'Дата обновления' },
  { key: 'description', label: 'Описание' }
]
</script>
