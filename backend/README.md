# Backend (FastAPI)

Backend service for WhatsApp feedback ingestion, AI analysis, MongoDB persistence, and SSE updates.

## Stack

- FastAPI + Uvicorn
- MongoDB Atlas via `pymongo[srv]`
- Twilio WhatsApp Sandbox inbound webhook
- OpenAI JSON analysis (`sentimiento`, `tema`, `resumen`)
- SSE stream for live updates

## Folder Structure

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

## Setup

1. Create virtual environment and install dependencies:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Configure environment:

```bash
cp .env.example .env
# Edit .env with real secrets and MongoDB URI
```

3. Run API locally:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

- `POST /webhook/twilio`
  - Receives Twilio form-data payload (`Body`, `From`, `MessageSid`)
  - Idempotent by `MessageSid`
  - Persists base record with `timestamp_epox` (epoch seconds)
  - Triggers AI analysis and updates same record
  - Returns TwiML-compatible response (`<Response></Response>`)

- `GET /api/mensajes?sentimiento=&tema=&desde=&hasta=&limit=`
  - Filters by `sentimiento`, `tema`, epoch range, and limit

- `GET /api/sentimientos`
  - Aggregation count by sentimiento

- `GET /api/temas`
  - Aggregation count by tema

- `GET /api/resumen?limit=`
  - Latest analyzed summaries

- `GET /api/health`
  - DB connectivity health (`ok`/`degraded`)

- `GET /api/stream`
  - SSE stream for message create/update events

## Enum Contracts

- `sentimiento`: `positivo | negativo | neutro`
- `tema`: `Servicio al Cliente | Calidad del Producto | Precio | Limpieza | Otro`
- `timestamp_epox`: epoch seconds

## Twilio Signature Validation

Optional and env-controlled:

- Set `VALIDATE_TWILIO_SIGNATURE=true`
- Set `TWILIO_AUTH_TOKEN=<your_token>`

## Smoke Examples (curl)

Webhook simulation:

```bash
curl -X POST "http://localhost:8000/webhook/twilio" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "Body=El servicio fue rapido" \
  --data-urlencode "From=whatsapp:+5215555550000" \
  --data-urlencode "MessageSid=SM_TEST_123"
```

Fetch messages:

```bash
curl "http://localhost:8000/api/mensajes?limit=10"
```

SSE stream:

```bash
curl -N "http://localhost:8000/api/stream"
```
