# Operación Extracción - FPS 3D

Videojuego FPS 3D desarrollado con HTML, CSS, JavaScript y Three.js.

## Requisitos
- Visual Studio Code.
- Extensión Live Server.
- Conexión a Internet para cargar Three.js desde CDN.

## Ejecución
1. Descomprime `OPERACION_EXTRACCION_1.zip`.
2. Abre la carpeta `OPERACION_EXTRACCION_1` en Visual Studio Code.
3. Abre `index.html`.
4. Haz clic derecho y selecciona **Open with Live Server**.
5. Pulsa **INICIAR MISIÓN** para capturar el mouse.

## Controles
- W: avanzar.
- S: retroceder.
- A: izquierda.
- D: derecha.
- Mouse: orientar la cámara.
- Clic izquierdo: un disparo por clic.
- 1: pistola.
- 2: rifle.
- Acércate a las cajas verdes para recoger munición.

## Mecánicas implementadas
- Dos armas cargadas desde modelos GLB.
- Munición independiente y limitada por arma.
- Reabastecimiento mediante cajas del escenario.
- Escenario 3D de hospital infestado: Recepción (inicio), Urgencias, Habitaciones, Quirófano y Helipuerto (extracción), con muros, puertas, camas, camillas y ambulancias.
- Las paredes bloquean tanto al jugador/zombis como a los disparos.
- Zombis GLB con activación por distancia y persecución.
- Dos impactos para eliminar cada zombi.
- Raycasting desde el centro de la cámara.
- Game Over al contacto con un zombi.
- Victoria al llegar a la zona de extracción.

## Modelos 3D
Los archivos `pistol.glb`, `rifle.glb` y `zombie.glb` son modelos low-poly generados para este proyecto y están incluidos en `assets/`.

## Nota
Este proyecto es una base funcional para la evaluación. Antes de la entrega, ejecuta pruebas en tu equipo y verifica cada mecánica. Para la sustentación, explica especialmente la carga GLB, el raycasting, el contador de munición y la lógica de detección/persecución.
