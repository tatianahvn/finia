import Groq from "groq-sdk";
import type { ParsedStatement } from "@/types/statements"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

// Categoría tal como se le presenta al LLM en el prompt: el slug que debe usar,
// su etiqueta legible, una descripción de qué pertenece y ejemplos (few-shot).
export interface CategoryForPrompt {
  slug: string
  label: string
  description?: string | null
  examples?: string[]
}

// Construye el prompt de categorización a partir de la taxonomía del usuario
// (defaults + categorías que la IA ya descubrió en corridas previas). Los
// ejemplos por categoría son el few-shot que mejora la precisión.
function buildCategorizationPrompt(categories: CategoryForPrompt[]): string {
  const catalogo = categories
    .map(c => {
      const ejemplos = c.examples?.length ? ` Ejemplos: ${c.examples.join(", ")}.` : ""
      const desc = c.description ? ` ${c.description}` : ""
      return `- "${c.slug}" (${c.label}):${desc}${ejemplos}`
    })
    .join("\n")

  return `Eres un experto en lectura y categorización de estados de cuenta bancarios mexicanos.
Extrae TODAS las transacciones del texto, asigna a cada una la categoría que mejor describa el gasto/ingreso, y responde ÚNICAMENTE con un JSON válido.

Categorías disponibles (usa el "slug" exacto en el campo "categoria"):
${catalogo}

El JSON debe tener exactamente esta estructura:
{
  "resumen": {
    "banco": string,
    "titular": string | null,
    "numero_cuenta": string | null,
    "periodo_inicio": "YYYY-MM-DD",
    "periodo_fin": "YYYY-MM-DD",
    "saldo_inicial": number | null,
    "saldo_final": number | null,
    "total_cargos": number,
    "total_abonos": number,
    "moneda": "MXN"
  },
  "transacciones": [
    {
      "fecha": "YYYY-MM-DD",
      "descripcion": string,
      "comercio": string | null,
      "monto": number,
      "tipo": "cargo" | "abono" | "transferencia_enviada" | "transferencia_recibida" | "retiro" | "deposito" | "comision" | "interes" | "desconocido",
      "categoria": string,
      "confianza": number
    }
  ],
  "advertencias": string[],
  "nuevas_categorias": [
    { "slug": string, "label": string, "emoji": string, "description": string, "examples": string[] }
  ]
}

Reglas:
- Montos siempre positivos; usa el campo "tipo" para indicar si es cargo o abono.
- "confianza" entre 0 y 1 según qué tan seguro estás de la categoría asignada.
- Asigna SIEMPRE la categoría existente que mejor encaje. Identifica el comercio real detrás del texto (ej. "COMPRA TARJETA 4512 SPOTIFY" → Spotify → "entretenimiento").
- Solo si NINGUNA categoría existente encaja razonablemente, crea UNA nueva: agrégala a "nuevas_categorias" (slug en snake_case, sin acentos ni espacios; label legible; emoji; description breve; 3-6 examples) y usa ese mismo slug en la transacción. No abuses: reutiliza las existentes siempre que puedas.
- Si no hay categorías nuevas, devuelve "nuevas_categorias": [].
- No incluyas texto fuera del JSON.`
}

const OCR_PROMPT = `Eres un OCR especializado en estados de cuenta bancarios mexicanos.
Extrae TODO el texto visible de la imagen tal cual aparece, preservando el orden de lectura y la estructura tabular cuando aplique.

Reglas:
- Conserva fechas, folios, descripciones, depósitos, retiros y saldos en el mismo renglón cuando estén alineados en una fila de tabla.
- Usa tabuladores (\\t) para separar columnas dentro de una misma fila de tabla.
- Conserva los montos exactamente como aparecen, con punto decimal.
- No agregues texto, comentarios ni markdown. Devuelve solo el texto extraído.
- Si la página no contiene información relevante, devuelve una cadena vacía.`

export async function extractTextFromPageImages(
  imageDataUrls: string[]
): Promise<string> {
  if (imageDataUrls.length === 0) return ""

  const results: string[] = []
  for (let i = 0; i < imageDataUrls.length; i++) {
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0,
      max_tokens: 8000,
      messages: [
        { role: "system", content: OCR_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Página ${i + 1}: extrae el texto.` },
            { type: "image_url", image_url: { url: imageDataUrls[i] } },
          ],
        },
      ],
    })
    results.push(completion.choices[0]?.message?.content ?? "")
  }

  return results
    .map((t, i) => `--- Página ${i + 1} ---\n${t.trim()}`)
    .join("\n\n")
}

const NORMALIZE_PROMPT = `Eres un normalizador de nombres de comercios y conceptos en transacciones bancarias mexicanas.
Recibirás una lista de descripciones de transacciones (campo "concepts") y debes devolver ÚNICAMENTE un JSON válido con el mapeo de cada descripción a un nombre comercial limpio y reconocible.

Reglas:
- Elimina códigos internos, números de sucursal, referencias y ruido: "OXXO SUC 1234 MTY" → "OXXO"
- Identifica el comercio real detrás del texto: "COMPRA TARJETA 4512 SPOTIFY" → "Spotify"
- Agrupa variantes del mismo comercio bajo un solo nombre normalizado: "PAGO TELCEL MOVIL", "RECARGA TELCEL" → "Telcel"
- Para pagos de servicios bancarios sin comercio claro (SPEI, CoDi, transferencias) mantén una descripción corta y descriptiva: "Transferencia SPEI"
- Para gasolineras: "SER PEMEX EST 3421" → "Gasolinera PEMEX"
- Usa mayúsculas iniciales en el nombre normalizado
- No inventes categorías, solo normaliza el nombre del comercio/concepto
- Responde ÚNICAMENTE con este JSON, sin texto adicional:
{ "mapping": { "<descripcion_original>": "<nombre_normalizado>", ... } }`

export async function normalizeConceptNames(
  concepts: string[]
): Promise<Record<string, string>> {
  if (concepts.length === 0) return {}

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    max_tokens: 2048,
    messages: [
      { role: "system", content: NORMALIZE_PROMPT },
      {
        role: "user",
        content: JSON.stringify({ concepts }),
      },
    ],
    response_format: { type: "json_object" },
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error("Groq devolvió respuesta vacía")

  const parsed = JSON.parse(content) as { mapping: Record<string, string> }
  return parsed.mapping ?? {}
}

export async function categorizeStatementText(
  pdfText: string,
  categories: CategoryForPrompt[]
): Promise<ParsedStatement> {
  const truncated = pdfText.slice(0, 80_000)

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    max_tokens: 4000,
    messages: [
      { role: "system", content: buildCategorizationPrompt(categories) },
      {
        role: "user",
        content: `Categoriza las transacciones de este estado de cuenta:\n\n${truncated}`,
      },
    ],
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error("Groq devolvió respuesta vacía")

  return JSON.parse(content) as ParsedStatement
}