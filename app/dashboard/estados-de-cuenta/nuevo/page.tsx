'use client'

import { Tag, Lightbulb, BarChart2, ChartNoAxesCombined } from 'lucide-react'
import { useAnalysis } from '@/lib/context/analysis'
import { useAdviceHistory } from '@/lib/context/advice'
import FileUpload from '../../_components/FileUpload'

const FEATURES = [
  {
    icon: Tag,
    title: 'Categorización automática',
    description: 'Cada gasto clasificado por IA en categorías claras.',
  },
  {
    icon: Lightbulb,
    title: 'Consejos personalizados',
    description: 'Recomendaciones para optimizar tus gastos y ahorrar.',
  },
  {
    icon: BarChart2,
    title: 'Reportes descargables',
    description: 'Gráficas por categoría, concepto y reporte PDF.',
  },
]

export default function NuevoEstadoPage() {
  const { reloadStatement } = useAnalysis()
  const { refresh: refreshAdvice } = useAdviceHistory()

  async function handleSaved() {
    // Tras guardar+generar consejos, recargamos statement e invalidamos el
    // historial de consejos para que los recién generados aparezcan sin F5.
    await Promise.all([reloadStatement(), refreshAdvice()])
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 h-full">
      {/* Info card */}
      <section className="bg-white border-2 border-violet-200 rounded-2xl p-6 shadow-sm flex flex-col h-full">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
            <ChartNoAxesCombined size={18} className="text-violet-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Analiza tus finanzas en segundos</h2>
            <p className="text-sm text-neutral-400">Sube tu PDF y obtén al instante:</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3 bg-violet-50 border border-violet-100 rounded-xl p-4">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={18} className="text-violet-700" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-violet-700">{title}</p>
                <p className="text-sm text-neutral-400 leading-snug mt-1">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upload card */}
      <FileUpload onSaved={handleSaved} />
    </div>
  )
}
