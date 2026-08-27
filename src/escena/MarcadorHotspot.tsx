import { useState } from 'react'
import { Billboard } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'

import { HOTSPOTS } from '../configuracion/hotspots'
import type { Hotspot } from '../tipos/showroom'

const { marcador, colores, ordenDibujado } = HOTSPOTS

/**
 * El punto flotante que marca una parte del equipo.
 *
 * Siempre mira a la camara y siempre se dibuja por encima de la geometria. Lleva
 * un area sensible invisible bastante mayor que el dibujo, porque apuntar con el
 * control de un visor es mucho menos preciso que con el raton.
 *
 * Los eventos son los normales de React Three Fiber, no hay nada especifico de VR:
 * en el visor, el rayo del control dispara exactamente los mismos onClick que el
 * raton en escritorio. Un solo camino de codigo para los dos modos.
 */
export default function MarcadorHotspot({
  hotspot,
  activo,
  onSeleccionar,
}: {
  hotspot: Hotspot
  activo: boolean
  onSeleccionar: (id: string) => void
}) {
  const [senalado, setSenalado] = useState(false)

  const entrar = (evento: ThreeEvent<PointerEvent>) => {
    evento.stopPropagation()
    setSenalado(true)
    document.body.style.cursor = 'pointer'
  }

  const salir = () => {
    setSenalado(false)
    document.body.style.cursor = 'auto'
  }

  const escala = senalado || activo ? marcador.escalaAlSenalar : 1

  return (
    <Billboard position={[...hotspot.posicion]}>
      <group scale={escala}>
        {/* Area sensible: invisible pero solida al raycast. No se usa visible={false}
            porque three deja fuera del raycast los objetos invisibles. */}
        <mesh
          onPointerOver={entrar}
          onPointerOut={salir}
          onClick={(evento) => {
            evento.stopPropagation()
            onSeleccionar(hotspot.id)
          }}
        >
          <circleGeometry args={[marcador.radioSensible, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
        </mesh>

        <mesh renderOrder={ordenDibujado} raycast={() => null}>
          <ringGeometry
            args={[marcador.radioAnillo - marcador.grosorAnillo, marcador.radioAnillo, 32]}
          />
          <meshBasicMaterial
            color={activo ? colores.anilloActivo : colores.anillo}
            transparent
            opacity={0.95}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        <mesh renderOrder={ordenDibujado + 1} raycast={() => null}>
          <circleGeometry args={[marcador.radioPunto, 24]} />
          <meshBasicMaterial
            color={activo ? colores.anillo : colores.punto}
            transparent
            opacity={0.95}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </Billboard>
  )
}
