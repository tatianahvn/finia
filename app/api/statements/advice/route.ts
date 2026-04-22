import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface CategorySpend {
  label: string
  total: number
  porcentaje: number
}

interface AdviceRequestBody {
  categorias: CategorySpend[]
  totalGastos: number
}

export async function POST(request: NextRequest) {
  let body: AdviceRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { categorias, totalGastos } = body
  if (!categorias?.length) {
    return NextResponse.json({ error: 'No hay categorías de gasto' }, { status: 400 })
  }

  const categoryList = categorias
    .map(c => `- ${c.label}: $${c.total.toFixed(2)} MXN (${c.porcentaje.toFixed(1)}% del total)`)
    .join('\n')

  const prompt = `Analiza los gastos mensuales de este usuario:

Total de gastos: $${totalGastos.toFixed(2)} MXN

Desglose por categoría (mayor a menor):
${categoryList}

Responde ÚNICAMENTE con este JSON exacto:
{
  "resumen": "string — 2 oraciones que destaquen los patrones más relevantes de gasto que el usuario debe conocer",
  "consejos": [
    {
      "titulo": "string — título del consejo, máximo 5 palabras",
      "descripcion": "string — acción concreta y práctica en 1-2 oraciones",
      "icono": "string — un solo emoji"
    }
  ]
}

Reglas:
- Exactamente 4 consejos ordenados de mayor a menor impacto potencial
- Los consejos deben ser específicos a las categorías con mayor peso en el gasto
- Enfócate en reducir gastos hormiga, automatizar ahorro e incrementar inversión
- Tono amigable, práctico y motivador
- Solo JSON, sin texto adicional fuera del objeto`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: 'Eres un asesor financiero personal experto en finanzas personales mexicanas. Respondes ÚNICAMENTE con JSON válido, sin texto adicional.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Respuesta vacía de Groq')

    return NextResponse.json(JSON.parse(content))
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json(
        { error: 'Límite de Groq alcanzado. Intenta en unos minutos.' },
        { status: 429 }
      )
    }
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
