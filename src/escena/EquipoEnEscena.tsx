import { MathUtils } from 'three'

import type { Equipo } from '../tipos/showroom'
import { calcularCentrado, type ModeloCargado } from '../ganchos/usarCargaModelo'
import CapaHotspots from './CapaHotspots'

/**
 * Coloca un equipo en el laboratorio a su tamano real.
 *
 * Toda la colocacion sale de los datos del equipo. El componente no sabe nada de
 * ningun analizador concreto: dale otro objeto Equipo y monta ese.
 *
 * La jerarquia de grupos va de fuera hacia dentro:
 *
 *   grupo exterior   posicion y giro dentro de la sala       <- dato del equipo
 *     grupo medio    escala de unidades del archivo a metros <- dato del equipo
 *       centrado     lleva el pivote al centro de la huella, a ras de piso
 *         modelo
 *
 * El centrado se calcula de la caja real del modelo y no se guarda como dato: asi,
 * si manana alguien reexporta el .glb con otro pivote, el equipo sigue apoyandose
 * en el suelo sin tocar equipos.ts.
 *
 * La carga vive en App y no aqui a proposito: la barra de progreso es interfaz 2D,
 * esta fuera del lienzo, y el estado tiene que nacer donde puedan verlo los dos.
 *
 * Los hotspots cuelgan del grupo exterior pero NO del de escala: sus posiciones ya
 * vienen en metros.
 */
export default function EquipoEnEscena({
  equipo,
  modelo,
  hotspotAbierto,
  onSeleccionarHotspot,
}: {
  equipo: Equipo
  modelo: ModeloCargado | null
  hotspotAbierto: string | null
  onSeleccionarHotspot: (id: string | null) => void
}) {
  if (modelo === null) {
    return null
  }

  return (
    <group
      name={`equipo:${equipo.id}`}
      position={[...equipo.posicionInicial]}
      rotation={[0, MathUtils.degToRad(equipo.rotacionY ?? 0), 0]}
    >
      <group scale={equipo.escala}>
        <group position={calcularCentrado(modelo.caja)}>
          <primitive object={modelo.escena} />
        </group>
      </group>

      <CapaHotspots
        hotspots={equipo.hotspots}
        abierto={hotspotAbierto}
        onSeleccionar={onSeleccionarHotspot}
      />
    </group>
  )
}
