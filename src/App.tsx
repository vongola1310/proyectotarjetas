import { equipos } from './data/equipos'

/**
 * Punto de entrada de la interfaz del showroom.
 *
 * PASO 2: sigue siendo una pantalla provisional, pero ya lee el catalogo real
 * desde src/data/equipos.ts en lugar de tener el contenido escrito a mano. La
 * escena 3D del laboratorio entra en el Paso 3 y sustituye este contenido.
 */
export default function App() {
  return (
    <main className="flex h-full w-full items-center justify-center overflow-y-auto bg-fondo p-6">
      <section className="w-full max-w-xl rounded-2xl border border-borde bg-superficie p-8 shadow-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-acento">
          Revvity Mexico &middot; EUROIMMUN
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-texto">Showroom Virtual</h1>

        <p className="mt-3 text-sm leading-relaxed text-texto-tenue">
          Recorrido a escala real de nuestros analizadores. Catalogo cargado desde datos;
          la escena del laboratorio se construye en el siguiente paso.
        </p>

        <h2 className="mt-8 text-xs font-medium uppercase tracking-[0.2em] text-texto-tenue">
          Catalogo ({equipos.length})
        </h2>

        <ul className="mt-4 space-y-3">
          {equipos.map((equipo) => (
            <li
              key={equipo.id}
              className="rounded-xl border border-borde bg-superficie-alta p-4"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-medium text-texto">{equipo.nombre}</h3>
                <span className="shrink-0 text-xs text-texto-tenue">
                  {equipo.hotspots.length} hotspots
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-texto-tenue">
                {equipo.descripcionCorta}
              </p>
              <p className="mt-3 font-mono text-xs text-texto-tenue/70">
                escala {equipo.escala} &middot; {equipo.modelo}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
