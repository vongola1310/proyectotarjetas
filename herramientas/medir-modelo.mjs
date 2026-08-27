/**
 * Mide un modelo .glb para calcular su factor de escala real.
 *
 * Los modelos exportados desde CAD llegan en unidades arbitrarias: uno viene en
 * metros, otro en pulgadas, otro en lo que decidiera el disenador. Esta herramienta
 * lee la caja envolvente del archivo y, dada una medida real de catalogo, calcula
 * el numero exacto que hay que poner en el campo `escala` de src/data/equipos.ts.
 *
 * Por defecto mide solo el CUERPO del equipo: los nodos con nombre. Los nodos
 * anonimos de las exportaciones suelen ser ejes guia, ayudantes o geometria suelta
 * que infla la caja envolvente y falsea el calculo. Con --completo se mide todo.
 *
 * Uso:
 *   node herramientas/medir-modelo.mjs <ruta.glb>
 *   node herramientas/medir-modelo.mjs <ruta.glb> --ancho=1600
 *   node herramientas/medir-modelo.mjs <ruta.glb> --alto=730 --fondo=820
 *   node herramientas/medir-modelo.mjs <ruta.glb> --detalle
 *   node herramientas/medir-modelo.mjs <ruta.glb> --ancho=1600 --completo
 *
 * Las medidas reales se dan en milimetros.
 */

import { NodeIO, getBounds } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import draco3d from 'draco3dgltf'

const EJES = ['x', 'y', 'z']
const EJE_POR_MEDIDA = { ancho: 'x', alto: 'y', fondo: 'z' }
const NOMBRE_DE_EJE = { x: 'ancho (X)', y: 'alto (Y)', z: 'fondo (Z)' }

/** Convierte los argumentos de linea de comandos en un objeto. */
function leerArgumentos(argv) {
  const opciones = { ruta: null, detalle: false, completo: false, medidasReales: {} }

  for (const argumento of argv) {
    if (argumento === '--detalle') {
      opciones.detalle = true
      continue
    }

    if (argumento === '--completo') {
      opciones.completo = true
      continue
    }

    const coincidencia = argumento.match(/^--(ancho|alto|fondo)=(.+)$/)
    if (coincidencia !== null) {
      const [, medida, valor] = coincidencia
      const milimetros = Number(valor)
      if (!Number.isFinite(milimetros) || milimetros <= 0) {
        throw new Error(`El valor de --${medida} debe ser un numero positivo en milimetros, no "${valor}"`)
      }
      opciones.medidasReales[EJE_POR_MEDIDA[medida]] = milimetros
      continue
    }

    if (argumento.startsWith('--')) {
      throw new Error(`Opcion desconocida: ${argumento}`)
    }

    opciones.ruta = argumento
  }

  if (opciones.ruta === null) {
    throw new Error(
      'Falta la ruta del .glb.\n' +
        'Ejemplo: node herramientas/medir-modelo.mjs public/models/analyzer-i2p.glb --ancho=1600',
    )
  }

  return opciones
}

/** Aplana el arbol de la escena a una lista de nodos que tienen malla. */
function listarNodosConMalla(escena) {
  const recorrer = (nodo) => [
    ...(nodo.getMesh() === null ? [] : [nodo]),
    ...nodo.listChildren().flatMap(recorrer),
  ]
  return escena.listChildren().flatMap(recorrer)
}

/** Describe una caja de gltf-transform como {min, max, dimensiones, centro}. */
function describirCaja(caja) {
  const dimensiones = {}
  const centro = {}
  EJES.forEach((eje, indice) => {
    dimensiones[eje] = caja.max[indice] - caja.min[indice]
    centro[eje] = (caja.max[indice] + caja.min[indice]) / 2
  })
  return { min: caja.min, max: caja.max, dimensiones, centro }
}

/** Une varias cajas en una sola. Devuelve null si la lista viene vacia. */
function unirCajas(cajas) {
  if (cajas.length === 0) {
    return null
  }
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const caja of cajas) {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], caja.min[i])
      max[i] = Math.max(max[i], caja.max[i])
    }
  }
  return describirCaja({ min, max })
}

const numero = (valor, decimales = 3) => valor.toFixed(decimales).padStart(10)

function imprimirCaja(titulo, caja) {
  console.log(`\n${titulo}`)
  console.log(`  minimo      X ${numero(caja.min[0])}   Y ${numero(caja.min[1])}   Z ${numero(caja.min[2])}`)
  console.log(`  maximo      X ${numero(caja.max[0])}   Y ${numero(caja.max[1])}   Z ${numero(caja.max[2])}`)
  console.log(
    `  dimensiones X ${numero(caja.dimensiones.x)}   Y ${numero(caja.dimensiones.y)}   Z ${numero(caja.dimensiones.z)}`,
  )
  console.log(`  centro      X ${numero(caja.centro.x)}   Y ${numero(caja.centro.y)}   Z ${numero(caja.centro.z)}`)
}

