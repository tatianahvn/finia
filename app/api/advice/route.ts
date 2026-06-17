import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Consejo } from "@/lib/hooks/useAdviceHistory"

interface SaveAdviceBody {
  statement_id?: string | null
  mes: string
  resumen: string
  consejos: Consejo[]
}

// GET /api/advice  → consulta los consejos del usuario.
// Filtro opcional por mes:  /api/advice?mes=2026-05
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const mes = request.nextUrl.searchParams.get("mes")

  let query = supabase
    .from("advice")
    .select("id, statement_id, mes, resumen, consejos, generado")
    .eq("user_id", user.id)
    .order("generado", { ascending: false })

  if (mes) query = query.eq("mes", mes)

  const { data, error } = await query
  if (error) {
    console.error("[advice] select failed:", error.message)
    return NextResponse.json({ error: "No se pudieron consultar los consejos" }, { status: 500 })
  }

  return NextResponse.json({ advice: data ?? [] })
}

// POST /api/advice  → registra los consejos de un mes. Si ya existen para ese
// mes, se reemplazan (regenerar). No hay edición parcial.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  let body: SaveAdviceBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const { statement_id, mes, resumen, consejos } = body
  if (!mes || typeof mes !== "string" || !Array.isArray(consejos)) {
    return NextResponse.json(
      { error: "Faltan campos: se espera { mes, resumen, consejos[] }" },
      { status: 400 }
    )
  }

  // Reemplazo idempotente por mes: borra el anterior e inserta el nuevo.
  const { error: deleteError } = await supabase
    .from("advice")
    .delete()
    .eq("user_id", user.id)
    .eq("mes", mes)
  if (deleteError) {
    console.error("[advice] delete-before-insert failed:", deleteError.message)
    return NextResponse.json({ error: "No se pudieron guardar los consejos" }, { status: 500 })
  }

  const { data, error: insertError } = await supabase
    .from("advice")
    .insert({
      user_id: user.id,
      statement_id: statement_id ?? null,
      mes,
      resumen: resumen ?? "",
      consejos,
      generado: new Date().toISOString(),
    })
    .select("id, statement_id, mes, resumen, consejos, generado")
    .single()

  if (insertError) {
    console.error("[advice] insert failed:", insertError.message)
    return NextResponse.json({ error: "No se pudieron guardar los consejos" }, { status: 500 })
  }

  return NextResponse.json({ success: true, advice: data })
}
