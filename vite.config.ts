import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

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
  const REFERENCIA =
    /new URL\(\s*'\.\.\/libs\/draco\/(?:gltf\/)?([\w.]+)'\s*,\s*import\.meta\.url\s*\)\.toString\(\)/g

  return {
    name: 'draco-local',
    enforce: 'pre',
    transform(codigo, id) {
      if (!id.includes('examples/jsm/loaders/DRACOLoader.js')) {
        return null
      }

      const reescrito = codigo.replace(
        REFERENCIA,
        (_coincidencia, archivo: string) => `'/draco/${archivo}'`,
      )
      return reescrito === codigo ? null : { code: reescrito, map: null }
    },
  }
}

/**
 * Deja fuera el emulador de XR al compilar para produccion.
 *
 * El almacen emula un visor en localhost para poder probar la interaccion sin
 * ponerse el Quest. Eso arrastra IWER y sus salas de ejemplo: unos 6 MB en trozos
 * que Rollup empaqueta aunque nunca se pidan, porque el import dinamico existe en
 * el codigo aunque la rama sea inalcanzable fuera del servidor de desarrollo.
 *
 * En desarrollo el emulador se mantiene intacto. En produccion se sustituye por un
 * modulo inerte. No lanza a proposito: alli `emulate` va desactivado y nadie
 * deberia llegar aqui, pero si se llegara, un error sin capturar durante la carga
 * de la pagina seria peor remedio que la enfermedad.
 */
function sinEmuladorEnProduccion(): Plugin {
  return {
    name: 'sin-emulador-en-produccion',
    apply: 'build',
    load(id) {
      if (!id.includes('@pmndrs/xr') || !id.endsWith('emulate.js')) {
        return null
      }
      return [
        'export function emulate() {',
        "  console.warn('El emulador de XR no se incluye en la compilacion de produccion')",
        '  return undefined',
        '}',
      ].join('\n')
    },
  }
}

// Configuracion de Vite.
// Tailwind 4 se conecta como plugin de Vite, ya no via PostCSS ni tailwind.config.js.
//
// El modo "visor" (npm run dev:visor) levanta el servidor con HTTPS y accesible
// desde la red local. Hace falta para probar con el Quest: WebXR solo funciona en
// contexto seguro, y localhost deja de serlo cuando se entra desde otro aparato. Se
// usa --mode y no una variable de entorno porque asi funciona igual en Windows.
export default defineConfig(({ mode }) => {
  const paraVisor = mode === 'visor'

  return {
    plugins: [
      react(),
      tailwindcss(),
      dracoLocal(),
      sinEmuladorEnProduccion(),
      // Certificado autofirmado. El navegador del Quest avisara de que no es de
      // confianza: hay que aceptarlo una vez por sesion.
      ...(paraVisor ? [basicSsl()] : []),
    ],

    // host: true expone el servidor en la IP de la red local, que es por donde
    // entra el visor.
    server: paraVisor ? { host: true } : {},

    css: {
      /**
       * Configuracion de PostCSS vacia y explicita.
       *
       * Sin esto, PostCSS busca su configuracion SUBIENDO por el arbol de carpetas
       * y puede acabar cogiendo un postcss.config.* que viva fuera del proyecto (en
       * la carpeta de usuario, por ejemplo, sobra de algun proyecto anterior). Si
       * ese archivo pide el plugin de Tailwind 3, la compilacion revienta con
       * "Cannot find module 'tailwindcss'" aunque aqui todo este bien.
       *
       * Declararla en linea corta esa busqueda de raiz. Este proyecto no usa PostCSS.
       */
      postcss: { plugins: [] },
    },

    build: {
      // El navegador del Quest 2 esta al dia con Chromium, no hace falta transpilar
      // a ES5.
      target: 'es2022',
    },
  }
})
