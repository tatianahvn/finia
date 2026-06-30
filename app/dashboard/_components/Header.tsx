'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'
import { useCredits } from '@/lib/hooks/useCredits'

export default function Header() {
  const { balance, loading } = useCredits()

  return (
    <header className="h-14 shrink-0 flex items-center justify-end px-6 bg-white gap-3">

      <Link
        href="/upgrade"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 transition-colors group"
      >
        <Zap size={13} className="text-violet-500 group-hover:text-violet-700 transition-colors" />
        <span className="text-sm font-semibold text-violet-700">
          {loading ? '—' : `${balance ?? 0} crédito${balance === 1 ? '' : 's'}`}
        </span>
      </Link>

    </header>
  )
}
