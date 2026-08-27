# Fuentes del texto 3D

`liberation-sans.woff` y `liberation-sans-negrita.woff` son Liberation Sans, con
licencia SIL Open Font License 1.1, copiadas de la distribucion del sistema.

Se sirven desde aqui, y no del CDN de Google, por dos razones. La demo se ensena
en el laboratorio del cliente, donde la red es ajena y a veces no hay; y el texto
de los paneles tiene que existir dentro del visor, donde no hay DOM que valga:
todo es geometria 3D, y si la fuente no carga los paneles salen en blanco.

Se generan recortadas al juego de caracteres que usa la interfaz:

    python3 herramientas/recortar-fuente.py \
      /usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf \
      public/fuentes/liberation-sans.woff

Tienen que ser **WOFF, no WOFF2**. Troika, que dibuja el texto 3D, no sabe leer
WOFF2: va comprimido con Brotli. Si se le da un WOFF2 falla en silencio y cae a su
fuente por defecto, que descarga de un CDN, justo lo que queremos evitar.
