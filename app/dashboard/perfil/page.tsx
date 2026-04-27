'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Zap, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCredits } from '@/lib/hooks/useCredits'
import type { StatementSummary } from '@/types/statements'

interface AnalysisRow {
  id: string
  created_at: string
  filename: string
  resumen: StatementSummary
}

export default function PerfilPage() {
  const router = useRouter()
  const { balance, loading: creditsLoading } = useCredits()
  const [email, setEmail] = useState<string | null>(null)
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email ?? null)

      const { data } = await supabase
        .from('analyses')
        .select('id, created_at, filename, resumen')
        .order('created_at', { ascending: false })
        .limit(20)

      setAnalyses((data ?? []) as unknown as AnalysisRow[])
      setLoadingData(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-neutral-900">Perfil</h1>

      <div className="flex flex-col gap-6 items-center">
        {/* Account card */}
        <section className="bg-white w-2xl rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-800 font-bold text-base shrink-0">
              {email ? email[0].toUpperCase() : '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{email ?? '—'}</p>
              <p className="text-xs text-neutral-400 mt-0.5">Cuenta Finia</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <LogOut size={16} />
            {signingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </section>

        {/* Credits card */}
        <section className="bg-white w-2xl rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Zap size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Créditos disponibles</p>
                <p className="text-xs text-neutral-400">1 crédito = 1 análisis de estado de cuenta</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-violet-700">
                {creditsLoading ? '—' : (balance ?? 0)}
              </p>
              <p className="text-xs text-neutral-400">crédito{balance === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-700 text-white text-sm font-semibold rounded-xl hover:bg-violet-800 transition-colors"
            >
              <Zap size={14} />
              Comprar más créditos
            </Link>
          </div>
        </section>

        {/* Analyses history */}
        <section className="bg-white w-2xl rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold tracking-widest text-violet-700 uppercase mb-4">
            Historial de análisis
          </h2>

          {loadingData ? (
            <div className="flex flex-col gap-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-neutral-100" />
              ))}
            </div>
          ) : analyses.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4 text-center">
              Aún no tienes análisis guardados
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-100">
              {analyses.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{a.filename}</p>
                    <p className="text-xs text-neutral-400">
                      {a.resumen?.banco ?? '—'} · {a.resumen?.periodo_inicio ?? ''} — {a.resumen?.periodo_fin ?? ''}
                    </p>
                  </div>
                  <p className="text-xs text-neutral-400 shrink-0">
                    {new Date(a.created_at).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
