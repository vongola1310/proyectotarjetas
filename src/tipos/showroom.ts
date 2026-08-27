/**
 * Tipos del showroom virtual.
 *
 * Todo lo que describe un equipo vive en datos (src/data/equipos.ts), nunca en el
 * JSX de la escena. Anadir un analizador nuevo debe ser escribir un objeto mas en
 * ese array, sin tocar ningun componente.
 */

/**
 * Tupla [x, y, z].
 *
 * Convenio de la escena, que es el de three.js: unidades en METROS, eje Y hacia
 * arriba, el piso en Y = 0. Un valor de Z positivo se acerca a la camara inicial.
 */
export type Vector3Tupla = readonly [x: number, y: number, z: number]

/**
 * Punto de interes flotante sobre una parte del equipo.
 *
 * En VR el usuario lo apunta con el control y presiona el gatillo; en escritorio
 * basta con hacer clic. Se abre entonces un panel con `titulo` y `descripcion`.
 */
export interface Hotspot {
  /** Identificador estable y unico dentro del equipo. Se usa como clave de React. */
  readonly id: string

  /**
   * Posicion en METROS relativa al origen del equipo, no al del mundo.
   *
   * El origen del equipo esta en el centro de su huella, a la altura del piso, de
   * modo que [0, 1, 0] es un metro por encima del suelo justo en el centro del
   * aparato. Asi las posiciones siguen siendo validas aunque el equipo se mueva a
   * otro punto del laboratorio.
   */
  readonly posicion: Vector3Tupla

  /** Encabezado del panel. Una linea corta. */
  readonly titulo: string

  /** Cuerpo del panel. Dos o tres frases; mas texto no se lee comodo en VR. */
  readonly descripcion: string
}

/**
 * Un analizador del catalogo, con todo lo necesario para colocarlo en la escena.
 */
export interface Equipo {
  /** Identificador estable y unico. Se usa en el selector y como clave de React. */
  readonly id: string

  /** Nombre comercial, tal como debe verse en pantalla. */
  readonly nombre: string

  /**
   * Ruta publica del archivo .glb, servida desde la carpeta /public.
   * Siempre empieza con "/models/".
   */
  readonly modelo: string

  /**
   * Factor que convierte las unidades del archivo a metros.
   *
   * Los .glb salen del CAD en unidades arbitrarias, distintas en cada modelo, asi
   * que este numero NO se adivina: se calcula a partir de una medida real de
   * catalogo con la herramienta de medicion.
   *
   *   node herramientas/medir-modelo.mjs public/models/<archivo>.glb --ancho=<mm>
   *
   * Es un escalar unico y no una tupla a proposito: escalar cada eje por separado
   * deformaria el equipo, y la promesa de esta demo es justamente la escala real.
   */
  readonly escala: number

  /**
   * Posicion del equipo dentro del laboratorio, en METROS.
   *
   * Se refiere al centro de la huella del equipo, con Y = 0 al nivel del piso.
   */
  readonly posicionInicial: Vector3Tupla

  /**
   * Giro del equipo sobre el eje vertical, en GRADOS.
   *
   * Los modelos no siempre salen del CAD mirando hacia el mismo lado. Es opcional
   * y su ausencia equivale a 0.
   */
  readonly rotacionY?: number

  /** Una o dos frases para el selector y la ficha de presentacion. */
  readonly descripcionCorta: string

  /** Puntos de interes del equipo. Puede ir vacio. */
  readonly hotspots: readonly Hotspot[]
}
