import { useMemo, useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useXRInputSourceState } from '@react-three/xr'
import { Group, Matrix4 } from 'three'

import { HOTSPOTS } from '../configuracion/hotspots'
import { usarMetricas } from '../ganchos/metricas'
import { crearFormaPanel } from './formas'

const { fuentes } = HOTSPOTS

/** Medidas del panel, en metros. Tamano de reloj de pulsera. */
const PANEL = {
  ancho: 0.19,
  alto: 0.135,
  radioEsquina: 0.01,
  margen: 0.014,
  cuerpoGrande: 0.028,
  cuerpoNormal: 0.0115,
}

const COLORES = {
  fondo: '#0b0f14',
  texto: '#e6edf3',
  tenue: '#8b9bab',
  bien: '#63d19e',
  regular: '#e8c468',
  mal: '#e05c5c',
}

/**
 * Desplazamiento del panel respecto al control: por encima y algo inclinado, para
 * que se lea al levantar la mano como quien mira la hora, sin taparse la escena.
 */
const DESPLAZAMIENTO = new Matrix4()
  .makeRotationX(-Math.PI / 3)
  .setPosition(0, 0.07, -0.02)

const matrizPanel = new Matrix4()

/** 389170 -> "389 k". Cifras cortas: en el visor no hay sitio para siete digitos. */
function abreviar(valor: number): string {
  if (valor < 1000) return String(Math.round(valor))
  if (valor < 1_000_000) return `${Math.round(valor / 1000)} k`
  return `${(valor / 1_000_000).toFixed(2)} M`
}

/**
 * Panel de diagnostico dentro del visor.
 *
 * Es geometria 3D, no HTML, por la misma razon que los paneles de los hotspots:
 * dentro de una sesion inmersiva no hay DOM. Un contador de fps en el DOM seria
 * exactamente igual de invisible que no tenerlo.
 *
 * Va pegado al control IZQUIERDO. El derecho lleva el teletransporte y los hotspots;
 * el izquierdo esta libre, asi que las cifras se consultan levantando esa mano y
 * desaparecen de la vista al bajarla.
 *
 * Solo existe si hay control izquierdo, es decir, dentro de la sesion. En escritorio
 * las mismas cifras las ensena el panel del DOM.
 */
export default function PanelDiagnostico() {
  const control = useXRInputSourceState('controller', 'left')
  const metricas = usarMetricas()
  const grupoRef = useRef<Group>(null)

  const forma = useMemo(
    () => crearFormaPanel(PANEL.ancho, PANEL.alto, PANEL.radioEsquina),
    [],
  )

  useFrame(() => {
    const grupo = grupoRef.current
    const objeto = control?.object

    if (grupo == null || objeto == null) {
      if (grupo != null) grupo.visible = false
      return
    }

    grupo.visible = true
    objeto.updateWorldMatrix(true, false)
    matrizPanel.multiplyMatrices(objeto.matrixWorld, DESPLAZAMIENTO)
    matrizPanel.decompose(grupo.position, grupo.quaternion, grupo.scale)
  })

  const objetivo = metricas.hzSesion ?? 72
  const colorFps =
    metricas.fps >= objetivo - 3
      ? COLORES.bien
      : metricas.fps >= objetivo * 0.85
        ? COLORES.regular
        : COLORES.mal

  const izquierda = PANEL.margen - PANEL.ancho / 2
  const derecha = PANEL.ancho / 2 - PANEL.margen
  const cima = PANEL.alto / 2 - PANEL.margen

  const etiquetas = ['llamadas', 'triangulos', 'texturas', 'sesion'].join('\n')
  const valores = [
    abreviar(metricas.llamadas),
    abreviar(metricas.triangulos),
    abreviar(metricas.texturas),
    metricas.hzSesion === null ? '-' : `${Math.round(metricas.hzSesion)} Hz`,
  ].join('\n')

  return (
    <group ref={grupoRef} visible={false} renderOrder={2000}>
      <mesh raycast={() => null}>
        <shapeGeometry args={[forma]} />
        <meshBasicMaterial color={COLORES.fondo} transparent opacity={0.92} toneMapped={false} />
      </mesh>

      <Text
        font={fuentes.negrita}
        fontSize={PANEL.cuerpoGrande}
        color={colorFps}
        anchorX="left"
        anchorY="top"
        position={[izquierda, cima, 0.001]}
      >
        {metricas.fps.toFixed(0)} fps
        <meshBasicMaterial attach="material" color={colorFps} depthTest={false} toneMapped={false} />
      </Text>

      <Text
        font={fuentes.normal}
        fontSize={PANEL.cuerpoNormal}
        color={COLORES.tenue}
        anchorX="left"
        anchorY="top"
        position={[izquierda, cima - PANEL.cuerpoGrande - 0.006, 0.001]}
      >
        {`${metricas.msMedio.toFixed(1)} ms  ·  peor ${metricas.msPeor.toFixed(1)}`}
        <meshBasicMaterial attach="material" color={COLORES.tenue} depthTest={false} toneMapped={false} />
      </Text>

      <Text
        font={fuentes.normal}
        fontSize={PANEL.cuerpoNormal}
        color={COLORES.tenue}
        anchorX="left"
        anchorY="top"
        lineHeight={1.5}
        position={[izquierda, cima - PANEL.cuerpoGrande - 0.028, 0.001]}
      >
        {etiquetas}
        <meshBasicMaterial attach="material" color={COLORES.tenue} depthTest={false} toneMapped={false} />
      </Text>

      <Text
        font={fuentes.normal}
        fontSize={PANEL.cuerpoNormal}
        color={COLORES.texto}
        anchorX="right"
        anchorY="top"
        lineHeight={1.5}
        position={[derecha, cima - PANEL.cuerpoGrande - 0.028, 0.001]}
      >
        {valores}
        <meshBasicMaterial attach="material" color={COLORES.texto} depthTest={false} toneMapped={false} />
      </Text>
    </group>
  )
}
