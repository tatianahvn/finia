'use client'

import { useMemo } from 'react'
import { useAnalysis } from '@/lib/context/analysis'
import StatCards from './_components/StatCards'
import MonthlySpendingChart from './_components/MonthlySpendingChart'
import RecentTransactions from './_components/RecentTransactions'
import EmptyAnalysisCTA from './_components/EmptyAnalysisCTA'

export default function Dashboard() {
  const { statement, loading } = useAnalysis()

  const months = useMemo(() => {
    if (!statement) return []
    const set = new Set(statement.transacciones.map(tx => tx.fecha.slice(0, 7)))
    return Array.from(set).sort()
  }, [statement])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-56 rounded-xl bg-neutral-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-neutral-200" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-neutral-200" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Resumen</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Vista general de tu actividad financiera reciente.
          </p>
        </div>
        {statement && (
          <span className="text-xs text-neutral-500 mt-1.5 shrink-0">
            {statement.resumen.banco} · {statement.resumen.periodo_inicio} — {statement.resumen.periodo_fin}
          </span>
        )}
      </div>

      {!statement ? (
        <EmptyAnalysisCTA />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <StatCards
              resumen={statement.resumen}
              count={statement.transacciones.length}
            />
            <MonthlySpendingChart
              transactions={statement.transacciones}
              months={months}
            />
          </div>
          <RecentTransactions transactions={statement.transacciones} />
        </>
      )}
    </div>
  )
}
