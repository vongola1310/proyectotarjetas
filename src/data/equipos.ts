import type { Equipo } from '../tipos/showroom'

/**
 * Catalogo de analizadores del showroom.
 *
 * Para anadir un equipo basta con agregar un objeto a este array; ningun componente
 * de la escena necesita cambiar. El orden del array es el orden del selector.
 *
 * COMO SE OBTIENEN LOS NUMEROS
 *
 *   escala    No se estima a ojo. Se mide el .glb contra una medida real de
 *             catalogo y la herramienta devuelve el factor exacto:
 *               node herramientas/medir-modelo.mjs public/models/<archivo>.glb --ancho=<mm>
 *
 *   hotspots  Sus posiciones son relativas al equipo (origen en el centro de la
 *             huella, Y = 0 en el piso), en metros. Las de este primer equipo se
 *             derivaron de los centros reales de las piezas del modelo, pero
 *             conviene afinarlas mirando la escena en el Paso 5.
 */
export const equipos: readonly Equipo[] = [
  {
    id: 'analyzer-i-2p',
    nombre: 'Analyzer I-2P',
    modelo: '/models/analyzer-i-2p.glb',

    // PROVISIONAL. Calculado suponiendo 1600 mm de ancho real, que es una
    // suposicion mia, no un dato de catalogo. Con esa cifra el equipo queda en
    // 1.600 x 0.861 x 1.128 m, proporciones plausibles para el aparato. En cuanto
    // tengamos la medida oficial hay que recalcularlo:
    //   node herramientas/medir-modelo.mjs public/models/analyzer-i-2p.glb --ancho=<mm reales>
    escala: 0.106243,

    // Centrado en el laboratorio, apoyado en el piso.
    posicionInicial: [0, 0, 0],

    descripcionCorta:
      'Sistema automatizado para el procesamiento de ensayos ELISA e inmunofluorescencia indirecta, con dos placas en paralelo.',

    hotspots: [
      {
        id: 'tapa',
        // Centro de la pieza "Tapa_EUROIMMUN Analyzer I-2P" del modelo.
        posicion: [0.145, 0.57, 0.261],
        titulo: 'Cubierta de proteccion',
        descripcion:
          'TEXTO PROVISIONAL. Cubierta abatible que aisla el area de trabajo durante el procesamiento y protege las muestras de contaminacion ambiental.',
      },
      {
        id: 'cajon-muestras',
        // Centro de la pieza "Cajon_S1" del modelo.
        posicion: [0.074, 0.362, 0.04],
        titulo: 'Cajon de muestras',
        descripcion:
          'TEXTO PROVISIONAL. Bandeja extraible donde se cargan las gradillas de muestras y los controles antes de iniciar la serie.',
      },
      {
        id: 'lector-codigo-barras',
        // Centro de la pieza "Codigo_Barras" del modelo.
        posicion: [0.642, 0.684, -0.191],
        titulo: 'Lector de codigo de barras',
        descripcion:
          'TEXTO PROVISIONAL. Identifica automaticamente muestras y reactivos, eliminando la transcripcion manual y su riesgo de error.',
      },
      {
        id: 'reactivos',
        // Centro de la pieza "Componente_Botes4" del modelo.
        posicion: [-0.702, 0.278, 0.2],
        titulo: 'Posiciones de reactivos',
        descripcion:
          'TEXTO PROVISIONAL. Alojamiento de los frascos de reactivo, con control de nivel para avisar antes de que se agoten a mitad de una corrida.',
      },
    ],
  },
]

/** Devuelve un equipo por su id, o undefined si no existe. */
export function buscarEquipo(id: string): Equipo | undefined {
  return equipos.find((equipo) => equipo.id === id)
}

/** Equipo que se muestra al abrir la aplicacion. */
export const equipoPorDefecto: Equipo = equipos[0]
