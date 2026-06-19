'use client'

import { useEffect, useRef, useState } from 'react'
import type { AdviceEntry } from './useAdviceHistory'

// 'idle'    — sin mes activo o consulta deshabilitada
// 'loading' — consultando la BD
// 'ready'   — la BD devolvió los consejos del mes
// 'empty'   — la BD no tiene consejos para el mes (p. ej. la generación falló)
// 'error'   — la consulta a la BD falló
export type MonthlyAdviceStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

interface Result {
  entry: AdviceEntry | null
  status: MonthlyAdviceStatus
}

/**
 * Consulta de SOLO LECTURA de los consejos del mes en visualización.
 *
 * La generación NO ocurre aquí: los consejos se generan al guardar el estado de
 * cuenta. Este hook solo trae de la BD los consejos del mes y los cachea en
 * memoria, de modo que cambiar de pestaña (mes) no vuelva a pegarle a la red.
 */
export function useMonthlyAdvice(month: string, enabled: boolean): Result {
  // Caché por mes: AdviceEntry si existe, null si la BD no tenía consejos.
  const cache = useRef<Map<string, AdviceEntry | null>>(new Map())
  const [entry, setEntry] = useState<AdviceEntry | null>(null)
  const [status, setStatus] = useState<MonthlyAdviceStatus>('idle')

  useEffect(() => {
    if (!enabled || !month) {
      setEntry(null)
      setStatus('idle')
      return
    }

    // Cache hit: servir de inmediato, sin red.
    if (cache.current.has(month)) {
      const hit = cache.current.get(month) ?? null
      setEntry(hit)
      setStatus(hit ? 'ready' : 'empty')
      return
    }

    let cancelled = false
    setEntry(null)
    setStatus('loading')

    ;(async () => {
      try {
        const res = await fetch(`/api/advice?mes=${month}`)
        if (!res.ok) throw new Error('No se pudieron consultar los consejos')
        const { advice } = (await res.json()) as { advice: AdviceEntry[] }
        const found = advice[0] ?? null
        if (cancelled) return
        cache.current.set(month, found)
        setEntry(found)
        setStatus(found ? 'ready' : 'empty')
      } catch {
        if (cancelled) return
        // No se cachea el error: permite reintentar al volver a abrir/cambiar mes.
        setEntry(null)
        setStatus('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [month, enabled])

  return { entry, status }
}
