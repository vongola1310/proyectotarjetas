import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

import { COLORES_LABORATORIO, LABORATORIO } from '../configuracion/laboratorio'
import { RENDIMIENTO } from '../configuracion/rendimiento'

/** Lado en pixeles del mosaico que se dibuja una sola vez y luego se repite. */
const LADO_MOSAICO = 256

/**
 * Dibuja la textura del piso en un canvas, sin descargar ningun archivo.
 *
 * Un color plano delata al ojo que el piso es falso: no hay nada que le diga al
 * cerebro a que distancia esta ni de que tamano es. Las juntas de las losetas dan
 * esa referencia. Generarlas en un canvas evita sumar una descarga mas a un
 * proyecto que ya va justo de peso.
 */
function dibujarMosaicoDePiso(): HTMLCanvasElement {
  const lienzo = document.createElement('canvas')
  lienzo.width = LADO_MOSAICO
  lienzo.height = LADO_MOSAICO

  const ctx = lienzo.getContext('2d')
  if (ctx === null) {
    throw new Error('No se pudo obtener el contexto 2D para generar la textura del piso')
  }

  ctx.fillStyle = COLORES_LABORATORIO.losetaClara
  ctx.fillRect(0, 0, LADO_MOSAICO, LADO_MOSAICO)

  // Veteado muy tenue: rompe la uniformidad sin llegar a leerse como suciedad.
  ctx.fillStyle = COLORES_LABORATORIO.losetaOscura
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * LADO_MOSAICO
    const y = Math.random() * LADO_MOSAICO
    ctx.globalAlpha = 0.05 + Math.random() * 0.12
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }
  ctx.globalAlpha = 1

  // Junta en dos bordes: al repetirse forma la retícula completa.
  const grosorJunta = Math.max(2, Math.round(LADO_MOSAICO * 0.012))
  ctx.fillStyle = COLORES_LABORATORIO.juntaLoseta
  ctx.fillRect(0, 0, LADO_MOSAICO, grosorJunta)
  ctx.fillRect(0, 0, grosorJunta, LADO_MOSAICO)

  return lienzo
}

/**
 * Textura del piso, lista para usar y repetida a la medida real de la loseta.
 *
 * Se crea una sola vez y se libera sola cuando three.js descarta el material.
 */
export function usarTexturaPiso(): Texture {
  const renderizador = useThree((estado) => estado.gl)

  return useMemo(() => {
    const textura = new CanvasTexture(dibujarMosaicoDePiso())

    textura.wrapS = RepeatWrapping
    textura.wrapT = RepeatWrapping
    textura.colorSpace = SRGBColorSpace

    // Una repeticion por loseta real, para que la escala del piso sea creible.
    textura.repeat.set(
      LABORATORIO.ancho / LABORATORIO.ladoLoseta,
      LABORATORIO.fondo / LABORATORIO.ladoLoseta,
    )

    textura.anisotropy = Math.min(
      RENDIMIENTO.anisotropiaMaxima,
      renderizador.capabilities.getMaxAnisotropy(),
    )

    return textura
  }, [renderizador])
}
