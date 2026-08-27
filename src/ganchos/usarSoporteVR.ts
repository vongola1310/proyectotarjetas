import { useEffect, useState, useSyncExternalStore } from 'react'

import { almacenXR } from '../configuracion/almacenXR'

/**
 * Dice si de verdad se puede entrar en realidad virtual desde este navegador.
 *
 * La respuesta que vale es una sola: que navigator.xr diga que soporta una sesion
 * inmersiva. Lo que complica el asunto es CUANDO preguntarlo.
 *
 * En desarrollo, el almacen inyecta un emulador de visor si no hay WebXR de verdad,
 * pero lo hace de forma asincrona y sustituyendo navigator.xr por el suyo. Preguntar
 * una sola vez al montar da un "no" que ya nunca se corrige, y el boton no aparece
 * nunca. Por eso se vuelve a preguntar cuando el emulador entra.
 *
 * Y se pregunta de verdad, en lugar de dar por bueno que la presencia del emulador
 * basta: puede quedar registrado en el almacen y aun asi no haber conseguido
 * instalar su runtime, en cuyo caso habria un boton que al pulsarlo falla. Mas vale
 * no ofrecer VR que ofrecerla y que reviente delante de un cliente.
 */
export function usarSoporteVR(): boolean {
  const hayEmulador = useSyncExternalStore(
    (avisar) => almacenXR.subscribe(avisar),
    () => almacenXR.getState().emulator != null,
    () => false,
  )

  const [soportado, setSoportado] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined' || navigator.xr == null) {
      setSoportado(false)
      return
    }

    let cancelado = false

    navigator.xr
      .isSessionSupported('immersive-vr')
      .then((respuesta) => {
        if (!cancelado) {
          setSoportado(respuesta)
        }
      })
      .catch(() => {
        if (!cancelado) {
          setSoportado(false)
        }
      })

    return () => {
      cancelado = true
    }
    // Se repite la consulta cuando entra el emulador, porque para entonces
    // navigator.xr ya no es el mismo objeto que se consulto la primera vez.
  }, [hayEmulador])

  return soportado
}
