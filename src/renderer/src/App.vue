<template>
  <div class="container">
    <h1>{{ message }}</h1>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const message = ref('欢迎使用 TuNan!')
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-family: Arial, sans-serif;
}

h1 {
  color: #42b883;
}
</style>