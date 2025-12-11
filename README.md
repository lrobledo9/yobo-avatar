# Avatar - Entrevistas asistidas por bot 3D

Aplicacion Node/Express que publica una experiencia de entrevista interactiva. El backend sirve los recursos estaticos en `public/` y expone las rutas `/` (pantalla de ingreso) y `/chat` (entrevista). En el navegador se renderiza un avatar 3D (Three.js) que conversa con los candidatos usando Azure Speech y un backend propio que genera las preguntas y respuestas del bot. Node.js se utiliza exclusivamente para el entorno local; en despliegues de produccion la carpeta `public/` se puede servir desde cualquier hosting estatico o CDN.

## Requisitos previos

- Node.js 18 o superior (se utiliza `type: "module"` y `express@5`).
- npm para instalar dependencias.
- Camara, microfono y un navegador moderno con soporte WebRTC/WebGL.
- Acceso a los servicios externos configurados:
  - Azure Speech (clave y region validas).
  - N8N (`https://appyobo.app.n8n.cloud/...`) para preguntas y vacantes.
  - Servicio de respuestas del bot (`https://yobo-services-.../openia/chat/response`).

> Importante: el repositorio contiene claves de ejemplo en `public/js/azureTTS.js`. Reemplazalas por variables de entorno o por un mecanismo seguro antes de desplegar en produccion.

## Instalacion

```bash
npm install
```

## Ejecucion

| Script       | Comando       | Descripcion                                                                 |
| ------------ | ------------- | --------------------------------------------------------------------------- |
| Servidor dev | `npm run dev` | Levanta Express con `nodemon`, recarga al detectar cambios en `app.js`.     |
| Produccion   | `npm start`   | Ejecuta `node app.js`.                                                      |

El servidor escucha en `PORT` (por defecto `3030`). Una vez iniciado, accede a `http://localhost:3030/`.

> Nota: en produccion solo necesitas publicar el contenido de `public/` en tu proveedor de hosting estatico (por ejemplo Vercel, Netlify o un CDN propio). El servidor Express queda reservado para desarrollo local o para escenarios donde quieras proxear servicios y proteger credenciales.

## Estructura del proyecto

```
📁 avatar
├── 📄 app.js                # Servidor Express, rutas `/` y `/chat`
├── 📁 public
│   ├── 📄 index.html        # Pantalla de ingreso, valida candidato y guarda datos en localStorage
│   ├── 📄 chat.html         # Sala principal de la entrevista + import map para Three.js
│   ├── 📁 js
│   │   ├── 📄 camera.js        # Activacion de camara en pantalla inicial
│   │   ├── 📄 cameraChat.js    # Control de grabacion, reconocimiento de voz y UI del chat
│   │   ├── 📄 avatar.js        # Render del avatar 3D, visemas y animaciones (parpadeo, saludo, pensando)
│   │   ├── 📄 azureTTS.js      # Configuracion del SDK de Azure Speech
│   │   ├── 📄 n8nService.js    # Consumo de la API N8N para preguntas/vacante y envio de resultados
│   │   └── 📄 openIA.js        # Gestion del historial y peticiones al servicio del bot conversacional
│   └── 📁 assets               # Bootstrap, iconos, texturas, etc.
├── 📁 context
│   └── 📄 # AGENTS.md        # Reglas internas del proyecto
├── 📁 node_modules            # Dependencias instaladas (se genera con npm install)
├── 📄 package.json           # Scripts, dependencias y metadatos del proyecto
├── 📄 package-lock.json      # Bloqueo de versiones npm
└── 📄 README.md              # Este documento
```

## Flujo funcional

1. **Ingreso** (`index.html`):
   - El usuario concede acceso a camara y microfono.
   - Ingresa su nombre y llega con `?application=<id>`.
   - `getVacant()` consulta N8N y guarda en `localStorage` los datos de la candidatura.
   - Se redirige a `/chat`.

