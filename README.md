# WhatsApp Feedback Dashboard

Proyecto full-stack para capturar mensajes de WhatsApp, analizarlos con IA y visualizarlos en un dashboard en tiempo real.

## 1) Descripcion del proyecto y arquitectura final

La solucion recibe feedback de clientes desde WhatsApp (Twilio Sandbox), lo procesa en backend, enriquece cada mensaje con analisis de IA (sentimiento, tema y resumen), persiste en MongoDB Atlas y actualiza el frontend en vivo.

Arquitectura final de demo:

- Frontend: React + Vite desplegado en Vercel.
- Backend: FastAPI desplegado en Render.
- Base de datos: MongoDB Atlas.
- Ingreso de mensajes: Twilio WhatsApp Sandbox (webhook).
- IA: Gemini (Google Generative Language API) con salida JSON validada.
- Tiempo real: SSE (`/api/stream`) + polling de respaldo.

## 2) Configuracion y ejecucion local (backend + frontend)

### Requisitos

- Python 3.11+
- Node.js 20+
- pnpm
- Cuenta/configuracion de MongoDB Atlas
- Credenciales de Gemini
- (Opcional) Twilio Auth Token para validar firma

### Backend (FastAPI)

1. Entrar al backend y crear entorno virtual:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

2. Instalar dependencias:

```bash
pip install -r requirements.txt
```

3. Crear archivo de entorno:

```bash
cp .env.example .env
```

4. Configurar variables requeridas en `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
GEMINI_API_KEY=<tu_gemini_api_key>
```

Variables importantes adicionales:

```env
APP_NAME=whatsapp-feedback-backend
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
LOG_LEVEL=INFO

CORS_ORIGINS_RAW=*
MONGODB_DB_NAME=whatsapp_feedback
MONGODB_COLLECTION_NAME=mensajes
GEMINI_MODEL=gemini-flash-latest
AI_TIMEOUT_SECONDS=15

VALIDATE_TWILIO_SIGNATURE=false
TWILIO_AUTH_TOKEN=
SSE_RETRY_MS=3000
```

5. Ejecutar backend:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (React + Vite)

1. Entrar al frontend:

```bash
cd frontend
```

2. Instalar dependencias:

```bash
pnpm install
```

3. Crear archivo de entorno:

```bash
cp .env.example .env
```

