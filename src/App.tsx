import EscenaShowroom from './escena/EscenaShowroom'

/**
 * Punto de entrada de la interfaz del showroom.
 *
 * PASO 3: la escena 3D ocupa toda la pantalla y la interfaz 2D se superpone encima.
 * El selector de equipo y el boton de entrar en VR ocuparan esta misma capa en los
 * pasos siguientes.
 */
export default function App() {
  return (
    <div className="relative h-full w-full bg-fondo">
      <EscenaShowroom />

      {/* Capa 2D. pointer-events-none deja pasar el raton al lienzo; cada control
          que si deba recibir clics lo vuelve a activar por su cuenta. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
        <header>
          <div className="inline-block rounded-xl border border-borde/60 bg-fondo/80 px-4 py-3 backdrop-blur">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-acento">
              Revvity Mexico &middot; EUROIMMUN
            </p>
            <h1 className="mt-1 text-lg font-semibold text-texto">Showroom Virtual</h1>
          </div>
        </header>

        <footer>
          <p className="inline-block rounded-lg border border-borde/60 bg-fondo/80 px-3 py-2 text-xs text-texto-tenue backdrop-blur">
            Arrastra para girar &middot; rueda para acercar &middot; clic derecho para desplazar
          </p>
        </footer>
      </div>
    </div>
  )
}
