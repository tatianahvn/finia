import type { CategoryRecord } from '@/types/statements'

export interface CategoryMeta {
  label: string
  emoji: string
  /** Tailwind classes for pill/badge — "bg-X-light text-X" pattern */
  badgeClasses: string
  /** Hex color for charts and inline styles */
  color: string
}

// -----------------------------------------------------------------------------
// Fuente de verdad de los defaults: el seed de categorías GLOBALES en
// `supabase/migrations/004_categories.sql` (§3). El arreglo de abajo es ese
// mismo seed embebido como fallback offline / primer render — DERIVADO del seed,
// no una taxonomía paralela. Mantener en sync con la migración.
//
// En runtime la BD siempre gana: `CategoriesProvider` carga `/api/categories` y
// puebla `dynamicRegistry`, que tiene prioridad en `getCategoryMeta`. Este mapa
// solo se usa mientras ese fetch resuelve (o si falla / sin conexión).
// -----------------------------------------------------------------------------
const DEFAULT_CATEGORY_RECORDS: CategoryRecord[] = [
  { slug: 'alimentacion',   label: 'Alimentación',  emoji: '🍽️', color: '#E05A2B', badge_classes: 'bg-ambar-light text-ambar',       created_by: 'system' },
  { slug: 'transporte',     label: 'Transporte',    emoji: '🚗', color: '#0D9488', badge_classes: 'bg-celeste-light text-celeste',    created_by: 'system' },
  { slug: 'entretenimiento', label: 'Ocio',         emoji: '🎬', color: '#D97706', badge_classes: 'bg-ambar-light text-ambar',       created_by: 'system' },
  { slug: 'salud',          label: 'Salud',         emoji: '🩺', color: '#DC2626', badge_classes: 'bg-durazno-light text-durazno',    created_by: 'system' },
  { slug: 'educacion',      label: 'Educación',     emoji: '📚', color: '#7C3AED', badge_classes: 'bg-lavanda-light text-lavanda',    created_by: 'system' },
  { slug: 'servicios',      label: 'Servicios',     emoji: '💻', color: '#4F46E5', badge_classes: 'bg-celeste-light text-celeste',    created_by: 'system' },
  { slug: 'vestimenta',     label: 'Vestimenta',    emoji: '👕', color: '#BE185D', badge_classes: 'bg-rosa-light text-rosa',          created_by: 'system' },
  { slug: 'hogar',          label: 'Hogar',         emoji: '🏠', color: '#2563EB', badge_classes: 'bg-celeste-light text-celeste',    created_by: 'system' },
  { slug: 'viajes',         label: 'Viajes',        emoji: '✈️', color: '#0891B2', badge_classes: 'bg-celeste-light text-celeste',    created_by: 'system' },
  { slug: 'nomina',         label: 'Nómina',        emoji: '💵', color: '#059669', badge_classes: 'bg-menta-light text-menta',        created_by: 'system' },
  { slug: 'transferencia',  label: 'Transferencia', emoji: '🔄', color: '#7C3AED', badge_classes: 'bg-lavanda-light text-lavanda',    created_by: 'system' },
  { slug: 'inversiones',    label: 'Ahorro',        emoji: '💰', color: '#059669', badge_classes: 'bg-menta-light text-menta',        created_by: 'system' },
  { slug: 'impuestos',      label: 'Impuestos',     emoji: '🧾', color: '#E05A2B', badge_classes: 'bg-durazno-light text-durazno',    created_by: 'system' },
  { slug: 'seguros',        label: 'Seguros',       emoji: '🛡️', color: '#2563EB', badge_classes: 'bg-celeste-light text-celeste',    created_by: 'system' },
  { slug: 'comisiones',     label: 'Comisiones',    emoji: '💳', color: '#E05A2B', badge_classes: 'bg-durazno-light text-durazno',    created_by: 'system' },
  { slug: 'otros',          label: 'Otros',         emoji: '📦', color: '#78716C', badge_classes: 'bg-neutral-100 text-neutral-400',  created_by: 'system' },
]

export const FALLBACK_CATEGORY: CategoryMeta = {
  label: 'Otros', emoji: '📦', badgeClasses: 'bg-neutral-100 text-neutral-400', color: '#78716C',
}

// Slugs legacy/alternos que la IA o datos antiguos pueden emitir → slug canónico.
// Son redirects (no duplican metadata visual): resuelven contra la categoría real
// en `dynamicRegistry`/`DEFAULT_CATEGORY_META`.
const CATEGORY_ALIASES: Record<string, string> = {
  ropa_calzado: 'vestimenta',
  nomina_ingreso: 'nomina',
  comisiones_bancarias: 'comisiones',
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

// Mapa de fallback derivado del seed (no se mantiene a mano). Los defaults traen
// metadata visual completa, así que no necesita consultar otros mapas.
export const DEFAULT_CATEGORY_META: Record<string, CategoryMeta> = Object.fromEntries(
  DEFAULT_CATEGORY_RECORDS.map((rec): [string, CategoryMeta] => [rec.slug, {
    label: rec.label,
    emoji: rec.emoji ?? '🏷️',
    color: rec.color ?? FALLBACK_CATEGORY.color,
    badgeClasses: rec.badge_classes ?? AI_BADGE_CLASSES,
  }]),
)

export function metaFromRecord(rec: CategoryRecord): CategoryMeta {
  const fallback = rec.created_by === 'system' ? DEFAULT_CATEGORY_META[rec.slug] : undefined
  return {
    label: rec.label,
    emoji: rec.emoji || fallback?.emoji || '🏷️',
    color: rec.color || fallback?.color || colorForSlug(rec.slug),
    badgeClasses: rec.badge_classes || fallback?.badgeClasses || AI_BADGE_CLASSES,
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
  const slug = CATEGORY_ALIASES[key] ?? key
  return dynamicRegistry[slug] ?? DEFAULT_CATEGORY_META[slug] ?? FALLBACK_CATEGORY
}
