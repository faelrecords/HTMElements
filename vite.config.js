import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path muda automaticamente para subpasta no GitHub Pages
// Define VITE_BASE_PATH no workflow caso precise (ex: /HTMElements/)
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
