# Evals — Asistente Fiscal

## Antes de correr esto

Ninguno de estos comandos va a funcionar todavía. Bloqueos reales, no hipotéticos:

1. **No hay `DATABASE_URL`** — falta la tarea 1.1 (Neon + pgvector), ver `openspec/changes/fiscal-assistant-mvp/infra-setup-manual.md`.
2. **El corpus no está ingestado** — una vez que exista la DB, correr `npx tsx src/lib/rag/ingest.ts` primero.
3. **Faltan las credenciales de Vertex AI** — tarea 1.2, mismo doc de arriba.
4. **`indirect-prompt-injection` (el plugin de redteam más relevante) exige el servicio remoto de Promptfoo** — no tiene versión local, sin importar la config. Confirmado en `~/.promptfoo/` que todavía no hay login guardado. Para desbloquearlo: correr `npx promptfoo auth login` en una terminal real (no funciona vía automatización sin TTY, ya confirmado).

## Cuando esté todo resuelto

```bash
# Evals normales
npx promptfoo eval -c promptfooconfig.yaml

# Redteam (sin indirect-prompt-injection hasta resolver el login)
npx promptfoo redteam run -c redteam.yaml

# Redteam completo (con indirect-prompt-injection), una vez logueado
npx promptfoo redteam run -c redteam.yaml
```

Documentar los hallazgos del redteam en `openspec/changes/fiscal-assistant-mvp/redteam-report.md` (tarea 4.4).
