'use client'

import Link from 'next/link'
import { Sparkles, Receipt, Zap } from 'lucide-react'
import { useCredits } from '@/lib/hooks/useCredits'

interface Props {
  title?: string
  subtitle?: string
}

export default function EmptyAnalysisCTA({
  title = 'Aún no tienes estados de cuenta',
  subtitle = 'Sube tu primer estado de cuenta y Finia hará el resto',
}: Props) {
  const { balance, loading } = useCredits()
  const noCredits = !loading && (balance ?? 0) <= 0

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center min-h-[60vh]">
      <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center">
        <Receipt size={26} className="text-violet-700" strokeWidth={1.75} />
      </div>

      <div>
        <p className="text-lg font-semibold text-neutral-900">{title}</p>
        <p className="text-base text-neutral-400 mt-1 max-w-xs mx-auto">{subtitle}</p>
      </div>

      <Link
        href="/dashboard/estados-de-cuenta"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-base text-white
          bg-gradient-to-r from-violet-600 to-fuchsia-500
          hover:from-violet-700 hover:to-fuchsia-600
          shadow-md hover:shadow-lg
          transition-all active:scale-95"
      >
        <Sparkles size={16} className="shrink-0" />
        Analizar mi primer estado de cuenta
      </Link>

      <div className="flex flex-col items-center gap-2">
        {loading ? (
          <div className="h-6 w-44 rounded-full bg-neutral-100 animate-pulse" />
        ) : noCredits ? (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-semibold">
              <Zap size={12} />
              No tienes créditos disponibles
            </div>
            <Link
              href="/upgrade"
              className="text-xs font-semibold text-violet-700 hover:text-violet-900 underline underline-offset-2 transition-colors"
            >
              Comprar créditos →
            </Link>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-sm font-semibold">
              <Zap size={12} />
              Costo: 1 crédito por análisis
            </div>
            {(balance ?? 0) <= 1 && (
              <Link
                href="/upgrade"
                className="text-xs font-semibold text-violet-700 hover:text-violet-900 underline underline-offset-2 transition-colors"
              >
                Comprar más créditos →
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}
