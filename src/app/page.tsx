'use client'

import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { askFiscalAssistantAction, continueFiscalAssistantAction } from './actions/fiscal-assistant'
import type { FiscalOutcome, SerializedState } from '@/lib/ai/fiscal-assistant'

// UI (task 3.4, pasada de diseño institucional + motion): mismo wizard de 3
// pasos que antes, con la piel visual de vexter-portfolio (IBM Plex, acento
// navy) y una capa de animación calma (fade + stagger + fondo que respira)
// para que no se sienta soso. El foco de diseño sigue en "clarify" (el
// agente NUNCA asume un dato personal, siempre pregunta) y "sin_fuente"
// (prefiere admitir un límite antes que inventar).

type WizardState =
  | { step: 'pregunta' }
  | { step: 'clarify'; question: string; toolCallId: string; state: SerializedState }
  | { step: 'resultado'; outcome: FiscalOutcome }

const PREGUNTAS_EJEMPLO = ['¿Qué es una factura C?', '¿Cuándo toca recategorizar?', '¿Qué pasa si supero el tope?']

const EASE_CALM = [0.16, 1, 0.3, 1] as const

const stepVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.28, ease: 'easeIn' } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_CALM } },
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      <span className="loading-dot" />
      <span className="loading-dot" style={{ animationDelay: '0.15s' }} />
      <span className="loading-dot" style={{ animationDelay: '0.3s' }} />
    </span>
  )
}

function IconWordmark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="14" height="16" rx="1.5" stroke="var(--brand)" strokeWidth="1.5" />
      <path d="M6.5 7H13.5M6.5 10H13.5M6.5 13H10.5" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-[color:var(--fg-muted)]">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 7.2V11.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="5.1" r="0.9" fill="currentColor" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3.5 8H12.5M12.5 8L8.5 4M12.5 8L8.5 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconPause() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8.3 8.5C8.3 7.1 9.5 6 11 6C12.5 6 13.7 7.1 13.7 8.5C13.7 9.9 12.4 10.2 11.4 10.9C10.9 11.2 10.7 11.6 10.7 12.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="10.9" cy="14.9" r="0.95" fill="currentColor" />
    </svg>
  )
}

function IconCheckShield() {
  return (
    <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
      <path
        d="M11 3L17.5 5.5V10.5C17.5 14.5 14.8 17.6 11 19C7.2 17.6 4.5 14.5 4.5 10.5V5.5L11 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 11L10.2 13.2L14.2 8.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconSearchEmpty() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="9.5" cy="9.5" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 14L18.5 18.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 9.5H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconHash() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M4.5 1.5L3 10.5M9 1.5L7.5 10.5M1.5 4.5H10.5M1.5 7.5H10.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <motion.svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.2, ease: EASE_CALM }}
    >
      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  )
}

const ABOUT_POINTS = [
  {
    label: 'RAG con grounding estricto',
    detail: 'El retrieval corre determinísticamente contra un corpus curado de normativa AFIP/ARCA. Si no encuentra respaldo, el sistema admite el límite en vez de inventar.',
  },
  {
    label: 'Human-in-the-loop',
    detail: 'El asistente nunca asume un dato personal (categoría, facturación real), siempre lo pregunta antes de responder.',
  },
  {
    label: 'Redteam de seguridad real',
    detail: 'Probado contra indirect prompt injection (Promptfoo). Se encontraron 2 vulnerabilidades reales y se cerraron con un guardrail determinístico en código, no un parche de prompt.',
  },
  {
    label: 'CI/CD con evals automáticos',
    detail: 'Tests unitarios + evals funcionales corriendo en GitHub Actions en cada push, no solo checkeados a mano.',
  },
  {
    label: 'Observabilidad de guardrails',
    detail: 'Cada decisión final del asistente queda registrada en Neon: qué guardrail intervino y por qué. Trazas reales, no solo texto en un reporte.',
  },
]

