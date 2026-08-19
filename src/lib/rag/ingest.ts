import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { embedTexts } from './embed'

// Task 2.2: lee data/normativa/*.md, embebe cada ficha completa (sin
// chunking adicional, ver design.md -- Decision "Vector store"), inserta
// en NormativaChunk. Pensado para correrse como script one-off
// (`npx tsx src/lib/rag/ingest.ts`), no en el request path de la app.

const fichaFrontmatter = z.object({
  titulo: z.string(),
  norma: z.string(),
  fecha_corte: z.string(),
  confianza: z.enum(['alta', 'media']),
  fuente: z.string(),
})

const NORMATIVA_DIR = join(process.cwd(), 'data', 'normativa')

interface ParsedFicha {
  ficha: string // nombre de archivo sin extensión, usado como id único
  norma: string
  fechaCorte: Date
  contenido: string // frontmatter + cuerpo, se embebe completo
}

function readCorpus(): ParsedFicha[] {
  const files = readdirSync(NORMATIVA_DIR).filter((f) => f.endsWith('.md'))

  return files.map((file) => {
    const raw = readFileSync(join(NORMATIVA_DIR, file), 'utf-8')
    const { data, content } = matter(raw)
    const fm = fichaFrontmatter.parse(data) // tira si falta un campo -- mejor fallar acá que silenciar

    return {
      ficha: basename(file, '.md'),
      norma: fm.norma,
      fechaCorte: new Date(fm.fecha_corte),
      // Se embebe el título + contenido, no el frontmatter crudo -- el
      // texto que importa para similitud es el humano-legible.
      contenido: `${fm.titulo}\n\n${content.trim()}`,
    }
  })
}

export async function ingestNormativa(): Promise<{ ingested: number }> {
  const fichas = readCorpus()
  const embeddings = await embedTexts(fichas.map((f) => f.contenido))

  for (let i = 0; i < fichas.length; i++) {
    const ficha = fichas[i]
    // Prisma serializa un array JS interpolado como "{...}" (array de
    // Postgres), no "[...]" (literal de pgvector) -- hay que armar el
    // string del literal a mano y pasarlo como texto plano.
    const vectorLiteral = `[${embeddings[i].join(',')}]`

    await prisma.$executeRaw`
      INSERT INTO normativa_chunks (id, ficha, norma, contenido, fecha_corte, embedding, created_at, updated_at)
      VALUES (gen_random_uuid()::text, ${ficha.ficha}, ${ficha.norma}, ${ficha.contenido}, ${ficha.fechaCorte}, ${vectorLiteral}::vector, now(), now())
      ON CONFLICT (ficha) DO UPDATE SET
        norma = EXCLUDED.norma,
        contenido = EXCLUDED.contenido,
        fecha_corte = EXCLUDED.fecha_corte,
        embedding = EXCLUDED.embedding,
        updated_at = now()
    `
  }

  return { ingested: fichas.length }
}

// Permite correr `npx tsx src/lib/rag/ingest.ts` directo.
if (require.main === module) {
  ingestNormativa()
    .then(({ ingested }) => {
      console.log(`Ingesta completa: ${ingested} fichas.`)
      return prisma.$disconnect()
    })
    .catch((err) => {
      console.error('Error en la ingesta:', err)
      process.exit(1)
    })
}
