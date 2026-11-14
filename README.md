Videojuego de disparos en primera persona (FPS) ambientado en un hospital infestado de zombis. Eres uno de los últimos sobrevivientes: debes cruzar el edificio, administrar tu munición limitada y llegar al helipuerto de extracción antes de que te atrapen.

Proyecto desarrollado para el curso Computación Gráfica y Visual – Universidad Privada del Norte (UPN), Evaluación T3.

Hecho con HTML, CSS, JavaScript y Three.js.

🎯 Objetivo

Atravesar el hospital desde la Recepción hasta el Helipuerto, sobreviviendo a los zombis. Si un zombi te toca, pierdes (GAME OVER). Si llegas a la zona de extracción, ganas (¡MISIÓN COMPLETADA!).

🏥 El escenario

El recorrido se divide en cinco zonas separadas por muros y puertas:

Recepción – punto de inicio.
Urgencias – bancas y camillas.
Habitaciones – camas y cortinas.
Quirófano – mesas y equipo médico.
Helipuerto – ambulancias y zona de extracción.
🎮 Controles
Tecla / Acción	Función
W / A / S / D	Moverse
Mouse	Orientar la cámara
Clic izquierdo	Disparar (un disparo por clic)
1	Pistola
2	Rifle
⚙️ Mecánicas
Dos armas cargadas desde modelos .glb, que acompañan a la cámara.
Munición independiente por arma (pistola 8, rifle 24). Cada disparo gasta una bala y no se puede disparar con el cargador vacío.
Sin recarga libre: la munición solo se recupera recogiendo cajas de abastecimiento repartidas por el hospital.
Zombis GLB con dos estados: inactivos fuera de su rango de detección y activos (persecución) al entrar en él.
Disparos con raycasting desde el centro de la cámara. Cada zombi tiene 2 puntos de vida y muere exactamente al segundo impacto válido; luego deja de perseguir.
Colisiones: las paredes y objetos bloquean al jugador, a los zombis y a las balas.
Game Over al contacto con un zombi (la partida se detiene) y opción de reiniciar.
Victoria al entrar a la zona de extracción.
Dificultad: zombis distribuidos por zonas, munición limitada y obstáculos en el recorrido.
🚀 Instalación y ejecución

Requisitos: Visual Studio Code con la extensión Live Server, y conexión a Internet (Three.js se carga desde CDN).

Clona o descarga el repositorio:
bash
git clone <URL-DEL-REPOSITORIO>
Abre la carpeta del proyecto en Visual Studio Code.
Abre index.html, clic derecho → Open with Live Server.
Pulsa INICIAR MISIÓN para capturar el mouse y jugar.

Se necesita un servidor local (Live Server): abrir index.html con doble clic no permite cargar los modelos GLB.
