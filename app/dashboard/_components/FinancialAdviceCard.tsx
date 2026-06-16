'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChartNoAxesCombined, Sparkles, ArrowRight, X, RefreshCw } from 'lucide-react'
import type { Transaction } from '@/types/statements'
import { useAdviceHistory, type AdviceEntry } from '@/lib/hooks/useAdviceHistory'

const CARGO_TYPES = new Set(['cargo', 'transferencia_enviada', 'retiro', 'comision'])

const LABEL: Record<string, string> = {
  alimentacion:         'Alimentación',
  transporte:           'Transporte',
  entretenimiento:      'Ocio y entretenimiento',
  salud:                'Salud',
  educacion:            'Educación',
  servicios:            'Servicios digitales',
  vestimenta:           'Moda y ropa',
  ropa_calzado:         'Moda y ropa',
  hogar:                'Hogar',
  viajes:               'Viajes',
  nomina:               'Nómina',
  transferencia:        'Transferencias',
  inversiones:          'Ahorro e inversión',
  impuestos:            'Impuestos',
  seguros:              'Seguros',
  comisiones:           'Comisiones',
  comisiones_bancarias: 'Comisiones bancarias',
  otros:                'Otros',
}

function buildPayload(transactions: Transaction[]) {
  const totals = new Map<string, number>()
  for (const tx of transactions) {
    if (!CARGO_TYPES.has(tx.tipo)) continue
    totals.set(tx.categoria, (totals.get(tx.categoria) ?? 0) + tx.monto)
  }
  const totalGastos = [...totals.values()].reduce((a, b) => a + b, 0)
  const categorias = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => ({
      label: LABEL[cat] ?? cat,
      total,
      porcentaje: totalGastos > 0 ? (total / totalGastos) * 100 : 0,
    }))
  return { categorias, totalGastos }
}

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

type Status = 'loading' | 'ready' | 'error'

export default function FinancialAdviceCard({ transactions, month }: Props) {
  const { entries, save, loaded } = useAdviceHistory()
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const inFlight = useRef<string | null>(null)

  const cached = useMemo(
    () => entries.find(e => e.mes === month) ?? null,
    [entries, month]
  )

  const payload = useMemo(() => buildPayload(transactions), [transactions])
  const hasGastos = payload.totalGastos > 0

  const runGenerate = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch('/api/statements/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'No se pudieron generar los consejos')
      const entry: AdviceEntry = {
        mes: month,
        generado: new Date().toISOString(),
        resumen: json.resumen,
        consejos: json.consejos,
      }
      save(entry)
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }, [payload, month, save])

  // Generación automática en segundo plano: una sola vez por mes y solo si no
  // existe el consejo en caché. Así el usuario no depende de ninguna acción.
  useEffect(() => {
    if (!loaded || !month || !hasGastos || cached) return
    if (inFlight.current === month) return
    inFlight.current = month
    runGenerate().finally(() => { inFlight.current = null })
  }, [loaded, month, hasGastos, cached, runGenerate])

  const regenerate = () => {
    if (!hasGastos || status === 'loading') return
    inFlight.current = month
    runGenerate().finally(() => { inFlight.current = null })
  }

  const generating = status === 'loading' && !cached

  return (
    <section className="rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center h-full bg-violet-600 text-white">
      <div className="flex items-center justify-center mb-4">
        <ChartNoAxesCombined size={38} className="text-white" />
      </div>

      <h2 className="text-lg font-bold">Tus consejos financieros</h2>
      <p className="text-sm text-violet-100 leading-relaxed mt-2 max-w-xs">
        A partir del análisis de tus gastos{month ? ` de ${monthLabel(month)}` : ''}, preparamos
        recomendaciones personalizadas para ayudarte a ahorrar y mejorar tus finanzas.
      </p>

      <button
        onClick={() => setOpen(true)}
        disabled={!hasGastos}
        className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
          bg-white text-violet-700 hover:bg-violet-50 transition-colors
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            Generando consejos…
          </>
        ) : (
          <>
            Ver mis consejos financieros
            <ArrowRight size={16} />
          </>
        )}
      </button>

      {!hasGastos && (
        <p className="mt-2 text-xs text-violet-200 text-center">
          No hay gastos en este mes para generar consejos.
        </p>
      )}

      <AdviceModal
        open={open}
        onClose={() => setOpen(false)}
        month={month}
        entry={cached}
        status={status}
        error={error}
        onRegenerate={regenerate}
      />
    </section>
  )
}

interface ModalProps {
  open: boolean
  onClose: () => void
  month: string
  entry: AdviceEntry | null
  status: Status
  error: string | null
  onRegenerate: () => void
}

function AdviceModal({ open, onClose, month, entry, status, error, onRegenerate }: ModalProps) {
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
              <p className="text-sm font-bold text-neutral-900">Consejos financieros</p>
              <p className="text-xs text-neutral-400 capitalize">{monthLabel(month)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {entry && (
              <button
                onClick={onRegenerate}
                disabled={status === 'loading'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-violet-700 hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />
                Regenerar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col gap-6">
          {entry ? (
            <Advice entry={entry} />
          ) : status === 'error' ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={onRegenerate}
                className="text-sm text-violet-600 hover:text-violet-800 underline underline-offset-2 transition-colors"
              >
                Reintentar
              </button>
            </div>
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
        <p className="text-sm font-semibold text-violet-800 mb-1">Resumen de tus gastos</p>
        <p className="text-sm text-violet-700 leading-relaxed">{entry.resumen}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {entry.consejos.map((consejo, i) => (
          <div key={i} className="flex gap-4 rounded-xl bg-neutral-50 border border-neutral-100 p-4">
            <span className="text-2xl shrink-0 mt-0.5">{consejo.icono}</span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-neutral-900">{consejo.titulo}</p>
              <p className="text-sm text-neutral-500 leading-relaxed">{consejo.descripcion}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-400 text-center">
        Guardado en tu historial · Powered by Groq · Llama 3.3
      </p>
    </>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
          <Sparkles size={20} className="text-violet-300" />
        </div>
        <p className="text-sm text-neutral-400">Analizando tus gastos...</p>
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