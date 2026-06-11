'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, FileCheck2, X, Building2, CalendarRange, FileText, Receipt } from 'lucide-react'
import type { Category, ParsedStatement, Transaction } from '@/types/statements'
import { CATEGORIES, getCategoryMeta } from '@/lib/categories'

const CATEGORY_OPTIONS: Category[] = [
  'alimentacion', 'transporte', 'entretenimiento', 'salud', 'educacion',
  'servicios', 'vestimenta', 'hogar', 'viajes', 'nomina', 'transferencia',
  'inversiones', 'impuestos', 'seguros', 'comisiones', 'otros',
]

const CARGO_TYPES = new Set(['cargo', 'transferencia_enviada', 'retiro', 'comision'])

interface Props {
  open: boolean
  filename: string
  statement: ParsedStatement | null
  saving: boolean
  onClose: () => void
  /** Devuelve el estado de cuenta con las categorías ajustadas por el usuario. */
  onSave: (data: ParsedStatement) => void
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatMoney(value: number, currency = 'MXN'): string {
  return value.toLocaleString('es-MX', { style: 'currency', currency, maximumFractionDigits: 2 })
}

export default function StatementReviewModal({
  open,
  filename,
  statement,
  saving,
  onClose,
  onSave,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [transacciones, setTransacciones] = useState<Transaction[]>([])

  // Cada vez que se abre con un nuevo análisis, reinicia el borrador editable.
  useEffect(() => {
    setTransacciones(statement?.transacciones ?? [])
  }, [statement])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, saving])

  const currency = statement?.resumen?.moneda ?? 'MXN'
  const banco = statement?.resumen?.banco?.trim() || '—'
  const periodo = statement
    ? `${formatDate(statement.resumen.periodo_inicio)} — ${formatDate(statement.resumen.periodo_fin)}`
    : '—'

  const ordered = useMemo(
    () =>
      transacciones
        .map((tx, index) => ({ tx, index }))
        .sort((a, b) => b.tx.fecha.localeCompare(a.tx.fecha)),
    [transacciones]
  )

  if (!open || !statement) return null

  const changeCategory = (index: number, categoria: Category) => {
    setTransacciones(prev =>
      prev.map((tx, i) => (i === index ? { ...tx, categoria, confianza: 1 } : tx))
    )
  }

  const handleSave = () => {
    onSave({ ...statement, transacciones })
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === overlayRef.current && !saving) onClose() }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <FileCheck2 size={16} className="text-violet-700" />
            </div>
            <p className="text-sm font-bold text-neutral-900">Revisar estado de cuenta</p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col gap-4 px-6 py-5 min-h-0 overflow-hidden">
          <p className="shrink-0 text-sm text-neutral-600 leading-relaxed">
            Verifica que este sea el estado de cuenta que deseas guardar. Ajusta o
            corrige las categorías que la IA asignó y guarda tus cambios para continuar.
          </p>

          {/* Banco y periodo — datos principales */}
          <div className="shrink-0 rounded-2xl bg-violet-50 border border-violet-100 px-5 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <Building2 size={24} className="text-violet-700" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-neutral-900 truncate" title={banco}>{banco}</p>
              <div className="flex items-center gap-1.5 mt-0.5 text-sm font-medium text-violet-700">
                <CalendarRange size={14} className="shrink-0" />
                <span className="truncate">{periodo}</span>
              </div>
            </div>
          </div>

          {/* Metadatos secundarios */}
          <div className="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
            <span className="flex items-center gap-1 min-w-0">
              <FileText size={12} className="shrink-0" />
              <span className="truncate" title={filename}>{filename}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Receipt size={12} />
              {transacciones.length} transacción{transacciones.length === 1 ? '' : 'es'}
            </span>
          </div>

          {/* Detalle de transacciones */}
          <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-neutral-200 divide-y divide-neutral-100">
            {ordered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-400">
                No se encontraron transacciones en este estado de cuenta
              </p>
            ) : (
              ordered.map(({ tx, index }) => {
                const esCargo = CARGO_TYPES.has(tx.tipo)
                const meta = getCategoryMeta(tx.categoria)
                return (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-neutral-50"
                  >
                    <div className="col-span-2 text-xs text-neutral-500">
                      {formatDate(tx.fecha)}
                    </div>
                    <div className="col-span-5 min-w-0">
                      <p className="text-sm text-neutral-900 truncate">
                        {tx.comercio || tx.descripcion}
                      </p>
                      {tx.comercio && tx.comercio !== tx.descripcion && (
                        <p className="text-xs text-neutral-400 truncate">{tx.descripcion}</p>
                      )}
                    </div>
                    <div className="col-span-3">
                      <div
                        title="Clic para cambiar la categoría"
                        className={`group relative inline-flex items-center rounded-full w-fit ring-1 ring-inset ring-black/10 transition hover:ring-2 hover:ring-black/25 hover:shadow-sm cursor-pointer ${meta.badgeClasses}`}
                      >
                        <select
                          value={CATEGORY_OPTIONS.includes(tx.categoria) ? tx.categoria : 'otros'}
                          disabled={saving}
                          onChange={e => changeCategory(index, e.target.value as Category)}
                          className="appearance-none bg-transparent text-xs font-medium pl-2.5 pr-7 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-black/30 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {CATEGORY_OPTIONS.map(opt => (
                            <option key={opt} value={opt} className="bg-white text-neutral-900">
                              {CATEGORIES[opt]?.emoji} {CATEGORIES[opt]?.label ?? opt}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={13}
                          aria-hidden
                          className="pointer-events-none absolute right-1.5 opacity-60 transition group-hover:opacity-100"
                        />
                      </div>
                    </div>
                    <div
                      className={`col-span-2 text-right text-sm font-medium ${esCargo ? 'text-neutral-900' : 'text-menta'}`}
                    >
                      {esCargo ? '−' : '+'}{formatMoney(tx.monto, currency)}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-neutral-100 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-violet-800 hover:bg-violet-900 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
