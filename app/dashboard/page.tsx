'use client'

import { useState } from 'react'
import FileUpload from './_components/FileUpload'
import StatCards from './_components/StatCards'
import DataTable from './_components/DataTable'
import InsightsPanel from './_components/InsightsPanel'
import SpendingByCategory from './_components/SpendingByCategory'
import FinancialAdvice from './_components/FinancialAdvice'
import type { ParsedStatement } from '@/types/statements'
import mockStatement from '@/lib/mock/statement.json'

export default function Dashboard() {
  const [statement, setStatement] = useState<ParsedStatement | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Análisis de gastos</h1>
        <button
          onClick={() => setStatement(mockStatement as ParsedStatement)}
          className="text-xs text-neutral-400 hover:text-violet-600 underline underline-offset-2 transition-colors"
        >
          Cargar datos de prueba
        </button>
      </div>
      <FileUpload onAnalysisComplete={setStatement} />
      <StatCards resumen={statement?.resumen ?? null} count={statement?.transacciones.length ?? 0} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <DataTable transactions={statement?.transacciones ?? []} />
        <InsightsPanel transactions={statement?.transacciones ?? []} />
      </div>
      <SpendingByCategory transactions={statement?.transacciones ?? []} />
      <FinancialAdvice transactions={statement?.transacciones ?? []} />
    </div>
  )
}