4. Configurar variable requerida en `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

5. Ejecutar frontend:

```bash
pnpm dev
```

## 3) Dependencias clave y decisiones tecnicas

Backend:

- FastAPI: API rapida, tipada y simple de mantener.
- Uvicorn: servidor ASGI eficiente para desarrollo/produccion.
- Pydantic + pydantic-settings: validacion fuerte de datos y configuracion por entorno.
- PyMongo: acceso directo y claro a MongoDB Atlas.
- twilio: manejo de webhook y validacion de firma.
- Gemini API: clasificacion semantica del mensaje.
- sse-starlette: stream SSE para actualizacion en vivo.

Frontend:

- React + TypeScript + Vite: base moderna, rapida y tipada.
- TanStack Query: cache, sincronizacion y refetch con bajo esfuerzo.
- Recharts: visualizacion simple para graficas de negocio.
- EventSource (SSE): refresco reactivo del dashboard ante nuevos eventos.

Decision de datos:

- MongoDB se eligio por flexibilidad para iterar el esquema del mensaje y metadatos Twilio.
- Idempotencia por `MessageSid` para evitar duplicados ante reintentos del proveedor.

## 4) Enfoque de ingenieria de prompts para construir el sistema

Esta seccion documenta el estilo de prompts que use con el asistente de IA (GitHub Copilot) para llegar al sistema actual. No describe el prompt interno a Gemini, sino la forma de pedir, iterar y restringir las respuestas del asistente durante el desarrollo.

### Estructura general de mis prompts

- Contexto del proyecto primero: stack (FastAPI + React + Vite + Mongo Atlas + Twilio + Gemini), objetivo (dashboard de feedback en vivo) y restricciones (full-stack, deploy en Vercel + Render).
- Objetivo concreto y unico por turno: "crear endpoint X", "agregar grafica Y", "arreglar bug Z". Sin mezclar tareas no relacionadas.
- Resultado esperado explicito: archivos a tocar, contrato de respuesta, criterios visuales o de UX, o estado final del feature.
- Restricciones tecnicas: TypeScript estricto, sin `any`, sin librerias extra cuando ya existe alternativa, mantener convenciones del repo, no romper builds.
- Cuando aplica, ejemplos: payloads de Twilio, formas de respuesta de la API, ejemplos de copy en espanol.

### Tipos de prompts que use

1. Prompts de scaffolding y arquitectura:
   - Pedir estructura inicial del backend (FastAPI), separacion en `routers`, `repositories`, `services`, `schemas`, `dependencies`.
   - Pedir estructura inicial del frontend (Vite + React + TS), con carpetas por feature (`features/dashboard`), componentes UI reutilizables y `services/queries`.
2. Prompts de contrato de API:
   - Definir endpoints (`/api/mensajes`, `/api/sentimientos`, `/api/temas`, `/api/stream`) con parametros, filtros y forma de respuesta antes de implementar la logica.
   - Establecer modelos Pydantic con enums cerrados (`positivo | negativo | neutro`, lista fija de temas) para validar la salida de Gemini.
3. Prompts de integracion externa:
   - Webhook de Twilio: validacion de firma opcional, idempotencia por `MessageSid`, upsert en Mongo.
   - Gemini: pedir respuesta solo JSON, `responseMimeType: "application/json"`, claves exactas (`sentimiento`, `tema`, `resumen`), enums cerrados y manejo de timeouts.
4. Prompts de UI/UX iterativos:
   - Indicaciones cortas y especificas: "el dropdown se ve como input de texto", "alinea colores entre pie chart y chips", "los porcentajes deberian ser pildoras clickeables que filtren el feed", "elimina resumen IA de las tarjetas".
   - Cada iteracion incluye criterio visual claro y, cuando aplica, captura de referencia.
5. Prompts de depuracion:
   - Pegar stack trace completo (por ejemplo `TLSV1_ALERT_INTERNAL_ERROR` en Render) y describir contexto diferenciador (funciona en local + ngrok, falla en Render) para que el asistente proponga causa raiz y solucion concreta.
6. Prompts de despliegue:
   - Pedir pasos especificos para Vercel (frontend) y Render (backend) con variables de entorno y comandos de build/start.
   - Pedir limpieza explicita cuando se descarto un enfoque (por ejemplo, eliminar `render.yaml` al optar por configuracion manual en el dashboard).

### Instrucciones y detalles que siempre incluyo

- Stack y versiones objetivo (Python 3.12, Node 20, React 18, pnpm).
- Convenciones: nombres en español para dominio, ingles para codigo, sin emojis en UI.
- Reglas de seguridad: nunca exponer secretos, usar variables de entorno, validar entrada en bordes.
- Comportamiento esperado en errores: respuestas JSON con shape consistente, fallback a polling cuando SSE falla, validacion Pydantic estricta.
- Criterios de aceptacion verificables: "que `pnpm build` pase", "que el endpoint responda 200 con esta forma", "que el chart conserve el orden entre polls".

### Como iteramos

- Cambios incrementales y verificables turno por turno; sin pedir refactors masivos.
- Despues de cada cambio relevante: build y/o request real para validar.
- Cuando el asistente proponia algo fuera de alcance, lo acotaba con un prompt corto ("solo toca este archivo", "no agregues librerias nuevas").
- Para problemas de produccion, separaba diagnostico de solucion: primero identificar la causa, luego aplicar el fix minimo.

## 5) Flujo end-to-end: WhatsApp -> Dashboard

1. Usuario envia mensaje al sandbox de WhatsApp de Twilio.
2. Twilio invoca `POST /webhook/twilio` con `Body`, `From`, `MessageSid`.
3. Backend valida entrada (y firma Twilio si esta habilitada).
4. Mensaje se inserta/actualiza en MongoDB (upsert por `MessageSid`).
5. Backend emite evento SSE `mensaje_ingresado`.
6. Se ejecuta analisis de IA en background y se actualiza el documento.
7. Backend emite SSE `mensaje_actualizado`.
8. Frontend recibe SSE, invalida queries y refresca widgets/feed.
9. Como respaldo, el frontend tambien hace refetch periodico cada 15s.

## 6) Instrucciones del demo para usuarios

1. Abrir WhatsApp y enviar al numero del sandbox Twilio:

```text
+14155238886
```

2. Si es la primera vez, enviar:

```text
join solid-track
```

3. Enviar mensajes de feedback (ejemplo: servicio, precio, calidad).
4. Observar el dashboard: nuevos mensajes aparecen automaticamente por SSE.
5. Si hay latencia de red, el polling de 15 segundos termina de sincronizar.

## 7) Endpoints principales del backend

Webhook:

- `POST /webhook/twilio`

API:

- `GET /api/mensajes?sentimiento=&tema=&desde=&hasta=&limit=`
- `GET /api/sentimientos`
- `GET /api/temas`
- `GET /api/resumen?limit=`
- `GET /api/health`
- `GET /api/stream` (SSE)

Ejemplos:

```bash
curl -X POST "http://localhost:8000/webhook/twilio" \
	-H "Content-Type: application/x-www-form-urlencoded" \
	--data-urlencode "Body=El servicio fue rapido" \
	--data-urlencode "From=whatsapp:+5215555550000" \
	--data-urlencode "MessageSid=SM_TEST_123"
