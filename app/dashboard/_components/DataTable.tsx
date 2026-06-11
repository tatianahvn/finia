'use client'

import type { Transaction } from '@/types/statements'
import { getCategoryMeta } from '@/lib/categories'

const CARGO_TYPES = new Set([
  'cargo', 'transferencia_enviada', 'retiro', 'comision',
])

const columns = ['Fecha', 'Descripción', 'Categoría', 'Monto']

interface Props {
  transactions: Transaction[]
}

function fmt(n: number) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2 })
}

export default function DataTable({ transactions }: Props) {
  const ingresos = transactions
    .filter(tx => !CARGO_TYPES.has(tx.tipo))
    .reduce((sum, tx) => sum + tx.monto, 0)

  const egresos = transactions
    .filter(tx => CARGO_TYPES.has(tx.tipo))
    .reduce((sum, tx) => sum + tx.monto, 0)

  const balance = ingresos - egresos

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="shrink-0 flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold tracking-widest text-violet-700 uppercase">
          Transacciones
        </h2>
      </div>

      <div className="shrink-0 grid grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-emerald-50 px-4 py-3">
          <p className="text-xs font-medium text-emerald-600 tracking-wide mb-1">Ingresos</p>
          <p className="text-base font-bold text-emerald-700">${fmt(ingresos)}</p>
        </div>
        <div className="rounded-xl bg-red-50 px-4 py-3">
          <p className="text-xs font-medium text-red-500 tracking-wide mb-1">Egresos</p>
          <p className="text-base font-bold text-red-600">${fmt(egresos)}</p>
        </div>
        <div className={`rounded-xl px-4 py-3 ${balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-xs font-medium tracking-wide mb-1 ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>Balance</p>
          <p className={`text-base font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{balance >= 0 ? '+' : '-'}${fmt(Math.abs(balance))}</p>
        </div>
        <div className="rounded-xl bg-violet-50 px-4 py-3">
          <p className="text-xs font-medium text-violet-600 tracking-wide mb-1">Transacciones</p>
          <p className="text-base font-bold text-violet-700">{transactions.length}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-neutral-200">
              {columns.map(col => (
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
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-neutral-400 text-sm">
                  Carga un archivo para ver tus transacciones
                </td>
              </tr>
            ) : (
              transactions.map((tx, i) => {
                const esCargo = CARGO_TYPES.has(tx.tipo)
                const meta = getCategoryMeta(tx.categoria)
                return (
                  <tr key={tx.id ?? i} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="py-3 pr-4 text-neutral-500 whitespace-nowrap">
                      {tx.fecha}
                    </td>
                    <td className="py-3 pr-4 text-neutral-900 max-w-xs truncate">
                      {tx.comercio ?? tx.descripcion}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.badgeClasses}`}>
                        <span aria-hidden>{meta.emoji}</span>
                        {meta.label}
                      </span>
                    </td>
                    <td className={`py-3 font-semibold whitespace-nowrap ${esCargo ? 'text-neutral-600' : 'text-emerald-600'}`}>
                      {esCargo ? '' : '+'}${tx.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
