import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// DELETE /api/advice/[id]  → elimina un consejo del usuario.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { error, count } = await supabase
    .from("advice")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("[advice] delete failed:", error.message)
    return NextResponse.json({ error: "No se pudo eliminar el consejo" }, { status: 500 })
  }

  if (!count) {
    return NextResponse.json({ error: "Consejo no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
