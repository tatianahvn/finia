import type { CategoryRecord } from '@/types/statements'

export interface CategoryMeta {
  label: string
  emoji: string
  /** Tailwind classes for pill/badge — "bg-X-light text-X" pattern */
  badgeClasses: string
  /** Hex color for charts and inline styles */
  color: string
}

// Metadata visual de las categorías por defecto. Sirve como fallback cuando la
// taxonomía dinámica (BD) aún no se ha cargado, y para los slugs/alias legacy.
export const DEFAULT_CATEGORY_META: Record<string, CategoryMeta> = {
  alimentacion:         { label: 'Alimentación',  emoji: '🍽️', badgeClasses: 'bg-ambar-light text-ambar',     color: '#E05A2B' },
  transporte:           { label: 'Transporte',    emoji: '🚗', badgeClasses: 'bg-celeste-light text-celeste',  color: '#0D9488' },
  entretenimiento:      { label: 'Ocio',          emoji: '🎬', badgeClasses: 'bg-ambar-light text-ambar',     color: '#D97706' },
  salud:                { label: 'Salud',         emoji: '🩺', badgeClasses: 'bg-durazno-light text-durazno', color: '#DC2626' },
  educacion:            { label: 'Educación',     emoji: '📚', badgeClasses: 'bg-lavanda-light text-lavanda', color: '#7C3AED' },
  servicios:            { label: 'Servicios',     emoji: '💻', badgeClasses: 'bg-celeste-light text-celeste',  color: '#4F46E5' },
  vestimenta:           { label: 'Vestimenta',    emoji: '👕', badgeClasses: 'bg-rosa-light text-rosa',       color: '#BE185D' },
  ropa_calzado:         { label: 'Vestimenta',    emoji: '🥾', badgeClasses: 'bg-rosa-light text-rosa',       color: '#BE185D' },
  hogar:                { label: 'Hogar',         emoji: '🏠', badgeClasses: 'bg-celeste-light text-celeste',  color: '#2563EB' },
  viajes:               { label: 'Viajes',        emoji: '✈️', badgeClasses: 'bg-celeste-light text-celeste',  color: '#0891B2' },
  nomina:               { label: 'Nómina',        emoji: '💵', badgeClasses: 'bg-menta-light text-menta',     color: '#059669' },
  nomina_ingreso:       { label: 'Nómina',        emoji: '💵', badgeClasses: 'bg-menta-light text-menta',     color: '#059669' },
  transferencia:        { label: 'Transferencia', emoji: '🔄', badgeClasses: 'bg-lavanda-light text-lavanda', color: '#7C3AED' },
  inversiones:          { label: 'Ahorro',        emoji: '💰', badgeClasses: 'bg-menta-light text-menta',     color: '#059669' },
  impuestos:            { label: 'Impuestos',     emoji: '🧾', badgeClasses: 'bg-durazno-light text-durazno', color: '#E05A2B' },
  seguros:              { label: 'Seguros',       emoji: '🛡️', badgeClasses: 'bg-celeste-light text-celeste',  color: '#2563EB' },
  comisiones:           { label: 'Comisiones',    emoji: '💳', badgeClasses: 'bg-durazno-light text-durazno', color: '#E05A2B' },
  comisiones_bancarias: { label: 'Comisiones',    emoji: '💳', badgeClasses: 'bg-durazno-light text-durazno', color: '#E05A2B' },
  otros:                { label: 'Otros',         emoji: '📦', badgeClasses: 'bg-neutral-100 text-neutral-400', color: '#78716C' },
}

export const FALLBACK_CATEGORY: CategoryMeta = {
  label: 'Otros', emoji: '📦', badgeClasses: 'bg-neutral-100 text-neutral-400', color: '#78716C',
}

// Pill neutro para categorías descubiertas por la IA que no traen clases Tailwind
// curadas (el color sí se usa en gráficas vía `color`).
const AI_BADGE_CLASSES = 'bg-neutral-100 text-neutral-600'

// Paleta para asignar un color estable a categorías de la IA sin color propio.
const AI_PALETTE = ['#E05A2B', '#0D9488', '#7C3AED', '#2563EB', '#DC2626', '#D97706', '#059669', '#BE185D', '#0891B2', '#4F46E5']

function colorForSlug(slug: string): string {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  return AI_PALETTE[hash % AI_PALETTE.length]
}

export function metaFromRecord(rec: CategoryRecord): CategoryMeta {
  const isDefault = !!DEFAULT_CATEGORY_META[rec.slug] && rec.origin === 'default'
  return {
    label: rec.label,
    emoji: rec.emoji || (isDefault ? DEFAULT_CATEGORY_META[rec.slug].emoji : '🏷️'),
    color: rec.color || (isDefault ? DEFAULT_CATEGORY_META[rec.slug].color : colorForSlug(rec.slug)),
    badgeClasses: rec.badge_classes || (isDefault ? DEFAULT_CATEGORY_META[rec.slug].badgeClasses : AI_BADGE_CLASSES),
  }
}

// Registro dinámico poblado por CategoriesProvider al cargar la taxonomía del
// usuario desde la BD. Permite que `getCategoryMeta` (usado de forma síncrona en
// muchos componentes y en el PDF) resuelva también las categorías de la IA sin
// reescribir cada call site.
const dynamicRegistry: Record<string, CategoryMeta> = {}

export function registerCategories(records: CategoryRecord[]): void {
  for (const rec of records) {
    if (rec.slug) dynamicRegistry[rec.slug] = metaFromRecord(rec)
  }
}

export function getCategoryMeta(key: string): CategoryMeta {
  return dynamicRegistry[key] ?? DEFAULT_CATEGORY_META[key] ?? FALLBACK_CATEGORY
}
