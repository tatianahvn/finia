import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeConceptNames } from "@/lib/services/groq"
import type { CategorySuggestion, ParsedStatement, Transaction } from "@/types/statements"
import type { SupabaseClient } from "@supabase/supabase-js"

interface SaveRequestBody {
  filename?: string
  data: ParsedStatement
}

// Normaliza un slug propuesto por la IA: minúsculas, sin acentos, snake_case.
function normalizeSlug(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

// Persiste best-effort las categorías nuevas que la IA propuso (created_by = 'ai').
// Si falla, el guardado del estado de cuenta continúa: la categoría queda en las
// transacciones como texto y solo se pierde su metadata en la tabla categories.
async function persistNewCategories(
  supabase: SupabaseClient,
  userId: string,
  suggestions: CategorySuggestion[] | undefined
): Promise<void> {
  if (!suggestions?.length) return

  const payload = suggestions
    .map(c => ({ ...c, slug: normalizeSlug(c.slug ?? "") }))
    .filter(c => c.slug)

  if (payload.length === 0) return

  const { error } = await supabase.rpc("upsert_user_categories", {
    p_user_id: userId,
    p_categories: payload,
  })
  if (error) {
    console.error("[statements] upsert_user_categories failed:", error.message)
  }
}

const CARGO_TYPES = new Set(["cargo", "transferencia_enviada", "retiro", "comision"])

function rawConceptName(tx: Transaction): string {
  if (tx.comercio && tx.comercio.trim()) return tx.comercio.trim()
  return tx.descripcion.trim()
}

// Normaliza los conceptos de gasto con la IA UNA sola vez (al guardar) y adjunta
// el nombre normalizado a cada transacción. Best-effort: si la IA falla, se
// guarda igual con el concepto en crudo como respaldo.
async function withNormalizedConcepts(transactions: Transaction[]): Promise<Transaction[]> {
  const rawConcepts = Array.from(
    new Set(
      transactions
        .filter(tx => CARGO_TYPES.has(tx.tipo))
        .map(rawConceptName)
        .filter(Boolean)
    )
  )

  if (rawConcepts.length === 0) return transactions

  let mapping: Record<string, string> = {}
  try {
    mapping = await normalizeConceptNames(rawConcepts)
  } catch (error) {
    console.error("[statements] normalize-concepts failed:", error)
  }

  return transactions.map(tx => {
    const raw = rawConceptName(tx)
    return { ...tx, concepto_normalizado: mapping[raw] ?? raw }
  })
}

// Persiste un estado de cuenta ya categorizado y revisado por el usuario (con sus
// categorías ajustadas en el modal). No consume crédito: el crédito se descuenta
// al categorizar en POST /api/statements/categorize.
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  let body: SaveRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const { filename, data } = body
  if (!data || !data.resumen || !Array.isArray(data.transacciones)) {
    return NextResponse.json(
      { error: "El estado de cuenta a guardar es inválido" },
      { status: 400 }
    )
  }

  const transacciones = await withNormalizedConcepts(data.transacciones)

  const { data: statementId, error: insertError } = await supabase.rpc(
    "insert_statement_with_transactions",
    {
      p_filename: filename ?? "sin_nombre",
      p_banco: data.resumen.banco ?? null,
      p_periodo_inicio: data.resumen.periodo_inicio || null,
      p_periodo_fin: data.resumen.periodo_fin || null,
      p_resumen: data.resumen as unknown as Record<string, unknown>,
      p_advertencias: data.advertencias ?? [],
      p_transacciones: transacciones as unknown as Record<string, unknown>[],
    }
  )

  if (insertError) {
    console.error("[statements] insert failed:", insertError.message)
    return NextResponse.json(
      { error: "No se pudo guardar el estado de cuenta. Intenta de nuevo." },
      { status: 500 }
    )
  }

  // Persiste las categorías nuevas que la IA propuso para que queden disponibles
  // en futuras categorizaciones del usuario. Best-effort: no bloquea el guardado.
  await persistNewCategories(supabase, user.id, data.nuevas_categorias)

  return NextResponse.json({ success: true, id: statementId })
}
