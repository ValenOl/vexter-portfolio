# Skills, vexter-portfolio

Catálogo de las competencias técnicas que este proyecto está pensado para demostrar, y las convenciones concretas para aplicarlas. Vive junto al código (a diferencia de `.atl/skill-registry.md`, que es infraestructura de las skills de Claude Code), pensado para vos, para quien lea el repo, y como referencia directa en entrevistas.

## 1. Tool calling / function calling

**Qué demuestra**: el modelo decide invocar funciones estructuradas en vez de improvisar texto libre para acciones que requieren datos reales.

**Convención**: cada tool vive con su schema tipado (zod), hace UNA cosa, y el scope/tenant (equivalente al `organizationId` de Vexter) se resuelve del lado del servidor, nunca de un parámetro que el modelo pueda setear.

## 2. Human-in-the-loop

**Qué demuestra**: el agente pausa y pregunta ante ambigüedad real, en vez de adivinar, patrón `askUser` sin `execute` (ver `vexter_human_in_loop_proposal` en Vexter).

**Convención**: nunca resolver una ambigüedad de negocio por cuenta propia en el código; ante 2+ candidatos o un dato crítico faltante, pausar y ofrecer opciones concretas, no un formulario libre cuando hay opciones discretas.

## 3. RAG / grounding

**Qué demuestra**: el agente responde citando su fuente real (normativa AFIP en este caso), nunca inventa una regla.

**Convención**: cada respuesta que use una fuente debe poder trazarse al documento/chunk de origen. Un eval específico verifica "nunca cita una fuente que no existe", esto es el gap de portfolio (RAG/embeddings/vector DB) que hoy no tengo con evidencia real.

## 4. Evals (Promptfoo)

**Qué demuestra**: testing de propiedades sobre output no-determinístico, no `assert.equal`.

**Convención**: golden dataset creado a partir de casos reales encontrados (no inventado de antemano completo), corre en CI en cada PR. Ver el [[evals_checklist]] de 7 puntos aplicado en Vexter, se aplica igual acá.

## 5. AI Agent Security (OWASP Agentic Top 10, 2026)

**Qué demuestra**: red-teaming activo contra el propio agente, guardrails de diseño, no reactivos.

**Convención**: cada tool nueva se evalúa contra el mapeo ASI01-10 antes de mergear (ver el trabajo de Fase 2 hecho en Vexter). Vectores prioritarios acá: ASI01 (goal hijack vía contenido no confiable) y ASI09 (trust exploitation), el usuario nunca debería poder inyectar instrucciones vía una pregunta que hace.

## 6. Stack

Next.js + TypeScript + Vercel AI SDK (mismo patrón que Vexter) + Google Gemini vía GCP (presupuesto acotado, tier gratis) + Promptfoo.

## Cómo se usa este archivo

Antes de escribir una tool o feature nueva, repasar la sección relevante. Al cerrar un change de SDD (`sdd-archive`), chequear que lo implementado sigue estas convenciones, si una se rompió, o esto se actualiza, o el código se corrige.
