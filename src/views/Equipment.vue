<template>
  <TableWrapper
    ref="tableWrapperRef"
    title="Техника"
    :columns="columns"
    :actions="tableActions"
    :limit="limit"
    :loadFn="loadEquipment"
  >
  </TableWrapper>
</template>

<script setup>
import { ref } from 'vue'
import TableWrapper from '@/app/layouts/Table/TableWrapper.vue'
import { loadEquipment } from '@/shared/api/resources/resourceService'

const tableWrapperRef = ref(null)

const tableActions = [
  {
    label: 'Добавить технику',
    icon: 'Plus',
    onClick: () => {
      console.log('Добавление техники...')
      // TODO: Открыть модальное окно добавления техники
    },
  },
  {
    label: 'Экспорт',
    icon: 'Download',
    onClick: () => console.log('Экспортирование...'),
  },
];

const limit = 10

const columns = [
  { key: 'index', label: '№' },
  { key: 'number', label: 'Инвентарный номер' },
  { key: 'name', label: 'Наименование' },
  { key: 'nameTypEquipment', label: 'Тип техники' },
  { key: 'nameLocationClsSection', label: 'Участок' },
]
</script>
