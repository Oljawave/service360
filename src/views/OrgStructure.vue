<template>
  <div class="org-structure-container">
    <div class="org-structure-header">
      <h2 class="org-structure-title">{{ title }}</h2>
      <TableActions :actions="tableActions" />
    </div>

    <div class="org-structure-content">
      <OrgStructureTree
        v-if="organizationData.length > 0"
        :data="organizationData"
        :childrenMap="childrenMap"
        :expandedRows="expandedRows"
        @toggleExpand="toggleRowExpand"
      />
    </div>

    <ModalOrgStructure v-if="isCreateModalOpen" @close="closeCreateModal" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TableActions from '@/components/layout/Table/TableActions.vue'
import ModalOrgStructure from '@/modals/ModalOrgStructure.vue'
import OrgStructureTree from '@/components/ui/OrgStructureTree.vue'
import { loadLocation } from '@/api/getLocationApi'

const title = 'Организационная структура'
const organizationData = ref([])
const expandedRows = ref([])
const childrenMap = ref({})
const isCreateModalOpen = ref(false)

const openCreateModal = () => {
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  isCreateModalOpen.value = false
}

const toggleRowExpand = (id) => {
  const i = expandedRows.value.indexOf(id)
  if (i === -1) {
    expandedRows.value.push(id)
  } else {
    expandedRows.value.splice(i, 1)
  }
}

const tableActions = [
  {
    label: 'Добавить структуру',
    icon: 'Plus',
    onClick: openCreateModal
  }
]

const fetchData = async () => {
  try {
    const response = await loadLocation()

    if (response?.result?.records) {
      const records = response.result.records.map(item => {
        const originalType = item.nameObjectTypeMulti || ''
        const typeWords = originalType.split(' ')
        const shortType = typeWords.length > 4
          ? typeWords.slice(0, 4).join(' ') + '...'
          : originalType

        return {
          ...item,
          nameObjectTypeMulti: shortType
        }
      })

      const tree = buildTree(records)
      const flatWithIndexes = assignIndexes(tree)
      childrenMap.value = buildChildrenMap(flatWithIndexes)
      organizationData.value = tree
    }
  } catch (e) {
    console.error('❌ Ошибка при загрузке данных структуры:', e)
  }
}

function buildTree(data) {
  const map = {}
  const result = []

  data.forEach(item => {
    map[item.id] = { ...item, children: [] }
  })

  data.forEach(item => {
    if (item.parent && map[item.parent]) {
      map[item.parent].children.push(map[item.id])
    } else {
      result.push(map[item.id])
    }
  })

  return result
}

function assignIndexes(tree, prefix = '') {
  const flat = []
  tree.forEach((node, i) => {
    const currentIndex = prefix ? `${prefix}.${i + 1}` : `${i + 1}`
    node.index = currentIndex
    flat.push(node)

    if (node.children.length) {
      flat.push(...assignIndexes(node.children, currentIndex))
    }
  })
  return flat
}

function buildChildrenMap(records) {
  const map = {}
  records.forEach(row => {
    if (row.parent != null) {
      if (!map[row.parent]) map[row.parent] = []
      map[row.parent].push(row)
    }
  })
  return map
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.org-structure-container {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin: 24px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.org-structure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.org-structure-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.org-structure-content {
  flex: 1;
  overflow-y: auto;
  max-height: 70vh;
  padding-right: 8px;
}
</style>
