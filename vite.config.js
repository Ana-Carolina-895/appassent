import { defineConfig } from 'vite'

export default defineConfig({
  // Raiz do projeto
  root: '.',

  // Build de produção
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },

  // Servidor de dev
  server: {
    port: 5173,
    open: true,
  },
})
