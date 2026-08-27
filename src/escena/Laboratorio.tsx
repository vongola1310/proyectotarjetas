import { COLORES_LABORATORIO as COLORES, LABORATORIO } from '../configuracion/laboratorio'
import { usarTexturaPiso } from './texturas'

const { ancho, fondo, alto, grosorMuro, alturaZoclo } = LABORATORIO

/** Mitades, que es como se colocan las cosas respecto al centro de la sala. */
const medioAncho = ancho / 2
const medioFondo = fondo / 2

/** Piso con losetas a medida real. Recibe sombras; no proyecta ninguna. */
function Piso() {
  const textura = usarTexturaPiso()

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[ancho, fondo]} />
      <meshStandardMaterial map={textura} roughness={0.55} metalness={0} />
    </mesh>
  )
}

/**
 * Un muro con su zoclo.
 *
 * Son cajas y no planos a proposito: con grosor, las esquinas cierran bien y el
 * muro se sigue viendo correcto aunque la camara de escritorio se asome desde
 * fuera. Doce triangulos por muro no le pesan a nadie.
 */
function Muro({
  posicion,
  medidas,
  posicionZoclo,
  medidasZoclo,
}: {
  posicion: [number, number, number]
  medidas: [number, number, number]
  posicionZoclo: [number, number, number]
  medidasZoclo: [number, number, number]
}) {
  return (
    <>
      <mesh position={posicion} receiveShadow>
        <boxGeometry args={medidas} />
        <meshStandardMaterial color={COLORES.pared} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={posicionZoclo}>
        <boxGeometry args={medidasZoclo} />
        <meshStandardMaterial color={COLORES.zoclo} roughness={0.7} metalness={0} />
      </mesh>
    </>
  )
}

function Muros() {
  const anchoConEsquinas = ancho + grosorMuro * 2
  const centroAltura = alto / 2
  const centroZoclo = alturaZoclo / 2
  // El zoclo sobresale un pelo del muro, como en la realidad.
  const salienteZoclo = 0.015

  return (
    <>
      {/* Fondo */}
      <Muro
        posicion={[0, centroAltura, -medioFondo - grosorMuro / 2]}
        medidas={[anchoConEsquinas, alto, grosorMuro]}
        posicionZoclo={[0, centroZoclo, -medioFondo + salienteZoclo]}
        medidasZoclo={[ancho, alturaZoclo, salienteZoclo * 2]}
      />

      {/* Frente */}
      <Muro
        posicion={[0, centroAltura, medioFondo + grosorMuro / 2]}
        medidas={[anchoConEsquinas, alto, grosorMuro]}
        posicionZoclo={[0, centroZoclo, medioFondo - salienteZoclo]}
        medidasZoclo={[ancho, alturaZoclo, salienteZoclo * 2]}
      />

      {/* Izquierda */}
      <Muro
        posicion={[-medioAncho - grosorMuro / 2, centroAltura, 0]}
        medidas={[grosorMuro, alto, fondo]}
        posicionZoclo={[-medioAncho + salienteZoclo, centroZoclo, 0]}
        medidasZoclo={[salienteZoclo * 2, alturaZoclo, fondo]}
      />

      {/* Derecha */}
      <Muro
        posicion={[medioAncho + grosorMuro / 2, centroAltura, 0]}
        medidas={[grosorMuro, alto, fondo]}
        posicionZoclo={[medioAncho - salienteZoclo, centroZoclo, 0]}
        medidasZoclo={[salienteZoclo * 2, alturaZoclo, fondo]}
      />
    </>
  )
}

/**
 * Techo y luminarias.
 *
 * Las luminarias llevan material sin iluminar (`meshBasicMaterial`): se ven
 * encendidas pero no aportan luz. Son seis paneles que, de ser luces de verdad,
 * costarian seis veces el sombreado de cada pixel. Aqui cuestan seis cajas.
 */
function Techo() {
  const { luminaria } = LABORATORIO
  const columnas = [-2.6, 0, 2.6]
  const filas = [-1.6, 1.6]

  return (
    <>
      {/* La cara util del techo mira hacia abajo, asi que la unica luz que le llega
          es el rebote del piso, y sale mas oscuro que los muros: al reves de como se
          lee un techo con luminarias. Un emisivo tenue lo corrige sin anadir ni una
          luz mas a la escena. */}
      <mesh position={[0, alto + grosorMuro / 2, 0]}>
        <boxGeometry args={[ancho, grosorMuro, fondo]} />
        <meshStandardMaterial
          color={COLORES.techo}
          roughness={0.95}
          metalness={0}
          emissive={COLORES.techo}
          emissiveIntensity={0.45}
        />
      </mesh>

      {columnas.map((x) =>
        filas.map((z) => (
          <mesh key={`${x}:${z}`} position={[x, alto - luminaria.descuelgue, z]}>
            <boxGeometry args={[luminaria.ancho, 0.04, luminaria.fondo]} />
            <meshBasicMaterial color={COLORES.luminaria} toneMapped={false} />
          </mesh>
        )),
      )}
    </>
  )
}

