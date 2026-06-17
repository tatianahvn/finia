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

  // Registra (o reemplaza) los consejos de un mes. Actualiza el estado de forma
  // optimista y persiste en la BD. No lanza: si falla el guardado, la UI sigue
  // mostrando los consejos recién generados.
  const save = useCallback(async (entry: AdviceEntry) => {
    setHistory(prev => ({ ...prev, [entry.mes]: entry }))
    try {
      const res = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement_id: entry.statement_id ?? null,
          mes: entry.mes,
          resumen: entry.resumen,
          consejos: entry.consejos,
        }),
      })
      if (res.ok) {
        const { advice } = await res.json() as { advice: AdviceEntry }
        setHistory(prev => ({ ...prev, [advice.mes]: advice }))
      }
    } catch (err) {
      console.error('[advice] save failed:', err)
    }
  }, [])

  const remove = useCallback(async (id: string, mes: string) => {
    setHistory(prev => {
      const next = { ...prev }
      delete next[mes]
      return next
    })
    try {
      await fetch(`/api/advice/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error('[advice] delete failed:', err)
    }
  }, [])

  const entries = Object.values(history).sort((a, b) => b.mes.localeCompare(a.mes))

  return { entries, save, remove, loaded, refresh }
}
