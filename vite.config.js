import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  base: './',
  root: path.join(__dirname, 'src/renderer'),
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true
  }
})