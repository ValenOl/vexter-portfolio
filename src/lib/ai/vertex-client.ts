import { createVertex } from '@ai-sdk/google-vertex'

// Config compartida entre embed.ts y fiscal-assistant.ts. En local, la auth
// se resuelve vía GOOGLE_APPLICATION_CREDENTIALS (path a un archivo JSON de
// service account) -- funciona porque hay filesystem persistente. En
// Vercel (serverless) no hay ese filesystem, así que ahí se usa
// GOOGLE_APPLICATION_CREDENTIALS_JSON (el contenido del JSON como string)
// pasado directo como `credentials` -- si no está seteada, cae al
// comportamiento default de google-auth-library (el path), sin romper local.
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON

export const vertex = createVertex({
  project: process.env.GOOGLE_VERTEX_PROJECT,
  location: process.env.GOOGLE_VERTEX_LOCATION ?? 'us-central1',
  ...(credentialsJson
    ? { googleAuthOptions: { credentials: JSON.parse(credentialsJson) } }
    : {}),
})
