'use client'

import Link from 'next/link'
import { ScanText } from 'lucide-react'
import { useAnalysis } from '@/lib/context/analysis'
import FinancialAdvice from '../_components/FinancialAdvice'

export default function ConsejosPage() {
  const { statement, loading } = useAnalysis()

  if (loading) {
    return <div className="h-96 rounded-2xl bg-neutral-200 animate-pulse" />
  }

  if (!statement) {
    return (
      <div className="flex flex-col gap-6">
        <div className="shrink-0 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Consejos</h1>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white p-16 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
            <ScanText size={28} className="text-violet-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-neutral-900">Sin datos aún</p>
            <p className="text-sm text-neutral-400 mt-1">Analiza un estado de cuenta para recibir recomendaciones personalizadas</p>
          </div>
          <Link
            href="/dashboard/analizar"
            className="px-5 py-2.5 bg-violet-700 text-white text-sm font-semibold rounded-xl hover:bg-violet-800 transition-colors"
          >
            Ir a Analizar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-neutral-900">Consejos financieros</h1>
      <FinancialAdvice transactions={statement.transacciones} />
    </div>
  )
}
