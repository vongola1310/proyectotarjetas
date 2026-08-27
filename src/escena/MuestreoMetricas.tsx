import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useXR } from '@react-three/xr'

import { publicarMetricas } from '../ganchos/metricas'

/** Cada cuanto se publican las cifras, en milisegundos. */
const INTERVALO = 500

/**
 * Toma las cifras de rendimiento y las publica.
 *
 * Va dentro del lienzo porque necesita el bucle de cuadro y el renderizador. No
 * dibuja nada: de ensenar las cifras se encargan el panel 3D del visor y el de
 * escritorio, cada uno suscrito por su cuenta.
 *
 * Se publica dos veces por segundo, no en cada cuadro. Avisar a los suscriptores 72
 * veces por segundo haria que medir el rendimiento costase rendimiento.
 */
export default function MuestreoMetricas() {
  const gl = useThree((estado) => estado.gl)
  const hzSesion = useXR((estado) => estado.frameRate)

  const ventana = useRef({ cuadros: 0, tiempo: 0, peor: 0 })

  useFrame((_, delta) => {
    const v = ventana.current
    const ms = delta * 1000

    v.cuadros += 1
    v.tiempo += ms
    v.peor = Math.max(v.peor, ms)

    if (v.tiempo < INTERVALO) {
      return
    }

    publicarMetricas({
      fps: (v.cuadros * 1000) / v.tiempo,
      msMedio: v.tiempo / v.cuadros,
      msPeor: v.peor,
      llamadas: gl.info.render.calls,
      triangulos: gl.info.render.triangles,
      geometrias: gl.info.memory.geometries,
      texturas: gl.info.memory.textures,
      programas: gl.info.programs?.length ?? 0,
      hzSesion: hzSesion ?? null,
    })

    v.cuadros = 0
    v.tiempo = 0
    v.peor = 0
  })

  return null
}
