'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ScanText, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useAnalysis } from '@/lib/context/analysis'
import DataTable from '../_components/DataTable'
import type { Transaction } from '@/types/statements'

function monthLabel(ym: string) {
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

const CATEGORY_LABELS: Record<string, string> = {
  alimentacion: 'Alimentación', transporte: 'Transporte', entretenimiento: 'Entretenimiento',
  salud: 'Salud', educacion: 'Educación', servicios: 'Servicios', vestimenta: 'Vestimenta',
  ropa_calzado: 'Vestimenta', hogar: 'Hogar', viajes: 'Viajes', nomina: 'Nómina',
  nomina_ingreso: 'Nómina', transferencia: 'Transferencia', inversiones: 'Inversiones',
  impuestos: 'Impuestos', seguros: 'Seguros', comisiones: 'Comisiones',
  comisiones_bancarias: 'Comisiones', otros: 'Otros',
}

const CARGO_TYPES = new Set(['cargo', 'transferencia_enviada', 'retiro', 'comision'])

async function exportToExcel(transactions: Transaction[], filename: string) {
  const { utils, writeFile } = await import('xlsx')
  const rows = transactions.map(tx => ({
    Fecha: tx.fecha,
    Descripción: tx.comercio ?? tx.descripcion,
    Categoría: CATEGORY_LABELS[tx.categoria] ?? tx.categoria,
    Tipo: CARGO_TYPES.has(tx.tipo) ? 'Cargo' : 'Abono',
    Monto: tx.monto,
  }))
  const ws = utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 18 }, { wch: 10 }, { wch: 12 }]
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Transacciones')
  writeFile(wb, filename)
}

export default function TransaccionesPage() {
  const { statement, loading } = useAnalysis()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const months = useMemo(() => {
    if (!statement) return []
    const set = new Set(statement.transacciones.map(tx => tx.fecha.slice(0, 7)))
    return Array.from(set).sort()
  }, [statement])

  const filtered = useMemo(() => {
    if (!statement || months.length === 0) return []
    return statement.transacciones.filter(tx => tx.fecha.startsWith(months[selectedIndex]))
  }, [statement, months, selectedIndex])

  if (loading) {
    return <div className="h-96 rounded-2xl bg-neutral-200 animate-pulse" />
  }

  if (!statement) {
    return (
      <div className="flex flex-col gap-6">
        <div className="shrink-0 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900"> Transacciones</h1>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white p-16 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
            <ScanText size={28} className="text-violet-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-neutral-900">Sin transacciones</p>
            <p className="text-sm text-neutral-400 mt-1">Analiza un estado de cuenta para ver el detalle aquí</p>
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
    <div className="flex flex-col h-full gap-4">
      <div className="shrink-0 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900"> Transacciones</h1>
      </div>

      {months.length > 1 && (
        <div className="shrink-0 flex justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIndex(i => Math.max(0, i - 1))}
              disabled={selectedIndex === 0}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-violet-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex gap-1">
              {months.map((ym, i) => (
                <button
                  key={ym}
                  onClick={() => setSelectedIndex(i)}
                  className={`px-3 py-1 text-sm font-medium rounded-lg capitalize transition-colors ${i === selectedIndex
                    ? 'bg-violet-700 text-white'
                    : 'text-neutral-500 hover:bg-neutral-100'
                    }`}
                >
                  {monthLabel(ym)}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedIndex(i => Math.min(months.length - 1, i + 1))}
              disabled={selectedIndex === months.length - 1}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportToExcel(filtered, `transacciones-${months[selectedIndex] ?? 'all'}.xlsx`)}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={13} />
              Exportar Excel
            </button>
          </div>
        </div>
      )}


      <div className="flex-1 min-h-0">
        <DataTable transactions={filtered} />
      </div>
    </div>
  )
}
