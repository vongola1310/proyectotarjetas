import { useSyncExternalStore } from 'react'

/** Un punto senalado sobre el equipo, en su espacio local, en metros. */
export interface PuntoColocado {
  readonly id: number
  readonly x: number
  readonly y: number
  readonly z: number
}

let puntos: readonly PuntoColocado[] = []
let siguienteId = 1
const oyentes = new Set<() => void>()

function avisar(): void {
  for (const oyente of oyentes) {
    oyente()
  }
}

/** Guarda un punto senalado. Los mas recientes van primero. */
export function anotarPunto(x: number, y: number, z: number): void {
  const redondear = (valor: number) => Math.round(valor * 1000) / 1000
  puntos = [
    { id: siguienteId++, x: redondear(x), y: redondear(y), z: redondear(z) },
    ...puntos,
  ].slice(0, 8)
  avisar()
}

export function olvidarPuntos(): void {
  puntos = []
  avisar()
}

export function usarPuntosColocados(): readonly PuntoColocado[] {
  return useSyncExternalStore(
    (oyente) => {
      oyentes.add(oyente)
      return () => {
        oyentes.delete(oyente)
      }
    },
    () => puntos,
    () => puntos,
  )
}

/**
 * Si el modo de colocacion esta pedido, via ?colocar en la direccion.
 *
 * Existe porque las posiciones de los hotspots no se pueden calcular: hay que
 * senalar la pieza real. Quien conoce el equipo es el equipo comercial, no quien
 * escribe el codigo, y este modo les deja hacerlo sin tocar nada.
 */
export function colocacionPedida(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return new URLSearchParams(window.location.search).has('colocar')
}
