import { LABORATORIO } from '../configuracion/laboratorio'
import { RENDIMIENTO } from '../configuracion/rendimiento'

/**
 * Iluminacion de la sala.
 *
 * Presupuesto deliberadamente pobre, porque cada luz que sombrea se paga en cada
 * pixel y en cada ojo. El esquema es el minimo que da una sala creible:
 *
 *   1. Una luz hemisferica que imita el rebote del techo blanco en el piso. No
 *      proyecta sombras y practicamente no cuesta.
 *   2. UNA luz direccional que si sombrea, para que los equipos se apoyen en el
 *      piso en lugar de flotar. Es la unica de toda la escena.
 *   3. Un relleno frontal muy tenue, sin sombras, para que las caras que quedan
 *      de espaldas a la direccional no se vayan a negro.
 *
 * Las luminarias del techo son geometria con material sin iluminar: se ven
 * encendidas pero no iluminan nada. El truco cuesta cero y evita meter seis luces.
 */
export default function Iluminacion() {
  const { sombras } = RENDIMIENTO
  const { alcance } = sombras

  return (
    <>
      <hemisphereLight
        // El segundo color es el rebote del piso hacia arriba. Si se pone calido
        // u oscuro, el techo se ensucia de pardo: es la unica luz que le llega.
        args={['#ffffff', '#d9d8d3', 1.35]}
        position={[0, LABORATORIO.alto, 0]}
      />

      <directionalLight
        position={[3.5, LABORATORIO.alto + 1.5, 4]}
        intensity={1.7}
        castShadow={sombras.activas}
        shadow-mapSize-width={sombras.resolucion}
        shadow-mapSize-height={sombras.resolucion}
        // Encuadre ajustado a la sala: cuanto menor sea el area que cubre el mapa
        // de sombras, mas nitida sale cada sombra con la misma resolucion.
        shadow-camera-left={-alcance}
        shadow-camera-right={alcance}
        shadow-camera-top={alcance}
        shadow-camera-bottom={-alcance}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        // Sin esto aparecen las bandas de auto-sombreado sobre el piso.
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />

      <directionalLight position={[-4, 2.5, -3]} intensity={0.35} />
    </>
  )
}
