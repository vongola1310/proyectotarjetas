/**
 * Comprobaciones de la matematica de locomocion.
 *
 *     npm run comprobar
 *
 * Existen porque el teletransporte y el giro solo se pueden probar de verdad con el
 * visor puesto, y ahi no hay forma de dejar constancia de que siguen bien. Si alguien
 * toca el arco, el giro o la zona caminable, esto avisa antes de que el fallo se
 * descubra con un cliente mareado delante.
 */

import {
  alturaDelArco,
  destinoDelArco,
  girarAlrededorDe,
  origenParaAterrizarEn,
} from '../src/escena/locomocion/matematicas'
import { esDestinoValido } from '../src/escena/locomocion/zonaCaminable'

let fallos = 0
const cerca = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) < tol
function probar(nombre: string, condicion: boolean, detalle = '') {
  if (!condicion) fallos++
  console.log(`${condicion ? '  OK  ' : ' FALLA'} ${nombre}${detalle ? '  -> ' + detalle : ''}`)
}

console.log('\nARCO BALISTICO')
{
  // Disparo horizontal desde 1 m de altura a 5 m/s: cae en t = sqrt(2h/g).
  const r = destinoDelArco({ x: 0, y: 1, z: 0 }, { x: 5, y: 0, z: 0 }, 10)!
  const tEsperado = Math.sqrt(2 / 10)
  probar('tiempo de caida horizontal', cerca(r.tFinal, tEsperado), `t=${r.tFinal.toFixed(4)} esperado=${tEsperado.toFixed(4)}`)
  probar('alcance horizontal', cerca(r.punto.x, 5 * tEsperado), `x=${r.punto.x.toFixed(4)}`)
  probar('no se desvia en Z', cerca(r.punto.z, 0))
}
{
  // Apuntando hacia abajo llega antes al suelo que apuntando en horizontal.
  const abajo = destinoDelArco({ x: 0, y: 1.2, z: 0 }, { x: 0, y: -3, z: -4 }, 9.8)!
  const recto = destinoDelArco({ x: 0, y: 1.2, z: 0 }, { x: 0, y: 0, z: -5 }, 9.8)!
  probar('apuntar abajo acorta el salto', abajo.tFinal < recto.tFinal,
    `abajo=${abajo.tFinal.toFixed(3)} recto=${recto.tFinal.toFixed(3)}`)
  probar('el destino queda delante (Z negativo)', abajo.punto.z < 0, `z=${abajo.punto.z.toFixed(3)}`)
}
{
  probar('la altura vuelve a 0 al aterrizar', (() => {
    const v = { x: 0, y: 1, z: -5 }
    const r = destinoDelArco({ x: 0, y: 1.4, z: 0 }, v, 9.8)!
    return cerca(alturaDelArco(1.4, v.y, 9.8, r.tFinal), 0, 1e-9)
  })())
  probar('gravedad invalida devuelve null', destinoDelArco({x:0,y:1,z:0},{x:0,y:0,z:-5},0) === null)
}

console.log('\nGIRO ALREDEDOR DE LA CABEZA')
{
  // La cabeza es el centro: girar no la mueve, solo mueve el origen a su alrededor.
  const centro = { x: 2, z: -1 }
  const origen = { x: 2.5, z: -1 }
  const g90 = girarAlrededorDe(origen, centro, Math.PI / 2)
  probar('a 90 grados el origen rota, radio constante',
    cerca(Math.hypot(g90.x - centro.x, g90.z - centro.z), 0.5, 1e-9),
    `(${g90.x.toFixed(3)}, ${g90.z.toFixed(3)})`)

  const vuelta = girarAlrededorDe(origen, centro, Math.PI * 2)
  probar('una vuelta completa devuelve al mismo sitio',
    cerca(vuelta.x, origen.x, 1e-9) && cerca(vuelta.z, origen.z, 1e-9))

  const centroMismo = girarAlrededorDe(centro, centro, 1.234)
  probar('girar sobre uno mismo no mueve nada',
    cerca(centroMismo.x, centro.x, 1e-12) && cerca(centroMismo.z, centro.z, 1e-12))

  // Doce saltos de 30 grados = una vuelta entera.
  let p = { x: 3, z: 0 }
  for (let i = 0; i < 12; i++) p = girarAlrededorDe(p, { x: 0, z: 0 }, (30 * Math.PI) / 180)
  probar('12 saltos de 30 grados cierran la vuelta',
    cerca(p.x, 3, 1e-9) && cerca(p.z, 0, 1e-9), `(${p.x.toFixed(6)}, ${p.z.toFixed(6)})`)
}

console.log('\nDESFASE DE LA CABEZA AL SALTAR')
{
  // El usuario camino 0.8 m a la derecha dentro de su espacio real.
  const nuevoOrigen = origenParaAterrizarEn({ x: 1, z: 2 }, { x: 0.8, z: 0 }, { x: 0, z: 0 })
  probar('el origen compensa el desfase', cerca(nuevoOrigen.x, 0.2) && cerca(nuevoOrigen.z, 2),
    `(${nuevoOrigen.x}, ${nuevoOrigen.z})`)
  // Y comprobado del reves: la cabeza acaba justo en el destino.
  const cabezaFinal = { x: nuevoOrigen.x + 0.8, z: nuevoOrigen.z + 0 }
  probar('la cabeza acaba en el punto senalado', cerca(cabezaFinal.x, 1) && cerca(cabezaFinal.z, 2))
}

console.log('\nZONA CAMINABLE (sala de 9 x 7)')
{
  probar('el centro de la sala esta ocupado por el equipo', !esDestinoValido(0, 0))
  probar('delante del equipo se puede pisar', esDestinoValido(0, 2.2))
  probar('fuera de la sala, no', !esDestinoValido(6, 0))
  probar('pegado al muro derecho, no', !esDestinoValido(4.3, 0))
  probar('dentro de la mesa izquierda, no', !esDestinoValido(-4.1, 0))
  probar('junto a la mesa izquierda pero libre, si', esDestinoValido(-3, 0))
  probar('dentro de la mesa del fondo, no', !esDestinoValido(1.6, -3.1))
  probar('esquina libre, si', esDestinoValido(2.5, 2.5))
}

console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\n${fallos} COMPROBACIONES FALLIDAS\n`)
process.exit(fallos === 0 ? 0 : 1)
