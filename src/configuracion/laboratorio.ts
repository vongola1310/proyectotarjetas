/**
 * Dimensiones del laboratorio virtual, en METROS.
 *
 * Vive aparte de los componentes porque otros sistemas necesitan estas medidas sin
 * tener que montar la escena: el area de teletransporte del Paso 7, por ejemplo,
 * se deriva del tamano de la sala.
 *
 * Las medidas del mobiliario son las reales de un laboratorio clinico. No es un
 * detalle esteticamente: la puerta de 2.10 m y la mesa de 0.90 m son las referencias
 * inconscientes con las que el cliente va a juzgar el tamano del analizador. Si estan
 * mal, el equipo se percibe del tamano equivocado aunque su escala sea exacta.
 */
export const LABORATORIO = {
  /** Medida de la sala de pared interior a pared interior. */
  ancho: 9,
  fondo: 7,
  alto: 3,

  /** Grosor de muros, piso y techo. */
  grosorMuro: 0.12,

  /** Zoclo: la franja baja que protege la pared. */
  alturaZoclo: 0.1,

  /** Lado del mosaico del piso. Un piso de laboratorio ronda los 60 cm. */
  ladoLoseta: 0.6,

  puerta: {
    ancho: 0.95,
    alto: 2.1,
    /** Desplazamiento sobre la pared del fondo, desde el centro. */
    desplazamientoX: -2.8,
  },

  mesa: {
    alto: 0.9,
    fondo: 0.75,
    grosorCubierta: 0.04,
  },

  gabinete: {
    /** Altura a la que arranca el gabinete mural. */
    alturaBase: 1.5,
    alto: 0.7,
    fondo: 0.35,
  },

  luminaria: {
    ancho: 1.2,
    fondo: 0.3,
    /** Cuanto cuelga del techo. */
    descuelgue: 0.02,
  },
} as const

/** Paleta del laboratorio. Tonos de clinica: claros, mates, sin saturacion. */
export const COLORES_LABORATORIO = {
  losetaClara: '#cfcfca',
  losetaOscura: '#c3c3bd',
  juntaLoseta: '#adada7',
  pared: '#e7e7e3',
  zoclo: '#7f8791',
  techo: '#f1f1ef',
  luminaria: '#fdfdf6',
  mesaCubierta: '#4a525c',
  mesaCuerpo: '#dedfe0',
  gabinete: '#e4e5e6',
  puerta: '#b9bec4',
  marcoPuerta: '#8d949c',
} as const
