import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Trazas de guardrails, Asistente Fiscal',
  description: 'Evidencia en vivo de las decisiones de guardrail del asistente fiscal: qué se bloqueó, qué pasó, y por qué.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

const OUTCOME_LABEL: Record<string, string> = {
  done: 'Respondió',
  needs_input: 'Pausó (askUser)',
  sin_fuente: 'Sin fuente',
}

const GUARDRAIL_LABEL: Record<string, string> = {
  sin_retrieval: 'Retrieval vacío',
  sin_citacion: 'Sin citación real',
  grounding_fallido: 'Grounding fallido',
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const styles: Record<string, string> = {
    done: 'bg-[var(--slate-bg)] text-[color:var(--green-fg)] border-[var(--border)]',
    needs_input: 'bg-[var(--amber-bg)] text-[color:var(--amber-fg)] border-transparent',
    sin_fuente: 'bg-[var(--slate-bg)] text-[color:var(--fg-muted)] border-[var(--border)]',
  }
  return (
    <span className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${styles[outcome] ?? styles.sin_fuente}`}>
      {OUTCOME_LABEL[outcome] ?? outcome}
    </span>
  )
}

function GuardrailBadge({ guardrail }: { guardrail: string | null }) {
  if (!guardrail) return <span className="text-xs text-[color:var(--fg-muted)]">-</span>
  return (
    <span className="inline-flex w-fit items-center rounded-md border border-transparent bg-[var(--brand)] px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white">
      {GUARDRAIL_LABEL[guardrail] ?? guardrail}
    </span>
  )
}

export default async function TrazasPage() {
  const eventos = await prisma.guardrailEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const total = eventos.length
  const guardrailsActivos = eventos.filter((e) => e.guardrailTriggered !== null).length
  const respondidas = eventos.filter((e) => e.outcome === 'done').length

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--bg)]">
      <div className="relative z-10 h-[3px] w-full shrink-0 bg-[var(--brand)]" />

      <div className="relative z-10 flex items-center justify-between border-b border-[var(--border)] px-6 py-5 sm:px-14">
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-semibold tracking-tight">Trazas de guardrails</span>
        </div>
        <a href="/" className="text-[12.5px] font-medium text-[color:var(--brand)] hover:underline">
          ← Volver al asistente
        </a>
      </div>

      <div className="relative z-10 mx-6 mt-5 flex items-start gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 sm:mx-14">
        <p className="text-[12.5px] leading-relaxed text-[color:var(--fg-muted)]">
          Últimas {total} decisiones reales del asistente, cada una con su resultado y si algún guardrail intervino. No hay
          curaduría: es la traza tal cual queda registrada en cada request, incluidos los intentos de prompt injection que se
          hayan probado contra la demo.
        </p>
      </div>

      <div className="relative z-10 mx-6 mt-5 grid grid-cols-3 gap-3 sm:mx-14">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-2xl font-semibold text-[var(--fg)]">{total}</p>
          <p className="text-xs text-[color:var(--fg-muted)]">eventos registrados</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-2xl font-semibold text-[color:var(--green-fg)]">{respondidas}</p>
          <p className="text-xs text-[color:var(--fg-muted)]">respondidas con grounding OK</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-2xl font-semibold text-[var(--brand)]">{guardrailsActivos}</p>
          <p className="text-xs text-[color:var(--fg-muted)]">guardrail activo</p>
        </div>
      </div>

      <div className="relative z-10 mx-6 my-5 flex-1 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] sm:mx-14">
        <table className="w-full min-w-[720px] text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-xs text-[color:var(--fg-muted)] uppercase">
              <th className="px-4 py-3 font-semibold">Cuándo</th>
              <th className="px-4 py-3 font-semibold">Origen</th>
              <th className="px-4 py-3 font-semibold">Resultado</th>
              <th className="px-4 py-3 font-semibold">Guardrail</th>
              <th className="px-4 py-3 font-semibold">Fichas citadas</th>
              <th className="px-4 py-3 font-semibold">Texto evaluado</th>
            </tr>
          </thead>
          <tbody>
            {eventos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[color:var(--fg-muted)]">
                  Todavía no hay eventos registrados. Hacé una consulta en el asistente para generar el primero.
                </td>
              </tr>
            )}
            {eventos.map((e) => (
              <tr key={e.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-[color:var(--fg-muted)]">
                  {e.createdAt.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[color:var(--fg-muted)]">
                  {e.origen === 'inicial' ? 'Pregunta' : 'Respuesta a askUser'}
                </td>
                <td className="px-4 py-3">
                  <OutcomeBadge outcome={e.outcome} />
                </td>
                <td className="px-4 py-3">
                  <GuardrailBadge guardrail={e.guardrailTriggered} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[color:var(--fg-muted)]">
                  {e.fichasCitadas.length > 0 ? e.fichasCitadas.join(', ') : '-'}
                </td>
                <td className="max-w-[320px] truncate px-4 py-3 text-[color:var(--fg-muted)]" title={e.textoEvaluado}>
                  {e.textoEvaluado}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
