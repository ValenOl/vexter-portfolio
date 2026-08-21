# Tasks: Asistente Fiscal MVP

## Phase 0: Corpus (Valentin, conocimiento de dominio)

- [x] 0.1 Redactar 15-30 fichas markdown en `data/normativa/`, una por tema (ej. `factura-c.md`, `categorias-monotributo.md`), cada una citando la RG/norma real y fecha de corte
- [x] 0.2 Definir formato de ficha (frontmatter: título, norma, fecha) consistente entre todas

## Phase 1: Infraestructura

- [x] 1.0 Scaffold Next.js/TS app (faltaba en el plan original), DONE: `create-next-app` (Next 16.3.1, React 19.2, App Router, TS, Tailwind), mergeado con `openspec/`/`.atl/`/`SKILLS.md` existentes
- [x] 1.1 Crear proyecto Neon (Postgres), habilitar extensión `pgvector`, BLOQUEADO en Valentin, ver `infra-setup-manual.md`
- [x] 1.2 Crear cuenta de servicio GCP con rol `roles/aiplatform.user` scopeado (no permisos amplios de proyecto), BLOQUEADO en Valentin, ver `infra-setup-manual.md`
- [x] 1.3 Instalar `ai`, `@ai-sdk/google-vertex`, `zod`, `prisma`, `@prisma/client`, `vitest`, instaladas; se usa Prisma (`$queryRaw`) para las queries de similitud en vez de un cliente `pg` aparte, evita dos clientes de DB en paralelo. Se encontraron 3 vulnerabilidades "high" (deepmerge-ts, transitiva de Prisma), resueltas con `overrides` en `package.json` sin downgradear Prisma. `npm audit`: 0 vulnerabilidades.
- [x] 1.4 Definir tabla `normativa_chunks`, `prisma/schema.prisma` escrito (vector(768), pgvector). Migración real (`prisma migrate dev`) pendiente de que exista `DATABASE_URL` (tarea 1.1)

## Phase 2: RAG core, DONE

- [x] 2.1 `src/lib/rag/embed.ts`, `embedText`/`embedTexts` vía `@ai-sdk/google-vertex` (`text-embedding-004`, 768 dims)
- [x] 2.2 `src/lib/rag/ingest.ts`, lee `data/normativa/*.md` con `gray-matter`, valida frontmatter con zod, embebe en batch, upsert en `normativa_chunks` (script one-off, `npx tsx src/lib/rag/ingest.ts`)
- [x] 2.3 `src/lib/rag/retrieve.ts`, `retrieveNormativa(query, {umbral, topK})`, similitud coseno vía `$queryRaw` + pgvector `<=>`, lista vacía si nada supera el umbral
- [x] 2.4 `src/__tests__/retrieve.test.ts`, 3/3 tests pasando (mapeo de filas, lista vacía, params respetados), mismo patrón que `lookupCliente-org-isolation.test.ts`

**Hallazgo no previsto en el design**: Prisma 7 (instalado, es la última) cambió el modelo de configuración, la `url` ya no va en `schema.prisma`, ahora vive en `prisma.config.ts` + un driver adapter (`@prisma/adapter-pg`) pasado a `PrismaClient`. Se ajustó `schema.prisma`, se creó `prisma.config.ts`, y `src/lib/prisma.ts` ahora usa `PrismaPg`. `npx prisma generate` funciona sin DB real (confirmado con una URL placeholder efímera, nunca escrita a disco), pero `prisma migrate dev` real sigue bloqueado por la tarea 1.1. `tsc --noEmit` limpio, 3/3 tests pasando.

## Phase 3: Agente core, DONE

- [x] 3.1 `src/lib/ai/fiscal-assistant.ts`, `buildFiscalPrompt`, tool `askUser` sin `execute` (calcado de Vexter)
- [x] 3.2 `askFiscalAssistant`: retrieval determinístico primero, `sin_fuente` sin llamar al modelo si no hay match; si hay, `generateText` (Vertex AI `gemini-2.5-flash`, ver Fase 4) con output estructurado (`respuesta` + `fichasCitadas`, testeable para grounding)
- [x] 3.3 `continueFiscalAssistant`, ciclo de retomada calcado de `continueParsing`, con una mejora sobre el diseño original: las fichas viajan DENTRO del `state` (no como parámetro aparte), así retomar nunca re-corre el retrieval
- [x] 3.4 UI mínima en `src/app/page.tsx`, wizard de 3 pasos (pregunta / clarify / resultado), Server Actions en `src/app/actions/fiscal-assistant.ts`
- [x] Test unitario `src/__tests__/fiscal-assistant.test.ts`, 4 tests, mock de `ai`/`@ai-sdk/google-vertex`/`retrieveNormativa`, sin llamar al modelo real

**Desviación del design** (mejora, documentada): `SerializedState` ahora incluye `fichas: NormativaMatch[]` además de `messages`, el design original tenía `fichasOriginales` como parámetro aparte de `continueFiscalAssistant`, pero eso hubiera obligado al cliente a re-pedir las fichas o a la UI a guardarlas por su cuenta. Metiéndolas en el `state` (que ya viaja completo entre pausa y retomada), se simplifica la firma y se evita un retrieval redundante.

