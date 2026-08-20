import { embed, embedMany } from 'ai'
import { vertex } from '../ai/vertex-client'

// Wrapper de text-embedding-004 vía Vertex AI (cuenta de servicio con IAM
// scopeado -- roles/aiplatform.user, ver design.md).

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
