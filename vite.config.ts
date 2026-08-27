import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Configuracion de Vite.
// Tailwind 4 se conecta como plugin de Vite, ya no via PostCSS ni tailwind.config.js.
export default defineConfig({
  plugins: [react(), tailwindcss()],

  css: {
    /**
     * Configuracion de PostCSS vacia y explicita.
     *
     * Sin esto, PostCSS busca su configuracion SUBIENDO por el arbol de carpetas y
     * puede acabar cogiendo un postcss.config.* que viva fuera del proyecto (en la
     * carpeta de usuario, por ejemplo, sobra de algun proyecto anterior). Si ese
     * archivo pide el plugin de Tailwind 3, la compilacion revienta con
     * "Cannot find module 'tailwindcss'" aunque aqui todo este bien.
     *
     * Declararla en linea corta esa busqueda de raiz. Este proyecto no usa PostCSS.
     */
    postcss: { plugins: [] },
  },

  build: {
    // El navegador del Quest 2 esta al dia con Chromium, no hace falta transpilar a ES5.
    target: 'es2022',
  },
})
