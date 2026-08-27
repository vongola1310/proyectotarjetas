import { useEffect, useState } from 'react'
import { Box3, Group, Mesh, Texture, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/**
 * Estado de la carga de un modelo.
 *
 * `procesando` existe a proposito: cuando termina la descarga todavia queda
 * descomprimir la geometria con Draco, que en un Quest 2 tarda lo suyo. Sin esta
 * fase la barra se quedaria clavada en 100% pareciendo colgada.
 */
export type EstadoCarga =
  | { readonly fase: 'inactivo' }
  | {
      readonly fase: 'descargando'
      readonly bytesRecibidos: number
      /** null cuando el servidor no informa el tamano total. */
      readonly bytesTotales: number | null
      /** null cuando no se puede calcular honestamente. */
      readonly porcentaje: number | null
    }
  | { readonly fase: 'procesando' }
  | { readonly fase: 'listo' }
  | { readonly fase: 'error'; readonly mensaje: string }

export interface ModeloCargado {
  readonly escena: Group
  /** Caja envolvente en unidades del archivo, antes de aplicar escala. */
  readonly caja: Box3
}

/** Ruta publica de los decodificadores de Draco. Ver public/draco/LEEME.md */
const RUTA_DECODIFICADORES = '/draco/'

let cargadorCompartido: GLTFLoader | null = null

/**
 * Un unico GLTFLoader para toda la aplicacion.
 *
 * DRACOLoader levanta un pool de workers con el modulo WebAssembly dentro. Crear
 * uno por modelo significaria pagar ese arranque en cada cambio de equipo, que es
 * justo lo que el selector no debe hacer sentir.
 */
function obtenerCargador(): GLTFLoader {
  if (cargadorCompartido === null) {
    const draco = new DRACOLoader()
    // setDecoderConfig quedo deprecado en three 0.185: el cargador ya elige
    // WebAssembly por su cuenta y cae a JavaScript solo si no hubiera soporte.
    draco.setDecoderPath(RUTA_DECODIFICADORES)

    cargadorCompartido = new GLTFLoader()
    cargadorCompartido.setDRACOLoader(draco)
  }
  return cargadorCompartido
}

/** Libera la memoria de video de un modelo que ya no se muestra. */
function liberar(escena: Group): void {
  escena.traverse((objeto) => {
    if (!(objeto instanceof Mesh)) {
      return
    }
    objeto.geometry.dispose()
    const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material]
    for (const material of materiales) {
      for (const valor of Object.values(material)) {
        // Las texturas del material son lo que de verdad ocupa en la GPU, y
        // material.dispose() no las libera: hay que soltarlas una por una.
        if (valor instanceof Texture) {
          valor.dispose()
        }
      }
      material.dispose()
    }
  })
}

/**
 * Carga un .glb informando del progreso REAL, en bytes.
 *
 * No se usa el cargador de three directamente porque su progreso depende de que el
 * servidor mande Content-Length; si responde con codificacion por trozos, el evento
 * llega con `lengthComputable` en falso y el porcentaje se vuelve ficcion. Aqui se
 * descarga con fetch leyendo el flujo trozo a trozo, asi que los bytes contados son
 * los que de verdad han llegado. Cuando no hay tamano total se informa de los
 * megabytes recibidos en lugar de inventar un porcentaje.
 */
export function usarCargaModelo(ruta: string): {
  modelo: ModeloCargado | null
  estado: EstadoCarga
} {
  const [modelo, setModelo] = useState<ModeloCargado | null>(null)
  const [estado, setEstado] = useState<EstadoCarga>({ fase: 'inactivo' })

  useEffect(() => {
    const control = new AbortController()
    let escenaCargada: Group | null = null
    let cancelado = false

    async function cargar(): Promise<void> {
      setModelo(null)
      setEstado({ fase: 'descargando', bytesRecibidos: 0, bytesTotales: null, porcentaje: null })

      try {
        const respuesta = await fetch(ruta, { signal: control.signal })

        if (!respuesta.ok) {
          throw new Error(`El servidor respondio ${respuesta.status} al pedir ${ruta}`)
        }
        if (respuesta.body === null) {
          throw new Error('La respuesta no trae cuerpo legible')
        }

        const cabecera = respuesta.headers.get('Content-Length')
        const bytesTotales = cabecera === null ? null : Number(cabecera)
        const totalValido = bytesTotales !== null && Number.isFinite(bytesTotales) && bytesTotales > 0

        const lector = respuesta.body.getReader()
        const trozos: Uint8Array[] = []
        let bytesRecibidos = 0

        for (;;) {
          const { done, value } = await lector.read()
          if (done) break

          trozos.push(value)
          bytesRecibidos += value.length

          setEstado({
            fase: 'descargando',
            bytesRecibidos,
            bytesTotales: totalValido ? bytesTotales : null,
            porcentaje: totalValido ? Math.min(100, (bytesRecibidos / bytesTotales) * 100) : null,
          })
        }

        if (cancelado) return

        // Un solo bufer contiguo, que es lo que espera el parser.
        const datos = new Uint8Array(bytesRecibidos)
        let desplazamiento = 0
        for (const trozo of trozos) {
          datos.set(trozo, desplazamiento)
          desplazamiento += trozo.length
        }

        setEstado({ fase: 'procesando' })

        const gltf = await obtenerCargador().parseAsync(
          datos.buffer as ArrayBuffer,
          // El .glb es autocontenido: no hay recursos externos que resolver.
          '',
        )

        if (cancelado) {
          liberar(gltf.scene)
          return
        }

        gltf.scene.traverse((objeto) => {
          if (objeto instanceof Mesh) {
            objeto.castShadow = true
            objeto.receiveShadow = true
          }
        })

        escenaCargada = gltf.scene
        setModelo({ escena: gltf.scene, caja: new Box3().setFromObject(gltf.scene) })
        setEstado({ fase: 'listo' })
      } catch (error) {
        if (control.signal.aborted || cancelado) {
          return
        }
        setEstado({
          fase: 'error',
          mensaje: error instanceof Error ? error.message : 'Fallo desconocido al cargar el modelo',
        })
      }
    }

    void cargar()

    return () => {
      cancelado = true
      control.abort()
      if (escenaCargada !== null) {
        liberar(escenaCargada)
      }
    }
  }, [ruta])

  return { modelo, estado }
}

/** Vector reutilizable, para no crear basura en cada calculo. */
const auxiliar = new Vector3()

/**
 * Desplazamiento que lleva el origen del modelo al centro de su huella y a ras
 * del piso, que es el convenio que documenta el tipo Hotspot.
 *
 * Va en UNIDADES DEL ARCHIVO, no en metros: se aplica dentro del grupo que ya lleva
 * la escala, asi que convertirlo aqui seria multiplicar y dividir por lo mismo.
 *
 * Se calcula de la caja real en lugar de guardarse como dato: asi, cuando alguien
 * vuelva a exportar el modelo con otro pivote, sigue apoyandose solo en el suelo.
 */
export function calcularCentrado(caja: Box3): [number, number, number] {
  caja.getCenter(auxiliar)
  return [-auxiliar.x, -caja.min.y, -auxiliar.z]
}
