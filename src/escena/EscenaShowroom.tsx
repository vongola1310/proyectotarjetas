import { useEffect, useState } from 'react'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

import { LABORATORIO } from '../configuracion/laboratorio'
import { RENDIMIENTO } from '../configuracion/rendimiento'
import type { ModeloCargado } from '../ganchos/usarCargaModelo'
import type { Equipo } from '../tipos/showroom'
import EquipoEnEscena from './EquipoEnEscena'
import Iluminacion from './Iluminacion'
import Laboratorio from './Laboratorio'

const { camara, dpr, sombras } = RENDIMIENTO

/** Punto al que mira la camara de escritorio: el centro de la sala, a media altura. */
const PUNTO_DE_INTERES: [number, number, number] = [0, 0.9, 0]

/**
 * La escena 3D del showroom.
 *
 * PASO 5: el laboratorio, el equipo y sus hotspots, en modo escritorio. La capa de
 * VR se monta encima en el paso siguiente.
 *
 * La camara arranca a 1.70 m del piso a proposito. Es la altura de los ojos de una
 * persona de pie, la misma con la que se vera dentro del visor, de modo que lo que
 * se juzga en el navegador se parece a lo que el cliente va a ver puesto el Quest.
 */
export default function EscenaShowroom({
  equipo,
  modelo,
}: {
  equipo: Equipo
  modelo: ModeloCargado | null
}) {
  const [hotspotAbierto, setHotspotAbierto] = useState<string | null>(null)

  // Al cambiar de equipo, el panel abierto pertenece al anterior: se cierra.
  useEffect(() => setHotspotAbierto(null), [equipo.id])

  return (
    <Canvas
      // R3F llama a esto cuando un clic no alcanza ningun objeto. Pinchar en el
      // vacio cierra el panel, que es lo que uno espera.
      onPointerMissed={() => setHotspotAbierto(null)}
      dpr={dpr}
      // 'percentage' = PCFShadowMap. El PCFSoft que R3F usa por defecto quedo
      // deprecado en three 0.185, y ademas cuesta mas por pixel del que podemos
      // gastar en el visor.
      shadows={sombras.activas ? 'percentage' : false}
      camera={{
        position: [2.7, camara.alturaOjos, 2.6],
        fov: camara.fov,
        near: camara.cerca,
        far: camara.lejos,
      }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      {/* Fondo neutro: si la camara de escritorio se asoma fuera de la sala, se ve
          un gris de estudio y no un vacio que parece un fallo. */}
      <color attach="background" args={['#3a3f46']} />

      <Iluminacion />
      <Laboratorio />
      <EquipoEnEscena
        equipo={equipo}
        modelo={modelo}
        hotspotAbierto={hotspotAbierto}
        onSeleccionarHotspot={setHotspotAbierto}
      />

      <OrbitControls
        target={PUNTO_DE_INTERES}
        // Amortiguacion: el giro se frena solo en vez de detenerse en seco.
        enableDamping
        dampingFactor={0.08}
        // Sin esto la camara se mete debajo del piso y se ve la sala por abajo.
        maxPolarAngle={Math.PI / 2 - 0.02}
        minPolarAngle={0.15}
        minDistance={0.8}
        // Tope pensado para no salirse de la sala y acabar mirando el muro por fuera.
        maxDistance={Math.min(LABORATORIO.ancho, LABORATORIO.fondo) / 2 + 1}
      />
    </Canvas>
  )
}