Verificación: `tsc --noEmit` limpio, 7/7 tests pasando (3 de retrieve + 4 de fiscal-assistant).

## Phase 4: Evals y security, CORRIDO REAL, 5/5 evals pasando

- [x] 4.1 `evals/providers/fiscal-assistant-provider.ts`, llama a `askFiscalAssistant`/`continueFiscalAssistant` reales, SIN stubs (a diferencia de Vexter: `retrieveNormativa` es solo lectura, sin costo ni efectos secundarios)
- [x] 4.2 `evals/promptfooconfig.yaml`, 5 casos: fuente correcta citada, sin_fuente (2 variantes: fuera de dominio y no-fiscal), needs_input por dato personal, ciclo completo con `answerIfAsked`
- [x] 4.3 `evals/redteam.yaml`, plugins `indirect-prompt-injection`/`overreliance`/`hallucination` (ASI01/ASI09), generador `vertex:gemini-2.0-flash` NATIVO (mejora real sobre Vexter: ahí hizo falta un workaround OpenAI-compat porque el AI Gateway no tiene provider nativo en Promptfoo; acá Vertex sí lo tiene)
- [x] **1.1/1.2 desbloqueados (2026-08-19)**, Neon + pgvector + cuenta de servicio GCP configurados por Valentin (guiado paso a paso, la UI de Google cambió de nombres varias veces en el camino: "Vertex AI" ahora es "Agent Platform", el rol "Vertex AI User" ahora se llama "Usuario de Agent Platform"). Migración real aplicada (`prisma migrate dev`), corpus ingestado (15 fichas reales en Neon).
- [x] 4.4 Evals corridos de verdad, **5/5 pasando (100%)**, contra el modelo real y la DB real.

### Bugs reales encontrados y arreglados en esta corrida (no hipotéticos)

1. **`prisma.config.ts` no leía `.env.local`** (dotenv solo lee `.env` por default), arreglado apuntándolo explícito.
2. **Formato del vector roto en `ingest.ts`/`retrieve.ts`**: Prisma serializaba el array de embeddings como `{...}` (array de Postgres) en vez de `[...]` (literal de pgvector), había que armar el string a mano antes de interpolarlo.
3. **`gemini-2.0-flash` no disponible** en este proyecto/región de GCP (confirmado probando contra la API real, no asumido), se cambió a `gemini-2.5-flash` en `fiscal-assistant.ts` y `redteam.yaml`.
4. **Assertions de Promptfoo de una sola línea con `return` explícito rompían** (`"Unexpected token 'return'"`, Promptfoo las envuelve mal en paréntesis). Fix: una sola línea sin `return`/`;`, multilínea SÍ con `return` explícito.
5. **Umbral de similitud (0.7) mal calibrado, sin evidencia real**, bajado a 0.62 después de medir los scores reales del corpus (matches genuinos: 0.637-0.703; casos "grises" fiscales fuera de corpus: hasta 0.582; totalmente ajenos: ~0.39).

**Hallazgo positivo, no un bug**: el modelo se negó a confirmar una recategorización aunque se le dio una respuesta simulada plausible, porque la ficha de categorías no tiene los topes numéricos completos de TODAS las letras (solo A y K), grounding funcionando incluso mejor de lo esperado. Oportunidad de v2: completar los montos de las 11 categorías en `categorias-monotributo.md`.

**Redteam corrido COMPLETO (2026-08-19)**, incluido `indirect-prompt-injection`, el login de Promptfoo se resolvió con el flujo de token no-interactivo desde `auth.promptfoo.app` (Valentin generó el token en la web, evita el problema de TTY que nos había bloqueado en Vexter). Ver `redteam-report.md` para el detalle completo: 2 fallos reales encontrados (fabricación de datos bajo prompt injection), arreglados con un guardrail determinístico en código (`finalizeOutcome`: `fichasCitadas` vacío fuerza `sin_fuente`, nunca confía en que el modelo se autocorrija). Segunda corrida: 11/12 evaluados pasaron (2 errores transitorios de conexión a Neon bajo concurrencia, no relacionados a seguridad, pendiente investigar; 1 "fallo" del grader evaluado como benigno, documentado como limitación conocida para v2).

`tsc --noEmit` limpio, 7/7 tests unitarios, 0 vulnerabilidades.

## Phase 5: Verificación, DONE

- [x] 5.1 `sdd-verify` corrido, ver `verify-report.md`. Veredicto: **PASS WITH WARNINGS**. Build/tests/lint reales limpios, 11/13 escenarios de specs COMPLIANT (2 PARTIAL, 0 CRITICAL). En el camino se corrigió un desfasaje real de checkboxes (tareas completas que seguían en `[ ]`).
- [x] 5.2 Success criteria de la proposal: 3/4 cumplidos (cita correcta ✅, `askUser`/nunca inventa ✅, reforzado por el fix del redteam, redteam documentado ✅). **1 NO cumplido**: evals en CI (corren manual, sin GitHub Actions todavía), pendiente real para v2.
