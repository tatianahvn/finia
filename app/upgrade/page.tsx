import Link from 'next/link'
import { ArrowLeft, Check, Zap } from 'lucide-react'

interface Plan {
  name: string
  badge?: string
  price: number
  credits: string
  features: string[]
  cta: string
  featured: boolean
}

const plans: Plan[] = [
  {
    name: '',
    price: 49,
    credits: '5 Créditos',
    features: [
      'Tabla de transacciones',
      'Categorías automáticas',
      'Hasta 15 consejos financieros',
    ],
    cta: 'Comenzar',
    featured: false,
  },
  {
    name: '',
    badge: '⭐️ Más popular',
    price: 199,
    credits: '22 Créditos',
    features: [
      'Todo lo anterior',
      'Export a PDF',
      'Créditos sin expiración',
    ],
    cta: 'Elegir plan',
    featured: true,
  },
  {
    name: '',
    price: 499,
    credits: '55 Créditos',
    features: [
      'Todo incluido',
      'Historial completo',
      'Comparativas y export',
    ],
    cta: 'Elegir plan',
    featured: false,
  },
]

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-neutral-50">
      <div className="max-w-5xl mx-auto px-6 py-12">

        <div className="flex items-center gap-4 mb-12">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-violet-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
          <span className="text-2xl font-bold tracking-tight text-violet-700">finia</span>
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold mb-4">
            <Zap size={12} />
            Potencia tu análisis financiero
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-3">
            Elige tu plan
          </h1>
          <p className="text-neutral-400 text-base max-w-md mx-auto">
            Analiza tus estados de cuenta, entiende tus gastos y toma mejores decisiones financieras.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>

        <p className="text-center text-xs text-neutral-400 mt-10">
          Pagos seguros · Sin suscripción forzada · Soporte por correo
        </p>

      </div>
    </div>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  const featured = plan.featured

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 transition-all ${featured
        ? 'bg-violet-700 text-white shadow-elevated scale-105'
        : 'bg-white text-neutral-900 shadow-card border border-neutral-100'
        }`}
    >
      {plan.badge && (
        <span
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${featured
            ? 'bg-white text-violet-700'
            : 'bg-violet-100 text-violet-700'
            }`}
        >
          {plan.badge}
        </span>
      )}

      <div
        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 mb-5 ${featured ? 'bg-white/15' : 'bg-violet-50'
          }`}
      >
        <Zap size={14} className={featured ? 'text-violet-200' : 'text-violet-500'} />
        <span className={`text-sm font-semibold ${featured ? 'text-white' : 'text-violet-700'}`}>
          {plan.credits}
        </span>
      </div>

      <div className="flex items-center mb-5">
        <div className="flex gap-1.5 mb-1">
          <span className="text-4xl font-bold">${plan.price}</span>
          <span className={`text-sm mb-1 ${featured ? 'text-violet-300' : 'text-neutral-400'}`}>
            MXN
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5 mb-6 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check
              size={15}
              className={`shrink-0 mt-0.5 ${featured ? 'text-violet-200' : 'text-violet-500'}`}
            />
            <span className={featured ? 'text-violet-100' : 'text-neutral-600'}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${featured
          ? 'bg-white text-violet-700 hover:bg-violet-50'
          : 'bg-violet-700 text-white hover:bg-violet-800'
          }`}
      >
        {plan.cta}
      </button>
    </div>
  )
}
