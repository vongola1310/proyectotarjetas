import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useXRInputSourceState } from '@react-three/xr'
import {
  Color,
  type BufferGeometry,
  InstancedMesh,
  MathUtils,
  Mesh,
  type MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three'

import { LOCOMOCION } from '../../configuracion/locomocion'
import {
  alturaDelArco,
  destinoDelArco,
  girarAlrededorDe,
  origenParaAterrizarEn,
} from './matematicas'
import { esDestinoValido } from './zonaCaminable'

const { zonaMuerta, teleport, giro, colores, radioMarca } = LOCOMOCION

/** Objetos de trabajo reutilizados, para no generar basura en cada cuadro. */
const origenArco = new Vector3()
const direccionArco = new Vector3()
const puntoArco = new Vector3()
const cabeza = new Vector3()
const auxiliar = new Object3D()
/** Radio de cada bolita del arco, en metros. */
const RADIO_PUNTO = 0.022

const colorValido = new Color(colores.arcoValido)
const colorInvalido = new Color(colores.arcoInvalido)

/**
 * Locomocion en realidad virtual: teletransporte y giro por saltos.
 *
 * REPARTO DE CONTROLES
 *   Palanca derecha adelante  ->  aparece el arco. Al soltarla, se salta.
 *   Palanca derecha a los lados -> gira la vista 30 grados de golpe.
 *   Gatillo                   ->  hotspots, y solo hotspots.
 *
 * Por que no se usa el teletransporte que trae la libreria: el suyo se confirma con
 * el gatillo (evento `select`), que es el mismo boton que abre los paneles. Tener
 * los dos ahi significa teletransportarse sin querer cada vez que se quiere leer una
 * ficha. Empujar la palanca y soltarla es ademas como funcionan las aplicaciones
 * nativas del Quest, asi que el cliente no tiene nada nuevo que aprender.
 *
 * Nada de esto provoca un re-render de React: el arco y la marca se actualizan
 * moviendo objetos de three directamente. A 72 cuadros por segundo, reconciliar el
 * arbol de React en cada uno seria tirar el presupuesto de cuadro a la basura.
 */
export default function Locomocion({
  origen,
  rotacionY,
  onMover,
}: {
  origen: [number, number, number]
  rotacionY: number
  onMover: (posicion: [number, number, number], rotacionY: number) => void
}) {
  const control = useXRInputSourceState('controller', 'right')
  const camara = useThree((estado) => estado.camera)

  // Se tipa el material de cada malla para poder cambiarle el color sin castear.
  const puntosRef = useRef<InstancedMesh<BufferGeometry, MeshBasicMaterial>>(null)
  const marcaRef = useRef<Mesh<BufferGeometry, MeshBasicMaterial>>(null)
  const anilloRef = useRef<Mesh<BufferGeometry, MeshBasicMaterial>>(null)

  /** Estado que no debe disparar renders: se lee y escribe dentro del bucle. */
  const estado = useRef({
    apuntando: false,
    destino: null as { x: number; z: number; valido: boolean } | null,
    puedeGirar: true,
  })

  // Referencias estables a lo que se toca en cada cuadro.
  const actual = useRef({ origen, rotacionY, onMover })
  actual.current = { origen, rotacionY, onMover }

  useFrame(() => {
    const palanca = control?.gamepad['xr-standard-thumbstick']
    const puntos = puntosRef.current
    const marca = marcaRef.current
    const anillo = anilloRef.current

    if (palanca == null || control?.object == null || puntos == null || marca == null || anillo == null) {
      if (puntos != null) puntos.visible = false
      if (marca != null) marca.visible = false
      if (anillo != null) anillo.visible = false
      estado.current.apuntando = false
      return
    }

    const ejeX = palanca.xAxis ?? 0
    // El eje Y del mando da negativo al empujar hacia adelante.
    const adelante = -(palanca.yAxis ?? 0)

    // ---- Giro por saltos ----------------------------------------------------
    if (Math.abs(ejeX) < zonaMuerta) {
      // El pestillo evita que un empujon mantenido gire sin parar.
      estado.current.puedeGirar = true
    } else if (estado.current.puedeGirar) {
      estado.current.puedeGirar = false
      girarAlrededorDeLaCabeza(camara, actual.current, ejeX > 0 ? -giro.grados : giro.grados)
    }

    // ---- Teletransporte -----------------------------------------------------
    const apuntandoAhora = adelante > zonaMuerta

    if (apuntandoAhora) {
      estado.current.apuntando = true
      estado.current.destino = dibujarArco(control.object, puntos)

      const destino = estado.current.destino
      puntos.visible = true
      marca.visible = destino !== null
      anillo.visible = destino !== null

      if (destino !== null) {
        marca.position.set(destino.x, 0.012, destino.z)
        anillo.position.set(destino.x, 0.011, destino.z)
        const color = destino.valido ? colorValido : colorInvalido
        marca.material.color.copy(color)
        anillo.material.color.copy(color)
      }
      return
    }

    // Se solto la palanca: si habia un destino valido, se salta.
    if (estado.current.apuntando) {
      estado.current.apuntando = false
      puntos.visible = false
      marca.visible = false
      anillo.visible = false

      const destino = estado.current.destino
      if (destino !== null && destino.valido) {
        saltarA(camara, actual.current, destino.x, destino.z)
      }
      estado.current.destino = null
    }
  })

  return (
    <group name="locomocion">
      {/* Arco de puntos. Una sola llamada de dibujo para toda la curva. */}
      <instancedMesh
        ref={puntosRef}
        args={[undefined, undefined, teleport.resolucion]}
        visible={false}
        frustumCulled={false}
        raycast={() => null}
      >
        <sphereGeometry args={[RADIO_PUNTO, 6, 4]} />
        <meshBasicMaterial color={colores.arcoValido} toneMapped={false} />
      </instancedMesh>

      {/* Marca de destino: disco relleno mas anillo, tumbados en el piso. */}
      <mesh ref={marcaRef} rotation={[-Math.PI / 2, 0, 0]} visible={false} raycast={() => null}>
        <circleGeometry args={[radioMarca * 0.35, 24]} />
        <meshBasicMaterial color={colores.marcaValida} transparent opacity={0.9} toneMapped={false} />
      </mesh>

      <mesh ref={anilloRef} rotation={[-Math.PI / 2, 0, 0]} visible={false} raycast={() => null}>
        <ringGeometry args={[radioMarca * 0.82, radioMarca, 40]} />
        <meshBasicMaterial color={colores.marcaValida} transparent opacity={0.75} toneMapped={false} />
      </mesh>
    </group>
  )
}

/**
 * Traza el arco balistico desde el control hasta el piso y coloca los puntos.
 * Devuelve donde aterriza, o null si el arco no llega al suelo.
 */
function dibujarArco(
  control: Object3D,
  puntos: InstancedMesh<BufferGeometry, MeshBasicMaterial>,
): { x: number; z: number; valido: boolean } | null {
  control.getWorldPosition(origenArco)
  // getWorldDirection devuelve el eje +Z del objeto; el frente de un control es -Z.
  control.getWorldDirection(direccionArco).negate()

  const velocidad = direccionArco.multiplyScalar(teleport.velocidad)
  const g = teleport.gravedad

  const aterrizaje = destinoDelArco(origenArco, velocidad, g)
  if (aterrizaje === null) {
    puntos.visible = false
    return null
  }

  const { punto, tFinal } = aterrizaje

  for (let i = 0; i < teleport.resolucion; i++) {
    const t = (i / (teleport.resolucion - 1)) * tFinal
    puntoArco
      .copy(velocidad)
      .multiplyScalar(t)
      .add(origenArco)
      .setY(alturaDelArco(origenArco.y, velocidad.y, g, t))

    auxiliar.position.copy(puntoArco)
    // Los puntos se afinan hacia el final, para que la curva apunte al destino.
    auxiliar.scale.setScalar(1 - (i / teleport.resolucion) * 0.45)
    auxiliar.updateMatrix()
    puntos.setMatrixAt(i, auxiliar.matrix)
  }
  puntos.instanceMatrix.needsUpdate = true

  const distancia = Math.hypot(punto.x - origenArco.x, punto.z - origenArco.z)
  const valido = distancia <= teleport.alcanceMaximo && esDestinoValido(punto.x, punto.z)
  puntos.material.color.copy(valido ? colorValido : colorInvalido)

  return { x: punto.x, z: punto.z, valido }
}

type Contexto = {
  origen: [number, number, number]
  rotacionY: number
  onMover: (posicion: [number, number, number], rotacionY: number) => void
}

/**
 * Mueve el origen para que el usuario acabe de pie sobre el destino.
 *
 * No basta con poner el origen en el punto: el usuario puede haberse desplazado
 * caminando dentro de su espacio real, y entonces su cabeza no esta sobre el
 * origen. Se descuenta ese desfase para que uno acabe donde apunto, no a un metro.
 */
function saltarA(camara: { getWorldPosition(v: Vector3): Vector3 }, ctx: Contexto, x: number, z: number) {
  camara.getWorldPosition(cabeza)

  const nuevo = origenParaAterrizarEn(
    { x, z },
    { x: cabeza.x, z: cabeza.z },
    { x: ctx.origen[0], z: ctx.origen[2] },
  )

  ctx.onMover([nuevo.x, ctx.origen[1], nuevo.z], ctx.rotacionY)
}

/**
 * Gira la vista alrededor de la cabeza del usuario, no del origen.
 *
 * Girar sobre el origen haria que la cabeza describiera un arco por la sala, que se
 * siente como si a uno lo empujaran de lado. Rotando alrededor de la cabeza, esta
 * se queda quieta y solo cambia hacia donde se mira, que es lo que el cuerpo espera.
 */
function girarAlrededorDeLaCabeza(
  camara: { getWorldPosition(v: Vector3): Vector3 },
  ctx: Contexto,
  grados: number,
) {
  camara.getWorldPosition(cabeza)
  const angulo = MathUtils.degToRad(grados)

  const nuevo = girarAlrededorDe(
    { x: ctx.origen[0], z: ctx.origen[2] },
    { x: cabeza.x, z: cabeza.z },
    angulo,
  )

  ctx.onMover([nuevo.x, ctx.origen[1], nuevo.z], ctx.rotacionY + angulo)
}
