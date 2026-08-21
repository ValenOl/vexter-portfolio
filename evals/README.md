# Evals, Asistente Fiscal

## Cómo correrlos localmente

Requiere `DATABASE_URL` (Neon + pgvector, corpus ya ingestado con
`npx tsx src/lib/rag/ingest.ts`) y credenciales de Vertex AI
(`GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_VERTEX_PROJECT`) en `.env.local`.

```bash
# Evals normales (batería funcional, corre contra RAG + Vertex AI reales)
npm run eval
# equivale a: npx promptfoo eval -c evals/promptfooconfig.yaml

# Redteam (sin indirect-prompt-injection hasta resolver el login)
npx promptfoo redteam run -c evals/redteam.yaml
```

Documentar los hallazgos del redteam en `openspec/changes/fiscal-assistant-mvp/redteam-report.md` (tarea 4.4).

## CI

La batería de evals (`npm run eval`) corre automáticamente en GitHub
Actions en cada push a `main` (job `evals` en `.github/workflows/ci.yml`),
además de poder dispararse a mano vía `workflow_dispatch`. No corre en
pull requests (los forks no tienen acceso a los secrets del repo, así
que ejecutarla ahí solo generaría fallos ruidosos); el job `test`
(lint, typecheck, build, vitest) sí corre en cada PR.

Para que el job `evals` pase, hay que cargar estos tres secrets en
`Settings → Secrets and variables → Actions` del repo de GitHub:

| Secret | De dónde sale |
| --- | --- |
| `DATABASE_URL` | Connection string de Neon (dashboard de Neon → el proyecto → Connection Details) |
| `GOOGLE_VERTEX_PROJECT` | El project id de GCP (consola de GCP, o `gcloud config get-value project`) |
| `GOOGLE_VERTEX_CREDENTIALS_JSON` | El contenido completo del JSON de la service account de Vertex AI (la misma que ya se usa localmente vía `GOOGLE_APPLICATION_CREDENTIALS` en `.env.local`, abrir ese archivo y pegar el JSON tal cual) |

**El redteam (`evals/redteam.yaml`) sigue siendo manual, no está en CI.**
El plugin `indirect-prompt-injection` exige `promptfoo auth login`
interactivo contra el servicio remoto de Promptfoo, que no tiene
alternativa no-interactiva, no hay forma limpia de automatizarlo en un
runner de CI sin TTY.
