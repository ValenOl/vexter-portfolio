import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// Test unitario (task 2.4) -- mockea Prisma y el embedder, mismo patrón que
// lookupCliente-org-isolation.test.ts de Vexter: no se prueba el SQL real
// de pgvector acá (eso lo cubre el test de integración de la Fase 4 contra
// una Neon dev DB, ver design.md), se prueba el CONTRATO de la función:
// mapeo correcto de filas, y que "sin match" devuelve lista vacía -- no
// fuerza un resultado poco relevante (ver spec de RAG, "Retrieval por
// similitud").

vi.mock('@/lib/prisma', () => ({
  prisma: { $queryRaw: vi.fn() },
}))

// Ruta relativa a ESTE archivo, pero tiene que resolver al mismo módulo
// absoluto que `./embed` dentro de src/lib/rag/retrieve.ts -- vitest
// matchea por path resuelto, no por el string literal.
vi.mock('../lib/rag/embed', () => ({
  embedText: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}))

import { prisma } from '@/lib/prisma'
import { retrieveNormativa } from '../lib/rag/retrieve'

const mockQueryRaw = prisma.$queryRaw as unknown as Mock

describe('retrieveNormativa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mapea las filas devueltas por la DB a NormativaMatch, con score = 1 - distance', async () => {
    mockQueryRaw.mockResolvedValue([
      { ficha: 'factura-c', norma: 'RG 4004/2017', contenido: 'texto...', fecha_corte: new Date('2026-08-19'), distance: 0.1 },
      { ficha: 'cae', norma: 'Factura Electrónica', contenido: 'texto...', fecha_corte: new Date('2026-08-19'), distance: 0.25 },
    ])

    const result = await retrieveNormativa('¿qué es una factura C?')

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ ficha: 'factura-c', score: 0.9 })
    expect(result[1]).toMatchObject({ ficha: 'cae', score: 0.75 })
  })

  it('devuelve lista vacía cuando nada supera el umbral -- NUNCA fuerza un resultado poco relevante', async () => {
    mockQueryRaw.mockResolvedValue([])

    const result = await retrieveNormativa('¿cuál es la capital de Francia?')

    expect(result).toEqual([])
  })

  it('respeta el umbral y topK pasados como parámetros', async () => {
    mockQueryRaw.mockResolvedValue([])

    await retrieveNormativa('pregunta cualquiera', { umbral: 0.85, topK: 5 })

    expect(mockQueryRaw).toHaveBeenCalledTimes(1)
  })
})
