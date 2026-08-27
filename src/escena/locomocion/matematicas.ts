/**
 * Matematica pura de la locomocion.
 *
 * Vive aparte del componente a proposito. Es la parte cuya correccion decide si el
 * cliente acaba mareado, y dentro de un bucle de cuadro con objetos de three no hay
 * forma de comprobarla; aqui si, con entradas y salidas de numeros.
 */

/** Punto en el plano del piso. */
export type PuntoPiso = { readonly x: number; readonly z: number }

/**
 * Donde cruza el piso (y = 0) un tiro parabolico.
 *
 * Devuelve null si el arco nunca baja al suelo, que pasa cuando se apunta hacia
 * arriba desde una altura negativa: imposible en la practica, pero la formula tiene
 * que decirlo en vez de devolver un NaN que se propague hasta la posicion del
 * usuario.
 */
export function destinoDelArco(
  origen: { x: number; y: number; z: number },
  velocidad: { x: number; y: number; z: number },
  gravedad: number,
): { punto: PuntoPiso; tFinal: number } | null {
  const discriminante = velocidad.y * velocidad.y + 2 * gravedad * origen.y

  if (discriminante < 0 || gravedad <= 0) {
    return null
  }

  const tFinal = (velocidad.y + Math.sqrt(discriminante)) / gravedad

  if (!Number.isFinite(tFinal) || tFinal <= 0) {
    return null
  }

  return {
    punto: { x: origen.x + velocidad.x * tFinal, z: origen.z + velocidad.z * tFinal },
    tFinal,
  }
}

/** Altura del arco en un instante dado. */
export function alturaDelArco(alturaInicial: number, velocidadY: number, gravedad: number, t: number): number {
  return alturaInicial + velocidadY * t - 0.5 * gravedad * t * t
}

/**
 * Gira un punto alrededor de otro, en el plano del piso.
 *
 * Se usa para que el giro por saltos pivote sobre la CABEZA del usuario y no sobre
 * el origen. Girando sobre el origen, la cabeza describiria un arco por la sala y se
 * sentiria como un empujon lateral; girando sobre la cabeza, esta se queda quieta y
 * solo cambia hacia donde se mira.
 */
export function girarAlrededorDe(punto: PuntoPiso, centro: PuntoPiso, radianes: number): PuntoPiso {
  const sen = Math.sin(radianes)
  const cos = Math.cos(radianes)
  const dx = punto.x - centro.x
  const dz = punto.z - centro.z

  return {
    x: centro.x + dx * cos - dz * sen,
    z: centro.z + dx * sen + dz * cos,
  }
}

/**
 * Origen que hace que el usuario acabe de pie sobre el destino.
 *
 * No basta con poner el origen en el punto: el usuario puede haberse desplazado
 * caminando dentro de su espacio real, y entonces su cabeza no esta encima del
 * origen. Descontando ese desfase, uno acaba donde apunto y no a un metro.
 */
export function origenParaAterrizarEn(
  destino: PuntoPiso,
  cabeza: PuntoPiso,
  origenActual: PuntoPiso,
): PuntoPiso {
  return {
    x: destino.x - (cabeza.x - origenActual.x),
    z: destino.z - (cabeza.z - origenActual.z),
  }
}
