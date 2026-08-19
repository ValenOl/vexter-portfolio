import { prisma } from '@/lib/prisma'
import { embedText } from './embed'

// Task 2.3 -- ver design.md, Decision "Retrieval determinístico en código,
// no como tool": esta función corre SIEMPRE antes de invocar al modelo,
// nunca queda a discreción del LLM. Si no hay match sobre el umbral,
// devuelve lista vacía -- quien la llama corta ahí, no llama al modelo.

export interface NormativaMatch {
  ficha: string
  norma: string
  contenido: string
  fechaCorte: Date
  score: number // similitud coseno, 1 = idéntico, 0 = sin relación
}

// Calibrado con datos reales (no adivinado): contra el corpus de 15
// fichas, preguntas genuinamente relevantes puntuaron 0.637-0.703;
// preguntas fiscales pero fuera de corpus (ej. Ingresos Brutos de
// Córdoba, no cubierto) puntuaron hasta 0.582; preguntas totalmente
// ajenas (capital de Francia) puntuaron ~0.39. 0.62 deja margen de
// seguridad de ~0.055 contra el caso "gris" más cercano. Reevaluar si el
// corpus crece mucho -- la separación puede cambiar.
const DEFAULT_UMBRAL = 0.62
const DEFAULT_TOP_K = 3

interface RawMatchRow {
  ficha: string
  norma: string
  contenido: string
  fecha_corte: Date
  distance: number
}

export async function retrieveNormativa(
  query: string,
  { umbral = DEFAULT_UMBRAL, topK = DEFAULT_TOP_K }: { umbral?: number; topK?: number } = {}
): Promise<NormativaMatch[]> {
  const queryEmbedding = await embedText(query)
  // Mismo motivo que en ingest.ts: hay que armar el literal de pgvector
  // ("[...]") a mano, Prisma serializaría un array JS como "{...}".
  const vectorLiteral = `[${queryEmbedding.join(',')}]`

  // pgvector `<=>` es distancia coseno (0 = idéntico, 2 = opuesto).
  // similitud = 1 - distancia. Filtramos en SQL para no traer basura y
  // reordenar en JS -- más eficiente y el índice de pgvector lo aprovecha.
  const rows = await prisma.$queryRaw<RawMatchRow[]>`
    SELECT ficha, norma, contenido, fecha_corte,
           (embedding <=> ${vectorLiteral}::vector) AS distance
    FROM normativa_chunks
    WHERE (1 - (embedding <=> ${vectorLiteral}::vector)) >= ${umbral}
    ORDER BY distance ASC
    LIMIT ${topK}
  `

  return rows.map((row) => ({
    ficha: row.ficha,
    norma: row.norma,
    contenido: row.contenido,
    fechaCorte: row.fecha_corte,
    score: 1 - row.distance,
  }))
}
