import type { Transaction } from '@/types/statements'

interface CategoryMeta {
  label: string
  classes: string
}

const CATEGORY: Record<string, CategoryMeta> = {
  alimentacion: { label: 'Alimentación', classes: 'bg-ambar-light' },
  transporte: { label: 'Transporte', classes: 'bg-celeste-light' },
  entretenimiento: { label: 'Entret.', classes: 'bg-rosa-light' },
  salud: { label: 'Salud', classes: 'bg-menta-light' },
  educacion: { label: 'Educación', classes: 'bg-lavanda-light' },
  servicios: { label: 'Servicios', classes: 'bg-celeste-light' },
  vestimenta: { label: 'Vestimenta', classes: 'bg-rosa-light' },
  ropa_calzado: { label: 'Vestimenta', classes: 'bg-rosa-light' },
  hogar: { label: 'Hogar', classes: 'bg-ambar-light' },
  viajes: { label: 'Viajes', classes: 'bg-celeste-light' },
  nomina: { label: 'Nómina', classes: 'bg-menta-light' },
  nomina_ingreso: { label: 'Nómina', classes: 'bg-menta-light' },
  transferencia: { label: 'Transferencia', classes: 'bg-lavanda-light' },
  inversiones: { label: 'Inversiones', classes: 'bg-lavanda-light' },
  impuestos: { label: 'Impuestos', classes: 'bg-durazno-light' },
  seguros: { label: 'Seguros', classes: 'bg-celeste-light' },
  comisiones: { label: 'Comisiones', classes: 'bg-durazno-light' },
  comisiones_bancarias: { label: 'Comisiones', classes: 'bg-durazno-light' },
  otros: { label: 'Otros', classes: 'bg-neutral-100  text-neutral-400' },
}

const CARGO_TYPES = new Set([
  'cargo', 'transferencia_enviada', 'retiro', 'comision',
])

const columns = ['Fecha', 'Descripción', 'Categoría', 'Monto']

interface Props {
  transactions: Transaction[]
}

export default function DataTable({ transactions }: Props) {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold tracking-widest text-violet-700 uppercase">
          Transacciones
        </h2>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[540px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-neutral-200">
              {columns.map(col => (
                <th
                  key={col}
                  className="pb-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-neutral-400 text-sm">
                  Carga un archivo para ver tus transacciones
                </td>
              </tr>
            ) : (
              transactions.map((tx, i) => {
                const esCargo = CARGO_TYPES.has(tx.tipo)
                return (
                  <tr key={i} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="py-3 pr-4 text-neutral-500 whitespace-nowrap">
                      {tx.fecha}
                    </td>
                    <td className="py-3 pr-4 text-neutral-900 max-w-xs truncate">
                      {tx.comercio ?? tx.descripcion}
                    </td>
                    <td className="py-3 pr-4">
                      {(() => {
                        const cat = CATEGORY[tx.categoria]
                        return (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full text-neutral-600 ${cat?.classes ?? 'bg-neutral-100'}`}>
                            {cat?.label ?? tx.categoria}
                          </span>
                        )
                      })()}
                    </td>
                    <td className={`py-3 font-semibold whitespace-nowrap ${esCargo ? 'text-neutral-600' : 'text-emerald-600'}`}>
                      {esCargo ?? '+'}${tx.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
