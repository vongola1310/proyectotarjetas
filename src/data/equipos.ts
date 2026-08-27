import { LABORATORIO } from '../configuracion/laboratorio'
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
 *             Conviene pasarle dos o tres medidas (--ancho --alto --fondo): si los
 *             factores no concuerdan entre si, avisa, y eso delata un modelo rotado
 *             o incompleto antes de que el equipo salga deformado en la demo.
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

    // Calculado con la medida de catalogo: 120 x 75 x 115 cm (ancho x fondo x alto).
    //
    // OJO, HAY UNA DISCREPANCIA SIN RESOLVER. El factor sale distinto segun el eje
    // con el que se mida:
    //
    //   ancho  1200 mm / 15.060 unidades  ->  0.0797
    //   fondo   750 mm / 10.583 unidades  ->  0.0709
    //   alto   1150 mm /  8.098 unidades  ->  0.1420   <- se sale del rango
    //
    // El fondo ya esta explicado: la caja envolvente incluye la TAPA ABIERTA, que
    // sobresale por detras del chasis. Midiendo solo el chasis el fondo sale en
    // 0.787 m contra los 0.750 de ficha, un 5%, que es tolerancia normal de
    // modelado. La ficha mide con la tapa cerrada.
    //
    // El alto sigue sin cuadrar: el modelo mide 0.645 m y la ficha dice 1.150 m.
    // Lo mas probable es que el .glb traiga solo el cuerpo del equipo y que la
    // ficha cuente tambien su base o pedestal. PENDIENTE DE CONFIRMAR.
    //
    // Se usa el ancho, que es la medida inequivoca: eje mayor del chasis, sin
    // partes moviles que lo alteren. Con el, el equipo queda en 1.200 x 0.645 m.
    escala: 0.0796822,

    // Sobre la isla de exposicion del centro de la sala, apoyado en su cubierta.
    //
    // El I-2P es un equipo de sobremesa: en el piso se ve mal y, mas importante,
    // el cliente lo percibe mas pequeno de lo que es porque pierde la referencia
    // de altura. La isla esta exenta para poder rodearla.
    posicionInicial: [0, LABORATORIO.mesa.alto, 0],

    descripcionCorta:
      'Sistema automatizado para el procesamiento de ensayos ELISA e inmunofluorescencia indirecta, con dos placas en paralelo.',

    hotspots: [
      {
        id: 'tapa',
        // Centro de la pieza "Tapa_EUROIMMUN Analyzer I-2P" del modelo.
        posicion: [0.109, 0.427, 0.196],
        titulo: 'Cubierta de proteccion',
        descripcion:
          'TEXTO PROVISIONAL. Cubierta abatible que aisla el area de trabajo durante el procesamiento y protege las muestras de contaminacion ambiental.',
      },
      {
        id: 'cajon-muestras',
        // Centro de la pieza "Cajon_S1" del modelo.
        posicion: [0.056, 0.271, 0.03],
        titulo: 'Cajon de muestras',
        descripcion:
          'TEXTO PROVISIONAL. Bandeja extraible donde se cargan las gradillas de muestras y los controles antes de iniciar la serie.',
      },
      {
        id: 'lector-codigo-barras',
        // Centro de la pieza "Codigo_Barras" del modelo.
        posicion: [0.482, 0.513, -0.143],
        titulo: 'Lector de codigo de barras',
        descripcion:
          'TEXTO PROVISIONAL. Identifica automaticamente muestras y reactivos, eliminando la transcripcion manual y su riesgo de error.',
      },
      {
        id: 'reactivos',
        // Centro de la pieza "Componente_Botes4" del modelo.
        posicion: [-0.527, 0.209, 0.15],
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
