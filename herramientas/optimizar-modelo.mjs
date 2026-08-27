/**
 * Prepara un .glb de CAD para que corra en Meta Quest 2.
 *
 * Los modelos que salen de ingenieria vienen pensados para renderizar imagenes,
 * no para 72 fps en estereo sobre un movil. Esta herramienta los pasa por una
 * cadena de transformaciones y reporta el antes y el despues de cada una, para
 * que la decision de cuanto recortar se tome mirando numeros.
 *
 * Uso:
 *   node herramientas/optimizar-modelo.mjs <entrada.glb> <salida.glb>
 *   node herramientas/optimizar-modelo.mjs entrada.glb salida.glb --triangulos=120000
 *   node herramientas/optimizar-modelo.mjs entrada.glb salida.glb --textura=1024 --unir
 *
 * Opciones:
 *   --triangulos=N        Objetivo de triangulos. Por defecto 150000.
 *   --textura=N           Lado maximo de textura, en pixeles. Por defecto 1024.
 *   --error=N             Error maximo del simplificador, como fraccion del tamano
 *                         del modelo. Por defecto 0.002. Subirlo recorta mas.
 *   --conservar-anonimos  No elimina los nodos sin nombre (ver mas abajo).
 *   --unir                Fusiona primitivas que comparten material. Reduce draw
 *                         calls; usalo en modelos con cientos de primitivas.
 *   --sin-draco           No comprime la geometria con Draco.
 *   --sin-texturas        No toca las texturas.
 *   --conservar-normales  No rehace las normales. Ver mas abajo antes de usarlo.
 *
 * SOBRE LAS NORMALES
 * Las exportaciones de CAD traen las normales partidas en cada arista, de modo que
 * practicamente ningun triangulo comparte vertices con su vecino. El simplificador
 * necesita aristas compartidas para colapsarlas: con las normales originales se
 * atasca a la mitad del recorte por mucho que se le suba el error. Por eso se
 * descartan antes de soldar y se recalculan despues, ya decimado el modelo. Salen
 * normales por cara, que es el sombreado correcto para un equipo de paneles rectos
 * y conserva las aristas vivas. Las superficies curvas quedan algo facetadas.
 *
 * SOBRE LOS NODOS ANONIMOS
 * Las exportaciones de CAD suelen arrastrar ejes guia y geometria de ayuda sin
 * nombre. Ademas de sumar triangulos, agrandan la caja envolvente del modelo, y
 * una caja inflada rompe el descarte por frustum: el motor dibuja el equipo aunque
 * quede fuera de la vista. Se eliminan por defecto, siempre listando cuales, y solo
 * si el modelo conserva al menos un nodo con nombre.
 */

import { NodeIO, getBounds } from '@gltf-transform/core'
import { ALL_EXTENSIONS, KHRMaterialsTransmission } from '@gltf-transform/extensions'
import {
  dedup,
  draco,
  flatten,
  join,
  normals,
  prune,
  simplify,
  textureCompress,
  weld,
} from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'
import { statSync } from 'node:fs'

const PREDETERMINADO = {
  triangulos: 150_000,
  textura: 1024,
  error: 0.002,
}

function leerArgumentos(argv) {
  const opciones = {
    entrada: null,
    salida: null,
    triangulos: PREDETERMINADO.triangulos,
    textura: PREDETERMINADO.textura,
    error: PREDETERMINADO.error,
    quitarAnonimos: true,
    unir: false,
    draco: true,
    texturas: true,
    rehacerNormales: true,
  }
  const banderas = {
    '--conservar-anonimos': () => (opciones.quitarAnonimos = false),
    '--unir': () => (opciones.unir = true),
    '--sin-draco': () => (opciones.draco = false),
    '--sin-texturas': () => (opciones.texturas = false),
    '--conservar-normales': () => (opciones.rehacerNormales = false),
  }

  for (const argumento of argv) {
    if (argumento in banderas) {
      banderas[argumento]()
      continue
    }

    const conValor = argumento.match(/^--(triangulos|textura|error)=(.+)$/)
    if (conValor !== null) {
      const [, nombre, texto] = conValor
      const valor = Number(texto)
      if (!Number.isFinite(valor) || valor <= 0) {
        throw new Error(`El valor de --${nombre} debe ser un numero positivo, no "${texto}"`)
      }
      opciones[nombre] = valor
      continue
    }

    if (argumento.startsWith('--')) {
      throw new Error(`Opcion desconocida: ${argumento}`)
    }

    if (opciones.entrada === null) opciones.entrada = argumento
    else if (opciones.salida === null) opciones.salida = argumento
    else throw new Error(`Sobra el argumento "${argumento}"`)
  }

  if (opciones.entrada === null || opciones.salida === null) {
    throw new Error(
      'Faltan rutas.\n' +
        'Uso: node herramientas/optimizar-modelo.mjs <entrada.glb> <salida.glb> [opciones]',
    )
  }

  return opciones
}

