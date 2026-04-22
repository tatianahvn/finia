import type { Transaction } from '@/types/statements'

const CARGO_TYPES = new Set(['cargo', 'transferencia_enviada', 'retiro', 'comision'])

interface CategoryMeta {
  label: string
  emoji: string
  color: string
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  alimentacion: { label: 'Comida', emoji: '🍽️', color: '#E05A2B' },
  transporte: { label: 'Transporte', emoji: '🚗', color: '#0D9488' },
  entretenimiento: { label: 'Ocio', emoji: '🎬', color: '#D97706' },
  salud: { label: 'Salud', emoji: '🩺', color: '#DC2626' },
  educacion: { label: 'Educación', emoji: '📚', color: '#7C3AED' },
  servicios: { label: 'Tecnología', emoji: '💻', color: '#4F46E5' },
  vestimenta: { label: 'Moda', emoji: '👕', color: '#BE185D' },
  ropa_calzado: { label: 'Moda', emoji: '🥾', color: '#BE185D' },
  hogar: { label: 'Hogar', emoji: '🏠', color: '#2563EB' },
  viajes: { label: 'Viajes', emoji: '✈️', color: '#0D9488' },
  nomina: { label: 'Nómina', emoji: '💵', color: '#059669' },
  transferencia: { label: 'Transferencia', emoji: '🔄', color: '#7C3AED' },
  inversiones: { label: 'Ahorro', emoji: '💰', color: '#059669' },
  impuestos: { label: 'Impuestos', emoji: '🧾', color: '#E05A2B' },
  seguros: { label: 'Seguros', emoji: '🛡️', color: '#2563EB' },
  comisiones: { label: 'Comisiones', emoji: '💳', color: '#E05A2B' },
  comisiones_bancarias: { label: 'Comisiones', emoji: '💳', color: '#E05A2B' },
  otros: { label: 'Otros', emoji: '📦', color: '#78716C' },
}

interface Props {
  transactions: Transaction[]
}

function formatPeriod(transactions: Transaction[]): string {
  if (transactions.length === 0) return ''
  const latest = [...transactions].sort((a, b) => b.fecha.localeCompare(a.fecha))[0].fecha
  const date = new Date(latest + 'T00:00:00')
  const month = date.toLocaleDateString('es-MX', { month: 'long' })
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${date.getFullYear()}`
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
  const period = formatPeriod(transactions)

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold tracking-widest text-violet-700 uppercase">
          Gastos por categoría
        </h2>
        {period && (
          <span className="text-sm text-neutral-400">
            Gasto por categoría · {period}
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">
          Carga un archivo para ver el desglose por categoría
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(([cat, total]) => {
            const meta = CATEGORY_META[cat] ?? { label: cat, emoji: '•', color: '#78716C' }
            const pct = (total / max) * 100
            return (
              <div key={cat} className="flex items-center gap-3">
                <div className="flex w-36 shrink-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
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
                  className="w-14 shrink-0 text-right text-md font-semibold"
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
