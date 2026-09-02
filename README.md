# Showroom Virtual — Revvity México (EUROIMMUN)

Recorrido en realidad virtual de los analizadores EUROIMMUN a escala real, para
enseñarlos en el laboratorio del cliente sin trasladar equipos de 200 kg.

Funciona en dos modos con el mismo código: navegador de escritorio con órbita de
ratón, y sesión inmersiva en Meta Quest 2.

## Puesta en marcha

Requiere **Node ^20.19 o >=22.12**.

```bash
npm install
npm run dev            # escritorio, http://localhost:5173
```

### Probar con el Quest

```bash
npm run dev:visor      # HTTPS y accesible desde la red local
```

Abre en el navegador del Quest la dirección **Network** que imprime (`https://192.168.x.x:5173`)
y acepta el aviso de certificado autofirmado. WebXR solo funciona en contexto
seguro, por eso no vale el `npm run dev` normal cuando se entra desde otro aparato.

### Panel de diagnóstico

Añade `?diagnostico` a la dirección:

```
https://192.168.x.x:5173/?diagnostico
```

Muestra fps, duración del peor cuadro, llamadas de dibujo, triángulos y la
frecuencia que negoció la sesión. En escritorio sale arriba a la derecha; **dentro
del visor va pegado al control izquierdo**, como un reloj de pulsera: se consulta
levantando esa mano.

El dato que más importa no es el fps medio sino el **peor cuadro**. Una media de 72
con un cuadro suelto de 40 ms se siente como un tirón, y la media no lo delata.

### Colocar hotspots

Añade `?colocar` a la dirección. Haz clic sobre la pieza del equipo y aparece la
línea lista para pegar en `src/data/equipos.ts`:

```
posicion: [0.413, 0.228, 0.36],
```

Las coordenadas salen en el espacio local del equipo —origen en el centro de su
huella, `Y = 0` en su base— así que siguen valiendo aunque el equipo cambie de sitio
o de altura.

Existe porque las posiciones de los hotspots **no se pueden calcular**: hay que
señalar la pieza, y quien conoce el equipo es el equipo comercial, no quien escribe
el código.

## Comandos

| comando | qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run dev:visor` | Igual, con HTTPS y expuesto a la red local |
| `npm run build` | Comprueba tipos y compila a `dist/` |
| `npm run preview` | Sirve el `dist/` compilado |
| `npm run tipos` | Solo la comprobación de tipos |
| `npm run comprobar` | Comprobaciones de la matemática de locomoción |

## Añadir un analizador

Todo lo que describe un equipo vive en `src/data/equipos.ts`. Añadir uno es escribir
un objeto más en ese array; ningún componente cambia.

**1. Optimizar el modelo.** Los `.glb` de CAD no corren en un Quest 2 tal cual:

```bash
node herramientas/optimizar-modelo.mjs entrada.glb public/models/salida.glb \
  --triangulos=150000 --textura=1024 --error=0.01
```

Decima, quita geometría de ayuda, sustituye el vidrio físico por transparencia
normal, redimensiona texturas y comprime con Draco. Informa del antes y el después.

**2. Calcular la escala.** No se estima a ojo: cada archivo viene en unidades
distintas.

```bash
node herramientas/medir-modelo.mjs public/models/salida.glb --ancho=1200
```

Pásale dos o tres medidas de catálogo (`--ancho --alto --fondo`) y avisa si no
concuerdan entre sí, lo que delata un modelo rotado o incompleto antes de que el
equipo salga deformado en una demo.

**3. Marcar si la escala está verificada.** El campo `escalaVerificada: true` solo
va cuando el factor sale de una ficha de catálogo real. Sin él, el selector muestra
un distintivo «escala aprox.», porque esta herramienta promete tamaño real y
enseñar uno estimado sin decirlo rompe esa promesa delante del cliente.

## Controles

**Escritorio:** arrastrar para girar, rueda para acercar, clic en un punto para su ficha.

**Visor:**

| entrada | acción |
|---|---|
| Palanca derecha adelante | aparece el arco; al soltarla, salta |
| Palanca derecha a los lados | gira la vista 30° de golpe |
| Gatillo | abre la ficha de un hotspot |

No hay desplazamiento continuo a propósito: mover al usuario sin que su cuerpo lo
acompañe es la causa principal del mareo, y el público de esta demo son clientes que
se ponen un visor por primera vez. Los ajustes están en `src/configuracion/locomocion.ts`.

## Estructura

```
herramientas/     Scripts de preparación de modelos y comprobaciones
legacy-8thwall/   Proyecto anterior de tarjetas AR, conservado intacto
public/
  draco/          Decodificadores Draco (locales, no CDN)
  fuentes/        Liberation Sans recortada para el texto 3D
  models/         Modelos ya optimizados
src/
  configuracion/  Medidas del laboratorio, rendimiento, locomoción, XR
  data/           Catálogo de equipos
  escena/         Todo lo que se dibuja en 3D
  ganchos/        Carga de modelos, métricas, soporte de VR
  tipos/          Tipos del dominio
  ui/             Interfaz 2D, solo visible fuera del visor
```

Dentro del visor no existe el DOM: todo lo que el cliente deba ver con el casco
puesto tiene que ser geometría de la escena. Por eso los paneles de los hotspots y
el de diagnóstico están hechos con texto 3D y no con HTML.
