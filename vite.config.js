import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || '4000', 10),
    host: true, // Permite acesso externo
  },
  preview: {
    port: parseInt(process.env.PORT || '4000', 10),
    host: true,
  },
})