function Shell({ children }: { children: ReactNode }) {
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--bg)]">
      <div className="bg-aurora" aria-hidden />

      <div className="relative z-10 h-[3px] w-full shrink-0 bg-[var(--brand)]" />

      <div className="relative z-10 flex items-center justify-between border-b border-[var(--border)] px-6 py-5 sm:px-14">
        <div className="flex items-center gap-2.5">
          <IconWordmark />
          <span className="text-[15px] font-semibold tracking-tight">Asistente Fiscal</span>
        </div>
        <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] font-semibold tracking-wider text-[color:var(--fg-muted)] uppercase">
          Portfolio
        </span>
      </div>

      <div className="relative z-10 mx-6 mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] sm:mx-14">
        <div className="flex items-start gap-2.5 p-3">
          <IconInfo />
          <p className="flex-1 text-[12.5px] leading-relaxed text-[color:var(--fg-muted)]">
            Portfolio piece, respuestas grounded en un corpus curado, no un asesor real. Ante dudas reales, consultá con
            un contador.
          </p>
          <button
            type="button"
            onClick={() => setAboutOpen((v) => !v)}
            className="flex shrink-0 items-center gap-1 text-[12.5px] font-medium whitespace-nowrap text-[color:var(--brand)] hover:underline"
          >
            ¿Qué es este proyecto?
            <IconChevron open={aboutOpen} />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {aboutOpen && (
            <motion.div
              key="about"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE_CALM }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 border-t border-[var(--border)] p-4">
                <p className="text-[12.5px] leading-relaxed text-[color:var(--fg-muted)]">
                  Pieza de portfolio para mostrar cómo diseño e implemento agentes de IA en producción, no solo que
                  &quot;responden&quot;, sino que son verificables y seguros:
                </p>
                <ul className="flex flex-col gap-2">
                  {ABOUT_POINTS.map((point) => (
                    <li key={point.label} className="text-[12.5px] leading-relaxed text-[color:var(--fg-muted)]">
                      <span className="font-semibold text-[var(--fg)]">{point.label}.</span> {point.detail}
                    </li>
                  ))}
                </ul>
                <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <a
                    href="https://github.com/ValenOl/vexter-portfolio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-fit items-center gap-1.5 text-[12.5px] font-semibold text-[color:var(--brand)] hover:underline"
                  >
                    Ver código y CI en GitHub <IconArrow />
                  </a>
                  <a
                    href="/trazas"
                    className="flex w-fit items-center gap-1.5 text-[12.5px] font-semibold text-[color:var(--brand)] hover:underline"
                  >
                    Ver trazas de guardrails en vivo <IconArrow />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex flex-1 justify-center px-6 py-14 sm:px-14 sm:py-16">
        <div className="w-full max-w-[600px]">
          <span className="text-xs font-semibold tracking-wider text-[color:var(--brand)] uppercase">
            Monotributo · Consulta fiscal
          </span>
          {children}
        </div>
      </div>
    </main>
  )
}

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
    <Shell>
      <AnimatePresence mode="wait">
        {wizard.step === 'pregunta' && (
          <motion.div key="pregunta" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <motion.h1 variants={itemVariants} className="mt-2 mb-8 text-[28px] leading-tight font-semibold tracking-tight">
              ¿En qué te puedo ayudar?
            </motion.h1>

            <div className="flex flex-col gap-3.5">
              <motion.textarea
                variants={itemVariants}
                className="min-h-[120px] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-[15px] text-[var(--fg)]"
                placeholder="Ej: ¿qué es una factura C?"
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
              />

              <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
                {PREGUNTAS_EJEMPLO.map((ej) => (
                  <motion.button
                    key={ej}
                    type="button"
                    whileHover={{ y: -1, borderColor: 'var(--brand)' }}
                    transition={{ duration: 0.2, ease: EASE_CALM }}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-[12.5px] text-[color:var(--fg-muted)] hover:text-[color:var(--brand)]"
                    onClick={() => setPregunta(ej)}
                  >
                    {ej}
                  </motion.button>
                ))}
              </motion.div>

              <motion.button
                variants={itemVariants}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                transition={{ duration: 0.2, ease: EASE_CALM }}
                className="mt-2 flex w-fit items-center gap-2 rounded-md bg-[var(--brand)] px-5.5 py-3 text-[14.5px] font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
                onClick={handlePreguntar}
                disabled={loading || !pregunta.trim()}
              >
                {loading ? (
                  <>
                    Consultando <LoadingDots />
                  </>
                ) : (
                  'Preguntar'
                )}
                {!loading && <IconArrow />}
              </motion.button>
            </div>
          </motion.div>
        )}

        {wizard.step === 'clarify' && (
          <motion.div key="clarify" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <motion.p variants={itemVariants} className="mt-4 mb-7 text-[15px] text-[color:var(--fg-muted)]">
              Tu consulta: <span className="font-medium text-[var(--fg)]">&quot;{pregunta}&quot;</span>
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col gap-4 rounded-xl bg-[var(--amber-bg)] p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--amber-icon-bg)] text-[color:var(--amber-fg)]">
                  <IconPause />
                </div>
                <p className="text-xs font-semibold tracking-wider text-[color:var(--amber-fg)] uppercase">
                  El asistente necesita un dato
                </p>
              </div>

              <p className="text-lg leading-snug font-semibold text-[var(--fg)]">{wizard.question}</p>
              <p className="max-w-[440px] text-[13.5px] leading-relaxed text-[color:var(--fg-muted)]">
                No asumimos tu categoría ni tu facturación, necesitamos que la confirmes vos antes de responder.
              </p>

              <div className="mt-1 flex gap-2.5">
                <input
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm"
                  value={respuestaClarify}
                  onChange={(e) => setRespuestaClarify(e.target.value)}
                  placeholder="Tu respuesta"
                />
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                  transition={{ duration: 0.2, ease: EASE_CALM }}
                  className="rounded-md bg-[var(--brand)] px-5.5 py-3 text-[14.5px] font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
                  onClick={handleResponderClarify}
                  disabled={loading || !respuestaClarify.trim()}
                >
                  {loading ? (
                    <>
                      Enviando <LoadingDots />
                    </>
                  ) : (
                    'Responder'
                  )}
                </motion.button>
              </div>
            </motion.div>

            <motion.button
              variants={itemVariants}
              className="mt-5 inline-block text-[13.5px] text-[color:var(--fg-muted)] hover:underline"
              onClick={handleReiniciar}
            >
              ← Cancelar y hacer otra pregunta
            </motion.button>
          </motion.div>
        )}

        {wizard.step === 'resultado' && (
          <motion.div key="resultado" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <motion.p variants={itemVariants} className="mt-4 mb-5 text-[15px] text-[color:var(--fg-muted)]">
              Tu consulta: <span className="font-medium text-[var(--fg)]">&quot;{pregunta}&quot;</span>
            </motion.p>

            {wizard.outcome.status === 'sin_fuente' && (
              <motion.div variants={itemVariants} className="flex flex-col gap-3.5 rounded-xl bg-[var(--slate-bg)] p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--slate-icon-bg)] text-[color:var(--fg-muted)]">
                    <IconSearchEmpty />
                  </div>
                  <p className="text-xs font-semibold tracking-wider text-[color:var(--fg-muted)] uppercase">
                    Sin información verificada
                  </p>
                </div>
                <p className="text-[17px] leading-snug font-semibold text-[var(--fg)]">
                  No tengo esa información en mi corpus curado.
                </p>
                <p className="max-w-[460px] text-[13.5px] leading-relaxed text-[color:var(--fg-muted)]">
                  Prefiero decírtelo con claridad antes que inventar una respuesta. Para este caso, consultá con un
                  contador matriculado.
                </p>
              </motion.div>
            )}

            {wizard.outcome.status === 'done' && (
              <motion.div variants={itemVariants} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-7">
                <p className="text-base leading-relaxed text-[var(--fg)]">{wizard.outcome.respuesta}</p>
                <div className="my-6 h-px bg-[var(--border)]" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {wizard.outcome.fuentesUsadas.length > 0 ? (
                      wizard.outcome.fuentesUsadas.map((fuente) => (
                        <span
                          key={fuente}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 font-mono text-xs text-[color:var(--fg-muted)]"
                        >
                          <IconHash />
                          {fuente}
                        </span>
                      ))
                    ) : (
                      <span className="font-mono text-xs text-[color:var(--fg-muted)]">-</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--green-fg)]">
                    <IconCheckShield />
                    Corpus verificado al {wizard.outcome.fechaCorte}
                  </div>
                </div>
              </motion.div>
            )}

            <motion.button
              variants={itemVariants}
              className="mt-5 inline-block text-[13.5px] text-[color:var(--fg-muted)] hover:underline"
              onClick={handleReiniciar}
            >
              ← Hacer otra pregunta
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  )
}