/** Cuenta triangulos, primitivas y memoria de textura de un documento. */
function medir(documento) {
  const raiz = documento.getRoot()
  let triangulos = 0
  let primitivas = 0

  for (const malla of raiz.listMeshes()) {
    for (const primitiva of malla.listPrimitives()) {
      primitivas++
      const indices = primitiva.getIndices()
      const posicion = primitiva.getAttribute('POSITION')
      const cuenta = indices?.getCount() ?? posicion?.getCount() ?? 0
      triangulos += Math.floor(cuenta / 3)
    }
  }

  // Memoria de video: la resolucion es lo unico que la mueve. Comprimir a WebP
  // adelgaza la descarga, pero en la GPU toda textura acaba descomprimida a RGBA.
  let bytesEnGpu = 0
  for (const textura of raiz.listTextures()) {
    const tamano = textura.getSize()
    if (tamano !== null) {
      // 4 bytes por texel mas un tercio por la cadena de mipmaps.
      bytesEnGpu += tamano[0] * tamano[1] * 4 * 1.33
    }
  }

  return {
    triangulos,
    primitivas,
    materiales: raiz.listMaterials().length,
    texturas: raiz.listTextures().length,
    nodos: raiz.listNodes().length,
    megasEnGpu: bytesEnGpu / 1024 / 1024,
  }
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

/**
 * Vertices por triangulo. Es el diagnostico que dice si el modelo se va a poder
 * decimar: cerca de 0.5 esta bien soldado, cerca de 1.0 cada triangulo lleva sus
 * propios vertices y el simplificador no tiene por donde entrar.
 */
function proporcionVertices(documento) {
  let vertices = 0
  let triangulos = 0
  for (const malla of documento.getRoot().listMeshes()) {
    for (const primitiva of malla.listPrimitives()) {
      vertices += primitiva.getAttribute('POSITION')?.getCount() ?? 0
      triangulos += Math.floor((primitiva.getIndices()?.getCount() ?? 0) / 3)
    }
  }
  return triangulos === 0 ? 0 : vertices / triangulos
}

function imprimirTabla(antes, despues, bytesAntes, bytesDespues) {
  const filas = [
    ['Peso del archivo', mb(bytesAntes), mb(bytesDespues)],
    ['Triangulos', antes.triangulos.toLocaleString('es-MX'), despues.triangulos.toLocaleString('es-MX')],
    ['Primitivas (draw calls)', String(antes.primitivas), String(despues.primitivas)],
    ['Materiales', String(antes.materiales), String(despues.materiales)],
    ['Texturas', String(antes.texturas), String(despues.texturas)],
    ['Nodos', String(antes.nodos), String(despues.nodos)],
    ['Memoria de textura (GPU)', `${antes.megasEnGpu.toFixed(1)} MB`, `${despues.megasEnGpu.toFixed(1)} MB`],
  ]

  console.log('\nRESULTADO')
  console.log('  ' + 'concepto'.padEnd(26) + 'antes'.padStart(14) + 'despues'.padStart(14) + '   cambio')
  console.log('  ' + '-'.repeat(68))

  const numeros = [
    [bytesAntes, bytesDespues],
    [antes.triangulos, despues.triangulos],
    [antes.primitivas, despues.primitivas],
    [antes.materiales, despues.materiales],
    [antes.texturas, despues.texturas],
    [antes.nodos, despues.nodos],
    [antes.megasEnGpu, despues.megasEnGpu],
  ]

  filas.forEach(([concepto, a, d], i) => {
    const [na, nd] = numeros[i]
    const cambio = na === 0 ? '' : `${(((nd - na) / na) * 100).toFixed(1)}%`
    console.log('  ' + concepto.padEnd(26) + a.padStart(14) + d.padStart(14) + '   ' + cambio.padStart(8))
  })
}

/**
 * Elimina los nodos sin nombre, que en estas exportaciones son ejes guia.
 * Solo actua si queda al menos un nodo con nombre, para no vaciar un modelo
 * que simplemente venga sin nombrar.
 */
function quitarNodosAnonimos(documento) {
  const escena = documento.getRoot().getDefaultScene() ?? documento.getRoot().listScenes()[0]
  if (escena == null) return []

  const conMalla = escena.listChildren().filter((nodo) => nodo.getMesh() !== null)
  const anonimos = conMalla.filter((nodo) => nodo.getName() === '')

  if (anonimos.length === 0 || anonimos.length === conMalla.length) {
    return []
  }

  const eliminados = anonimos.map((nodo) => {
    const caja = getBounds(nodo)
    const dim = [0, 1, 2].map((i) => (caja.max[i] - caja.min[i]).toFixed(2))
    const triangulos = nodo
      .getMesh()
      .listPrimitives()
      .reduce((suma, p) => suma + Math.floor((p.getIndices()?.getCount() ?? 0) / 3), 0)
    nodo.dispose()
    return { dim, triangulos }
  })

  return eliminados
}

/**
 * Sustituye la transmision (vidrio fisico) por transparencia normal.
 *
 * three.js implementa KHR_materials_transmission volviendo a renderizar la escena
 * a un render target en cada cuadro. En estereo sobre Quest 2 eso hunde los fps.
 * La transparencia comun se ve casi igual a la distancia de un showroom.
 */
function quitarTransmision(documento) {
  const afectados = []

  for (const material of documento.getRoot().listMaterials()) {
    const transmision = material.getExtension('KHR_materials_transmission')
    if (transmision == null) continue

    const factor = transmision.getTransmissionFactor()
    material.setExtension('KHR_materials_transmission', null)
    material.setAlphaMode('BLEND')
    // Un vidrio que transmite el 90% se ve como una transparencia del 90%.
    material.setAlpha(Math.max(0.12, 1 - factor * 0.85))
    afectados.push(material.getName() || '(sin nombre)')
  }

  if (afectados.length > 0) {
    const extension = documento
      .getRoot()
      .listExtensionsUsed()
      .find((e) => e.extensionName === KHRMaterialsTransmission.EXTENSION_NAME)
    extension?.dispose()
  }

  return afectados
}

async function principal() {
  const opciones = leerArgumentos(process.argv.slice(2))

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  })

  console.log(`\nOptimizando: ${opciones.entrada}`)
  console.log('='.repeat(74))

  const documento = await io.read(opciones.entrada)
  const bytesAntes = statSync(opciones.entrada).size
  const antes = medir(documento)

  // 1. Fusionar recursos duplicados antes de nada, para no trabajar de mas.
  await documento.transform(dedup())

  // 2. Basura de la exportacion.
  if (opciones.quitarAnonimos) {
    const eliminados = quitarNodosAnonimos(documento)
    if (eliminados.length > 0) {
      const triangulos = eliminados.reduce((s, e) => s + e.triangulos, 0)
      console.log(`\nNODOS ANONIMOS ELIMINADOS: ${eliminados.length} (${triangulos.toLocaleString('es-MX')} triangulos)`)
      for (const { dim, triangulos: t } of eliminados) {
        console.log(`  dim ${dim[0].padStart(8)} x ${dim[1].padStart(8)} x ${dim[2].padStart(8)}   ${t} triangulos`)
      }
    }
  }

  // 3. Vidrio fisico fuera.
  const sinTransmision = quitarTransmision(documento)
  if (sinTransmision.length > 0) {
    console.log(`\nTRANSMISION SUSTITUIDA POR TRANSPARENCIA en ${sinTransmision.length} materiales:`)
    console.log(`  ${sinTransmision.join(', ')}`)
  }

  await documento.transform(prune())

  // 4. Descartar las normales originales y soldar por posicion.
  //
  //    Este es el paso que decide si la decimacion sirve de algo. Con las normales
  //    del CAD el ratio vertices/triangulos ronda 1.0, que significa que casi nadie
  //    comparte vertices y el simplificador no tiene aristas que colapsar. Sin
  //    ellas baja a ~0.5, que es lo normal en una malla bien soldada.
  console.log(`\nSoldado de vertices  (ratio vertices/triangulos, menor es mejor)`)
  console.log(`  antes de soldar          ${proporcionVertices(documento).toFixed(2)}`)

  if (opciones.rehacerNormales) {
    for (const malla of documento.getRoot().listMeshes()) {
      for (const primitiva of malla.listPrimitives()) {
        primitiva.setAttribute('NORMAL', null)
      }
    }
  }
  await documento.transform(weld())
  console.log(`  despues de soldar        ${proporcionVertices(documento).toFixed(2)}`)

  if (opciones.rehacerNormales && proporcionVertices(documento) > 0.9) {
    console.log(
      '  AVISO: sigue por encima de 0.9. Quedan costuras que impiden soldar (suelen\n' +
        '  ser cortes de UV). La decimacion va a quedarse corta.',
    )
  }

  const trasSoldar = medir(documento)

  // 5. Decimar hasta el objetivo.
  if (trasSoldar.triangulos > opciones.triangulos) {
    await MeshoptSimplifier.ready
    const proporcion = opciones.triangulos / trasSoldar.triangulos
    console.log(
      `\nDecimando al ${(proporcion * 100).toFixed(1)}% (objetivo ${opciones.triangulos.toLocaleString('es-MX')} triangulos, ` +
        `error maximo ${opciones.error})`,
    )
    await documento.transform(
      simplify({ simplifier: MeshoptSimplifier, ratio: proporcion, error: opciones.error }),
    )
  } else {
    console.log(`\nSin decimar: el modelo ya baja de ${opciones.triangulos.toLocaleString('es-MX')} triangulos`)
  }

  // 6. Recalcular las normales sobre la malla ya decimada.
  //    normals() desuelda para dar una normal por cara; volver a soldar despues
  //    reagrupa los vertices de las zonas coplanares y deja partidas solo las
  //    aristas vivas, que es exactamente lo que queremos.
  if (opciones.rehacerNormales) {
    await documento.transform(normals({ overwrite: true }), weld())
    console.log('\nNormales recalculadas por cara (aristas vivas conservadas)')
  }

  // 7. Fusionar primitivas por material, solo si se pide.
  if (opciones.unir) {
    const previo = medir(documento).primitivas
    await documento.transform(flatten(), join())
    console.log(`\nPrimitivas fusionadas: ${previo} -> ${medir(documento).primitivas}`)
  }

  // 8. Texturas. La resolucion es lo unico que baja la memoria de video.
  if (opciones.texturas) {
    console.log(`\nRedimensionando texturas a un maximo de ${opciones.textura} px y pasandolas a WebP`)
    await documento.transform(
      textureCompress({
        encoder: sharp,
        targetFormat: 'webp',
        resize: [opciones.textura, opciones.textura],
      }),
    )
  }

  await documento.transform(prune())

  // 9. Draco al final, cuando ya no queda geometria por tocar.
  if (opciones.draco) {
    await documento.transform(draco())
    console.log('\nGeometria comprimida con Draco')
  }

  await io.write(opciones.salida, documento)

  const despues = medir(documento)
  const bytesDespues = statSync(opciones.salida).size
  imprimirTabla(antes, despues, bytesAntes, bytesDespues)

  console.log(`\nEscrito en: ${opciones.salida}`)
  console.log(
    '\nRecuerda volver a medir la escala: al quitar nodos cambia la caja envolvente.\n' +
      `  node herramientas/medir-modelo.mjs ${opciones.salida} --ancho=<mm reales>\n`,
  )
}

principal().catch((error) => {
  console.error(`\nError: ${error.message}\n`)
  process.exitCode = 1
})
