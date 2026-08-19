import { askFiscalAssistant, continueFiscalAssistant, type FiscalOutcome } from '../../src/lib/ai/fiscal-assistant'

// Provider custom de Promptfoo -- mismo patrón que
// invoice-extraction-provider.ts de Vexter: en vez de que Promptfoo le
// hable directo al modelo, le pasamos el control al motor REAL
// (askFiscalAssistant), para evaluar el prompt, el retrieval y las tools
// reales, no una recreación aparte que se puede desincronizar.
//
// A diferencia de Vexter, acá NO se stubea nada -- retrieveNormativa es
// una consulta de solo lectura a la DB (sin costo, sin efectos
// secundarios como ARCA), así que el eval prueba el RAG real de punta a
// punta. Requiere DATABASE_URL + corpus ingestado (ver evals/README.md).

interface ProviderContext {
  vars?: Record<string, unknown>
}

export default class FiscalAssistantProvider {
  id() {
    return 'fiscal-assistant-provider'
  }

  async callApi(rawText: string, context?: ProviderContext) {
    // Igual que en Vexter: si el test case define answerIfAsked, simulamos
    // que el humano contesta eso cuando el modelo pause con askUser, para
    // poder evaluar el ciclo completo (pregunta -> respuesta -> resultado
    // final). Si no se define, la pausa queda tal cual -- útil para evals
    // que solo verifican QUE preguntó.
    const answerIfAsked = (context?.vars?.answerIfAsked as string | undefined) ?? null

    let outcome: FiscalOutcome = await askFiscalAssistant(rawText)

    let guard = 0
    while (outcome.status === 'needs_input' && answerIfAsked !== null && guard < 3) {
      guard++
      outcome = await continueFiscalAssistant(outcome.state, outcome.toolCallId, answerIfAsked)
    }

    // Promptfoo espera un objeto con "output" -- se deja el FiscalOutcome
    // completo (no un string) para que las assertions puedan chequear
    // campos puntuales (ej: outcome.fuentesUsadas, outcome.status).
    return { output: outcome }
  }
}
