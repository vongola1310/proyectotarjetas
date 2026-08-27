import { equipoPorDefecto } from './data/equipos'
import EscenaShowroom from './escena/EscenaShowroom'
import { usarCargaModelo } from './ganchos/usarCargaModelo'
import BotonEntrarVR from './ui/BotonEntrarVR'
import PantallaCarga from './ui/PantallaCarga'

/**
 * Punto de entrada de la interfaz del showroom.
 *
 * PASO 6: la interfaz 2D es la de escritorio. Dentro del visor no se ve nada de
 * esto, porque alli no hay DOM: lo que el cliente vea con el casco puesto tiene que
 * ser geometria de la escena.
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

        <footer className="flex items-end justify-between gap-4">
          <p className="rounded-lg border border-borde/60 bg-fondo/80 px-3 py-2 text-xs text-texto-tenue backdrop-blur">
            Arrastra para girar &middot; rueda para acercar &middot; clic en un punto para ver su ficha
          </p>

          <BotonEntrarVR listo={modelo !== null} />
        </footer>
      </div>

      <PantallaCarga estado={estado} nombre={equipo.nombre} />
    </div>
  )
}
