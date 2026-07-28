'use client'

import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer'
import type { Transaction } from '@/types/statements'
import { getCategoryMeta } from '@/lib/categories'
import type { AdviceEntry } from '@/lib/context/advice'

// Twemoji para que los íconos de los consejos no salgan como cuadros
Font.registerEmojiSource({
  format: 'png',
  url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/',
})

const CARGO_TYPES = new Set(['cargo', 'transferencia_enviada', 'retiro', 'comision'])

// Paleta del proyecto traducida a hex (Tailwind violet/emerald/red/neutral)
const C = {
  brand:       '#6D28D9',  // violet-700
  brandSoft:   '#EDE9FE',  // violet-100
  brandBorder: '#DDD6FE',  // violet-200
  brandDeep:   '#5B21B6',  // violet-800
  text:        '#111827',  // neutral-900
  muted:       '#6B7280',  // neutral-500
  light:       '#9CA3AF',  // neutral-400
  border:      '#E5E7EB',  // neutral-200
  borderLight: '#F3F4F6',  // neutral-100
  bg:          '#F9FAFB',  // neutral-50
  posBg:       '#D1FAE5',  // emerald-100
  posDeep:     '#047857',  // emerald-700
  pos:         '#059669',  // emerald-600
  negBg:       '#FEE2E2',  // red-100
  negDeep:     '#B91C1C',  // red-700
  neg:         '#DC2626',  // red-600
}

const s = StyleSheet.create({
  page: {
    paddingTop: 32, paddingBottom: 40, paddingHorizontal: 32,
    fontSize: 10, color: C.text, fontFamily: 'Helvetica',
  },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 18, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  brand:       { fontSize: 22, color: C.brand, fontFamily: 'Helvetica-Bold' },
  reportLabel: { fontSize: 8, color: C.light, marginTop: 3 },
  metaRight:   { textAlign: 'right' },
  reportTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', textTransform: 'capitalize' },

  // Section
  section:      { marginBottom: 18 },
  sectionTitle: {
    fontSize: 9, color: C.brand, fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10,
  },

  // Stat cards
  statRow:   { flexDirection: 'row', gap: 8, marginBottom: 18 },
  statCard:  { flex: 1, padding: 10, borderRadius: 8 },
  statLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', marginBottom: 4, letterSpacing: 0.6 },
  statValue: { fontSize: 12, fontFamily: 'Helvetica-Bold' },

  // Generic table
  thead: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: C.border,
    paddingBottom: 6,
  },
  th: {
    fontSize: 7, color: C.light, fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  tr: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5, borderBottomColor: C.borderLight,
  },
  td: { fontSize: 8.5, color: C.text },

  // Pill (categoría)
  pill: { flexDirection: 'row', alignItems: 'center' },
  pillDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },

  // Advice
  adviceResumen: {
    backgroundColor: C.brandSoft, borderWidth: 1, borderColor: C.brandBorder,
    borderRadius: 8, padding: 12, marginBottom: 10,
  },
  adviceResumenTitle: { fontSize: 9, color: C.brandDeep, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  adviceResumenText:  { fontSize: 9, color: C.brandDeep, lineHeight: 1.45 },
  adviceCard: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.borderLight,
    borderRadius: 8, padding: 10, flexDirection: 'row',
    width: '48.5%', marginBottom: 8,
  },
  adviceIcon:  { fontSize: 13, marginRight: 6 },
  adviceTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  adviceDesc:  { fontSize: 8, color: C.muted, lineHeight: 1.45 },

  // Footer
  footer: {
    position: 'absolute', bottom: 18, left: 32, right: 32,
    textAlign: 'center', fontSize: 7, color: C.light,
  },
})

function fmtCurrency(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })
}
function fmtAmountShort(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}
function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

interface ConceptRow {
  name: string
  total: number
  count: number
  category: string
}

