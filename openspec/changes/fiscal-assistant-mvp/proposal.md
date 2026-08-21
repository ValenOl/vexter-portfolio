# Proposal: Asistente Fiscal MVP (monotributistas)

## Intent

Portfolio técnico para búsqueda laboral en roles de AI Evals + Agent Security. Un agente que responde dudas fiscales frecuentes de monotributistas argentinos (ej. "¿qué es factura C?", "¿cuándo recategorizo?"), con grounding estricto (RAG) para nunca inventar normativa, human-in-the-loop cuando la pregunta excede lo genérico, y seguridad/evals diseñados desde el día 1, no agregados después. Sin datos transaccionales ni sensibles.

## Scope

### In Scope
- Agente Next.js/TS + Vercel AI SDK, tool calling + `askUser` sin `execute` (patrón Vexter)
- RAG sobre corpus curado a mano (~15-30 fichas de normativa AFIP/ARCA)
- Provider: Vertex AI (Gemini 2.0 Flash + `text-embedding-004`) vía `@ai-sdk/google-vertex`, cuenta de servicio con IAM scopeado (least-privilege)
- Vector store: pgvector en Neon (tier gratis)
- Evals con Promptfoo (mismo patrón que Vexter Fase 1)
- Redteam OWASP Agentic 2026, prioridad ASI01/ASI09 (mismo patrón que Vexter Fase 2)

### Out of Scope (diferido)
- Scraping automatizado de AFIP/ARCA (corpus queda manual para el MVP)
- Autenticación de usuarios / multi-tenant (sin datos sensibles, no hace falta todavía)
- LangGraph.js u otro framework de orquestación (se evaluó, se descarta para v1, Valentin arranca en cero ahí)
- Deploy a producción con dominio propio

## Approach

Reusar la arquitectura ya validada en Vexter: función pura de extracción/tool calling compartida entre app y evals, scope resuelto server-side, prompt único como fuente de verdad. La novedad es la capa de RAG (retrieval antes del prompt) y el provider Vertex AI en vez de Vercel AI Gateway/OpenAI directo.

## Affected Areas

| Area | Impact | Description |
|------|--------|--------------|
| `src/lib/ai/fiscal-assistant.ts` | New | Motor de tool calling + RAG |
| `src/lib/rag/` | New | Ingesta, chunking, embeddings, retrieval |
| `data/normativa/` | New | Corpus curado (fichas markdown) |
| `evals/` | New | Promptfoo, evals + `redteam.yaml` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Corpus desactualizado vs. normativa real | Medium | Fecha de corte visible en el producto |
| Presupuesto GCP ($10) excedido | Low | Gemini 2.0 Flash free tier cubre desarrollo |
| Golden dataset sintético, no de bugs reales | Medium | Curar casos deliberadamente, no improvisar |

## Rollback Plan

Todo vive en una rama nueva de un repo sin `git init` todavía, revertir es borrar el directorio o resetear la rama, sin impacto en Vexter ni en ningún sistema en producción.

## Dependencies

- Cuenta de servicio GCP con IAM scopeado para Vertex AI
- Proyecto Neon (Postgres + pgvector) en tier gratis

## Success Criteria

- [x] Agente responde preguntas del golden dataset citando la ficha de normativa correcta, verificado, evals reales 5/5
- [x] `askUser` dispara ante ambigüedad, nunca inventa un dato fiscal, verificado; el redteam encontró 2 casos donde SÍ fabricaba bajo prompt injection, cerrados con guardrail de código
- [ ] Evals corriendo en CI, **NO cumplido**: corren manual (`npx promptfoo eval`), sin pipeline de GitHub Actions todavía
- [x] Redteam corrido con hallazgos documentados (mismo estándar que Vexter Fase 2), `redteam-report.md`, 2 vulnerabilidades reales encontradas y cerradas
