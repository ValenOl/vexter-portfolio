# Setup manual — tareas 1.1 y 1.2 (Valentin)

No tengo `gcloud` ni `neon` CLI instalados en este entorno, así que estas 2 tareas las tenés que hacer vos. Son 10-15 minutos en total.

## 1.1 — Neon (Postgres + pgvector)

1. Entrá a [neon.tech](https://neon.tech), creá cuenta/proyecto nuevo (tier gratis).
2. Nombre sugerido de proyecto: `vexter-portfolio` o `fiscal-assistant`.
3. Una vez creado, andá a **SQL Editor** del proyecto y corré:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copiá el **Connection String** (pestaña "Connection Details", con el pooler activado) — algo como:
   ```
   postgresql://usuario:password@ep-xxxx.neon.tech/neondb?sslmode=require
   ```
5. Pegalo en un `.env.local` nuevo en `vexter-portfolio/` como:
   ```
   DATABASE_URL="postgresql://..."
   ```
   (Este `.env.local` no lo toco yo directo, mismo criterio que con Vexter — si necesito confirmar algo de ahí, te aviso y lo hacés vos.)

## 1.2 — Cuenta de servicio GCP con IAM scopeado (Vertex AI)

1. Andá a [console.cloud.google.com](https://console.cloud.google.com) → tu proyecto (el que tiene los $10 de crédito).
2. **IAM & Admin → Service Accounts → Create Service Account**.
3. Nombre sugerido: `fiscal-assistant-vertex`.
4. En el paso de rol, asigná **únicamente**: `Vertex AI User` (`roles/aiplatform.user`) — NO le des `Editor` ni `Owner` del proyecto. Esto es a propósito (ver `design.md`, Decision "Vertex AI con cuenta de servicio scopeada" — es tu evidencia real de least-privilege para portfolio).
5. Una vez creada, entrá a la cuenta de servicio → **Keys → Add Key → JSON** — se descarga un archivo `.json`.
6. Guardá ese archivo FUERA del repo (ej. en tu carpeta de credenciales local), y en `.env.local` agregá:
   ```
   GOOGLE_APPLICATION_CREDENTIALS="/ruta/absoluta/al/archivo.json"
   GOOGLE_VERTEX_PROJECT="tu-project-id-de-gcp"
   GOOGLE_VERTEX_LOCATION="us-central1"
   ```
7. Habilitá la API si todavía no está: **APIs & Services → Enable APIs → "Vertex AI API"**.

## Cuando termines

Avisame y sigo con la Fase 2 (RAG core) — necesito que `DATABASE_URL` exista para poder correr `prisma migrate dev` y generar la migración real de `normativa_chunks`.