function buildConceptRows(transactions: Transaction[]): ConceptRow[] {
  const groups = new Map<string, { total: number; count: number; votes: Map<string, number> }>()
  for (const tx of transactions) {
    if (!CARGO_TYPES.has(tx.tipo)) continue
    const name = (tx.comercio?.trim() || tx.descripcion.trim())
    const prev = groups.get(name) ?? { total: 0, count: 0, votes: new Map<string, number>() }
    prev.total += tx.monto
    prev.count += 1
    prev.votes.set(tx.categoria, (prev.votes.get(tx.categoria) ?? 0) + 1)
    groups.set(name, prev)
  }
  return [...groups.entries()]
    .map(([name, { total, count, votes }]) => ({
      name, total, count,
      category: [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0],
    }))
    .sort((a, b) => b.total - a.total)
}

interface Props {
  month: string
  transactions: Transaction[]
  advice: AdviceEntry | null
}

export default function MonthlyReportPdf({ month, transactions, advice }: Props) {
  const ingresos = transactions.filter(t => !CARGO_TYPES.has(t.tipo)).reduce((a, t) => a + t.monto, 0)
  const egresos  = transactions.filter(t =>  CARGO_TYPES.has(t.tipo)).reduce((a, t) => a + t.monto, 0)
  const balance  = ingresos - egresos

  const totals = new Map<string, number>()
  for (const tx of transactions) {
    if (!CARGO_TYPES.has(tx.tipo)) continue
    totals.set(tx.categoria, (totals.get(tx.categoria) ?? 0) + tx.monto)
  }
  const sortedCats = [...totals.entries()].sort((a, b) => b[1] - a[1])
  const max = sortedCats[0]?.[1] ?? 1

  const conceptRows = buildConceptRows(transactions)
  const sortedTx = [...transactions].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const generadoEl = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <Document title={`Finia · Reporte ${month}`} author="Finia">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header} fixed>
          <View>
            <Text style={s.brand}>finia</Text>
            <Text style={s.reportLabel}>Reporte mensual</Text>
          </View>
          <View style={s.metaRight}>
            <Text style={s.reportTitle}>{monthLabel(month)}</Text>
            <Text style={s.reportLabel}>Generado el {generadoEl}</Text>
          </View>
        </View>

        {/* Stat cards */}
        <View style={s.statRow}>
          <View style={[s.statCard, { backgroundColor: C.posBg }]}>
            <Text style={[s.statLabel, { color: C.pos }]}>INGRESOS</Text>
            <Text style={[s.statValue, { color: C.posDeep }]}>{fmtCurrency(ingresos)}</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.negBg }]}>
            <Text style={[s.statLabel, { color: C.neg }]}>EGRESOS</Text>
            <Text style={[s.statValue, { color: C.negDeep }]}>{fmtCurrency(egresos)}</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: balance >= 0 ? C.posBg : C.negBg }]}>
            <Text style={[s.statLabel, { color: balance >= 0 ? C.pos : C.neg }]}>BALANCE</Text>
            <Text style={[s.statValue, { color: balance >= 0 ? C.posDeep : C.negDeep }]}>
              {balance >= 0 ? '+' : '-'}{fmtCurrency(Math.abs(balance))}
            </Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.brandSoft }]}>
            <Text style={[s.statLabel, { color: C.brand }]}>TRANSACCIONES</Text>
            <Text style={[s.statValue, { color: C.brand }]}>{transactions.length}</Text>
          </View>
        </View>

        {/* Vertical bar chart */}
        <View style={s.section} wrap={false}>
          <Text style={s.sectionTitle}>Gastos por categoría</Text>
          {sortedCats.length === 0 ? (
            <Text style={{ fontSize: 9, color: C.light, textAlign: 'center', paddingVertical: 20 }}>
              Sin gastos registrados para este período
            </Text>
          ) : (
            <View>
              <View style={{
                height: 175, flexDirection: 'row', alignItems: 'flex-end',
                gap: 6, paddingHorizontal: 4,
                borderBottomWidth: 0.5, borderBottomColor: C.border,
              }}>
                {sortedCats.map(([cat, total]) => {
                  const meta = getCategoryMeta(cat)
                  const barHeight = (total / max) * 145
                  return (
                    <View key={cat} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Text style={{ fontSize: 7, color: C.muted, marginBottom: 2 }}>
                        {fmtAmountShort(total)}
                      </Text>
                      <View style={{
                        height: barHeight, width: '70%',
                        backgroundColor: meta.color,
                        borderTopLeftRadius: 3, borderTopRightRadius: 3,
                      }} />
                    </View>
                  )
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, paddingHorizontal: 4 }}>
                {sortedCats.map(([cat]) => {
                  const meta = getCategoryMeta(cat)
                  return (
                    <Text key={cat} style={{ flex: 1, fontSize: 7, textAlign: 'center', color: C.muted }}>
                      {meta.label}
                    </Text>
                  )
                })}
              </View>
            </View>
          )}
        </View>

        {/* Concept breakdown */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Gasto por concepto</Text>
          {conceptRows.length === 0 ? (
            <Text style={{ fontSize: 9, color: C.light, textAlign: 'center', paddingVertical: 16 }}>
              Sin gastos registrados
            </Text>
          ) : (
            <>
              <View style={s.thead} fixed>
                <Text style={[s.th, { width: 22 }]}>#</Text>
                <Text style={[s.th, { flex: 1 }]}>Concepto</Text>
                <Text style={[s.th, { width: 90 }]}>Categoría</Text>
                <Text style={[s.th, { width: 35, textAlign: 'center' }]}>Tx</Text>
                <Text style={[s.th, { width: 80, textAlign: 'right' }]}>Total</Text>
              </View>
              {conceptRows.map((row, i) => {
                const meta = getCategoryMeta(row.category)
                return (
                  <View key={row.name} style={s.tr} wrap={false}>
                    <Text style={[s.td, { width: 22, color: C.light }]}>{i + 1}</Text>
                    <Text style={[s.td, { flex: 1 }]}>{row.name}</Text>
                    <View style={[s.pill, { width: 90 }]}>
                      <View style={[s.pillDot, { backgroundColor: meta.color }]} />
                      <Text style={[s.td, { fontSize: 8 }]}>{meta.label}</Text>
                    </View>
                    <Text style={[s.td, { width: 35, textAlign: 'center', color: C.muted }]}>
                      {row.count}
                    </Text>
                    <Text style={[s.td, { width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
                      {fmtCurrency(row.total)}
                    </Text>
                  </View>
                )
              })}
            </>
          )}
        </View>

        {/* Financial advice (if available) */}
        {advice && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Consejos financieros</Text>
            <View style={s.adviceResumen} wrap={false}>
              <Text style={s.adviceResumenTitle}>Resumen de tus gastos</Text>
              <Text style={s.adviceResumenText}>{advice.resumen}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {advice.consejos.map((c, i) => (
                <View key={i} style={s.adviceCard} wrap={false}>
                  <Text style={s.adviceIcon}>{c.icono}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.adviceTitle}>{c.titulo}</Text>
                    <Text style={s.adviceDesc}>{c.descripcion}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Full transactions table */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Detalle de transacciones</Text>
          <View style={s.thead} fixed>
            <Text style={[s.th, { width: 60 }]}>Fecha</Text>
            <Text style={[s.th, { flex: 1 }]}>Descripción</Text>
            <Text style={[s.th, { width: 90 }]}>Categoría</Text>
            <Text style={[s.th, { width: 75, textAlign: 'right' }]}>Monto</Text>
          </View>
          {sortedTx.map((tx, i) => {
            const esCargo = CARGO_TYPES.has(tx.tipo)
            const meta = getCategoryMeta(tx.categoria)
            return (
              <View key={i} style={s.tr} wrap={false}>
                <Text style={[s.td, { width: 60, color: C.muted, fontSize: 8 }]}>{tx.fecha}</Text>
                <Text style={[s.td, { flex: 1, fontSize: 8 }]}>{tx.comercio ?? tx.descripcion}</Text>
                <View style={[s.pill, { width: 90 }]}>
                  <View style={[s.pillDot, { backgroundColor: meta.color }]} />
                  <Text style={[s.td, { fontSize: 8 }]}>{meta.label}</Text>
                </View>
                <Text style={[
                  s.td,
                  {
                    width: 75, textAlign: 'right', fontFamily: 'Helvetica-Bold',
                    fontSize: 8, color: esCargo ? C.text : C.pos,
                  },
                ]}>
                  {esCargo ? '' : '+'}{fmtCurrency(tx.monto)}
                </Text>
              </View>
            )
          })}
        </View>

        <Text
          style={s.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages} · finia · Generado el ${generadoEl}`
          }
        />
      </Page>
    </Document>
  )
}