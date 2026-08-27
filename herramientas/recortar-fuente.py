#!/usr/bin/env python3
"""
Recorta una fuente al juego de caracteres que la interfaz usa de verdad.

Liberation Sans completa pesa ~400 KB por variante porque trae alfabetos que
nunca vamos a escribir. Los paneles del showroom son texto en espanol, asi que
con Latin-1 mas unos signos sobra. Recortada y en WOFF baja a unas decenas de KB,
que en el wifi de un laboratorio ajeno es la diferencia entre que el panel salga
con texto o salga en blanco.

OJO: tiene que ser WOFF y no WOFF2. Troika, que es quien dibuja el texto 3D, no
sabe leer WOFF2 (va comprimido con Brotli) y se queda sin fuente en silencio,
cayendo a su fuente por defecto, que descarga de un CDN.

Uso:
    python3 herramientas/recortar-fuente.py <entrada.ttf> <salida.woff>

Requiere: pip install fonttools brotli
"""

import sys
from fontTools import subset

# Basico latino, suplemento latino-1 (acentos y enes), comillas y rayas
# tipograficas, y los simbolos que aparecen en la interfaz.
CARACTERES = (
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "".join(chr(c) for c in range(0xA0, 0x100))
    + "‘’“”–—…·•×→✓○"
)


def principal(entrada: str, salida: str) -> None:
    opciones = subset.Options()
    opciones.flavor = "woff"
    opciones.desubroutinize = True
    # El texto 3D se dibuja con troika, que no usa las tablas de maquetacion
    # complejas; quitarlas ahorra bastante sin cambiar como se ve.
    opciones.layout_features = ["kern", "liga"]
    opciones.drop_tables += ["DSIG"]
    opciones.notdef_outline = True

    fuente = subset.load_font(entrada, opciones)
    subsetter = subset.Subsetter(options=opciones)
    subsetter.populate(text=CARACTERES)
    subsetter.subset(fuente)
    subset.save_font(fuente, salida, opciones)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        raise SystemExit(1)
    principal(sys.argv[1], sys.argv[2])
