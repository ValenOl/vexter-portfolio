# Asistente Fiscal (vexter-portfolio)

Pieza de portfolio: un asistente conversacional para monotributistas argentinos, construido para demostrar cómo diseño agentes de IA en producción de forma verificable y segura, no solo "que respondan".

**Demo en vivo**: [vexter-portfolio.vercel.app](https://vexter-portfolio.vercel.app)

## Qué demuestra este proyecto

- **RAG con grounding estricto.** El retrieval corre determinísticamente contra un corpus curado de normativa AFIP/ARCA (`data/normativa/*.md`, embebido con pgvector en Neon). Si el modelo no puede citar una ficha real, el código descarta la respuesta y fuerza `sin_fuente`, sin confiar en que el modelo "se porte bien". Detalle técnico en `src/lib/ai/fiscal-assistant.ts`.
- **Human-in-the-loop.** El agente nunca asume un dato personal (categoría, facturación real): usa `askUser` sin `execute` para pausar y pedirlo, siempre.
- **Redteam de seguridad real.** Probado contra `indirect-prompt-injection`, `hallucination` y `overreliance` con Promptfoo. Se encontraron 2 vulnerabilidades reales (fabricación de datos "verificados" y normativa inventada presentada como oficial) y se cerraron con guardrails determinísticos en código, no parches de prompt. Reporte completo en `openspec/changes/fiscal-assistant-mvp/redteam-report.md`.
- **CI/CD con evals automáticos.** Lint, typecheck, build, tests unitarios y evals funcionales (contra Neon + Vertex AI reales) corriendo en GitHub Actions en cada push, no solo checkeados a mano.

Catálogo completo de competencias y convenciones en [`SKILLS.md`](./SKILLS.md).

## Stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **Vercel AI SDK** + **Google Vertex AI** (`gemini-2.5-flash`) vía `@ai-sdk/google-vertex`
- **Prisma** + **Neon Postgres** con extensión **pgvector** para el retrieval
- **Promptfoo** para evals funcionales y redteam de seguridad
- **Vitest** para tests unitarios
- **Tailwind CSS** + **Framer Motion** para la UI

## Correrlo localmente

```bash
npm install
npx dotenv -e .env.local -- npx tsx src/lib/rag/ingest.ts   # ingesta el corpus a la DB
npm run dev
```

Variables de entorno necesarias en `.env.local`: `DATABASE_URL` (Neon con pgvector), `GOOGLE_VERTEX_PROJECT`, `GOOGLE_VERTEX_LOCATION`, `GOOGLE_APPLICATION_CREDENTIALS`.

```bash
npm run lint    # ESLint
npm run build   # typecheck + build de producción
npm test        # tests unitarios (Vitest)
npm run eval    # evals funcionales (Promptfoo, requiere DB + Vertex AI reales)
```

## Estructura

```
src/lib/ai/fiscal-assistant.ts   # orquestación del agente + guardrails de grounding
src/lib/rag/                     # ingesta y embedding del corpus
data/normativa/*.md              # corpus curado de normativa AFIP/ARCA (fuente de verdad)
evals/                           # config de Promptfoo: eval suite + redteam
openspec/changes/fiscal-assistant-mvp/  # historial de diseño, spec y verificación (SDD)
```

## Contexto

Este proyecto aplica el mismo patrón (tool calling + human-in-the-loop + evals + security) que uso en producción en Vexter, pero sobre un dominio no sensible pensado específicamente como pieza de portfolio.

**Disclaimer**: respuestas grounded en un corpus curado, no un asesor fiscal real. Ante dudas reales, consultá con un contador matriculado.
