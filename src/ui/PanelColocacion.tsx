import { olvidarPuntos, usarPuntosColocados } from '../ganchos/colocacion'

/**
 * Ayuda para colocar hotspots.
 *
 * Se clica sobre la pieza del equipo y aqui aparece la linea lista para pegar en
 * src/data/equipos.ts. Las coordenadas salen en el espacio local del equipo, que es
 * el que documenta el tipo Hotspot: origen en el centro de la huella, Y = 0 en la
 * base. Asi siguen siendo validas aunque el equipo cambie de sitio o de altura.
 */
export default function PanelColocacion() {
  const puntos = usarPuntosColocados()

  const comoLinea = (p: { x: number; y: number; z: number }) =>
    `posicion: [${p.x}, ${p.y}, ${p.z}],`

  return (
    <aside className="pointer-events-auto w-72 rounded-xl border border-acento/40 bg-fondo/90 p-3 backdrop-blur">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-acento">Modo colocación</p>
        {puntos.length > 0 && (
          <button
            type="button"
            onClick={olvidarPuntos}
            className="text-[0.65rem] text-texto-tenue underline underline-offset-2 hover:text-texto"
          >
            limpiar
          </button>
        )}
      </div>

      <p className="mt-1 text-[0.7rem] leading-relaxed text-texto-tenue">
        Haz clic sobre la pieza del equipo. Copia la línea y pégala en el hotspot
        correspondiente de <code className="text-texto">src/data/equipos.ts</code>.
      </p>

      {puntos.length === 0 ? (
        <p className="mt-3 rounded-lg border border-borde bg-superficie px-3 py-2 text-center font-mono text-[0.7rem] text-texto-tenue">
          sin puntos todavía
        </p>
      ) : (
        <ul className="mt-3 space-y-1">
          {puntos.map((punto) => (
            <li key={punto.id}>
              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(comoLinea(punto))}
                title="Copiar al portapapeles"
                className="w-full rounded-lg border border-borde bg-superficie px-2 py-1.5 text-left font-mono text-[0.7rem] text-texto transition-colors hover:border-acento/60 hover:bg-superficie-alta"
              >
                {comoLinea(punto)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
