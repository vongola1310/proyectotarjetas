import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configuracion de Vite.
// Tailwind 4 se conecta como plugin de Vite, ya no via PostCSS ni tailwind.config.js.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // El navegador del Quest 2 esta al dia con Chromium, no hace falta transpilar a ES5.
    target: 'es2022',
  },
})