2. **Entrevista** (`chat.html`):
   - Se valida que existan `application`, `vacant` y `username` en `localStorage`.
   - Se inicializa el avatar: camara, animacion base (`animate()`), saludo inicial y explicacion del flujo.
   - El boton central funciona como push-to-talk: se mantiene para hablar y se suelta para enviar la respuesta.
   - Azure Speech (`recognizer`) transcribe audio; la transcripcion se envia a `generateChatResponse`, que agrega la respuesta del bot al historial.
   - `speakAvatar()` sintetiza la voz con Azure TTS, sincroniza visemas y muestra expresiones segun el contenido.
   - `cameraChat.js` mantiene el historial visual, el cronometro, el control de salida y gestiona la subida del video a Azure Blob Storage mas el registro en N8N (`sendDataInterview`).

3. **Cierre**:
   - Al terminar (o salir), se detiene la grabacion, se suben los datos y se limpia el `localStorage`.

## Servicios externos

- **Azure Speech** (`public/js/azureTTS.js`):
  - `subscriptionKey` y `serviceRegion` determinan la voz (`es-MX-JorgeNeural`), visemas y reconocimiento continuo.
  - Recomendado mover estas credenciales a variables de entorno y leerlas desde el backend.

- **API del bot** (`public/js/openIA.js`):
  - Endpoint `POST /api/v1/openia/chat/response`.
  - Envia: nombre del candidato, vacante, lista de preguntas y el historial `[{role, content}, ...]`.
  - Devuelve `reply`, que se almacena y reproduce.

- **N8N** (`public/js/n8nService.js`):
  - `GET /webhook/api/interview?application_id=<id>` devuelve listado de preguntas y datos de la vacante.
  - `POST /webhook/api/interview` recibe `interviewId`, URL del video y transcripcion para el registro final.
  - Usa autenticacion basica; evita hardcodear credenciales en builds publicos.

## Extender o personalizar

- **Animaciones del avatar**: `avatar.js` expone `triggerAvatarWave()` y `triggerAvatarThinking()` (saludo y gesto de pensando). Podes crear animaciones adicionales controlando huesos especificos o morph targets.
- **Estados del chat**: `cameraChat.js` maneja los estados del boton, mensajes y la UI. Se puede adaptar estilos o indicadores para mejorar accesibilidad y soporte movil.
- **Fuentes de preguntas**: reemplaza `n8nService.js` por el origen que prefieras (REST, GraphQL, etc.) manteniendo el formato `{ txt, length }`.
- **Persistencia**: actualmente el historial se almacena en memoria del navegador; si se necesita persistencia server-side, crea endpoints en Express para guardar o recuperar el chat.

## Buenas practicas recomendadas

- No expongas claves en el frontend; lee las credenciales desde variables de entorno y proxialas a traves del backend.
- Habilita HTTPS en despliegues para que WebRTC (camara y microfono) funcione sin advertencias.
- Agrega pruebas end-to-end (por ejemplo con Playwright) para validar el flujo de la entrevista.
- Documenta a los candidatos que datos se recopilan (video, transcripcion) y como se almacenan, para cumplir con politicas de privacidad.

## Problemas conocidos

- La clave de Azure esta actualmente hardcodeada; reemplazala antes de subir a repositorios publicos.
- Algunas cadenas contienen caracteres especiales deteriorados (`boton`, `camara`); conviene revisar `public/*.html` y `public/js/*.js`.
- No hay manejo de errores de red en la UI (sin conexion o servicios externos inalcanzables).

## Proximos pasos sugeridos

- Externalizar la configuracion sensible a `.env` y consumirla desde `app.js`.
- Anadir autenticacion para asegurar que solo candidatos validos ingresen.
- Mejorar la UI movil y la accesibilidad (textos alternativos, feedback auditivo).
- Integrar analitica o dashboards para revisar resultados de entrevistas.

---

Cualquier cambio o contribucion segui las reglas de `context/# AGENTS.md`: funciones en camelCase y documentarlas con bloques JSDoc.