async function principal() {
  const opciones = leerArgumentos(process.argv.slice(2))

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
  })

  const documento = await io.read(opciones.ruta)
  const escena = documento.getRoot().getDefaultScene() ?? documento.getRoot().listScenes()[0]

  if (escena == null) {
    throw new Error(`El archivo ${opciones.ruta} no contiene ninguna escena.`)
  }

  const nodos = listarNodosConMalla(escena).map((nodo) => ({
    nombre: nodo.getName(),
    caja: getBounds(nodo),
  }))

  const cajaCompleta = describirCaja(getBounds(escena))
  const cajaCuerpo = unirCajas(nodos.filter((n) => n.nombre !== '').map((n) => n.caja))
  const anonimos = nodos.filter((n) => n.nombre === '')

  console.log(`\nModelo: ${opciones.ruta}`)
  console.log('='.repeat(74))
  console.log(`Nodos con malla: ${nodos.length}  (con nombre: ${nodos.length - anonimos.length}, anonimos: ${anonimos.length})`)

  imprimirCaja('CAJA ENVOLVENTE COMPLETA (unidades del archivo)', cajaCompleta)

  if (cajaCuerpo !== null && anonimos.length > 0) {
    imprimirCaja('CAJA DEL CUERPO DEL EQUIPO (solo nodos con nombre)', cajaCuerpo)

    const infla = EJES.some((eje) => cajaCompleta.dimensiones[eje] > cajaCuerpo.dimensiones[eje] * 1.1)
    if (infla) {
      console.log(
        '\n  AVISO: los nodos anonimos agrandan la caja envolvente mas de un 10%.\n' +
          '  Suelen ser ejes guia o geometria de ayuda que sobro de la exportacion. Ademas de\n' +
          '  falsear la escala, una caja inflada rompe el descarte por frustum y hace que el\n' +
          '  motor dibuje el equipo aunque este fuera de la vista. Conviene eliminarlos al\n' +
          '  optimizar el modelo. Usa --detalle para verlos uno por uno.',
      )
    }
  }

  if (opciones.detalle) {
    console.log('\nCAJA POR NODO (mayor volumen primero)')
    const filas = nodos
      .map(({ nombre, caja }) => {
        const descrita = describirCaja(caja)
        const { x, y, z } = descrita.dimensiones
        return { nombre: nombre || '(anonimo)', descrita, volumen: x * y * z }
      })
      .sort((a, b) => b.volumen - a.volumen)

    for (const fila of filas) {
      const { x, y, z } = fila.descrita.dimensiones
      const c = fila.descrita.centro
      console.log(
        `  ${fila.nombre.padEnd(34).slice(0, 34)} dim ${numero(x)} ${numero(y)} ${numero(z)}` +
          `   centro ${numero(c.x)} ${numero(c.y)} ${numero(c.z)}`,
      )
    }
  }

  const medidas = Object.entries(opciones.medidasReales)
  if (medidas.length === 0) {
    console.log(
      '\nPara obtener el factor de escala, vuelve a ejecutar indicando una medida real de\n' +
        'catalogo en milimetros. Por ejemplo, si el equipo mide 1600 mm de ancho:\n' +
        `  node herramientas/medir-modelo.mjs ${opciones.ruta} --ancho=1600\n`,
    )
    return
  }

  const cajaMedida = opciones.completo || cajaCuerpo === null ? cajaCompleta : cajaCuerpo
  const cual = opciones.completo || cajaCuerpo === null ? 'caja completa' : 'cuerpo del equipo'

  console.log(`\nFACTOR DE ESCALA  (medido sobre: ${cual})`)
  const factores = medidas.map(([eje, milimetros]) => {
    const unidades = cajaMedida.dimensiones[eje]
    const factor = milimetros / 1000 / unidades
    console.log(
      `  ${NOMBRE_DE_EJE[eje].padEnd(12)} ${String(milimetros).padStart(6)} mm reales / ` +
        `${unidades.toFixed(3)} unidades  ->  escala ${factor.toPrecision(6)}`,
    )
    return factor
  })

  const promedio = factores.reduce((suma, factor) => suma + factor, 0) / factores.length

  console.log(`\n  Valor para src/data/equipos.ts:  escala: ${Number(promedio.toPrecision(6))}`)

  if (factores.length > 1) {
    const discrepancia = Math.max(...factores) / Math.min(...factores) - 1
    if (discrepancia > 0.02) {
      console.log(
        `\n  AVISO: los ejes no concuerdan entre si (${(discrepancia * 100).toFixed(1)}% de diferencia).\n` +
          '  O el modelo no esta orientado como se asume (ancho=X, alto=Y, fondo=Z) y necesita\n' +
          '  rotacion, o la caja medida incluye geometria ajena al equipo.',
      )
    }
  }

  const { x, y, z } = cajaMedida.dimensiones
  console.log('\n  Tamano resultante en la escena:')
  console.log(
    `    ${(x * promedio).toFixed(3)} m de ancho  x  ${(y * promedio).toFixed(3)} m de alto  x  ` +
      `${(z * promedio).toFixed(3)} m de fondo`,
  )
  console.log(
    '\n  Desplazamiento para que el equipo se apoye en el piso y quede centrado en su\n' +
      '  posicionInicial (aplicalo al grupo que envuelve el modelo, no a posicionInicial):',
  )
  console.log(
    `    [${Number((-cajaMedida.centro.x * promedio).toPrecision(4))}, ` +
      `${Number((-cajaMedida.min[1] * promedio).toPrecision(4))}, ` +
      `${Number((-cajaMedida.centro.z * promedio).toPrecision(4))}]\n`,
  )
}

principal().catch((error) => {
  console.error(`\nError: ${error.message}\n`)
  process.exitCode = 1
})
