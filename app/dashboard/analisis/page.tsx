'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Loader2, TrendingUp, TrendingDown, Scale, Hash } from 'lucide-react'
import { useAnalysis } from '@/lib/context/analysis'
import { useAdviceHistory } from '@/lib/hooks/useAdviceHistory'
import SpendingByCategory from '../_components/SpendingByCategory'
import SpendingByConcept from '../_components/SpendingByConcept'
import FinancialAdviceCard from '../_components/FinancialAdviceCard'
import EmptyAnalysisCTA from '../_components/EmptyAnalysisCTA'

const CARGO_TYPES = new Set(['cargo', 'transferencia_enviada', 'retiro', 'comision'])
const ABONO_TYPES = new Set(['abono', 'transferencia_recibida', 'deposito', 'interes'])

function monthLabel(ym: string) {
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

function formatCurrency(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

export default function AnalisisPage() {
  const { statement, loading } = useAnalysis()
  const { entries: adviceEntries } = useAdviceHistory()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [downloading, setDownloading] = useState(false)

  const months = useMemo(() => {
    if (!statement) return []
    const set = new Set(statement.transacciones.map(tx => tx.fecha.slice(0, 7)))
    return Array.from(set).sort()
  }, [statement])

  const filtered = useMemo(() => {
    if (!statement || months.length === 0) return []
    return statement.transacciones.filter(tx => tx.fecha.startsWith(months[selectedIndex]))
  }, [statement, months, selectedIndex])

  const monthStats = useMemo(() => {
    let ingresos = 0
    let gastos = 0
    for (const tx of filtered) {
      if (ABONO_TYPES.has(tx.tipo)) ingresos += tx.monto
      if (CARGO_TYPES.has(tx.tipo)) gastos += tx.monto
    }
    return { ingresos, gastos, transacciones: filtered.length, balance: ingresos - gastos }
  }, [filtered])

  async function handleDownloadReport() {
    if (months.length === 0) return
    setDownloading(true)
    try {
      const month = months[selectedIndex]
      const advice = adviceEntries.find(e => e.mes === month) ?? null
      const [{ pdf }, { default: MonthlyReportPdf }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../_components/MonthlyReportPdf'),
      ])
      const blob = await pdf(
        <MonthlyReportPdf month={month} transactions={filtered} advice={advice} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finia-reporte-${month}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[reporte-pdf]', err)
      alert('No se pudo generar el reporte. Intenta de nuevo.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5 animate-pulse">
        <div className="h-8 w-40 rounded-xl bg-neutral-200" />
        <div className="h-12 rounded-xl bg-neutral-200" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-neutral-200" />
              ))}
            </div>
            <div className="h-72 rounded-2xl bg-neutral-200" />
          </div>
          <div className="lg:col-span-2 h-[26rem] rounded-2xl bg-neutral-200" />
        </div>
        <div className="h-72 rounded-2xl bg-neutral-200" />
      </div>
    )
  }

  if (!statement) {
    return (
      <div className="flex flex-col gap-6 min-h-full">
        <div className="shrink-0">
          <h1 className="text-3xl font-bold text-neutral-900">Análisis</h1>
          <p className="text-md text-neutral-500 mt-1">
            Desglose analítico de tus gastos. Descarga el reporte en PDF y genera consejos financieros personalizados.
          </p>
        </div>
        <EmptyAnalysisCTA
          title="Sin datos para análisis"
          subtitle="Sube un estado de cuenta para ver tus gráficas aquí"
        />
      </div>
    )
  }

  const stats = [
    { label: 'Ingresos', value: formatCurrency(monthStats.ingresos), icon: TrendingUp, labelClass: 'text-menta', iconBg: 'bg-menta-light' },
    { label: 'Gastos', value: formatCurrency(monthStats.gastos), icon: TrendingDown, labelClass: 'text-durazno', iconBg: 'bg-durazno-light' },
    { label: 'Transacciones', value: String(monthStats.transacciones), icon: Hash, labelClass: 'text-celeste', iconBg: 'bg-celeste-light' },
    { label: 'Balance', value: formatCurrency(monthStats.balance), icon: Scale, labelClass: 'text-lavanda', iconBg: 'bg-lavanda-light', valueColor: monthStats.balance >= 0 ? 'text-menta' : 'text-durazno' },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Análisis</h1>
        <p className="text-base text-neutral-500 mt-1">
          Desglose analítico de tus gastos por categorías, conceptos y tendencias mensuales.
        </p>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {months.length > 1 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIndex(i => Math.max(0, i - 1))}
              disabled={selectedIndex === 0}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-violet-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex flex-wrap gap-1">
              {months.map((ym, i) => (
                <button
                  key={ym}
                  onClick={() => setSelectedIndex(i)}
                  className={`px-3 py-1.5 text-base font-medium rounded-lg capitalize transition-colors ${
                    i === selectedIndex
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
        ) : (
          <div />
        )}

        <button
          onClick={handleDownloadReport}
          disabled={downloading || filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-base
            bg-white border border-violet-200 text-violet-700
            hover:bg-violet-50 hover:border-violet-300
            shadow-sm transition-all active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {downloading
            ? <Loader2 size={16} className="shrink-0 animate-spin" />
            : <Download size={16} className="shrink-0" />}
          {downloading ? 'Generando…' : 'Descargar reporte'}
        </button>
      </div>

      {/* Two-column: (stats 2x2 + categories) left | advice right */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Stat cards 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value, icon: Icon, labelClass, iconBg, valueColor }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <span className={`text-sm font-semibold ${labelClass}`}>{label}</span>
                  <p className={`text-2xl font-bold ${valueColor ?? 'text-neutral-900'}`}>{value}</p>
                </div>
                <div className={`flex items-center justify-center ${iconBg} rounded-xl w-10 h-10 shrink-0`}>
                  <Icon size={20} className={labelClass} />
                </div>
              </div>
            ))}
          </div>

          <SpendingByCategory transactions={filtered} />
        </div>

        <div className="lg:col-span-2">
          <FinancialAdviceCard transactions={filtered} month={months[selectedIndex]} />
        </div>
      </div>

      {/* Full-width concept table */}
      <SpendingByConcept transactions={filtered} />
    </div>
  )
}
