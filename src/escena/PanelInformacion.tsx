import { useMemo, useState } from 'react'
import { Billboard, Text } from '@react-three/drei'
import { crearFormaPanel } from './formas'

import { HOTSPOTS } from '../configuracion/hotspots'
import type { Hotspot } from '../tipos/showroom'

const { panel, fuentes, colores, ordenPanel } = HOTSPOTS

/**
 * Panel de informacion de un hotspot.
 *
 * Es geometria 3D y no HTML porque tiene que existir dentro del visor, donde no hay
 * DOM. El texto se dibuja con troika (drei <Text>), que genera campos de distancia
 * y se mantiene nitido de cerca; la fuente se sirve desde /public/fuentes para que
 * no dependa de un CDN durante una demo en casa del cliente.
 *
 * El alto del panel se mide del texto ya maquetado en vez de fijarse a ojo. Los
 * textos definitivos los escribe el equipo comercial y nadie va a contar caracteres
 * para que quepan: el panel se ajusta a lo que le pongan.
 *
 * Se coloca a un lado del marcador, no encima, para no tapar justo la pieza que el
 * hotspot esta senalando.
 */
export default function PanelInformacion({ hotspot }: { hotspot: Hotspot }) {
  // Se anota el tipo a mano: la configuracion es `as const`, asi que sin esto
  // useState inferiria el literal 0.034 en vez de number.
  const [altoTitulo, setAltoTitulo] = useState<number>(panel.cuerpoTitulo)
  const [altoDescripcion, setAltoDescripcion] = useState<number>(panel.cuerpoDescripcion * 3)

  const anchoTexto = panel.ancho - panel.margen * 2
  const separacionInterna = panel.cuerpoTitulo * 0.6
  const alto = panel.margen * 2 + altoTitulo + separacionInterna + altoDescripcion

  const forma = useMemo(
    () => crearFormaPanel(panel.ancho, alto, panel.radioEsquina),
    [alto],
  )

  // El panel arranca junto al marcador y crece hacia la derecha.
  const desplazamientoX = panel.separacion + panel.ancho / 2
  const cima = alto / 2 - panel.margen

  /** Toma el alto real del texto ya maquetado por troika. */
  const medir =
    (guardar: (alto: number) => void) =>
    (objeto: { geometry?: { boundingBox?: { min: { y: number }; max: { y: number } } } }) => {
      const caja = objeto.geometry?.boundingBox
      if (caja != null) {
        guardar(caja.max.y - caja.min.y)
      }
    }

  return (
    <Billboard position={[...hotspot.posicion]}>
      <group position={[desplazamientoX, 0, 0]}>
        {/* Guia corta del marcador al panel, para que se lea a que punto pertenece. */}
        <mesh position={[-panel.ancho / 2 - panel.separacion / 2, 0, 0]} renderOrder={ordenPanel}>
          <planeGeometry args={[panel.separacion, 0.0035]} />
          <meshBasicMaterial color={colores.guia} transparent opacity={0.8} depthTest={false} toneMapped={false} />
        </mesh>

        <mesh renderOrder={ordenPanel} >
          <shapeGeometry args={[forma]} />
          <meshBasicMaterial
            color={colores.fondoPanel}
            transparent
            opacity={0.93}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>

        <Text
          font={fuentes.negrita}
          fontSize={panel.cuerpoTitulo}
          color={colores.titulo}
          maxWidth={anchoTexto}
          lineHeight={panel.interlineado}
          anchorX="left"
          anchorY="top"
          position={[-anchoTexto / 2, cima, 0.001]}
          renderOrder={ordenPanel + 1}
          onSync={medir(setAltoTitulo)}
        >
          {hotspot.titulo}
          <meshBasicMaterial attach="material" color={colores.titulo} depthTest={false} toneMapped={false} />
        </Text>

        <Text
          font={fuentes.normal}
          fontSize={panel.cuerpoDescripcion}
          color={colores.descripcion}
          maxWidth={anchoTexto}
          lineHeight={panel.interlineado}
          anchorX="left"
          anchorY="top"
          position={[-anchoTexto / 2, cima - altoTitulo - separacionInterna, 0.001]}
          renderOrder={ordenPanel + 1}
          onSync={medir(setAltoDescripcion)}
        >
          {hotspot.descripcion}
          <meshBasicMaterial attach="material" color={colores.descripcion} depthTest={false} toneMapped={false} />
        </Text>
      </group>
    </Billboard>
  )
}
