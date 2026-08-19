# Design: Asistente Fiscal MVP

## Technical Approach

Reusar el motor de Vexter (`invoice-extraction.ts`) como plantilla: función pura de orquestación (sin `"use server"`), tools tipadas con zod, `askUser` sin `execute` para pausar. La diferencia clave: el retrieval del RAG NO es una tool que el modelo decide llamar — corre **determinísticamente en código, antes** de invocar al modelo, igual que ya se decidió para `lookupCliente`/`lookupCuit` (scope nunca queda a discreción del modelo). Esto satisface directamente el requisito "MUST NOT responder sin fuente" del spec: si el retrieval no encuentra nada por encima del umbral, el código corta ahí y devuelve el mensaje de "no tengo info verificada" sin ni siquiera llamar al LLM — no depende de que el modelo "se porte bien".

## Architecture Decisions

### Decision: Retrieval determinístico en código, no como tool

**Choice**: `retrieveNormativa(query)` corre siempre antes del prompt, resultado inyectado como contexto.
**Alternatives considered**: tool `buscarNormativa` que el modelo invoca a discreción (más "agéntico", pero el gotcha real de Vexter — "el modelo a veces decide distinto con el mismo input" — hace que esto sea inaceptable para un requisito MUST de grounding).
**Rationale**: mismo principio que `lookupCliente` (server-side, no model-controlled) aplicado a este dominio nuevo. Convierte el requisito de grounding en garantía de código, no en esperanza de comportamiento del modelo.

### Decision: `askUser` reutilizado sin cambios de forma

**Choice**: misma tool sin `execute` que Vexter, dispara cuando la pregunta requiere un dato personal del usuario (categoría real, facturación real) que el sistema no tiene.
**Alternatives considered**: chat completo con `useChat` — descartado por sobre-ingeniería, mismo motivo que en Vexter.
**Rationale**: patrón ya probado, evita reinventar arquitectura de pausa/retomada.

### Decision: Vertex AI con cuenta de servicio scopeada

**Choice**: `@ai-sdk/google-vertex`, rol IAM `roles/aiplatform.user` acotado al proyecto GCP, sin permisos de proyecto amplios.
**Alternatives considered**: API key de Google AI Studio (más simple, pero sin historia de IAM/least-privilege para portfolio).
**Rationale**: demuestra ASI03 (Identity & Privilege Abuse) mitigado por diseño, cierra gap de portfolio GCP/IAM.

### Decision: Vector store — pgvector en Neon, no vector DB dedicada

**Choice**: Postgres + extensión pgvector, free tier.
**Alternatives considered**: Pinecone/Weaviate (mejor DX de vector search, pero suman una dependencia paga o de cuenta nueva sin necesidad para un corpus de ~30 fichas).
**Rationale**: corpus chico, no justifica infra dedicada; reusa el conocimiento de Postgres/Prisma que ya tiene de Vexter.

## Data Flow

    Usuario pregunta
          │
          ▼
    retrieveNormativa(query)  ── pgvector (Neon) ──► top-k fichas + score
          │
          ├── score < umbral (todas) ──► respuesta fija "no tengo info verificada" (NO llama al modelo)
          │
          └── score ≥ umbral ──► inyecta fichas como contexto
                    │
                    ▼
              generateText (Vertex AI Gemini 2.0 Flash)
              tools: [askUser]
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
    responde citando      askUser (pausa) ──► respuesta humana ──► retoma
    la ficha real

## File Changes

| File | Action | Description |
|------|--------|--------------|
| `src/lib/ai/fiscal-assistant.ts` | Create | Motor: `retrieveNormativa` + `runFiscalAssistantStep`, prompt compartido con evals |
| `src/lib/rag/embed.ts` | Create | Wrapper de `text-embedding-004` vía Vertex AI |
| `src/lib/rag/retrieve.ts` | Create | Query pgvector por similitud coseno + umbral configurable |
| `src/lib/rag/ingest.ts` | Create | Script one-off: lee `data/normativa/*.md`, embebe, inserta en Neon |
| `data/normativa/*.md` | Create | Corpus curado (una ficha por archivo = un chunk, sin chunking adicional en MVP) |
| `evals/providers/fiscal-assistant-provider.ts` | Create | Provider Promptfoo, mismo patrón que `invoice-extraction-provider.ts` |
| `evals/promptfooconfig.yaml`, `evals/redteam.yaml` | Create | Evals + redteam (ASI01/ASI09), reusa gotchas de Vexter (auth remota de Promptfoo) |

## Interfaces / Contracts

```typescript
type RetrievalResult = { ficha: string; norma: string; contenido: string; score: number }[]

type FiscalOutcome =
  | { status: 'done'; respuesta: string; fuentesUsadas: string[] }
  | { status: 'needs_input'; question: string; state: SerializedState }
  | { status: 'sin_fuente' } // retrieval vacío, respuesta fija sin llamar al modelo
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit | `retrieveNormativa` — umbral, orden por score, lista vacía | Vitest, mock de pgvector con dataset fijo (mismo patrón que `lookupCliente-org-isolation.test.ts`) |
| Integration | Motor completo con corpus real chico | Vitest + Neon dev DB |
| Evals | Grounding, no-alucinación de fuente, human-in-the-loop | Promptfoo contra Vertex AI real |
| Security | ASI01/ASI09 | `redteam.yaml`, mismo patrón que Vexter Fase 2 |

## Migration / Rollout

No aplica — proyecto greenfield, sin datos previos que migrar.

## Open Questions

- [ ] ¿Cuántas fichas mínimas necesita el corpus para que el MVP sea demostrable? (a definir en tasks, junto con Valentin redactando el contenido)
- [ ] Umbral de similitud exacto — se define empíricamente una vez haya embeddings reales, no a priori
