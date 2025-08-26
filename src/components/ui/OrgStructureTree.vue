<template>
  <div class="tree-container">
    <div
      v-for="(node) in data"
      :key="node.id"
      class="tree-node-wrapper"
    >

      <div class="tree-node" :style="{ paddingLeft: `${level * 24}px` }">
        <div class="node-card" :class="{ expanded: isExpanded(node.id) }">
          <div class="node-header" @click="hasChildren(node) && toggleExpand(node.id)">
            <UiIcon
              v-if="hasChildren(node)"
              :name="isExpanded(node.id) ? 'ChevronDown' : 'ChevronRight'"
              class="chevron-icon"
            />
            <span class="node-title">{{ node.name }}</span>
          </div>

          <div class="node-details">
            <div><span>Тип:</span> {{ node.nameCls }}</div>
            <div><span>Регион:</span> {{ node.nameRegion }}</div>
            <div>
              <span>Статус:</span>
              <span :class="['status-pill', node.nameIsActive === 'да' ? 'active' : 'inactive']">
                {{ node.nameIsActive === 'да' ? 'Активен' : 'Неактивен' }}
              </span>
            </div>
            <div><span>Дата создания:</span> {{ node.CreatedAt }}</div>
          </div>
        </div>
      </div>

      <div
        v-if="isExpanded(node.id) && childrenMap[node.id]"
        class="tree-children"
      >
        <OrgStructureTree
          :data="childrenMap[node.id]"
          :childrenMap="childrenMap"
          :expandedRows="expandedRows"
          :level="level + 1"
          @toggleExpand="toggleExpand"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import UiIcon from '@/components/ui/UiIcon.vue'

const props = defineProps({
  data: Array,
  childrenMap: Object,
  expandedRows: Array,
  level: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['toggleExpand'])

const toggleExpand = (id) => emit('toggleExpand', id)
const isExpanded = (id) => props.expandedRows.includes(id)
const hasChildren = (node) => props.childrenMap[node.id]?.length > 0
</script>

<style scoped>
.tree-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tree-node-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
}

.tree-node {
  position: relative;
}

.tree-children {
  margin-left: 24px;
  padding-left: 12px;
  border-left: 2px solid #e5e7eb;
  margin-top: 8px;
}

.node-card {
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 16px;
  transition: background-color 0.2s;
}

.node-card.expanded {
  background-color: #f0f8ff;
}

.node-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
}

.chevron-icon {
  margin-right: 8px;
}

.node-title {
  font-weight: 600;
}

.node-details {
  display: grid;
  grid-template-columns: repeat(4, auto);
  gap: 8px 24px;
  font-size: 14px;
  color: #374151;
}

.node-details span:first-child {
  font-weight: 500;
  margin-right: 4px;
  color: #6b7280;
}

.status-pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.status-pill.active {
  background-color: #d1fae5;
  color: #065f46;
}

.status-pill.inactive {
  background-color: #f3f4f6;
  color: #6b7280;
}
</style>
