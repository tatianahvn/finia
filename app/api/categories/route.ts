import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { CategoryRecord } from "@/types/statements"

// Devuelve la taxonomía de categorías del usuario (defaults + las que la IA
// descubrió). El cliente la usa para el dropdown del modal de revisión y para
// la metadata visual (label/emoji/color). No se crean/editan categorías desde
// la UI: este endpoint es de solo lectura.
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  // Siembra perezosa: cubre usuarios registrados antes de la migración.
  await supabase.rpc("seed_default_categories", { p_user_id: user.id })

  const { data, error } = await supabase
    .from("categories")
    .select("slug, label, emoji, color, badge_classes, description, examples, origin")
    .eq("user_id", user.id)
    .order("origin", { ascending: true })
    .order("label", { ascending: true })

  if (error) {
    console.error("[categories] select failed:", error.message)
    return NextResponse.json(
      { error: "No se pudieron cargar las categorías" },
      { status: 500 }
    )
  }

  const categories: CategoryRecord[] = (data ?? []).map(c => ({
    slug: c.slug,
    label: c.label,
    emoji: c.emoji ?? undefined,
    color: c.color ?? undefined,
    badge_classes: c.badge_classes ?? undefined,
    description: c.description ?? undefined,
    examples: Array.isArray(c.examples) ? (c.examples as string[]) : [],
    origin: c.origin === "ai" ? "ai" : "default",
  }))

  return NextResponse.json({ categories })
}
