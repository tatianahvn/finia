'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Sparkles, ScanText } from 'lucide-react'
import { useAdviceHistory, type AdviceEntry } from '@/lib/hooks/useAdviceHistory'

function monthLabel(ym: string) {
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AccordionItem({ entry }: { entry: AdviceEntry }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900 capitalize">
              {monthLabel(entry.mes)}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Generado el {formatDate(entry.generado)}
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-neutral-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 flex flex-col gap-4 border-t border-neutral-100">
          <div className="rounded-xl bg-violet-50 border border-violet-200 px-5 py-4 mt-4">
            <p className="text-sm font-semibold text-violet-800 mb-1">Resumen de tus gastos</p>
            <p className="text-sm text-violet-700 leading-relaxed">{entry.resumen}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {entry.consejos.map((consejo, i) => (
              <div key={i} className="flex gap-4 rounded-xl bg-neutral-50 border border-neutral-100 p-4">
                <span className="text-2xl shrink-0 mt-0.5">{consejo.icono}</span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-neutral-900">{consejo.titulo}</p>
                  <p className="text-sm text-neutral-500 leading-relaxed">{consejo.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ConsejosPage() {
  const { entries } = useAdviceHistory()

  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Consejos financieros</h1>
          <p className="text-md text-neutral-500 mt-1">
            Recomendaciones personalizadas generadas a partir de tus gastos.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white p-16 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
            <ScanText size={28} className="text-violet-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-neutral-900">Sin consejos generados aún</p>
            <p className="text-sm text-neutral-400 mt-1 max-w-xs">
              Carga un estado de cuenta y, al guardarlo, generaremos
              automáticamente tus consejos financieros personalizados.
            </p>
          </div>
          <Link
            href="/dashboard/estados-de-cuenta"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white
              bg-gradient-to-r from-violet-600 to-fuchsia-500
              hover:from-violet-700 hover:to-fuchsia-600
              shadow-md transition-all"
          >
            <Sparkles size={15} />
            Cargar estado de cuenta
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Consejos financieros</h1>
          <p className="text-md text-neutral-500 mt-1">
            Recomendaciones personalizadas generadas a partir de tus gastos.
          </p>
        </div>
        <p className="text-sm text-neutral-500 mt-1.5 shrink-0">{entries.length} {entries.length === 1 ? 'mes guardado' : 'meses guardados'}</p>
      </div>

      <div className="flex flex-col gap-3">
        {entries.map(entry => (
          <AccordionItem key={entry.mes} entry={entry} />
        ))}
      </div>

      <p className="text-xs text-neutral-400 text-center">
        Genera nuevos consejos desde la página de Análisis · Powered by Groq · Llama 3.3
      </p>
    </div>
  )
}
