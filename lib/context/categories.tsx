'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { CategoryRecord } from '@/types/statements'
import { getCategoryMeta, registerCategories, type CategoryMeta } from '@/lib/categories'

interface CategoriesContextValue {
  categories: CategoryRecord[]
  /** Metadata visual de un slug (dinámica + fallback estático). */
  getMeta: (slug: string) => CategoryMeta
  loading: boolean
  refresh: () => Promise<void>
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) return
      const { categories: rows }: { categories: CategoryRecord[] } = await res.json()
      registerCategories(rows)          // alimenta el registro síncrono de lib/categories
      setCategories(rows)
    } catch {
      // best-effort: la UI degrada a los defaults estáticos
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // `getCategoryMeta` ya consulta el registro dinámico; se expone aquí para que
  // los consumidores re-rendericen cuando la taxonomía termina de cargar.
  const getMeta = useCallback((slug: string) => getCategoryMeta(slug), [])

  return (
    <CategoriesContext.Provider value={{ categories, getMeta, loading, refresh }}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategories must be used inside CategoriesProvider')
  return ctx
}
