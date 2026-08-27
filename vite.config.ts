import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Evita que los decodificadores de Draco se dupliquen en el bundle.
 *
 * Desde three 0.185, DRACOLoader referencia sus propios decodificadores con
 * `new URL('../libs/draco/...', import.meta.url)` en el cuerpo del modulo. Vite
 * analiza esas expresiones y emite los archivos como assets, TODOS, incluidas las
 * variantes que no se usan: 1.3 MB que se despliegan y que nadie descarga, porque
 * en tiempo de ejecucion `setDecoderPath('/draco/')` los sustituye.
 *
 * Este plugin reescribe esas expresiones para que apunten directamente a
 * /public/draco/. Vite deja de ver referencias a assets y deja de copiarlos, y de
 * paso los valores por defecto del cargador ya apuntan al sitio correcto.
 */
function dracoLocal(): Plugin {
  const REFERENCIA = /new URL\(\s*'\.\.\/libs\/draco\/(?:gltf\/)?([\w.]+)'\s*,\s*import\.meta\.url\s*\)\.toString\(\)/g

  return {
    name: 'draco-local',
    enforce: 'pre',
    transform(codigo, id) {
      if (!id.includes('examples/jsm/loaders/DRACOLoader.js')) {
        return null
      }

      const reescrito = codigo.replace(REFERENCIA, (_coincidencia, archivo: string) => `'/draco/${archivo}'`)
      return reescrito === codigo ? null : { code: reescrito, map: null }
    },
  }
}

// Configuracion de Vite.
// Tailwind 4 se conecta como plugin de Vite, ya no via PostCSS ni tailwind.config.js.
export default defineConfig({
  plugins: [react(), tailwindcss(), dracoLocal()],

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
