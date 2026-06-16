'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react'
import { useAnalysis } from '@/lib/context/analysis'
import { useAdviceHistory } from '@/lib/hooks/useAdviceHistory'
import SpendingByCategory from '../_components/SpendingByCategory'
import SpendingByConcept from '../_components/SpendingByConcept'
import FinancialAdviceCard from '../_components/FinancialAdviceCard'
import EmptyAnalysisCTA from '../_components/EmptyAnalysisCTA'

function monthLabel(ym: string) {
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
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

  async function handleDownloadReport() {
    if (months.length === 0) return
    setDownloading(true)
    try {
      const month = months[selectedIndex]
      const advice = adviceEntries.find(e => e.mes === month) ?? null
      // Lazy-load to keep @react-pdf/renderer (~1MB) out of the initial bundle
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
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-40 rounded-xl bg-neutral-200" />
        <div className="h-12 rounded-xl bg-neutral-200" />
        <div className="h-72 rounded-2xl bg-neutral-200" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-2xl bg-neutral-200" />
          <div className="h-80 rounded-2xl bg-neutral-200" />
        </div>
      </div>
    )
  }

  if (!statement) {
    return (
      <div className="flex flex-col gap-6 min-h-full">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-neutral-900">Análisis</h1>
          <p className="text-sm text-neutral-500 mt-1">
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

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Análisis</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Desglose analítico de tus gastos por categorías, conceptos y tendencias mensuales. Descarga el reporte en PDF y genera consejos financieros personalizados.
          </p>
        </div>

        {/* Month selector + advice button */}
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
                    className={`px-3 py-1 text-sm font-medium rounded-lg capitalize transition-colors ${
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

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadReport}
              disabled={downloading || filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
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
        </div>

        {/* Primera fila — gastos por categoría + CTA de consejos financieros */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SpendingByCategory transactions={filtered} />
          </div>
          <FinancialAdviceCard transactions={filtered} month={months[selectedIndex]} />
        </div>

        {/* Segunda fila — gastos por concepto */}
        <SpendingByConcept transactions={filtered} />
      </div>
    </>
  )
}
