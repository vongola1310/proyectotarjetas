import { equipoPorDefecto } from './data/equipos'
import EscenaShowroom from './escena/EscenaShowroom'
import { usarCargaModelo } from './ganchos/usarCargaModelo'
import PantallaCarga from './ui/PantallaCarga'

/**
 * Punto de entrada de la interfaz del showroom.
 *
 * PASO 4: el equipo se carga aqui, no dentro de la escena, porque la barra de
 * progreso es interfaz 2D y vive fuera del lienzo. Naciendo el estado en este nivel
 * lo ven los dos sin que ninguno tenga que avisar al otro durante el render.
 *
 * El selector de equipo (Paso 8) sustituira esta constante por estado.
 */
export default function App() {
  const equipo = equipoPorDefecto
  const { modelo, estado } = usarCargaModelo(equipo.modelo)

  return (
    <div className="relative h-full w-full bg-fondo">
      <EscenaShowroom equipo={equipo} modelo={modelo} />

      {/* Capa 2D. pointer-events-none deja pasar el raton al lienzo; cada control
          que si deba recibir clics lo vuelve a activar por su cuenta. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
        <header>
          <div className="inline-block rounded-xl border border-borde/60 bg-fondo/80 px-4 py-3 backdrop-blur">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-acento">
              Revvity Mexico &middot; EUROIMMUN
            </p>
            <h1 className="mt-1 text-lg font-semibold text-texto">{equipo.nombre}</h1>
          </div>
        </header>

        <footer>
          <p className="inline-block rounded-lg border border-borde/60 bg-fondo/80 px-3 py-2 text-xs text-texto-tenue backdrop-blur">
            Arrastra para girar &middot; rueda para acercar &middot; clic derecho para desplazar
          </p>
        </footer>
      </div>

      <PantallaCarga estado={estado} nombre={equipo.nombre} />
    </div>
  )
}
