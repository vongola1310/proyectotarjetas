import { useSyncExternalStore } from 'react'

/** Instantanea de rendimiento, refrescada varias veces por segundo. */
export interface Metricas {
  /** Cuadros por segundo del ultimo intervalo. */
  readonly fps: number
  /** Duracion media del cuadro, en milisegundos. */
  readonly msMedio: number
  /**
   * Duracion del PEOR cuadro del intervalo, en milisegundos.
   *
   * Es el numero que de verdad importa. Una media de 72 fps con un cuadro suelto de
   * 40 ms se siente como un tiron, y la media no lo delata.
   */
  readonly msPeor: number
  /** Llamadas de dibujo del ultimo cuadro, sumando todos los pases y ojos. */
  readonly llamadas: number
  /** Triangulos del ultimo cuadro, sumando todos los pases y ojos. */
  readonly triangulos: number
  readonly geometrias: number
  readonly texturas: number
  /** Programas de shader compilados. Si sube en marcha, hay tirones de compilacion. */
  readonly programas: number
  /** Frecuencia que negocio la sesion inmersiva, o null fuera de ella. */
  readonly hzSesion: number | null
}

const INICIAL: Metricas = {
  fps: 0,
  msMedio: 0,
  msPeor: 0,
  llamadas: 0,
  triangulos: 0,
  geometrias: 0,
  texturas: 0,
  programas: 0,
  hzSesion: null,
}

/**
 * Almacen minimo fuera de React.
 *
 * El muestreo ocurre dentro del lienzo y el panel de escritorio vive fuera, en el
 * DOM. Publicando aqui, cada uno se suscribe por su cuenta y no hay que subir el
 * estado hasta App: si estuviera alli, refrescar las cifras volveria a renderizar
 * toda la aplicacion varias veces por segundo.
 */
let actual: Metricas = INICIAL
const oyentes = new Set<() => void>()

export function publicarMetricas(metricas: Metricas): void {
  actual = metricas
  for (const avisar of oyentes) {
    avisar()
  }
}

function suscribir(avisar: () => void): () => void {
  oyentes.add(avisar)
  return () => {
    oyentes.delete(avisar)
  }
}

export function usarMetricas(): Metricas {
  return useSyncExternalStore(suscribir, () => actual, () => INICIAL)
}

/**
 * Si el diagnostico esta pedido, via ?diagnostico en la direccion.
 *
 * Se elige un parametro de la URL y no una tecla porque dentro del visor no hay
 * teclado: el vendedor escribe la direccion en el navegador del Quest y entra con
 * el panel ya puesto.
 */
export function diagnosticoPedido(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return new URLSearchParams(window.location.search).has('diagnostico')
}
