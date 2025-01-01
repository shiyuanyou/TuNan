<template>
  <div class="app-container">
    <!-- 左侧任务组列表 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>任务组</h2>
        <button @click="createTaskGroup">新建任务组</button>
      </div>
      <div class="task-groups">
        <div
          v-for="group in taskGroups"
          :key="group.id"
          :class="['task-group', { active: selectedGroup?.id === group.id }]"
          @click="selectGroup(group)"
        >
          <span v-if="!group.isEditing">{{ group.name }}</span>
          <input
            v-else
            v-model="group.name"
            @blur="finishEditing(group)"
            @keyup.enter="finishEditing(group)"
            class="edit-input"
          />
          <div class="group-actions">
            <button @click.stop="startEditing(group)">重命名</button>
            <button @click.stop="deleteGroup(group)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="main-content">
      <div v-if="selectedGroup" class="tasks-container">
        <div class="tasks-header">
          <h2>{{ selectedGroup.name }}</h2>
          <button @click="createTask">新建任务</button>
        </div>
        <div class="coordinate-system">
          <!-- 这里将是坐标系统组件 -->
          <coordinate-chart
            :tasks="selectedGroup.tasks"
            @update-task-position="updateTaskPosition"
          />
        </div>
      </div>
      <div v-else class="no-selection">
        请选择或创建一个任务组
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import CoordinateChart from './components/CoordinateChart.vue'

// 任务组数据
const taskGroups = ref([])
const selectedGroup = ref(null)

// 添加重命名相关的方法
const editInput = ref(null)

// 创建任务组
const createTaskGroup = () => {
  const newGroup = {
    id: Date.now(),
    name: '新任务组',
    tasks: [],
    isEditing: false
  }
  taskGroups.value.push(newGroup)
}

// 选择任务组
const selectGroup = (group) => {
  selectedGroup.value = group
}

// 删除任务组
const deleteGroup = (group) => {
  const index = taskGroups.value.indexOf(group)
  taskGroups.value.splice(index, 1)
  if (selectedGroup.value === group) {
    selectedGroup.value = null
  }
}

// 创建任务
const createTask = () => {
  if (!selectedGroup.value) return
  
  const newTask = {
    id: Date.now(),
    name: '新任务',
    difficulty: 50,
    impact: 50
  }
  selectedGroup.value.tasks.push(newTask)
}

// 更新任务位置
const updateTaskPosition = ({ taskId, x, y }) => {
  const task = selectedGroup.value.tasks.find(t => t.id === taskId)
  if (task) {
    task.difficulty = x
    task.impact = y
  }
}

// 添加重命名相关的方法
const startEditing = (group) => {
  // 先重置其他组的编辑状态
  taskGroups.value.forEach(g => {
    if (g !== group) g.isEditing = false
  })
  group.isEditing = true
  nextTick(() => {
    // 使用 querySelector 直接获取 DOM 元素
    const input = document.querySelector('.edit-input')
    if (input) {
      input.focus()
    }
  })
}

const finishEditing = (group) => {
  group.isEditing = false
  // 如果名称为空，设置默认名称
  if (!group.name.trim()) {
    group.name = '新任务组'
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 250px;
  border-right: 1px solid #e0e0e0;
  padding: 20px;
}

.main-content {
  flex: 1;
  padding: 20px;
}

.task-group {
  padding: 10px;
  margin-bottom: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
}

.task-group.active {
  background-color: #e8f5e9;
}

.coordinate-system {
  margin-top: 20px;
  height: calc(100vh - 200px);
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.no-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
}

.edit-input {
  width: 100%;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>