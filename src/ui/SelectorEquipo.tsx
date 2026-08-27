import type { Equipo } from '../tipos/showroom'

/**
 * Selector de equipo.
 *
 * Recorre el catalogo, asi que anadir un analizador a src/data/equipos.ts lo hace
 * aparecer aqui sin tocar nada.
 *
 * Los equipos cuya escala no esta verificada contra ficha de catalogo se marcan a la
 * vista. Esta herramienta promete tamano real; ensenar uno estimado sin decirlo seria
 * romper esa promesa justo delante del cliente, y sin que el vendedor lo sepa.
 */
export default function SelectorEquipo({
  equipos,
  activoId,
  onSeleccionar,
}: {
  equipos: readonly Equipo[]
  activoId: string
  onSeleccionar: (id: string) => void
}) {
  if (equipos.length < 2) {
    return null
  }

  return (
    <nav
      aria-label="Equipos del catalogo"
      className="pointer-events-auto flex flex-wrap gap-2 rounded-xl border border-borde/60 bg-fondo/80 p-2 backdrop-blur"
    >
      {equipos.map((equipo) => {
        const activo = equipo.id === activoId

        return (
          <button
            key={equipo.id}
            type="button"
            aria-current={activo ? 'true' : undefined}
            onClick={() => onSeleccionar(equipo.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${
              activo
                ? 'bg-acento/20 font-semibold text-texto'
                : 'text-texto-tenue hover:bg-superficie-alta hover:text-texto'
            }`}
          >
            {equipo.nombre}

            {equipo.escalaVerificada !== true && (
              <span
                title="La escala es una estimacion, no viene de ficha de catalogo"
                className="rounded border border-borde px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-texto-tenue"
              >
                escala aprox.
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
