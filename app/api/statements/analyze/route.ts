import { NextRequest, NextResponse } from "next/server"
import { analyzeStatementText } from "@/lib/services/groq"
import { createClient } from "@/lib/supabase/server"

interface AnalyzeRequestBody {
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

  let body: AnalyzeRequestBody
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

  try {
    const data = await analyzeStatementText(text)

    const { error: insertError } = await supabase.from("analyses").insert({
      user_id: user.id,
      filename: filename ?? "sin_nombre",
      resumen: data.resumen as unknown as Record<string, unknown>,
      transacciones: data.transacciones as unknown as Record<string, unknown>[],
      advertencias: data.advertencias as unknown as string[],
    })

    if (insertError) {
      console.error("[analyses] insert failed:", insertError.message)
      return NextResponse.json(
        { error: "No se pudo guardar el análisis. Intenta de nuevo." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      metadata: {
        filename: filename ?? "sin_nombre",
        caracteres_analizados: text.length,
        transacciones_encontradas: data.transacciones.length,
      },
      data,
    })
  } catch (error: unknown) {
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
