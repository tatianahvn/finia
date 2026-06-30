'use client'

import { useEffect, useRef, useState } from 'react'
import { ChartNoAxesCombined, Sparkles, ArrowRight, X, Loader2, AlertTriangle } from 'lucide-react'
import type { Transaction } from '@/types/statements'
import type { AdviceEntry } from '@/lib/hooks/useAdviceHistory'
import { hasExpenses } from '@/lib/services/advice'
import { useMonthlyAdvice, type MonthlyAdviceStatus } from '@/lib/hooks/useMonthlyAdvice'

function monthLabel(ym: string) {
  if (!ym) return ''
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

interface Props {
  transactions: Transaction[]
  month: string  // "YYYY-MM"
}

export default function FinancialAdviceCard({ transactions, month }: Props) {
  const [open, setOpen] = useState(false)

  const hasGastos = hasExpenses(transactions)
  const { entry, status } = useMonthlyAdvice(month, hasGastos)

  const loading = status === 'loading'
  const previewConsejos = entry?.consejos?.slice(0, 4) ?? []

  return (
    <section className="rounded-2xl p-6 shadow-sm flex flex-col h-full bg-gradient-to-br from-violet-700 via-violet-600 to-violet-800 text-white">
      <div className="flex items-center gap-3 mb-3">
        <ChartNoAxesCombined size={30} className="text-white shrink-0" />
        <div>
          <h2 className="text-lg font-bold leading-tight">Tus consejos financieros</h2>
          <p className="text-sm text-violet-200 leading-snug mt-0.5">
            Recomendaciones basadas en tus gastos{month ? ` de ${monthLabel(month)}` : ''}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6">
          <Loader2 size={24} className="animate-spin text-violet-200" />
          <p className="text-sm text-violet-200">Consultando tus consejos…</p>
        </div>
      ) : previewConsejos.length > 0 ? (
        <div className="flex-1 flex flex-col gap-2 mt-2 bg-white/10 rounded-xl p-4 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-300 mb-1">
            Vista previa
          </p>
          {previewConsejos.map((consejo, i) => (
            <div key={i}>
              <div className="flex items-start gap-2.5">
                <span className="text-lg shrink-0 mt-0.5">{consejo.icono}</span>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-white leading-tight">{consejo.titulo}</p>
                  <p className="text-sm text-violet-200 leading-snug mt-0.5 line-clamp-2">{consejo.descripcion}</p>
                </div>
              </div>
              {i < previewConsejos.length - 1 && (
                <div className="h-px bg-white/10 mt-2" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
          <Sparkles size={24} className="text-violet-200 mb-2" />
          <p className="text-base text-violet-100 leading-relaxed max-w-[240px]">
            {!hasGastos
              ? 'No hay gastos en este mes para generar consejos.'
              : 'Sube un estado de cuenta para ver recomendaciones personalizadas.'}
          </p>
        </div>
      )}

      <button
        onClick={() => setOpen(true)}
        disabled={!hasGastos || loading}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-base
          bg-white text-violet-700 hover:bg-violet-50 transition-colors shrink-0
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Sparkles size={14} />
        Ver análisis completo
        <ArrowRight size={14} />
      </button>

      <AdviceModal
        open={open}
        onClose={() => setOpen(false)}
        month={month}
        entry={entry}
        status={status}
      />
    </section>
  )
}

interface ModalProps {
  open: boolean
  onClose: () => void
  month: string
  entry: AdviceEntry | null
  status: MonthlyAdviceStatus
}

function AdviceModal({ open, onClose, month, entry, status }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <Sparkles size={16} className="text-violet-600" />
            </div>
            <div>
              <p className="text-base font-bold text-neutral-900">Consejos financieros</p>
              <p className="text-sm text-neutral-400 capitalize">{monthLabel(month)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col gap-6">
          {status === 'ready' && entry ? (
            <Advice entry={entry} />
          ) : status === 'empty' || status === 'error' ? (
            <ErrorState status={status} month={month} />
          ) : (
            <LoadingSkeleton />
          )}
        </div>
      </div>
    </div>
  )
}

function Advice({ entry }: { entry: AdviceEntry }) {
  return (
    <>
      <div className="rounded-xl bg-violet-50 border border-violet-200 px-5 py-4">
        <p className="text-base font-semibold text-violet-800 mb-1">Resumen de tus gastos</p>
        <p className="text-base text-violet-700 leading-relaxed">{entry.resumen}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {entry.consejos.map((consejo, i) => (
          <div key={i} className="flex gap-4 rounded-xl bg-neutral-50 border border-neutral-100 p-4">
            <span className="text-2xl shrink-0 mt-0.5">{consejo.icono}</span>
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-neutral-900">{consejo.titulo}</p>
              <p className="text-base text-neutral-500 leading-relaxed">{consejo.descripcion}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-neutral-400 text-center">
        Guardado en tu historial · Powered by Groq · Llama 3.3
      </p>
    </>
  )
}

// Estado de error: la BD no devolvió consejos para el mes ('empty', típicamente
// porque la generación falló al guardar) o la consulta falló ('error').
function ErrorState({ status, month }: { status: MonthlyAdviceStatus; month: string }) {
  const message =
    status === 'empty'
      ? `No encontramos consejos para ${monthLabel(month)}. Es posible que ocurriera un error al generarlos. Vuelve a cargar el estado de cuenta de este periodo para generarlos nuevamente.`
      : 'No pudimos consultar tus consejos en este momento. Revisa tu conexión e inténtalo de nuevo más tarde.'

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertTriangle size={24} className="text-red-500" />
      </div>
      <p className="text-lg font-semibold text-neutral-900">No hay consejos disponibles</p>
      <p className="text-base text-neutral-500 max-w-sm leading-relaxed">{message}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
          <Sparkles size={20} className="text-violet-300" />
        </div>
        <p className="text-sm text-neutral-400">Consultando tus consejos...</p>
      </div>
      <div className="rounded-xl bg-violet-50 border border-violet-200 px-5 py-4 flex flex-col gap-2">
        <div className="h-3.5 w-40 rounded-full bg-violet-200" />
        <div className="h-3 w-full rounded-full bg-violet-100" />
        <div className="h-3 w-3/4 rounded-full bg-violet-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-xl bg-neutral-50 border border-neutral-100 p-4">
            <div className="h-8 w-8 rounded-full bg-neutral-200 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3.5 w-32 rounded-full bg-neutral-200" />
              <div className="h-3 w-full rounded-full bg-neutral-200" />
              <div className="h-3 w-4/5 rounded-full bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
