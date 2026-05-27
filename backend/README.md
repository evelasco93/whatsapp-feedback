# Backend (FastAPI)

Servicio backend para ingesta de feedback por WhatsApp, analisis con IA, persistencia en MongoDB y actualizaciones en vivo por SSE.

## Stack

- FastAPI + Uvicorn
- MongoDB Atlas usando `pymongo[srv]`
- Webhook entrante de Twilio WhatsApp Sandbox
- Analisis JSON con Gemini (Google Generative Language API) (`sentimiento`, `tema`, `resumen`)
- Stream SSE para actualizaciones en vivo

## Estructura de carpetas

```text
backend/
├── app/
│   ├── config/settings.py
│   ├── core/logging.py
│   ├── db/mongo.py
│   ├── repositories/messages_repository.py
│   ├── routers/api.py
│   ├── routers/webhook.py
│   ├── schemas/message.py
│   ├── services/ai_analysis_service.py
│   ├── services/message_processing_service.py
│   ├── services/stream_service.py
│   ├── dependencies.py
│   └── main.py
├── .env.example
└── requirements.txt
```

## Requisitos

- Python 3.11+
- MongoDB Atlas (o MongoDB compatible con el driver)

## Configuracion y ejecucion

1. Crear entorno virtual e instalar dependencias:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Configurar variables de entorno:

```bash
cp .env.example .env
```

Variables clave para analisis IA:

- `GEMINI_API_KEY`: API key de Google AI Studio / Generative Language API.
- `GEMINI_MODEL`: modelo de Gemini a usar. Si no se define, el backend usa `gemini-flash-latest`.
  - Si el usuario define `gemini-3.5-flash`, se utiliza ese valor.
- `AI_TIMEOUT_SECONDS`: timeout de la llamada HTTP al proveedor IA.

3. Iniciar API local:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

- `POST /webhook/twilio`
  - Recibe payload `form-data` de Twilio (`Body`, `From`, `MessageSid`).
  - Es idempotente por `MessageSid`.
  - Persiste el registro base con `timestamp_epox` (epoch seconds).
  - Dispara el analisis IA y actualiza el mismo registro.
  - Retorna respuesta compatible con TwiML (`<Response></Response>`).

- `GET /api/mensajes?sentimiento=&tema=&desde=&hasta=&limit=`
  - Filtra por `sentimiento`, `tema`, rango de fechas (`timestamp_epox`) y `limit`.

- `GET /api/sentimientos?desde=&hasta=`
  - Retorna conteo agregado por sentimiento.
  - `desde` y `hasta` son opcionales (epoch seconds) y aplican filtro por `timestamp_epox`.

- `GET /api/temas?desde=&hasta=`
  - Retorna conteo agregado por tema.
  - `desde` y `hasta` son opcionales (epoch seconds) y aplican filtro por `timestamp_epox`.

- `GET /api/resumen?limit=`
  - Retorna resumenes mas recientes ya analizados.

- `GET /api/health`
  - Estado de conectividad a base de datos (`ok` / `degraded`).

- `GET /api/stream`
  - Stream SSE de eventos de mensajes creados y actualizados.

## Contratos de enums

- `sentimiento`: `positivo | negativo | neutro`
- `tema`: `Servicio al Cliente | Calidad del Producto | Precio | Limpieza | Otro`
- `timestamp_epox`: epoch seconds

## Validacion de firma de Twilio

Opcional y controlada por variables de entorno:

- `VALIDATE_TWILIO_SIGNATURE=true`
- `TWILIO_AUTH_TOKEN` definido en entorno (no incluir secretos en repositorio)

## Nota Atlas SQL vs MongoDB Driver

- Atlas SQL requiere una instancia federada (Federated Database Instance) y al menos una base de datos registrada para poder consultar.
- El acceso por driver MongoDB (`pymongo`) funciona sin Atlas SQL y la base/coleccion puede crearse automaticamente en el primer write.

## Ejemplos rapidos (curl)

Simular webhook:

```bash
curl -X POST "http://localhost:8000/webhook/twilio" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "Body=El servicio fue rapido" \
  --data-urlencode "From=whatsapp:+5215555550000" \
  --data-urlencode "MessageSid=SM_TEST_123"
```

Listar mensajes:

```bash
curl "http://localhost:8000/api/mensajes?limit=10"
```

Obtener agregados de temas por rango:

```bash
curl "http://localhost:8000/api/temas?desde=1716400000&hasta=1717000000"
```

Consumir SSE:

```bash
curl -N "http://localhost:8000/api/stream"
```
