import MarcadorHotspot from './MarcadorHotspot'
import PanelInformacion from './PanelInformacion'
import type { Hotspot } from '../tipos/showroom'

/**
 * Todos los hotspots de un equipo, con su panel abierto si lo hay.
 *
 * Va como hija del grupo que posiciona el equipo, pero FUERA del grupo que le
 * aplica la escala: las posiciones de los hotspots ya vienen en metros, tal como
 * documenta el tipo Hotspot. Si colgaran del grupo escalado se multiplicarian dos
 * veces y acabarian dispersos por la sala.
 */
export default function CapaHotspots({
  hotspots,
  abierto,
  onSeleccionar,
}: {
  hotspots: readonly Hotspot[]
  abierto: string | null
  onSeleccionar: (id: string | null) => void
}) {
  const hotspotAbierto = hotspots.find((h) => h.id === abierto) ?? null

  return (
    <group name="hotspots">
      {hotspots.map((hotspot) => (
        <MarcadorHotspot
          key={hotspot.id}
          hotspot={hotspot}
          activo={hotspot.id === abierto}
          // Volver a pulsar el mismo hotspot cierra su panel.
          onSeleccionar={(id) => onSeleccionar(id === abierto ? null : id)}
        />
      ))}

      {hotspotAbierto !== null && <PanelInformacion hotspot={hotspotAbierto} />}
    </group>
  )
}
