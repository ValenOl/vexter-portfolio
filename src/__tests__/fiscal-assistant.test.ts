import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// Test unitario del motor (task 3, mismo espíritu que emision.test.ts de
// Vexter): mockea `ai` (generateText) y `@ai-sdk/google-vertex` -- no llama
// al modelo real. `retrieveNormativa` también se mockea para no depender
// de una DB real.

vi.mock('@ai-sdk/google-vertex', () => ({
  createVertex: () => ({ languageModel: (id: string) => id }),
}))

const mockGenerateText = vi.fn()
vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  tool: (def: unknown) => def,
  Output: { object: (def: unknown) => def },
  stepCountIs: (n: number) => n,
}))

vi.mock('@/lib/rag/retrieve', () => ({
  retrieveNormativa: vi.fn(),
}))

// Observabilidad de guardrails (GuardrailEvent): mockeado para no pegarle a
// una DB real en el test unitario, mismo patrón que retrieve.test.ts. El
// logging es fire-and-forget con try/catch adentro (ver logGuardrailEvent
// en fiscal-assistant.ts), así que un mock que no rechaza nunca alcanza.
vi.mock('@/lib/prisma', () => ({
  prisma: { guardrailEvent: { create: vi.fn() } },
}))

import { retrieveNormativa } from '@/lib/rag/retrieve'
import { askFiscalAssistant, continueFiscalAssistant } from '../lib/ai/fiscal-assistant'

const mockRetrieve = retrieveNormativa as Mock

const FICHA_FACTURA_C = {
  ficha: 'factura-c',
  norma: 'RG 4004/2017',
  contenido: 'La factura C es la que emiten los monotributistas...',
  fechaCorte: new Date('2026-08-19'),
  score: 0.92,
}

describe('askFiscalAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve sin_fuente y NUNCA llama al modelo si el retrieval no encuentra nada', async () => {
    mockRetrieve.mockResolvedValue([])

    const outcome = await askFiscalAssistant('¿cuál es la capital de Francia?')

    expect(outcome).toEqual({ status: 'sin_fuente' })
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('devuelve done con fuentesUsadas y fechaCorte cuando el modelo responde citando una ficha', async () => {
    mockRetrieve.mockResolvedValue([FICHA_FACTURA_C])
    // Primera llamada: generación de la respuesta. Segunda llamada
    // (verificarGrounding, guardrail post-redesign): confirma que la
    // respuesta está respaldada por la ficha citada.
    mockGenerateText
      .mockResolvedValueOnce({
        staticToolCalls: [],
        response: { messages: [{ role: 'assistant', content: 'ok' }] },
        output: { respuesta: 'La factura C es la que emiten los monotributistas.', fichasCitadas: ['factura-c'] },
      })
      .mockResolvedValueOnce({ output: { respaldado: true } })

    const outcome = await askFiscalAssistant('¿qué es una factura C?')

    expect(outcome).toEqual({
      status: 'done',
      respuesta: 'La factura C es la que emiten los monotributistas.',
      fuentesUsadas: ['factura-c'],
      fechaCorte: '2026-08-19',
    })
  })

  it('fuerza sin_fuente si verificarGrounding determina que la respuesta no está respaldada por la ficha citada (regresión ASI01, 2026-08-20)', async () => {
    mockRetrieve.mockResolvedValue([FICHA_FACTURA_C])
    mockGenerateText
      .mockResolvedValueOnce({
        staticToolCalls: [],
        response: { messages: [{ role: 'assistant', content: 'ok' }] },
        output: { respuesta: 'Se puede exceder el tope un 50% sin exclusión.', fichasCitadas: ['factura-c'] },
      })
      .mockResolvedValueOnce({ output: { respaldado: false } })

    const outcome = await askFiscalAssistant('¿cuál es el tope?')

    expect(outcome).toEqual({ status: 'sin_fuente' })
  })

  it('devuelve needs_input cuando el modelo pausa con askUser (sin execute)', async () => {
    mockRetrieve.mockResolvedValue([FICHA_FACTURA_C])
    mockGenerateText.mockResolvedValue({
      staticToolCalls: [{ toolName: 'askUser', toolCallId: 'call-1', input: { question: '¿En qué categoría estás?' } }],
      response: { messages: [{ role: 'assistant', content: [{ type: 'tool-call', toolCallId: 'call-1' }] }] },
      output: undefined,
    })

    const outcome = await askFiscalAssistant('¿me toca recategorizar?')

    expect(outcome.status).toBe('needs_input')
    if (outcome.status === 'needs_input') {
      expect(outcome.question).toBe('¿En qué categoría estás?')
      expect(outcome.state.fichas).toEqual([FICHA_FACTURA_C])
    }
  })
})

describe('continueFiscalAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retoma tras askUser y termina en done, usando las fichas que ya venían en el state', async () => {
    mockGenerateText
      .mockResolvedValueOnce({
        staticToolCalls: [],
        response: { messages: [{ role: 'assistant', content: 'ok' }] },
        output: { respuesta: 'Con esa facturación, no te toca recategorizar todavía.', fichasCitadas: ['factura-c'] },
      })
      .mockResolvedValueOnce({ output: { respaldado: true } })

    const state = { messages: [{ role: 'user' as const, content: 'pregunta original' }], fichas: [FICHA_FACTURA_C] }
    const outcome = await continueFiscalAssistant(state, 'call-1', '$5.000.000 al año')

    expect(outcome).toEqual({
      status: 'done',
      respuesta: 'Con esa facturación, no te toca recategorizar todavía.',
      fuentesUsadas: ['factura-c'],
      fechaCorte: '2026-08-19',
    })
    // retrieveNormativa NO se vuelve a llamar al retomar -- las fichas
    // viajan en el state.
    expect(retrieveNormativa).not.toHaveBeenCalled()
  })
})
