'use client'

import { useState } from 'react'
import { askFiscalAssistantAction, continueFiscalAssistantAction } from './actions/fiscal-assistant'
import type { FiscalOutcome, SerializedState } from '@/lib/ai/fiscal-assistant'

// UI mínima (task 3.4): input de pregunta, muestra respuesta + fecha de
// corte, o el paso de clarificación si el agente pausó con askUser --
// mismo espíritu que el wizard de EmissionForm.tsx en Vexter, pero sin
// los pasos de facturación (acá no hay nada que emitir).

type WizardState =
  | { step: 'pregunta' }
  | { step: 'clarify'; question: string; toolCallId: string; state: SerializedState }
  | { step: 'resultado'; outcome: FiscalOutcome }

export default function Home() {
  const [wizard, setWizard] = useState<WizardState>({ step: 'pregunta' })
  const [pregunta, setPregunta] = useState('')
  const [respuestaClarify, setRespuestaClarify] = useState('')
  const [loading, setLoading] = useState(false)

  async function handlePreguntar() {
    if (!pregunta.trim()) return
    setLoading(true)
    const outcome = await askFiscalAssistantAction(pregunta)
    setLoading(false)

    if (outcome.status === 'needs_input') {
      setWizard({ step: 'clarify', question: outcome.question, toolCallId: outcome.toolCallId, state: outcome.state })
    } else {
      setWizard({ step: 'resultado', outcome })
    }
  }

  async function handleResponderClarify() {
    if (wizard.step !== 'clarify' || !respuestaClarify.trim()) return
    setLoading(true)
    const outcome = await continueFiscalAssistantAction(wizard.state, wizard.toolCallId, respuestaClarify)
    setLoading(false)
    setRespuestaClarify('')

    if (outcome.status === 'needs_input') {
      setWizard({ step: 'clarify', question: outcome.question, toolCallId: outcome.toolCallId, state: outcome.state })
    } else {
      setWizard({ step: 'resultado', outcome })
    }
  }

  function handleReiniciar() {
    setPregunta('')
    setRespuestaClarify('')
    setWizard({ step: 'pregunta' })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-16 font-sans">
      <div>
        <h1 className="text-2xl font-semibold">Asistente fiscal — Monotributo</h1>
        <p className="mt-1 text-sm text-gray-500">
          Portfolio piece — respuestas grounded en un corpus curado, no un asesor real. Ante dudas reales, consultá con
          un contador.
        </p>
      </div>

      {wizard.step === 'pregunta' && (
        <div className="flex flex-col gap-3">
          <textarea
            className="min-h-24 rounded border border-gray-300 p-3"
            placeholder="Ej: ¿qué es una factura C?"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
          />
          <button
            className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            onClick={handlePreguntar}
            disabled={loading || !pregunta.trim()}
          >
            {loading ? 'Consultando…' : 'Preguntar'}
          </button>
        </div>
      )}

      {wizard.step === 'clarify' && (
        <div className="flex flex-col gap-3 rounded border border-amber-300 bg-amber-50 p-4">
          <p className="font-medium">{wizard.question}</p>
          <input
            className="rounded border border-gray-300 p-2"
            value={respuestaClarify}
            onChange={(e) => setRespuestaClarify(e.target.value)}
            placeholder="Tu respuesta"
          />
          <button
            className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            onClick={handleResponderClarify}
            disabled={loading || !respuestaClarify.trim()}
          >
            {loading ? 'Enviando…' : 'Responder'}
          </button>
        </div>
      )}

      {wizard.step === 'resultado' && (
        <div className="flex flex-col gap-3">
          {wizard.outcome.status === 'sin_fuente' && (
            <p className="rounded border border-gray-300 p-4 text-gray-700">
              No tengo información verificada sobre esa pregunta en mi corpus curado. Consultá con un contador.
            </p>
          )}
          {wizard.outcome.status === 'done' && (
            <div className="rounded border border-gray-300 p-4">
              <p>{wizard.outcome.respuesta}</p>
              <p className="mt-3 text-xs text-gray-500">
                Fuentes: {wizard.outcome.fuentesUsadas.join(', ') || '—'} · Corpus verificado al{' '}
                {wizard.outcome.fechaCorte}
              </p>
            </div>
          )}
          <button className="self-start text-sm text-gray-500 underline" onClick={handleReiniciar}>
            Hacer otra pregunta
          </button>
        </div>
      )}
    </main>
  )
}
