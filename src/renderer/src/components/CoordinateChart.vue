<template>
  <div class="chart-container">
    <svg ref="chartRef" width="100%" height="100%">
      <!-- 坐标轴 -->
      <g class="axes">
        <line class="axis" x1="50" :y1="height - 50" :x2="width - 50" :y2="height - 50" />
        <line class="axis" x1="50" :y1="height - 50" y2="50" x2="50" />
        
        <!-- 坐标轴标签 -->
        <text :x="width / 2" :y="height - 20">容易程度</text>
        <text x="20" :y="height / 2" :transform="`rotate(-90, 20, ${height / 2})`">影响程度</text>
      </g>

      <!-- 分界曲线 -->
      <path
        :d="curvePath"
        class="divide-curve"
        fill="none"
        stroke="#666"
        stroke-width="2"
      />

      <!-- 任务卡片 -->
      <g
        v-for="task in tasks"
        :key="task.id"
        class="task-card"
        :transform="`translate(${getX(task.difficulty)}, ${getY(task.impact)})`"
        @mousedown="startDrag($event, task)"
      >
        <rect width="100" height="40" rx="4" />
        <text x="50" y="25" text-anchor="middle">{{ task.name }}</text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update-task-position'])

const chartRef = ref(null)
const width = ref(0)
const height = ref(0)

// 计算分界曲线路径
const curvePath = computed(() => {
  if (!width.value || !height.value) return ''
  
  // 创建反比例函数曲线
  const points = []
  for (let x = 50; x < width.value - 50; x += 10) {
    const k = 100000 // 调整系数
    const y = height.value - 50 - (k / x)
    if (y > 50 && y < height.value - 50) {
      points.push(`${x},${y}`)
    }
  }
  return points.length ? `M ${points.join(' L ')}` : ''
})

// 坐标转换函数
const getX = (difficulty) => {
  return 50 + (difficulty / 100) * (width.value - 100)
}

const getY = (impact) => {
  return height.value - 50 - (impact / 100) * (height.value - 100)
}

// 拖拽相关
let isDragging = false
let currentTask = null
let startX = 0
let startY = 0

const startDrag = (event, task) => {
  isDragging = true
  currentTask = task
  startX = event.clientX
  startY = event.clientY
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (event) => {
  if (!isDragging) return
  
  const dx = event.clientX - startX
  const dy = event.clientY - startY
  
  // 更新任务位置
  const newX = Math.max(0, Math.min(100, currentTask.difficulty + dx / (width.value - 100) * 100))
  const newY = Math.max(0, Math.min(100, currentTask.impact - dy / (height.value - 100) * 100))
  
  emit('update-task-position', {
    taskId: currentTask.id,
    x: newX,
    y: newY
  })
  
  startX = event.clientX
  startY = event.clientY
}

const stopDrag = () => {
  isDragging = false
  currentTask = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

onMounted(() => {
  const updateSize = () => {
    const rect = chartRef.value.getBoundingClientRect()
    width.value = rect.width
    height.value = rect.height
  }
  
  updateSize()
  window.addEventListener('resize', updateSize)
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
}

.axis {
  stroke: #666;
  stroke-width: 2;
}

.task-card {
  cursor: move;
}

.task-card rect {
  fill: #42b883;
  opacity: 0.8;
}

.task-card text {
  fill: white;
  font-size: 12px;
  user-select: none;
}
</style> 