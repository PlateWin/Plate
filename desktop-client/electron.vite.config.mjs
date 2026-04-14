import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    // Electron main process config
  },
  preload: {
    // Preload scripts config
  },
  renderer: {
    plugins: [react()],
    css: {
      postcss: './postcss.config.js'
    }
  }
})