/**
 * Puerta cerrada sobre el muro del fondo.
 *
 * No perfora el muro: es marco y hoja apoyados encima. Basta para lo que hace
 * falta, que es dar una referencia de altura conocida. Perforar de verdad obligaria
 * a geometria constructiva, mas triangulos y mas complicacion, a cambio de nada
 * que el cliente vaya a notar en una sala cerrada.
 */
function Puerta() {
  const { puerta } = LABORATORIO
  const z = -medioFondo

  return (
    <group position={[puerta.desplazamientoX, 0, z]}>
      <mesh position={[0, puerta.alto / 2 + 0.03, 0.025]}>
        <boxGeometry args={[puerta.ancho + 0.12, puerta.alto + 0.06, 0.05]} />
        <meshStandardMaterial color={COLORES.marcoPuerta} roughness={0.6} metalness={0.1} />
      </mesh>

      <mesh position={[0, puerta.alto / 2, 0.055]} castShadow>
        <boxGeometry args={[puerta.ancho, puerta.alto, 0.04]} />
        <meshStandardMaterial color={COLORES.puerta} roughness={0.65} metalness={0} />
      </mesh>

      {/* Manija */}
      <mesh position={[puerta.ancho / 2 - 0.09, 1.05, 0.09]}>
        <boxGeometry args={[0.13, 0.025, 0.025]} />
        <meshStandardMaterial color="#6f767e" roughness={0.35} metalness={0.7} />
      </mesh>
    </group>
  )
}

/**
 * Mesa de laboratorio. Su altura de 0.90 m es la referencia con la que el ojo
 * calibra el tamano de todo lo demas en la sala.
 */
function MesaLaboratorio({
  largo,
  posicion,
  giroY = 0,
}: {
  largo: number
  posicion: [number, number, number]
  giroY?: number
}) {
  const { alto: altoMesa, fondo: fondoMesa, grosorCubierta } = LABORATORIO.mesa
  const alturaZocloMesa = 0.09
  const altoCuerpo = altoMesa - grosorCubierta - alturaZocloMesa

  return (
    <group position={posicion} rotation={[0, giroY, 0]}>
      {/* Cuerpo de gabinetes, retranqueado abajo para el zoclo */}
      <mesh position={[0, alturaZocloMesa + altoCuerpo / 2, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[largo, altoCuerpo, fondoMesa - 0.04]} />
        <meshStandardMaterial color={COLORES.mesaCuerpo} roughness={0.7} metalness={0} />
      </mesh>

      {/* Cubierta */}
      <mesh position={[0, altoMesa - grosorCubierta / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[largo, grosorCubierta, fondoMesa]} />
        <meshStandardMaterial color={COLORES.mesaCubierta} roughness={0.35} metalness={0.05} />
      </mesh>
    </group>
  )
}

/** Gabinete mural, colgado sobre una mesa. */
function GabineteMural({
  largo,
  posicion,
  giroY = 0,
}: {
  largo: number
  posicion: [number, number, number]
  giroY?: number
}) {
  const { alturaBase, alto: altoGabinete, fondo: fondoGabinete } = LABORATORIO.gabinete

  return (
    <mesh
      position={[posicion[0], alturaBase + altoGabinete / 2, posicion[2]]}
      rotation={[0, giroY, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[largo, altoGabinete, fondoGabinete]} />
      <meshStandardMaterial color={COLORES.gabinete} roughness={0.7} metalness={0} />
    </mesh>
  )
}

/** Mobiliario arrimado a los muros, para que el centro quede libre. */
function Mobiliario() {
  const { mesa, gabinete } = LABORATORIO
  const xMesaIzquierda = -medioAncho + mesa.fondo / 2
  const xGabineteIzquierdo = -medioAncho + gabinete.fondo / 2
  const zMesaFondo = -medioFondo + mesa.fondo / 2
  const zGabineteFondo = -medioFondo + gabinete.fondo / 2

  return (
    <>
      {/* Pared izquierda, de lado a lado */}
      <MesaLaboratorio largo={4.6} posicion={[xMesaIzquierda, 0, 0]} giroY={Math.PI / 2} />
      <GabineteMural largo={3.6} posicion={[xGabineteIzquierdo, 0, 0]} giroY={Math.PI / 2} />

      {/* Pared del fondo, a la derecha de la puerta */}
      <MesaLaboratorio largo={3.4} posicion={[1.6, 0, zMesaFondo]} />
      <GabineteMural largo={2.8} posicion={[1.6, 0, zGabineteFondo]} />

      {/* Pared derecha, un tramo corto */}
      <MesaLaboratorio
        largo={2.6}
        posicion={[medioAncho - mesa.fondo / 2, 0, 1.4]}
        giroY={-Math.PI / 2}
      />
    </>
  )
}

/**
 * El laboratorio: caja de la sala mas mobiliario fijo.
 *
 * No lleva ninguna luz; de eso se encarga <Iluminacion />. Tampoco sabe nada de los
 * equipos, que se montan encima como hijos de la escena.
 */
export default function Laboratorio() {
  return (
    <group name="laboratorio">
      <Piso />
      <Muros />
      <Techo />
      <Puerta />
      <Mobiliario />
    </group>
  )
}