```

```bash
curl "http://localhost:8000/api/mensajes?limit=10"
```

```bash
curl -N "http://localhost:8000/api/stream"
```

## 8) Despliegue demo (Vercel + Render + Atlas)

### MongoDB Atlas

1. Crear cluster y usuario de base de datos.
2. Permitir acceso de red desde Render.
3. Obtener `MONGODB_URI`.

### Backend en Render

1. Crear nuevo Web Service conectado al repo.
2. Root directory: `backend`.
3. Build command:

```bash
pip install -r requirements.txt
```

4. Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

5. Configurar variables de entorno (Render):

```env
MONGODB_URI=...
MONGODB_DB_NAME=whatsapp_feedback
MONGODB_COLLECTION_NAME=mensajes
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-flash-latest
AI_TIMEOUT_SECONDS=15
CORS_ORIGINS_RAW=https://<tu-frontend>.vercel.app
VALIDATE_TWILIO_SIGNATURE=true
TWILIO_AUTH_TOKEN=...
```

### Frontend en Vercel

1. Importar proyecto y seleccionar root `frontend`.
2. Build command:

```bash
pnpm build
```

3. Output directory:

```text
dist
```

4. Variable de entorno en Vercel:

```env
VITE_API_BASE_URL=https://<tu-backend>.onrender.com
```

### Twilio Sandbox

Configurar webhook de WhatsApp apuntando al backend desplegado:

```text
https://<tu-backend>.onrender.com/webhook/twilio
```

## 9) Buenas practicas de seguridad

- Nunca subir secretos al repositorio (`.env`, tokens, API keys).
- Gestionar secretos solo por variables de entorno en cada plataforma.
- Activar validacion de firma de Twilio en entornos publicos (`VALIDATE_TWILIO_SIGNATURE=true`).
- Restringir CORS a dominios reales de frontend en produccion.
- Rotar periodicamente claves (Gemini, Twilio, MongoDB) y revocar credenciales antiguas.
- Aplicar principio de menor privilegio en usuarios de base de datos y servicios.
