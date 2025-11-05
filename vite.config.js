import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Porta padrão: 4000 ou PORT do ambiente
const port = parseInt(process.env.PORT || '4000', 10)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: port,
    host: '0.0.0.0', // Escuta em todas as interfaces (necessário para Render)
    strictPort: true, // Falha se a porta estiver em uso
  },
  preview: {
    port: port,
    host: '0.0.0.0', // Escuta em todas as interfaces (necessário para Render)
    strictPort: true,
  },
})

