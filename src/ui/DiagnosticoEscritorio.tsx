import { usarMetricas } from '../ganchos/metricas'

/** Objetivo de cuadros por segundo fuera de la sesion inmersiva. */
const OBJETIVO_ESCRITORIO = 60

/**
 * Las mismas cifras que el panel del visor, pero en el DOM, para escritorio.
 *
 * Aqui si vale HTML: fuera de la sesion inmersiva el DOM se ve, y en un monitor se
 * lee mejor una tabla del navegador que geometria 3D. Dentro del visor este panel
 * no existe, y de las cifras se encarga <PanelDiagnostico />.
 */
export default function DiagnosticoEscritorio() {
  const m = usarMetricas()

  const objetivo = m.hzSesion ?? OBJETIVO_ESCRITORIO
  const color =
    m.fps >= objetivo - 3
      ? 'text-[#63d19e]'
      : m.fps >= objetivo * 0.85
        ? 'text-[#e8c468]'
        : 'text-[#e05c5c]'

  const filas: ReadonlyArray<readonly [string, string]> = [
    ['cuadro medio', `${m.msMedio.toFixed(1)} ms`],
    ['cuadro peor', `${m.msPeor.toFixed(1)} ms`],
    ['llamadas', String(m.llamadas)],
    ['triangulos', m.triangulos.toLocaleString('es-MX')],
    ['geometrias', String(m.geometrias)],
    ['texturas', String(m.texturas)],
    ['programas', String(m.programas)],
    ['sesion', m.hzSesion === null ? 'fuera de VR' : `${Math.round(m.hzSesion)} Hz`],
  ]

  return (
    <aside className="pointer-events-auto w-60 rounded-xl border border-borde/60 bg-fondo/85 p-3 font-mono text-xs backdrop-blur">
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{m.fps.toFixed(0)} fps</p>

      <dl className="mt-2 space-y-1 border-t border-borde pt-2">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex justify-between gap-3">
            <dt className="text-texto-tenue">{etiqueta}</dt>
            <dd className="tabular-nums text-texto">{valor}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
