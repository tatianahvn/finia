import Link from 'next/link'
import type { Transaction } from '@/types/statements'
import { getCategoryMeta } from '@/lib/categories'

const CARGO_TYPES = new Set(['cargo', 'transferencia_enviada', 'retiro', 'comision'])

interface Props {
  transactions: Transaction[]
}

export default function RecentTransactions({ transactions }: Props) {
  const recent = [...transactions]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5)

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold tracking-widest text-violet-700 uppercase">
          Últimas transacciones
        </h2>
        <Link
          href="/dashboard/transacciones"
          className="text-sm text-violet-600 hover:text-violet-800 underline underline-offset-2 transition-colors"
        >
          Ver todas
        </Link>
      </div>

      <table className="w-full text-base">
        <thead>
          <tr className="border-b border-neutral-200">
            {['Fecha', 'Descripción', 'Categoría', 'Monto'].map(col => (
              <th
                key={col}
                className="pb-3 text-left text-sm font-semibold text-neutral-400 uppercase tracking-wide"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recent.map((tx, i) => {
            const esCargo = CARGO_TYPES.has(tx.tipo)
            const meta = getCategoryMeta(tx.categoria)
            return (
              <tr key={i} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="py-3 pr-4 text-neutral-500 whitespace-nowrap">
                  {tx.fecha}
                </td>
                <td className="py-3 pr-4 text-neutral-900 max-w-xs truncate">
                  {tx.comercio ?? tx.descripcion}
                </td>
                <td className="py-3 pr-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${meta.badgeClasses}`}>
                    <span aria-hidden>{meta.emoji}</span>
                    {meta.label}
                  </span>
                </td>
                <td className={`py-3 font-semibold whitespace-nowrap ${esCargo ? 'text-neutral-600' : 'text-emerald-600'}`}>
                  {esCargo ? '' : '+'}${tx.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
