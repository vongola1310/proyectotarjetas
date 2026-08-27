import { createXRStore } from '@react-three/xr'

/**
 * Cuadros por segundo objetivo en el visor.
 *
 * El Quest 2 ofrece 72, 80 y 90 Hz. Se pide 72 A PROPOSITO, aunque el aparato pueda
 * mas: lo que el usuario percibe como "va mal" no es una cifra baja sino los cuadros
 * perdidos. Pedir 90 y quedarse a 84 se siente peor que clavar 72. El valor por
 * defecto de la libreria es 'high', que pediria 90.
 */
const CUADROS_OBJETIVO = 72

/**
 * Elige la frecuencia mas cercana a nuestro objetivo entre las que ofrezca el visor.
 * Asi funciona igual en un Quest 3, que ofrece frecuencias distintas.
 */
function elegirFrecuencia(disponibles: ArrayLike<number>): number | false {
  const lista = Array.from(disponibles)
  if (lista.length === 0) {
    return false
  }
  return lista.reduce((mejor, actual) =>
    Math.abs(actual - CUADROS_OBJETIVO) < Math.abs(mejor - CUADROS_OBJETIVO) ? actual : mejor,
  )
}

/**
 * Almacen de la sesion de WebXR.
 *
 * Se crea a nivel de modulo, fuera de React: la sesion sobrevive a los re-renders y
 * no debe reiniciarse porque un componente se vuelva a montar.
 *
 * API de @react-three/xr v6. La v5 se manejaba con <VRButton> y <XRCanvas>, que ya
 * no existen; ahora es este almacen mas <XR store={...}> y store.enterVR().
 */
export const almacenXR = createXRStore({
  /**
   * Reduccion progresiva de resolucion hacia la periferia de la lente.
   *
   * Es de lo poco que regala rendimiento en el Quest 2. El cliente mira al equipo,
   * que cae en el centro; lo de los bordes lo ve el ojo mucho peor de todos modos.
   * A 1 se nota el difuminado lateral, asi que se queda algo por debajo. Si en el
   * visor se ve sucio, bajarlo; si faltan cuadros, subirlo.
   */
  foveation: 0.75,

  frameRate: elegirFrecuencia,

  /**
   * Escala del framebuffer. Sin definir = la que decida el navegador.
   *
   * OJO: es esto y no el dpr del <Canvas> lo que manda dentro del visor. Se deja
   * en el valor del sistema hasta medir de verdad en el Paso 9; bajarlo a ciegas
   * es regalar nitidez sin saber si hacia falta.
   */
  frameBufferScaling: undefined,

  /**
   * Funciones de sesion que NO pedimos.
   *
   * La libreria las solicita todas por defecto. Un showroom de realidad virtual no
   * detecta paredes ni ancla nada al mundo real, y cada funcion pedida es trabajo
   * que el sistema hace al abrir la sesion.
   */
  anchors: false,
  meshDetection: false,
  planeDetection: false,
  hitTest: false,
  depthSensing: false,

  /**
   * Los controles no agarran nada, asi que se les quita el puntero de agarre y se
   * quedan solo con el rayo, que es el que activa los hotspots.
   */
  controller: { grabPointer: false },
  hand: { grabPointer: false },

  /** Deja que el sistema del visor ofrezca entrar en la experiencia por su cuenta. */
  offerSession: 'immersive-vr',

  /**
   * Emula un visor cuando no hay WebXR de verdad, para poder probar la interaccion
   * desde el navegador sin ponerse el Quest cada vez.
   *
   * Solo en el servidor de desarrollo, y ademas la libreria lo limita a localhost.
   * En la compilacion de produccion queda desactivado del todo, de modo que alli el
   * boton de entrar aparece unicamente cuando hay soporte real. Eso incluye
   * `npm run preview`, que sirve el build: para probar la emulacion, `npm run dev`.
   */
  emulate: import.meta.env.DEV,
})
