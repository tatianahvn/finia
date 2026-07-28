'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UploadCloud, ArrowLeft } from 'lucide-react'

const BASE = '/dashboard/estados-de-cuenta'
const NUEVO = `${BASE}/nuevo`

export default function EstadosDeCuentaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isNuevo = pathname === NUEVO

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            {isNuevo ? 'Nuevo estado de cuenta' : 'Mis estados de cuenta'}
          </h1>
          <p className="text-base text-neutral-500 mt-1">
            {isNuevo
              ? 'Sube un estado de cuenta bancario en PDF para analizarlo.'
              : 'Consulta los estados de cuenta que ya analizaste o sube uno nuevo.'}
          </p>
        </div>

        {isNuevo ? (
          <Link
            href={BASE}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-semibold
              bg-white text-neutral-600 border border-neutral-200
              hover:bg-neutral-50 hover:text-neutral-800 transition-colors"
          >
            <ArrowLeft size={18} />
            Volver
          </Link>
        ) : (
          <Link
            href={NUEVO}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-semibold
              bg-violet-700 text-white hover:bg-violet-800 shadow-sm transition-colors"
          >
            <UploadCloud size={18} />
            Subir nuevo estado de cuenta
          </Link>
        )}
      </div>

      <div className="flex-1 min-h-0 mt-5">
        {children}
      </div>
    </div>
  )
}
