import { OrbitControls } from '@react-three/drei'
import { useXR } from '@react-three/xr'

import { LABORATORIO } from '../configuracion/laboratorio'

/** Punto al que mira la camara de escritorio: el centro de la sala, a media altura. */
const PUNTO_DE_INTERES: [number, number, number] = [0, 0.9, 0]

/**
 * Controles de orbita, solo para escritorio.
 *
 * Se desmontan al entrar en el visor. Dentro de una sesion inmersiva la camara la
 * gobierna la cabeza del usuario, y unos controles que ademas la muevan por su
 * cuenta provocan justo el mareo que este proyecto quiere evitar.
 */
export default function ControlesEscritorio() {
  const enSesion = useXR((estado) => estado.session != null)

  if (enSesion) {
    return null
  }

  return (
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
  )
}
