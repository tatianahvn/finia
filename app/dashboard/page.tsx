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
        <div className="h-8 w-40 rounded-xl bg-neutral-200" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4"
              >
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-6 w-24 rounded-full bg-neutral-200" />
                  <div className="h-7 w-20 rounded-lg bg-neutral-200" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-neutral-200 shrink-0" />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <div className="h-4 w-40 rounded bg-neutral-200" />
            <div className="flex-1 min-h-64 rounded-xl bg-neutral-200" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-44 rounded bg-neutral-200" />
            <div className="h-3 w-16 rounded bg-neutral-200" />
          </div>
          <div className="flex flex-col">
            <div className="flex gap-4 border-b border-neutral-200 pb-3">
              {['w-16', 'flex-1', 'w-24', 'w-20'].map((w, i) => (
                <div key={i} className={`h-3 ${w} rounded bg-neutral-200`} />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-neutral-100 last:border-0 py-3"
              >
                <div className="h-4 w-16 rounded bg-neutral-200" />
                <div className="h-4 flex-1 rounded bg-neutral-200" />
                <div className="h-5 w-24 rounded-full bg-neutral-200" />
                <div className="h-4 w-20 rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Resumen</h1>
        </div>
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
