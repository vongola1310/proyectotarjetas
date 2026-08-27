import { LABORATORIO, MOBILIARIO } from '../../configuracion/laboratorio'
import { LOCOMOCION } from '../../configuracion/locomocion'
import { equipos } from '../../data/equipos'

const { margenMuros, margenObstaculos } = LOCOMOCION.teleport

/** Rectangulo alineado a los ejes, en el plano del piso. */
type Rectangulo = {
  readonly minX: number
  readonly maxX: number
  readonly minZ: number
  readonly maxZ: number
}

/** Superficie de la sala menos el margen hasta los muros. */
const SUELO_UTIL: Rectangulo = {
  minX: -LABORATORIO.ancho / 2 + margenMuros,
  maxX: LABORATORIO.ancho / 2 - margenMuros,
  minZ: -LABORATORIO.fondo / 2 + margenMuros,
  maxZ: LABORATORIO.fondo / 2 - margenMuros,
}

/**
 * Huella de una mesa, con su margen.
 *
 * Los giros del mobiliario son de 0 o de 90 grados, asi que basta con intercambiar
 * largo y fondo; no hace falta rotar un rectangulo de verdad.
 */
function huellaDeMesa(mesa: (typeof MOBILIARIO.mesas)[number]): Rectangulo {
  const deLado = Math.abs(mesa.giroY) === 90
  const fondo = mesa.fondo ?? LABORATORIO.mesa.fondo
  const medioX = (deLado ? fondo : mesa.largo) / 2 + margenObstaculos
  const medioZ = (deLado ? mesa.largo : fondo) / 2 + margenObstaculos
  const [x, z] = mesa.centro

  return { minX: x - medioX, maxX: x + medioX, minZ: z - medioZ, maxZ: z + medioZ }
}

/**
 * Huella de los equipos expuestos, con su margen.
 *
 * Se estima con un radio generoso alrededor de su posicion. No hace falta ser
 * exacto: solo evita que el usuario se plante literalmente dentro del analizador.
 */
function huellasDeEquipos(): Rectangulo[] {
  return equipos.map((equipo) => {
    const [x, , z] = equipo.posicionInicial
    const medio = 0.6 + margenObstaculos
    return { minX: x - medio, maxX: x + medio, minZ: z - medio, maxZ: z + medio }
  })
}

const OBSTACULOS: readonly Rectangulo[] = [
  ...MOBILIARIO.mesas.map(huellaDeMesa),
  ...huellasDeEquipos(),
]

const dentro = (r: Rectangulo, x: number, z: number): boolean =>
  x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ

/**
 * Dice si se puede aterrizar en un punto del piso.
 *
 * Se comprueba contra la sala y contra los muebles, no solo contra los muros: un
 * teletransporte que te deja de pie dentro de una mesa rompe la ilusion de escala
 * real igual de rapido que un equipo del tamano equivocado.
 */
export function esDestinoValido(x: number, z: number): boolean {
  if (!dentro(SUELO_UTIL, x, z)) {
    return false
  }
  return !OBSTACULOS.some((obstaculo) => dentro(obstaculo, x, z))
}
