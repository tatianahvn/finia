'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { CheckCircle2, ScanText, ArrowLeftRight, BarChart2, ChevronRight, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const LINKS = [
  {
    href: '/dashboard/estados-de-cuenta',
    icon: ScanText,
    title: 'Estados de cuenta',
    description: 'Consulta los estados de cuenta que has cargado.',
  },
  {
    href: '/dashboard/transacciones',
    icon: ArrowLeftRight,
    title: 'Transacciones mensuales',
    description: 'Revisa el detalle de tus movimientos mes a mes.',
  },
  {
    href: '/dashboard/analisis',
    icon: BarChart2,
    title: 'Análisis de gastos mensuales',
    description: 'Descubre cómo se distribuyen tus gastos cada mes.',
  },
] as const

export default function StatementSavedModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="relative flex flex-col items-center text-center px-6 pt-6 pb-2">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3">
            <CheckCircle2 size={48} className="text-menta" />
          </div>
          <p className="text-xl font-bold text-neutral-900">¡Estado de cuenta guardado!</p>
          <p className="text-sm text-neutral-500">Tu información ya está lista para consultar.</p>
        </div>

        {/* Body — accesos directos */}
        <div className="flex flex-col gap-2 px-6 py-4">
          {LINKS.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="group flex items-center gap-3 rounded-2xl border border-neutral-100 px-4 py-3 hover:border-violet-200 hover:bg-violet-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center shrink-0 transition-colors">
                <Icon size={18} className="text-violet-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900">{title}</p>
                <p className="text-xs text-neutral-500 truncate">{description}</p>
              </div>
              <ChevronRight size={18} className="text-neutral-300 group-hover:text-violet-700 transition-colors shrink-0" />
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-violet-800 hover:bg-violet-900 rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
