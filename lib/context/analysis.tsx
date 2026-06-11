'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, ParsedStatement, StatementSummary, Transaction } from '@/types/statements'

interface AnalysisContextValue {
  statement: ParsedStatement | null
  setStatement: (s: ParsedStatement | null) => void
  updateTransactionCategory: (id: string, categoria: Category) => void
  refresh: () => Promise<void>
  loading: boolean
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [statement, setStatement] = useState<ParsedStatement | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setStatement(null)
      setLoading(false)
      return
    }

    // Resumen + advertencias del estado de cuenta más reciente.
    const { data: latest } = await supabase
      .from('statements')
      .select('resumen, advertencias')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!latest) {
      setStatement(null)
      setLoading(false)
      return
    }

    // Vista unificada de transacciones (cross-banco, cross-archivo) con ids reales.
    const { data: txs } = await supabase
      .from('transactions')
      .select('id, fecha, descripcion, comercio, monto, tipo, categoria, confianza')
      .eq('user_id', user.id)
      .order('fecha', { ascending: true })

    setStatement({
      resumen: latest.resumen as unknown as StatementSummary,
      transacciones: (txs ?? []) as unknown as Transaction[],
      advertencias: (latest.advertencias ?? []) as unknown as string[],
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    async function run() {
      await refresh()
    }
    run()
  }, [refresh])

  const updateTransactionCategory = useCallback((id: string, categoria: Category) => {
    setStatement(prev => {
      if (!prev) return prev
      return {
        ...prev,
        transacciones: prev.transacciones.map(tx =>
          tx.id === id ? { ...tx, categoria, confianza: 1 } : tx
        ),
      }
    })
  }, [])

  return (
    <AnalysisContext.Provider value={{ statement, setStatement, updateTransactionCategory, refresh, loading }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis must be used inside AnalysisProvider')
  return ctx
}
