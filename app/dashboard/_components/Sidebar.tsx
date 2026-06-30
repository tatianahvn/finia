'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ScanText,
  ArrowLeftRight,
  BarChart2,
  Lightbulb,
  UserCircle,
  Rocket,
  Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/estados-de-cuenta', label: 'Estados de cuenta', icon: ScanText },
  { href: '/dashboard/transacciones', label: 'Transacciones', icon: ArrowLeftRight },
  { href: '/dashboard/analisis', label: 'Análisis', icon: BarChart2 },
  { href: '/dashboard/consejos', label: 'Consejos', icon: Lightbulb },
  { href: '/dashboard/perfil', label: 'Perfil', icon: UserCircle },
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

export default function Sidebar() {
  const pathname = usePathname()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const full = user.user_metadata?.full_name as string | undefined
      setDisplayName(full ?? user.email?.split('@')[0] ?? '')
      setEmail(user.email ?? '')
    })
  }, [])

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-white min-h-screen">
      <div className="px-6 py-5">
        <Link href="/" className="text-3xl font-bold tracking-tight text-violet-800">
          Finial
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-colors ${isActive
                ? 'bg-violet-100 text-violet-800 font-semibold'
                : 'text-neutral-500 hover:bg-violet-50 hover:text-violet-800'
                }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 pb-3">
        <div className="flex flex-col justify-center min-h-50 rounded-xl bg-violet-700 p-4 bg-gradient-to-r from-violet-600 to-fuchsia-500">
          <div className="flex justify-center">
            <Rocket size={45} className="text-white" />
          </div>

          <div className="flex items-center gap-1.5 pt-5">
            <Zap size={15} className="text-violet-200" />
            <p className="text-base font-semibold text-white">Obtén más créditos</p>
          </div>

          <p className="text-base text-violet-200 leading-relaxed mb-3">
            Más análisis y funciones avanzadas para tus finanzas
          </p>
          <Link
            href="/upgrade"
            className="block text-center text-base font-semibold bg-white text-violet-700 rounded-lg py-1.5 hover:bg-violet-50 transition-colors"
          >
            Créditos →
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-neutral-100">
        <Link
          href="/dashboard/perfil"
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-xs text-violet-900 font-semibold shrink-0 group-hover:bg-violet-200 transition-colors">
            {displayName ? getInitials(displayName) : '…'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-neutral-900 truncate">{displayName || '—'}</p>
            <p className="text-sm text-neutral-400 truncate">{email || '—'}</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
