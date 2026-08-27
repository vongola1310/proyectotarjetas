/**
 * Ajustes de locomocion en realidad virtual.
 *
 * El publico de esta demo son clientes que se ponen un visor por primera vez, asi
 * que TODO aqui esta calibrado hacia el lado prudente. No hay desplazamiento
 * continuo a proposito: mover al usuario sin que su cuerpo lo acompane es la causa
 * numero uno del mareo, y un cliente mareado no compra un analizador.
 */
export const LOCOMOCION = {
  /**
   * Cuanto hay que empujar la palanca para que la accion cuente, de 0 a 1.
   *
   * Alto a proposito. Las palancas del Quest 2 se desvian solas un poco, y un
   * umbral bajo dispara giros que el usuario no pidio.
   */
  zonaMuerta: 0.6,

  teleport: {
    /** Velocidad inicial del arco, en m/s. Marca el alcance del salto. */
    velocidad: 5.5,
    /** Gravedad del arco. Mas alta, arco mas cerrado y salto mas corto. */
    gravedad: 9.8,
    /** Puntos con los que se dibuja la curva. Suficientes para que se vea suave. */
    resolucion: 24,
    /** Alcance maximo, en metros. Mas alla el destino se marca invalido. */
    alcanceMaximo: 6,
    /** Separacion minima a los muros, para no acabar con la nariz en la pared. */
    margenMuros: 0.55,
    /** Separacion minima a los muebles y al equipo. */
    margenObstaculos: 0.35,
  },

  giro: {
    /**
     * Grados por salto.
     *
     * Se gira a saltos y no de forma continua por la misma razon que no hay
     * desplazamiento continuo. 30 grados es el termino medio habitual: 45 marea a
     * algunos, y por debajo de 30 hacen falta demasiados saltos para darse la
     * vuelta.
     */
    grados: 30,
  },

  colores: {
    arcoValido: '#4f9cf9',
    arcoInvalido: '#e05c5c',
    marcaValida: '#4f9cf9',
    marcaInvalida: '#e05c5c',
  },

  /** Radio del disco que marca el destino en el piso, en metros. */
  radioMarca: 0.28,
} as const
