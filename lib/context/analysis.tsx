'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ParsedStatement, StatementSummary, Transaction } from '@/types/statements'

interface AnalysisContextValue {
  statement: ParsedStatement | null
  setStatement: (s: ParsedStatement | null) => void
  addStatement: (s: ParsedStatement) => void
  loading: boolean
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null)

function mergeTransactions(existing: Transaction[], incoming: Transaction[]): Transaction[] {
  const seen = new Set(existing.map(tx => `${tx.fecha}|${tx.descripcion}|${tx.monto}|${tx.tipo}`))
  const merged = [...existing]
  for (const tx of incoming) {
    const key = `${tx.fecha}|${tx.descripcion}|${tx.monto}|${tx.tipo}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(tx)
    }
  }
  return merged.sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [statement, setStatement] = useState<ParsedStatement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('analyses')
        .select('resumen, transacciones, advertencias')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        const allTransactions = mergeTransactions(
          [],
          data.flatMap(row => row.transacciones as unknown as Transaction[])
        )

        setStatement({
          resumen: data[0].resumen as unknown as StatementSummary,
          transacciones: allTransactions,
          advertencias: (data[0].advertencias ?? []) as unknown as string[],
        })
      }
      setLoading(false)
    }
    loadAll()
  }, [])

  const addStatement = useCallback((incoming: ParsedStatement) => {
    setStatement(prev => {
      if (!prev) return incoming
      return {
        resumen: incoming.resumen,
        transacciones: mergeTransactions(prev.transacciones, incoming.transacciones),
        advertencias: incoming.advertencias,
      }
    })
  }, [])

  return (
    <AnalysisContext.Provider value={{ statement, setStatement, addStatement, loading }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis must be used inside AnalysisProvider')
  return ctx
}
