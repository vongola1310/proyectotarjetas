# Decodificadores Draco

Copiados de `node_modules/three/examples/jsm/libs/draco/gltf/`.

Se sirven desde aqui, y no desde un CDN, por dos razones: la demo se ensena en el
laboratorio del cliente, donde la red es ajena y a veces mala, y porque la version
del decodificador debe corresponder con la de three.js del proyecto.

Al actualizar three.js hay que volver a copiarlos:

    cp node_modules/three/examples/jsm/libs/draco/gltf/* public/draco/
