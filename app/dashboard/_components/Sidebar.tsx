'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ScanText,
  ArrowLeftRight,
  BarChart2,
  Lightbulb,
  UserCircle,
  Zap,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/analizar', label: 'Analizar', icon: ScanText },
  { href: '/dashboard/transacciones', label: 'Transacciones', icon: ArrowLeftRight },
  { href: '/dashboard/reportes', label: 'Reportes', icon: BarChart2 },
  { href: '/dashboard/consejos', label: 'Consejos', icon: Lightbulb },
  { href: '/dashboard/perfil', label: 'Perfil', icon: UserCircle },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-white min-h-screen">
      <div className="px-6 py-5">
        <Link href="/" className="text-3xl font-bold tracking-tight text-violet-800">
          finia
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
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
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
        <div className="rounded-xl bg-violet-700 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={13} className="text-violet-200" />
            <p className="text-sm font-semibold text-white">Obtén más créditos</p>
          </div>
          <p className="text-xs text-violet-200 leading-relaxed mb-3">
            Más análisis y funciones avanzadas para tus finanzas
          </p>
          <Link
            href="/upgrade"
            className="block text-center text-xs font-semibold bg-white text-violet-700 rounded-lg py-1.5 hover:bg-violet-50 transition-colors"
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
            TH
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">Tatiana</p>
            <p className="text-xs text-neutral-400 truncate">tatyshv@finia.app</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
