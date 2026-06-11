import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Category } from "@/types/statements"

const VALID_CATEGORIES: Category[] = [
  "alimentacion", "transporte", "entretenimiento", "salud", "educacion",
  "servicios", "vestimenta", "hogar", "viajes", "nomina", "transferencia",
  "inversiones", "impuestos", "seguros", "comisiones", "otros",
]

interface PatchBody {
  categoria: Category
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 })
  }

  let body: PatchBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  if (!VALID_CATEGORIES.includes(body.categoria)) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { error, count } = await supabase
    .from("transactions")
    .update({ categoria: body.categoria, confianza: 1 }, { count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("[transactions] update failed:", error.message)
    return NextResponse.json({ error: "No se pudo actualizar la categoría" }, { status: 500 })
  }

  if (!count) {
    return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
