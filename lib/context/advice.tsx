'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'

export interface Consejo {
  titulo: string
  descripcion: string
  icono: string
}

export interface AdviceEntry {
  id?: string
  statement_id?: string | null
  mes: string       // "YYYY-MM"
  generado: string  // ISO timestamp
  resumen: string
  consejos: Consejo[]
}

interface AdviceContextValue {
  entries: AdviceEntry[]
  loaded: boolean
  refresh: () => Promise<void>
}

const AdviceContext = createContext<AdviceContextValue | null>(null)

// Provider montado en el layout del dashboard: carga el historial de consejos una
// vez y persiste mientras el usuario navega, ya que el layout no se desmonta al
// cambiar de página. Misma mecánica que AnalysisProvider / CategoriesProvider.
export function AdviceProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<Record<string, AdviceEntry>>({})
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/advice')
      if (res.ok) {
        const { advice } = (await res.json()) as { advice: AdviceEntry[] }
        const map: Record<string, AdviceEntry> = {}
        for (const a of advice) map[a.mes] = a
        setHistory(map)
      }
    } catch (err) {
      console.error('[advice] fetch failed:', err)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const entries = useMemo(
    () => Object.values(history).sort((a, b) => b.mes.localeCompare(a.mes)),
    [history],
  )

  return (
    <AdviceContext.Provider value={{ entries, loaded, refresh }}>
      {children}
    </AdviceContext.Provider>
  )
}

export function useAdviceHistory(): AdviceContextValue {
  const ctx = useContext(AdviceContext)
  if (!ctx) throw new Error('useAdviceHistory must be used inside AdviceProvider')
  return ctx
}
