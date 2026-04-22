'use client'

import { useState } from 'react'
import type { Transaction } from '@/types/statements'

const CARGO_TYPES = new Set(['cargo', 'transferencia_enviada', 'retiro', 'comision'])

const LABEL: Record<string, string> = {
  alimentacion:        'Alimentación',
  transporte:          'Transporte',
  entretenimiento:     'Ocio y entretenimiento',
  salud:               'Salud',
  educacion:           'Educación',
  servicios:           'Servicios digitales',
  vestimenta:          'Moda y ropa',
  ropa_calzado:        'Moda y ropa',
  hogar:               'Hogar',
  viajes:              'Viajes',
  nomina:              'Nómina',
  transferencia:       'Transferencias',
  inversiones:         'Ahorro e inversión',
  impuestos:           'Impuestos',
  seguros:             'Seguros',
  comisiones:          'Comisiones',
  comisiones_bancarias:'Comisiones bancarias',
  otros:               'Otros',
}

interface Consejo {
  titulo: string
  descripcion: string
  icono: string
}

interface AdviceData {
  resumen: string
  consejos: Consejo[]
}

type Status = 'idle' | 'loading' | 'done' | 'error'

interface Props {
  transactions: Transaction[]
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

export default function FinancialAdvice({ transactions }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [advice, setAdvice] = useState<AdviceData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasData = transactions.some(tx => CARGO_TYPES.has(tx.tipo))

  async function fetchAdvice() {
    setStatus('loading')
    setError(null)
    try {
      const payload = buildPayload(transactions)
      const res = await fetch('/api/statements/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al obtener recomendaciones')
      setAdvice(json as AdviceData)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }

  if (!hasData) {
    return (
      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold tracking-widest text-violet-700 uppercase">
            Recomendaciones IA
          </h2>
          <span className="text-xs text-neutral-400">Powered by Groq · Llama 3.3</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <span className="text-4xl">✦</span>
          <p className="text-sm font-medium text-neutral-900">Sin datos aún</p>
          <p className="text-xs text-neutral-400 max-w-xs">
            Carga un estado de cuenta para recibir recomendaciones personalizadas de finanzas.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold tracking-widest text-violet-700 uppercase">
          Recomendaciones IA
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">Powered by Groq · Llama 3.3</span>
          {status === 'done' && (
            <button
              onClick={fetchAdvice}
              className="text-xs text-violet-600 hover:text-violet-800 underline underline-offset-2 transition-colors"
            >
              Regenerar
            </button>
          )}
        </div>
      </div>

      {status === 'idle' && (
        <div className="flex flex-col items-center justify-center gap-4 py-10">
          <p className="text-sm text-neutral-500 text-center max-w-sm">
            Analizaremos tus gastos por categoría y generaremos consejos personalizados para mejorar tus finanzas.
          </p>
          <button
            onClick={fetchAdvice}
            className="px-5 py-2.5 bg-violet-700 text-white text-sm font-semibold rounded-xl hover:bg-violet-800 transition-colors shadow-btn"
          >
            Obtener recomendaciones
          </button>
        </div>
      )}

      {status === 'loading' && <LoadingSkeleton />}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={fetchAdvice}
            className="text-sm text-violet-600 hover:text-violet-800 underline underline-offset-2 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {status === 'done' && advice && (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-violet-50 border border-violet-200 px-5 py-4">
            <p className="text-sm font-semibold text-violet-800 mb-1">Resumen de tus gastos</p>
            <p className="text-sm text-violet-700 leading-relaxed">{advice.resumen}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {advice.consejos.map((consejo, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-xl bg-neutral-100 p-4"
              >
                <span className="text-2xl shrink-0 mt-0.5">{consejo.icono}</span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-neutral-900">{consejo.titulo}</p>
                  <p className="text-sm text-neutral-500 leading-relaxed">{consejo.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="rounded-xl bg-violet-50 border border-violet-200 px-5 py-4 flex flex-col gap-2">
        <div className="h-3.5 w-40 rounded-full bg-violet-200" />
        <div className="h-3 w-full rounded-full bg-violet-100" />
        <div className="h-3 w-3/4 rounded-full bg-violet-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-xl bg-neutral-100 p-4">
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
