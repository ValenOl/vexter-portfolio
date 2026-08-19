import { createVertex } from '@ai-sdk/google-vertex'
import { embed, embedMany } from 'ai'

// Wrapper de text-embedding-004 vía Vertex AI (cuenta de servicio con IAM
// scopeado -- roles/aiplatform.user, ver design.md). Se resuelve
// GOOGLE_APPLICATION_CREDENTIALS/GOOGLE_VERTEX_PROJECT/GOOGLE_VERTEX_LOCATION
// del entorno automáticamente vía el SDK oficial de Google -- no se pasan
// keys sueltas acá.
const vertex = createVertex({
  project: process.env.GOOGLE_VERTEX_PROJECT,
  location: process.env.GOOGLE_VERTEX_LOCATION ?? 'us-central1',
})

// 768 dimensiones -- ver prisma/schema.prisma (Unsupported("vector(768)")).
const embeddingModel = vertex.embeddingModel('text-embedding-004')

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({ model: embeddingModel, value: text })
  return embedding
}

// Usado en la ingesta (2.2): embebe todas las fichas del corpus en batch,
// más eficiente que llamar embedText() una por una.
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({ model: embeddingModel, values: texts })
  return embeddings
}
