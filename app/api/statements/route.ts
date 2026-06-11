import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { ParsedStatement } from "@/types/statements"

interface SaveRequestBody {
  filename?: string
  data: ParsedStatement
}

// Persiste un estado de cuenta ya analizado y revisado por el usuario (con sus
// categorías ajustadas en el modal). No consume crédito: el crédito se descuenta
// al analizar en POST /api/statements/analyze.
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

  const { data: statementId, error: insertError } = await supabase.rpc(
    "insert_statement_with_transactions",
    {
      p_filename: filename ?? "sin_nombre",
      p_banco: data.resumen.banco ?? null,
      p_periodo_inicio: data.resumen.periodo_inicio || null,
      p_periodo_fin: data.resumen.periodo_fin || null,
      p_resumen: data.resumen as unknown as Record<string, unknown>,
      p_advertencias: data.advertencias ?? [],
      p_transacciones: data.transacciones as unknown as Record<string, unknown>[],
    }
  )

  if (insertError) {
    console.error("[statements] insert failed:", insertError.message)
    return NextResponse.json(
      { error: "No se pudo guardar el estado de cuenta. Intenta de nuevo." },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, id: statementId })
}
