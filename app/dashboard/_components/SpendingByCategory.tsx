import type { Transaction } from '@/types/statements'
import { getCategoryMeta } from '@/lib/categories'

const CARGO_TYPES = new Set(['cargo', 'transferencia_enviada', 'retiro', 'comision'])

interface Props {
  transactions: Transaction[]
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })
}

export default function SpendingByCategory({ transactions }: Props) {
  const totals = new Map<string, number>()
  for (const tx of transactions) {
    if (!CARGO_TYPES.has(tx.tipo)) continue
    totals.set(tx.categoria, (totals.get(tx.categoria) ?? 0) + tx.monto)
  }

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1])
  const max = sorted[0]?.[1] ?? 1
  const grandTotal = sorted.reduce((sum, [, v]) => sum + v, 0)

  return (
    <section className="flex flex-col min-h-[33vh] max-h-[66vh] h-full bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-base font-bold tracking-widest text-violet-700 uppercase">
          Gastos por categoría
        </h2>
      </div>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">
          Carga un archivo para ver el desglose por categoría
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
            {sorted.map(([cat, total]) => {
              const meta = getCategoryMeta(cat)
              const barPct = (total / max) * 100
              const sharePct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className="flex w-32 shrink-0 items-center gap-2">
                    <span className="truncate text-base text-neutral-700">
                      {meta.emoji} {meta.label}
                    </span>
                  </div>

                  <div className="h-6 flex-1 overflow-hidden rounded-md bg-neutral-100">
                    <div
                      className="h-full rounded-md transition-all duration-500"
                      style={{ width: `${barPct}%`, backgroundColor: meta.color }}
                    />
                  </div>

                  <span className="w-10 shrink-0 text-right text-sm font-semibold text-neutral-600">
                    {sharePct}%
                  </span>

                  <span
                    className="w-24 shrink-0 text-right text-base font-semibold"
                    style={{ color: meta.color }}
                  >
                    {formatCurrency(total)}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between shrink-0">
            <span className="text-md font-bold text-neutral-900">Total de gastos del mes</span>
            <span className="text-lg font-bold text-neutral-900">{formatCurrency(grandTotal)}</span>
          </div>
        </>
      )}
    </section>
  )
}
