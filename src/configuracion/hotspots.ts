/**
 * Aspecto y medidas de los hotspots y sus paneles, en METROS.
 *
 * Los tamanos estan pensados para verse desde el visor, no desde un monitor. La
 * referencia util es el angulo que ocupa el texto en el ojo: por debajo de un grado
 * se lee mal con la resolucion del Quest 2. A un metro de distancia, un grado son
 * unos 17 mm, y de ahi salen los cuerpos de letra de abajo.
 */
export const HOTSPOTS = {
  marcador: {
    /** Radio del punto central. */
    radioPunto: 0.016,
    /** Radio exterior del anillo. */
    radioAnillo: 0.03,
    grosorAnillo: 0.006,
    /**
     * Radio del area sensible, invisible y mas grande que el marcador.
     * Apuntar con el control de un visor es bastante menos preciso que con el raton.
     */
    radioSensible: 0.055,
    /** Cuanto crece el marcador al pasar por encima. */
    escalaAlSenalar: 1.25,
  },

  panel: {
    ancho: 0.58,
    /** Margen interior entre el borde del panel y el texto. */
    margen: 0.035,
    radioEsquina: 0.022,
    /** Separacion entre el marcador y el borde del panel. */
    separacion: 0.07,
    cuerpoTitulo: 0.034,
    cuerpoDescripcion: 0.022,
    /** Interlineado, como multiplo del cuerpo de letra. */
    interlineado: 1.45,
  },

  /** Fuentes recortadas y servidas en local. Ver public/fuentes/LEEME.md */
  fuentes: {
    normal: '/fuentes/liberation-sans.woff',
    negrita: '/fuentes/liberation-sans-negrita.woff',
  },

  colores: {
    punto: '#ffffff',
    anillo: '#4f9cf9',
    anilloActivo: '#ffffff',
    fondoPanel: '#0b0f14',
    bordePanel: '#4f9cf9',
    titulo: '#ffffff',
    descripcion: '#c3cedb',
    guia: '#4f9cf9',
  },

  /**
   * Orden de dibujado de los marcadores.
   *
   * Se dibujan por encima de todo y sin comprobar profundidad, a proposito: si no,
   * los hotspots que caen sobre el interior del equipo quedarian ocultos por su
   * propia carcasa y el cliente no sabria que existen. El precio es que los del
   * lado opuesto tambien se ven; a cambio, la informacion disponible se ve toda de
   * un vistazo, que es lo que se busca en una demo comercial.
   */
  ordenDibujado: 999,

  /**
   * Orden de dibujado del panel abierto, por encima del de los marcadores.
   * Sin esta separacion, un marcador que caiga sobre el panel se le dibuja encima
   * y le tacha el texto.
   */
  ordenPanel: 1010,
} as const
