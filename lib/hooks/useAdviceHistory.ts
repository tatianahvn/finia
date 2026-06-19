'use client'

import { useState, useEffect, useCallback } from 'react'

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

export function useAdviceHistory() {
  const [history, setHistory] = useState<Record<string, AdviceEntry>>({})
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/advice')
      if (res.ok) {
        const { advice } = await res.json() as { advice: AdviceEntry[] }
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
    refresh()
  }, [refresh])

  const entries = Object.values(history).sort((a, b) => b.mes.localeCompare(a.mes))

  return { entries, loaded, refresh }
}
