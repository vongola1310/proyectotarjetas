import { useState } from 'react'

import { equipoPorDefecto, equipos, buscarEquipo } from './data/equipos'
import EscenaShowroom from './escena/EscenaShowroom'
import { colocacionPedida } from './ganchos/colocacion'
import { diagnosticoPedido } from './ganchos/metricas'
import { usarCargaModelo } from './ganchos/usarCargaModelo'
import DiagnosticoEscritorio from './ui/DiagnosticoEscritorio'
import PanelColocacion from './ui/PanelColocacion'
import BotonEntrarVR from './ui/BotonEntrarVR'
import PantallaCarga from './ui/PantallaCarga'
import SelectorEquipo from './ui/SelectorEquipo'

/**
 * Punto de entrada de la interfaz del showroom.
 *
 * PASO 8: el equipo activo es estado, y el selector lo cambia sin recargar la
 * pagina. La carga del modelo vive aqui, no dentro de la escena, porque la barra de
 * progreso es interfaz 2D y esta fuera del lienzo.
 *
 * Dentro del visor no se ve nada de esta capa: alli no hay DOM, y lo que el cliente
 * vea con el casco puesto tiene que ser geometria de la escena.
 */
/** Se decide una vez al cargar. */
const CON_DIAGNOSTICO = diagnosticoPedido()
const EN_COLOCACION = colocacionPedida()

export default function App() {
  const [equipoId, setEquipoId] = useState(equipoPorDefecto.id)
  const equipo = buscarEquipo(equipoId) ?? equipoPorDefecto

  const { modelo, estado } = usarCargaModelo(equipo.modelo)

  return (
    <div className="relative h-full w-full bg-fondo">
      <EscenaShowroom equipo={equipo} modelo={modelo} />

      {/* Capa 2D. pointer-events-none deja pasar el raton al lienzo; cada control
          que si deba recibir clics lo vuelve a activar por su cuenta. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between gap-4 p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="inline-block max-w-md rounded-xl border border-borde/60 bg-fondo/80 px-4 py-3 backdrop-blur">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-acento">
              Revvity Mexico &middot; EUROIMMUN
            </p>
            <h1 className="mt-1 text-lg font-semibold text-texto">{equipo.nombre}</h1>
            <p className="mt-1 text-xs leading-relaxed text-texto-tenue">
              {equipo.descripcionCorta}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            {CON_DIAGNOSTICO && <DiagnosticoEscritorio />}
            {EN_COLOCACION && <PanelColocacion />}
          </div>
        </header>

        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col items-start gap-3">
            <SelectorEquipo equipos={equipos} activoId={equipo.id} onSeleccionar={setEquipoId} />

            <p className="rounded-lg border border-borde/60 bg-fondo/80 px-3 py-2 text-xs text-texto-tenue backdrop-blur">
              Arrastra para girar &middot; rueda para acercar &middot; clic en un punto para ver su ficha
            </p>
          </div>

          <BotonEntrarVR listo={modelo !== null} />
        </div>
      </div>

      <PantallaCarga estado={estado} nombre={equipo.nombre} />
    </div>
  )
}
