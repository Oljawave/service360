<template>
  <TableWrapper
    ref="tableWrapperRef"
    title="Инструменты"
    :columns="columns"
    :actions="tableActions"
    :limit="limit"
    :loadFn="loadTools"
  >
  </TableWrapper>
</template>

<script setup>
import { ref } from 'vue'
import TableWrapper from '@/app/layouts/Table/TableWrapper.vue'
import { loadTools } from '@/shared/api/resources/resourceService'

const tableWrapperRef = ref(null)

const tableActions = [
  {
    label: 'Добавить инструмент',
    icon: 'Plus',
    onClick: () => {
      console.log('Добавление инструмента...')
      // TODO: Открыть модальное окно добавления инструмента
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
  { key: 'nameTypTool', label: 'Тип инструмента' },
  { key: 'nameLocationClsSection', label: 'Участок' },
]
</script>
