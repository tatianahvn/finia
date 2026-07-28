'use client'

import type { Transaction } from '@/types/statements'
import type { AdviceEntry } from '@/lib/context/advice'

const CARGO_TYPES = new Set(['cargo', 'transferencia_enviada', 'retiro', 'comision'])

const LABEL: Record<string, string> = {
  alimentacion:         'Alimentación',
  transporte:           'Transporte',
  entretenimiento:      'Ocio y entretenimiento',
  salud:                'Salud',
  educacion:            'Educación',
  servicios:            'Servicios digitales',
  vestimenta:           'Moda y ropa',
  ropa_calzado:         'Moda y ropa',
  hogar:                'Hogar',
  viajes:               'Viajes',
  nomina:               'Nómina',
  transferencia:        'Transferencias',
  inversiones:          'Ahorro e inversión',
  impuestos:            'Impuestos',
  seguros:              'Seguros',
  comisiones:           'Comisiones',
  comisiones_bancarias: 'Comisiones bancarias',
  otros:                'Otros',
}

export interface AdvicePayload {
  categorias: { label: string; total: number; porcentaje: number }[]
  totalGastos: number
}

// Agrega los cargos por categoría para alimentar al modelo de consejos.
export function buildAdvicePayload(transactions: Transaction[]): AdvicePayload {
  const totals = new Map<string, number>()
  for (const tx of transactions) {
    if (!CARGO_TYPES.has(tx.tipo)) continue
    totals.set(tx.categoria, (totals.get(tx.categoria) ?? 0) + tx.monto)
  }
  const totalGastos = [...totals.values()].reduce((a, b) => a + b, 0)
  const categorias = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => ({
      label: LABEL[cat] ?? cat,
      total,
      porcentaje: totalGastos > 0 ? (total / totalGastos) * 100 : 0,
    }))
  return { categorias, totalGastos }
}

// Lista de meses ("YYYY-MM") presentes en las transacciones, ascendente.
export function monthsOf(transactions: Transaction[]): string[] {
  return Array.from(new Set(transactions.map(tx => tx.fecha.slice(0, 7)))).sort()
}

// ¿Hay cargos (gastos) en estas transacciones? Si no los hay, no tiene sentido
// consultar ni esperar consejos para el periodo.
export function hasExpenses(transactions: Transaction[]): boolean {
  return transactions.some(tx => CARGO_TYPES.has(tx.tipo) && tx.monto > 0)
}

// Genera los consejos de UN mes con la IA y los persiste en el historial.
// Devuelve la entrada generada, o null si el mes no tiene gastos.
// Lanza si la petición de generación falla (para que el llamador decida).
export async function generateMonthlyAdvice(opts: {
  transactions: Transaction[]  // transacciones del mes
  month: string                // "YYYY-MM"
  statementId: string | null
}): Promise<AdviceEntry | null> {
  const { transactions, month, statementId } = opts
  const payload = buildAdvicePayload(transactions)
  if (payload.totalGastos <= 0) return null

  const res = await fetch('/api/statements/advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'No se pudieron generar los consejos')

  const entry: AdviceEntry = {
    statement_id: statementId,
    mes: month,
    generado: new Date().toISOString(),
    resumen: json.resumen,
    consejos: json.consejos,
  }

  // Persiste de forma idempotente por mes (la API reemplaza si ya existía).
  await fetch('/api/advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      statement_id: entry.statement_id ?? null,
      mes: entry.mes,
      resumen: entry.resumen,
      consejos: entry.consejos,
    }),
  })

  return entry
}
