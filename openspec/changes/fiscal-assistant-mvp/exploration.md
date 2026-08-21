# Exploration: Asistente fiscal informativo para monotributistas argentinos

## Current State

Proyecto greenfield, sin código todavía (`vexter-portfolio` recién inicializado). No hay arquitectura existente que investigar en este repo, así que la exploración se apoya en dos fuentes reales:

1. **Patrones ya validados en Vexter** (`/mnt/c/Users/Vivobook 14/vertex-clone`), tool calling con `createInvoiceParsingTools`, `askUser` sin `execute` para human-in-the-loop, prompt compartido entre app y evals (`buildExtractionPrompt`), scope/tenant resuelto server-side vía `auth()` nunca por parámetro del modelo.
2. **Investigación real de la fuente de datos** (AFIP/ARCA), confirmado vía búsqueda: no existe API pública de normativa. El contenido vive como HTML en `afip.gob.ar/monotributo/ayuda/normativa.asp`, basado en Resolución General 4.309 y modificatorias. Dato relevante para el propio producto: **AFIP se renombró a ARCA** (Agencia de Recaudación y Control Aduanero), un LLM sin grounding puede fácilmente decir "AFIP" con confianza cuando el nombre correcto hoy es ARCA. Es un caso de alucinación por conocimiento desactualizado, útil como caso de estudio real para el proyecto.

## Affected Areas (a crear)

- `src/lib/ai/fiscal-assistant.ts`, motor de tool calling + RAG, mismo patrón que `invoice-extraction.ts` de Vexter (función pura, sin `"use server"`, compartida entre app y evals)
- `src/lib/rag/`, ingesta, chunking, embeddings, retrieval sobre el corpus de normativa
- `data/normativa/`, corpus curado (ver Approaches, opción recomendada)
- `evals/`, Promptfoo, mismo patrón que Vexter (provider custom que llama al motor real)
- `evals/redteam.yaml`, mismo patrón que se armó en Vexter Fase 2

## Approaches

### Fuente de datos para el RAG

1. **Corpus curado a mano** (Valentin escribe/compila ~15-30 fichas temáticas en markdown, citando la RG/norma real), Recomendado
   - Pros: cero riesgo de scraping (sitio de gobierno, sin ToS de scraping claros), control total de calidad de los chunks (embeddings buenos dependen de chunks buenos), demuestra criterio propio de curaduría (buena historia de entrevista: "elegí qué información es correcta y verificable, no hice scraping ciego"), reusa el conocimiento de dominio que ya tiene de Vexter
   - Cons: corpus chico al principio, requiere trabajo manual de investigación/redacción
   - Esfuerzo: Medio

2. **Scraping del sitio de ayuda de AFIP/ARCA**
   - Pros: corpus más grande automáticamente
   - Cons: sitio de gobierno, estructura HTML puede cambiar sin aviso, riesgo legal/ToS no confirmado, contenido de "ayuda" no siempre es el texto normativo formal, mayor complejidad para un MVP de portfolio
   - Esfuerzo: Alto

3. **Híbrido**: arrancar con corpus curado (opción 1) para el MVP, dejar el scraping documentado como "próximo paso" no implementado
   - Pros: mejor de ambos, sin comprometerse al riesgo de scraping para la versión de portfolio
   - Esfuerzo: Medio (igual a la opción 1, con nota de extensión futura)

### Vector store (dado el presupuesto de $10 en GCP)

1. **pgvector en Neon/Supabase (tier gratis)**, Recomendado para un MVP con intención de deploy real
   - Pros: gratis, persistente, mismo motor relacional que ya conoce (Vexter usa Prisma/Postgres), fácil de mostrar en el repo
   - Cons: una dependencia más para levantar

2. **Vector store en memoria (sin DB)**, más simple para desarrollo local puro
   - Pros: cero infra, arranca en minutos
   - Cons: no sobrevive a un restart, no sirve para el deploy final del portfolio

### Modelo / embeddings

- **Gemini 2.0 Flash** (gratis, tier generoso) para generación, confirmado como opción viable para desarrollo sin gastar el crédito de GCP.
- **`text-embedding-004`** (Gemini embeddings) para el RAG, mismo proveedor, evita mezclar cuentas/keys.

## Recommendation

MVP con: corpus curado a mano (opción 1 de fuente de datos) + pgvector en Neon free tier + Gemini 2.0 Flash + `text-embedding-004`. Arquitectura de tool calling calcada del patrón ya probado en Vexter (`askUser` sin `execute`, scope resuelto server-side, prompt compartido con evals). Esto prioriza tener un MVP funcional, evaluable y con redteam corrido ANTES de invertir tiempo en scraping, que puede sumarse después como v2 sin romper nada de lo ya construido.

## Risks

- El corpus curado a mano puede quedar desactualizado si la normativa cambia (mismo riesgo que cualquier sistema RAG con fuente estática), mitigar documentando fecha de corte del corpus, visible en el propio producto.
- Sin datos reales de usuarios (a propósito, por diseño, dominio no sensible), los evals van a depender de casos sintéticos bien pensados, no de bugs reales encontrados en producción como pasó en Vexter, hay que ser más deliberado armando el golden dataset inicial.
- Presupuesto de $10 en GCP es ajustado si en algún momento se sube de tier, mientras se use el free tier de Gemini para desarrollo, no debería tocarse.

## Ready for Proposal

Sí. Hay dirección clara de stack, fuente de datos y arquitectura. Recomiendo pasar a `sdd-propose` con nombre de change `fiscal-assistant-mvp`.
