import { Shape } from 'three'

/**
 * Rectangulo de esquinas redondeadas, centrado en su origen.
 *
 * Lo usan el panel de los hotspots y el de diagnostico. Vive aparte para que las
 * esquinas de los dos sean las mismas sin copiar el trazado.
 */
export function crearFormaPanel(ancho: number, alto: number, radio: number): Shape {
  const forma = new Shape()
  const x = ancho / 2
  const y = alto / 2
  const r = Math.min(radio, x, y)

  forma.moveTo(-x + r, -y)
  forma.lineTo(x - r, -y)
  forma.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false)
  forma.lineTo(x, y - r)
  forma.absarc(x - r, y - r, r, 0, Math.PI / 2, false)
  forma.lineTo(-x + r, y)
  forma.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false)
  forma.lineTo(-x, -y + r)
  forma.absarc(-x + r, -y + r, r, Math.PI, (3 * Math.PI) / 2, false)

  return forma
}
