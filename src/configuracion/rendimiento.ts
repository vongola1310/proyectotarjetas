/**
 * Ajustes de rendimiento.
 *
 * El objetivo es 72 fps estables en Meta Quest 2, que es hardware modesto. Todo lo
 * que cuesta cuadros esta reunido aqui para poder subirlo o bajarlo de un solo sitio.
 *
 * OJO CON dpr: solo gobierna el lienzo de ESCRITORIO. Dentro de una sesion inmersiva
 * el navegador ignora dpr por completo y manda la escala del framebuffer de WebXR,
 * que se configura en el store de XR (Paso 6), no aqui.
 */
export const RENDIMIENTO = {
  /**
   * Rango de densidad de pixeles del lienzo de escritorio: [minimo, maximo].
   * El tope de 1.5 evita que una pantalla Retina renderice a 2x sin necesidad.
   */
  dpr: [1, 1.5] as [number, number],

  /**
   * Sombras en tiempo real. Como maximo UNA luz las proyecta.
   *
   * En escritorio salen gratis. Para el Quest 2 se evalua en el Paso 9 si se
   * mantienen o se sustituyen por una sombra de contacto renderizada una sola vez.
   */
  sombras: {
    activas: true,
    /**
     * Lado del mapa de sombras. En escritorio 2048 sale gratis; en el Paso 9 se
     * evalua bajarlo a 1024, que es el techo razonable en movil.
     */
    resolucion: 2048,
    /**
     * Radio del area que proyecta sombra, en metros, alrededor del origen.
     * Cuanto mas ajustado a la sala, mas texeles por metro y menos dentado.
     */
    alcance: 5.5,
  },

  /**
   * Filtrado anisotropico de las texturas.
   *
   * Sin el, el piso se convierte en una papilla de aliasing en cuanto lo miras de
   * canto, que es justo el angulo con el que se ve casi siempre. Cuesta poco y se
   * nota mucho; 4 es suficiente.
   */
  anisotropiaMaxima: 4,

  /** Plano cercano y lejano de la camara. Ajustados a una sala, no a un exterior. */
  camara: {
    fov: 60,
    cerca: 0.1,
    lejos: 60,
    /** Altura de los ojos en escritorio. Coincide con la de una persona de pie. */
    alturaOjos: 1.7,
  },
} as const
