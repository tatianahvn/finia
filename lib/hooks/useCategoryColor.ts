'use client'

import { useTheme } from 'next-themes'

const CATEGORY_COLORS = {
  food:       { light: '#E05A2B', dark: '#FF7A4D' },
  home:       { light: '#2563EB', dark: '#60A5FA' },
  transport:  { light: '#0D9488', dark: '#2DD4BF' },
  health:     { light: '#DC2626', dark: '#F87171' },
  leisure:    { light: '#D97706', dark: '#FCD34D' },
  education:  { light: '#7C3AED', dark: '#A78BFA' },
  savings:    { light: '#059669', dark: '#34D399' },
  fashion:    { light: '#BE185D', dark: '#F472B6' },
  tech:       { light: '#4F46E5', dark: '#818CF8' },
  other:      { light: '#78716C', dark: '#A8A29E' },
} as const

export type CategoryKey = keyof typeof CATEGORY_COLORS

export function useCategoryColor(cat: CategoryKey): string {
  const { resolvedTheme } = useTheme()
  return CATEGORY_COLORS[cat][resolvedTheme === 'dark' ? 'dark' : 'light']
}

export function useCategoryColors(): Record<CategoryKey, string> {
  const { resolvedTheme } = useTheme()
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light'
  return Object.fromEntries(
    Object.entries(CATEGORY_COLORS).map(([k, v]) => [k, v[mode]])
  ) as Record<CategoryKey, string>
}
