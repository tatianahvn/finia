'use client'

import { useEffect, useState, useCallback } from 'react'
import { Eye, Pencil, Trash2, FileText, Building2, CalendarRange, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAnalysis } from '@/lib/context/analysis'
import type { StatementSummary, Transaction } from '@/types/statements'
import DeleteStatementModal from './DeleteStatementModal'
import StatementDetailModal from './StatementDetailModal'

interface AnalysisRow {
  id: string
  created_at: string
  filename: string
  resumen: StatementSummary
  transacciones_raw: Transaction[]
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatPeriod(s: StatementSummary | undefined): string {
  if (!s) return '—'
  const inicio = formatDate(s.periodo_inicio)
  const fin = formatDate(s.periodo_fin)
  return `${inicio} — ${fin}`
}

interface BankStatementsProps {
  /** Cambiar este valor fuerza una recarga de la lista (p. ej. tras guardar). */
  reloadKey?: number
}

export default function BankStatements({ reloadKey = 0 }: BankStatementsProps) {
  const { reloadStatement } = useAnalysis()
  const [rows, setRows] = useState<AnalysisRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState<AnalysisRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Modal de detalle / edición.
  const [detail, setDetail] = useState<{ row: AnalysisRow; mode: 'view' | 'edit' } | null>(null)
  const [detailTxs, setDetailTxs] = useState<Transaction[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [savingDetail, setSavingDetail] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setRows([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('statements')
      .select('id, created_at, filename, resumen, transacciones_raw')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setRows((data ?? []) as unknown as AnalysisRow[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load, reloadKey])

  const openDetail = useCallback(async (row: AnalysisRow, mode: 'view' | 'edit') => {
    setDetail({ row, mode })
    setDetailTxs([])
    setDetailLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setDetailLoading(false)
      return
    }

    // Capa editable (con ids reales) para poder persistir cambios de categoría.
    const { data } = await supabase
      .from('transactions')
      .select('id, fecha, descripcion, comercio, monto, tipo, categoria, confianza')
      .eq('user_id', user.id)
      .eq('statement_id', row.id)
      .order('fecha', { ascending: false })

    setDetailTxs((data ?? []) as unknown as Transaction[])
    setDetailLoading(false)
  }, [])

  const closeDetail = useCallback(() => {
    if (savingDetail) return
    setDetail(null)
    setDetailTxs([])
  }, [savingDetail])

  // Persiste únicamente las categorías que cambiaron, al dar "Guardar cambios".
  const handleSaveDetail = useCallback(async (updated: Transaction[]) => {
    const changed = updated.filter(tx => {
      const orig = detailTxs.find(o => o.id === tx.id)
      return orig && orig.categoria !== tx.categoria
    })

    if (changed.length === 0) return

    setSavingDetail(true)
    try {
      await Promise.all(
        changed.map(async tx => {
          const res = await fetch(`/api/transactions/${tx.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoria: tx.categoria }),
          })
          if (!res.ok) throw new Error('No se pudo actualizar la categoría')
        })
      )
      setDetailTxs(updated)
      await reloadStatement()
    } finally {
      setSavingDetail(false)
    }
  }, [detailTxs, reloadStatement])

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/statements/${pendingDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar')
      setPendingDelete(null)
      await load()
      await reloadStatement()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-lg font-semibold text-neutral-900">Mis estados de cuenta</h2>
        <p className="text-xs text-neutral-400">{rows.length} estado{rows.length === 1 ? '' : 's'} de cuenta</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 animate-pulse flex-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-neutral-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-center flex-1">
          <FileText size={28} className="text-neutral-300" />
          <p className="text-sm text-neutral-400">Aún no tienes estados de cuenta cargados</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 -mr-1 min-h-0">
          {rows.map((row) => (
            <AnalysisCard
              key={row.id}
              row={row}
              onView={() => openDetail(row, 'view')}
              onEdit={() => openDetail(row, 'edit')}
              onAskDelete={() => setPendingDelete(row)}
            />
          ))}
        </div>
      )}

      <DeleteStatementModal
        open={!!pendingDelete}
        onClose={() => { if (!deleting) setPendingDelete(null) }}
        onConfirm={handleDelete}
        loading={deleting}
        bankName={pendingDelete?.resumen?.banco ?? '—'}
        totalTransactions={pendingDelete?.transacciones_raw?.length ?? 0}
        periodLabel={formatPeriod(pendingDelete?.resumen)}
      />

      <StatementDetailModal
        open={!!detail}
        mode={detail?.mode ?? 'view'}
        filename={detail?.row?.filename ?? ''}
        resumen={detail?.row?.resumen ?? null}
        transactions={detailTxs}
        loading={detailLoading}
        saving={savingDetail}
        onClose={closeDetail}
        onSave={handleSaveDetail}
      />
    </section>
  )
}

interface CardProps {
  row: AnalysisRow
  onView: () => void
  onEdit: () => void
  onAskDelete: () => void
}

function AnalysisCard({ row, onView, onEdit, onAskDelete }: CardProps) {
  const total = row.transacciones_raw?.length ?? 0
  const banco = row.resumen?.banco?.trim() || '—'

  return (
    <div className="rounded-xl border border-violet-300 transition-all hover:shadow-lg hover:shadow-violet-200/60 hover:border-violet-400">
      <div className="flex items-center gap-4 p-4">
        <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <Building2 size={25} className="text-violet-700" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-semibold text-neutral-900 truncate">{banco}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-sm font-medium">
              <Receipt size={12} />
              {total} transacción{total === 1 ? '' : 'es'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500">
            <CalendarRange size={12} />
            <span>{formatPeriod(row.resumen)}</span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 truncate">
            {row.filename} · cargado {formatDate(row.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onView}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-violet-700 hover:bg-violet-50 transition-colors"
          >
            <Eye size={15} />
            Ver detalles
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-violet-700 hover:bg-violet-50 transition-colors"
          >
            <Pencil size={14} />
            Editar
          </button>
          <button
            onClick={onAskDelete}
            aria-label="Eliminar estado de cuenta"
            className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
