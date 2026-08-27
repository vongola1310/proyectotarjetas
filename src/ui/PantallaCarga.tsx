import type { EstadoCarga } from '../ganchos/usarCargaModelo'

const megas = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} MB`

/**
 * Pantalla de carga con progreso real.
 *
 * Nunca muestra un porcentaje inventado. Si el servidor no informa del tamano
 * total, ensena los megabytes recibidos, que siguen siendo un dato cierto y que se
 * mueve. Y distingue la descarga de la descompresion, porque al terminar de bajar
 * el archivo todavia queda descomprimir la geometria: sin decirlo, la barra se
 * quedaria en 100% pareciendo colgada.
 */
export default function PantallaCarga({ estado, nombre }: { estado: EstadoCarga; nombre: string }) {
  if (estado.fase === 'listo' || estado.fase === 'inactivo') {
    return null
  }

  const hayError = estado.fase === 'error'

  return (
    <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center bg-fondo/95 backdrop-blur-sm">
      <div className="w-full max-w-sm px-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-acento">{nombre}</p>

        {hayError ? (
          <>
            <h2 className="mt-3 text-lg font-semibold text-texto">No se pudo cargar el modelo</h2>
            <p className="mt-3 rounded-lg border border-borde bg-superficie px-4 py-3 text-left font-mono text-xs leading-relaxed text-texto-tenue">
              {estado.mensaje}
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-3 text-lg font-semibold text-texto">
              {estado.fase === 'procesando' ? 'Descomprimiendo geometria' : 'Cargando modelo'}
            </h2>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-superficie-alta">
              <div
                className={`h-full rounded-full bg-acento ${
                  // Sin porcentaje fiable, una barra que recorre de lado a lado dice
                  // "sigo trabajando" sin mentir sobre cuanto falta.
                  estado.fase === 'procesando' || estado.porcentaje === null
                    ? 'w-1/3 animate-[recorrer_1.1s_ease-in-out_infinite]'
                    : 'transition-[width] duration-200'
                }`}
                style={
                  estado.fase === 'descargando' && estado.porcentaje !== null
                    ? { width: `${estado.porcentaje}%` }
                    : undefined
                }
              />
            </div>

            <p className="mt-3 font-mono text-xs text-texto-tenue">
              {estado.fase === 'procesando'
                ? 'Un momento, esto no descarga nada'
                : estado.porcentaje !== null
                  ? `${estado.porcentaje.toFixed(0)}% · ${megas(estado.bytesRecibidos)} de ${megas(estado.bytesTotales ?? 0)}`
                  : `${megas(estado.bytesRecibidos)} recibidos`}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
