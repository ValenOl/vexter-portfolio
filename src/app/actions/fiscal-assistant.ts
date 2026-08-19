'use server'

import {
  askFiscalAssistant,
  continueFiscalAssistant,
  type FiscalOutcome,
  type SerializedState,
} from '@/lib/ai/fiscal-assistant'

// Wrapper "use server" -- fiscal-assistant.ts NO tiene esta directiva
// (exporta tipos y una función sync, buildFiscalPrompt, que Next.js
// rechazaría en un archivo "use server" -- cada export ahí tiene que ser
// una función async). Mismo motivo que separa invoicing.ts de
// invoice-extraction.ts en Vexter.

export async function askFiscalAssistantAction(pregunta: string): Promise<FiscalOutcome> {
  return askFiscalAssistant(pregunta)
}

export async function continueFiscalAssistantAction(
  state: SerializedState,
  toolCallId: string,
  answer: string
): Promise<FiscalOutcome> {
  return continueFiscalAssistant(state, toolCallId, answer)
}
