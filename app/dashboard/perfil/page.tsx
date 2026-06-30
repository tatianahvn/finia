'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCredits } from '@/lib/hooks/useCredits'

export default function PerfilPage() {
  const router = useRouter()
  const { balance, loading: creditsLoading } = useCredits()
  const [email, setEmail] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email ?? null)
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
      <h1 className="text-3xl font-bold text-neutral-900">Perfil</h1>

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
      </div>
    </div>
  )
}
