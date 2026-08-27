import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { XR, XROrigin } from '@react-three/xr'

import { almacenXR } from '../configuracion/almacenXR'
import { RENDIMIENTO } from '../configuracion/rendimiento'
import type { ModeloCargado } from '../ganchos/usarCargaModelo'
import type { Equipo } from '../tipos/showroom'
import ControlesEscritorio from './ControlesEscritorio'
import Locomocion from './locomocion/Locomocion'
import EquipoEnEscena from './EquipoEnEscena'
import Iluminacion from './Iluminacion'
import Laboratorio from './Laboratorio'

const { camara, dpr, sombras } = RENDIMIENTO

/**
 * Donde empieza de pie el usuario dentro del visor: a poco mas de dos metros del
 * equipo, mirando hacia el. La orientacion por defecto de three ya apunta hacia -Z,
 * asi que estando en +Z se mira al centro de la sala sin girar nada.
 */
const POSICION_INICIAL_JUGADOR: [number, number, number] = [0, 0, 2.2]

/**
 * La escena 3D del showroom.
 *
 * PASO 7: el mismo contenido sirve para escritorio y para el visor. <XR> conecta el
 * almacen de sesion con la escena; <XROrigin> marca donde estan los pies del
 * usuario, y sobre el se monta la altura real de su cabeza.
 *
 * La posicion y el giro del jugador viven aqui, y <Locomocion /> es lo unico que
 * los cambia. Teniendolos en un solo sitio, nada mas puede mover al usuario por
 * su cuenta, que es la clase de sorpresa que marea.
 *
 * En escritorio la camara arranca a 1.70 m del piso, la altura de los ojos de una
 * persona de pie, para que lo que se juzga en el navegador se parezca a lo que el
 * cliente vera con el visor puesto.
 */
export default function EscenaShowroom({
  equipo,
  modelo,
}: {
  equipo: Equipo
  modelo: ModeloCargado | null
}) {
  const [hotspotAbierto, setHotspotAbierto] = useState<string | null>(null)
  const [posicionJugador, setPosicionJugador] = useState<[number, number, number]>(
    POSICION_INICIAL_JUGADOR,
  )
  const [rotacionJugador, setRotacionJugador] = useState(0)

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
      <XR store={almacenXR}>
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

        <XROrigin position={posicionJugador} rotation={[0, rotacionJugador, 0]} />

        <Locomocion
          origen={posicionJugador}
          rotacionY={rotacionJugador}
          onMover={(posicion, rotacion) => {
            setPosicionJugador(posicion)
            setRotacionJugador(rotacion)
          }}
        />

        <ControlesEscritorio />
      </XR>
    </Canvas>
  )
}
