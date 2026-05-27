# Frontend - Cafe de El Salvador

Dashboard en React + TypeScript para visualizar feedback de WhatsApp con graficas, feed filtrable y actualizaciones en vivo.

## Requisitos

- Node.js 20+
- Backend corriendo en `http://localhost:8000` (o URL configurada en `.env`)

## Configuracion

1. Copia variables:

```bash
cp .env.example .env
```

2. Ajusta `VITE_API_BASE_URL` si corresponde.

## Ejecucion

```bash
pnpm install
pnpm dev
```

Scripts disponibles:

- `pnpm dev`: servidor de desarrollo.
- `pnpm build`: compilacion de produccion.
- `pnpm preview`: previsualizacion del build.

## Funcionalidades principales

- Dashboard en espanol para "Cafe de El Salvador".
- Grafica de pastel: distribucion de sentimientos.
- Grafica de barras: frecuencia de temas por rango de fechas.
- Feed reciente con chips clicables para filtrar por sentimiento y tema.
- Seccion "Como usar este demo" con pasos de Twilio sandbox.
- Actualizaciones en vivo por SSE (`/api/stream`) y polling de respaldo cada 15 segundos.
