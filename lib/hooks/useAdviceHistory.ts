'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Consejo {
  titulo: string
  descripcion: string
  icono: string
}

export interface AdviceEntry {
  mes: string       // "YYYY-MM"
  generado: string  // ISO timestamp
  resumen: string
  consejos: Consejo[]
}

const STORAGE_KEY = 'finia_advice_history'

function load(): Record<string, AdviceEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function useAdviceHistory() {
  const [history, setHistory] = useState<Record<string, AdviceEntry>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setHistory(load())
    setLoaded(true)
  }, [])

  const save = useCallback((entry: AdviceEntry) => {
    setHistory(prev => {
      const next = { ...prev, [entry.mes]: entry }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const entries = Object.values(history).sort((a, b) => b.mes.localeCompare(a.mes))

  return { entries, save, loaded }
}
