import { useState } from 'react'

import { almacenXR } from '../configuracion/almacenXR'
import { usarSoporteVR } from '../ganchos/usarSoporteVR'

/**
 * Boton para entrar en realidad virtual.
 *
 * Solo aparece cuando el navegador soporta de verdad sesiones inmersivas, asi que
 * en un portatil corriente no existe y nadie pulsa algo que no puede funcionar.
 *
 * Se deshabilita mientras el modelo carga: dentro del visor no hay DOM, la pantalla
 * de carga no se veria, y entrar antes de tiempo dejaria al cliente mirando una sala
 * vacia sin saber que esta pasando.
 *
 * Si la sesion falla, el motivo se muestra en pantalla. Esto va a usarse delante de
 * un cliente y con el visor ya puesto: un boton que no hace nada y no dice por que
 * es lo peor que le puede pasar al vendedor en ese momento.
 */
export default function BotonEntrarVR({ listo }: { listo: boolean }) {
  const soportado = usarSoporteVR()
  const [error, setError] = useState<string | null>(null)

  if (!soportado) {
    return null
  }

  const entrar = async () => {
    setError(null)
    try {
      await almacenXR.enterVR()
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudo iniciar la sesion de VR')
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error !== null && (
        <p className="pointer-events-auto max-w-xs rounded-lg border border-borde bg-superficie px-3 py-2 text-right text-xs leading-relaxed text-texto-tenue">
          No se pudo entrar en VR: {error}
        </p>
      )}

      <button
        type="button"
        disabled={!listo}
        onClick={() => void entrar()}
        className="pointer-events-auto rounded-xl border border-acento/50 bg-acento/15 px-5 py-3 text-sm font-semibold text-texto backdrop-blur transition-colors hover:bg-acento/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento disabled:cursor-not-allowed disabled:border-borde disabled:bg-superficie/70 disabled:text-texto-tenue"
      >
        {listo ? 'Entrar en VR' : 'Preparando el equipo...'}
      </button>
    </div>
  )
}
