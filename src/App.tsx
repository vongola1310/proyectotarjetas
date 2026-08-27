/**
 * Punto de entrada de la interfaz del showroom.
 *
 * PASO 1: esta pantalla es provisional. Solo sirve para comprobar que el andamiaje
 * (Vite + React + TypeScript + Tailwind) compila y renderiza. La escena 3D del
 * laboratorio entra en el Paso 3 y sustituye por completo este contenido.
 */
export default function App() {
  return (
    <main className="flex h-full w-full items-center justify-center bg-fondo p-6">
      <section className="w-full max-w-lg rounded-2xl border border-borde bg-superficie p-8 shadow-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-acento">
          Revvity Mexico &middot; EUROIMMUN
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-texto">Showroom Virtual</h1>

        <p className="mt-3 text-sm leading-relaxed text-texto-tenue">
          Recorrido a escala real de nuestros analizadores. Andamiaje instalado y
          funcionando; la escena del laboratorio se construye en el siguiente paso.
        </p>

        <ul className="mt-6 space-y-2 border-t border-borde pt-6 text-sm text-texto-tenue">
          <li>
            <span className="text-acento">&#10003;</span> Vite + React + TypeScript
          </li>
          <li>
            <span className="text-acento">&#10003;</span> Tailwind aplicando estilos
          </li>
          <li>
            <span className="text-texto-tenue/50">&#9675;</span> Escena 3D del laboratorio
          </li>
          <li>
            <span className="text-texto-tenue/50">&#9675;</span> Modelos y modo VR
          </li>
        </ul>
      </section>
    </main>
  )
}
