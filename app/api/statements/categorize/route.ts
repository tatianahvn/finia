import { NextRequest, NextResponse } from "next/server"
import { categorizeStatementText, type CategoryForPrompt } from "@/lib/services/groq"
import { createClient } from "@/lib/supabase/server"

interface CategorizeRequestBody {
  text: string
  filename?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { data: credits, error: creditsError } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", user.id)
    .single()

  if (creditsError || !credits || credits.balance < 1) {
    return NextResponse.json(
      { error: "Sin créditos disponibles", code: "NO_CREDITS" },
      { status: 402 }
    )
  }

  let body: CategorizeRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "El body debe ser JSON con el campo 'text'" },
      { status: 400 }
    )
  }

  const { text, filename } = body

  if (!text || typeof text !== "string" || text.trim().length < 50) {
    return NextResponse.json(
      { error: "El campo 'text' está vacío o es demasiado corto" },
      { status: 400 }
    )
  }

  const { error: rpcError } = await supabase.rpc("consume_credit", {
    p_user_id: user.id,
  })
  if (rpcError) {
    return NextResponse.json(
      { error: "Error al consumir crédito. Intenta de nuevo." },
      { status: 500 }
    )
  }

  // Lee la taxonomía del usuario: globales (defaults) + custom (IA/usuario).
  // Si falla la lectura, se continúa con lista vacía (el LLM podrá proponer
  // categorías nuevas igualmente).
  const { data: catRows } = await supabase
    .from("categories")
    .select("slug, label, description, examples")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .eq("is_active", true)

  const categories: CategoryForPrompt[] = (catRows ?? []).map(c => ({
    slug: c.slug,
    label: c.label,
    description: c.description,
    examples: Array.isArray(c.examples) ? (c.examples as string[]) : [],
  }))

  try {
    const data = await categorizeStatementText(text, categories)

    // Importante: aquí NO se persiste nada. La categorización se devuelve al
    // cliente para que el usuario la revise y ajuste las categorías en el modal;
    // el guardado real ocurre en POST /api/statements al confirmar. El crédito
    // ya se consumió porque el costo es el procesamiento de IA, no el guardado.
    return NextResponse.json({
      success: true,
      metadata: {
        filename: filename ?? "sin_nombre",
        caracteres_procesados: text.length,
        transacciones_encontradas: data.transacciones.length,
      },
      data,
    })
  } catch (error: unknown) {
    console.error("[categorize] error:", error)
    if (error instanceof Error && error.message.includes("429")) {
      return NextResponse.json(
        { error: "Límite de Groq alcanzado. Intenta en unos minutos." },
        { status: 429 }
      )
    }

    const message = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
