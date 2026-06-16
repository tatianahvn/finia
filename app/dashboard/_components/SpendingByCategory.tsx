import type { Transaction } from '@/types/statements'
import { getCategoryMeta } from '@/lib/categories'

const CARGO_TYPES = new Set(['cargo', 'transferencia_enviada', 'retiro', 'comision'])

interface Props {
  transactions: Transaction[]
}

function formatAmount(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`
  return `$${amount.toFixed(0)}`
}

export default function SpendingByCategory({ transactions }: Props) {
  const totals = new Map<string, number>()
  for (const tx of transactions) {
    if (!CARGO_TYPES.has(tx.tipo)) continue
    totals.set(tx.categoria, (totals.get(tx.categoria) ?? 0) + tx.monto)
  }

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1])
  const max = sorted[0]?.[1] ?? 1

  return (
    <section className="flex flex-col min-h-[33vh] max-h-[66vh] h-full bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-sm font-bold tracking-widest text-violet-700 uppercase">
          Gastos por categoría
        </h2>
      </div>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">
          Carga un archivo para ver el desglose por categoría
        </p>
      ) : (
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
          {sorted.map(([cat, total]) => {
            const meta = getCategoryMeta(cat)
            const pct = (total / max) * 100
            return (
              <div key={cat} className="flex items-center gap-3">
                <div className="flex w-30 shrink-0 items-center gap-3">
                  <span className="truncate text-md text-neutral-700">
                    {meta.emoji} {meta.label}
                  </span>
                </div>

                <div className="h-6 flex-1 overflow-hidden rounded-md bg-neutral-100">
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: meta.color }}
                  />
                </div>

                <span
                  className="w-14 shrink-0 text-right text-md font-medium"
                  style={{ color: meta.color }}
                >
                  {formatAmount(total)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
