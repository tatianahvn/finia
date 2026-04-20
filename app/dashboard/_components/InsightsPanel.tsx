'use client'

import { PieChart, Pie, Sector, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { PieSectorShapeProps } from 'recharts/types/polar/Pie'
import type { Transaction } from '@/types/statements'
import { useCategoryColors } from '@/lib/hooks/useCategoryColor'
import type { CategoryKey } from '@/lib/hooks/useCategoryColor'

const CARGO_TYPES = new Set([
  'cargo', 'transferencia_enviada', 'retiro', 'comision',
])

const CATEGORY_META: Record<string, { label: string; key: CategoryKey }> = {
  alimentacion:         { label: 'Alimentación',   key: 'food'      },
  transporte:           { label: 'Transporte',      key: 'transport' },
  entretenimiento:      { label: 'Entretenimiento', key: 'leisure'   },
  salud:                { label: 'Salud',           key: 'health'    },
  educacion:            { label: 'Educación',       key: 'education' },
  servicios:            { label: 'Servicios',       key: 'home'      },
  vestimenta:           { label: 'Vestimenta',      key: 'fashion'   },
  ropa_calzado:         { label: 'Vestimenta',      key: 'fashion'   },
  hogar:                { label: 'Hogar',           key: 'home'      },
  viajes:               { label: 'Viajes',          key: 'transport' },
  nomina:               { label: 'Nómina',          key: 'savings'   },
  nomina_ingreso:       { label: 'Nómina',          key: 'savings'   },
  transferencia:        { label: 'Transferencia',   key: 'tech'      },
  inversiones:          { label: 'Inversiones',     key: 'savings'   },
  impuestos:            { label: 'Impuestos',       key: 'other'     },
  seguros:              { label: 'Seguros',         key: 'health'    },
  comisiones:           { label: 'Comisiones',      key: 'other'     },
  comisiones_bancarias: { label: 'Comisiones',      key: 'other'     },
  otros:                { label: 'Otros',           key: 'other'     },
}

const renderSector = (props: PieSectorShapeProps) => <Sector {...props} />

interface Props {
  transactions: Transaction[]
}

export default function InsightsPanel({ transactions }: Props) {
  const colors = useCategoryColors()
  const expenses = transactions.filter(tx => CARGO_TYPES.has(tx.tipo))

  const totalsMap = new Map<string, { monto: number; fill: string }>()
  for (const tx of expenses) {
    const meta = CATEGORY_META[tx.categoria] ?? { label: tx.categoria, key: 'other' as CategoryKey }
    const existing = totalsMap.get(meta.label)
    totalsMap.set(meta.label, {
      monto: (existing?.monto ?? 0) + tx.monto,
      fill: colors[meta.key],
    })
  }

  const data = Array.from(totalsMap.entries())
    .sort((a, b) => b[1].monto - a[1].monto)
    .map(([name, { monto, fill }]) => ({ name, monto, fill }))

  const fmt = (n: number) =>
    `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

  if (expenses.length === 0) {
    return (
      <section className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Gastos por categoría</h2>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-lavanda-light flex items-center justify-center">
            <span className="text-lavanda text-xl">✦</span>
          </div>
          <p className="text-sm font-medium text-neutral-900">Sin datos aún</p>
          <p className="text-xs text-neutral-400 max-w-[200px]">
            Carga un estado de cuenta para ver la distribución de tus gastos.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">Gastos por categoría</h2>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="monto"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="90%"
            innerRadius="60%"
            strokeWidth={2}
            stroke="#ffffff"
            shape={renderSector}
          />
          <Tooltip
            formatter={(value) => typeof value === 'number' ? fmt(value) : String(value)}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          />
          <Legend
            iconType="circle"
            iconSize={15}
            formatter={(value) => <span style={{ fontSize: 18, color: '#3B3B38' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </section>
  )
}
