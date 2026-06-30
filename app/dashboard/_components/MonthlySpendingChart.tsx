'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Transaction } from '@/types/statements'

const CARGO_TYPES = new Set(['cargo', 'transferencia_enviada', 'retiro', 'comision'])

function shortMonthLabel(ym: string) {
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  const m = date.toLocaleDateString('es-MX', { month: 'short' })
  return `${m.charAt(0).toUpperCase() + m.slice(1).replace('.', '')} '${String(year).slice(2)}`
}

function formatTick(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
  return `$${value}`
}

function formatTooltip(value: number): string {
  return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

interface Props {
  transactions: Transaction[]
  months: string[]
}

export default function MonthlySpendingChart({ transactions, months }: Props) {
  const totalsMap = new Map<string, number>()
  for (const tx of transactions) {
    if (!CARGO_TYPES.has(tx.tipo)) continue
    const ym = tx.fecha.slice(0, 7)
    totalsMap.set(ym, (totalsMap.get(ym) ?? 0) + tx.monto)
  }

  const data = months.map(ym => ({
    label: shortMonthLabel(ym),
    total: totalsMap.get(ym) ?? 0,
  }))

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      <h2 className="text-base font-bold tracking-widest text-violet-700 uppercase">
        Gasto total por mes
      </h2>

      <div className="flex-1 min-h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="35%" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#52525B' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#52525B' }}
              tickFormatter={formatTick}
              width={44}
            />
            <Tooltip
              formatter={(value) => [formatTooltip(value as number), 'Gasto']}
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(197, 71, 255, 0.39)',
                fontSize: '13px',
              }}
              cursor={{ fill: '#f5f3ff', radius: 6 }}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#7C3AED" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
