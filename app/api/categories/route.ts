import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { CategoryRecord } from "@/types/statements"

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("categories")
    .select("slug, label, emoji, color, badge_classes, description, examples, created_by, source_context, is_active")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .eq("is_active", true)
    .order("user_id", { ascending: true, nullsFirst: true })
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
    created_by: c.created_by as CategoryRecord["created_by"],
    source_context: c.source_context ?? undefined,
    is_active: c.is_active ?? true,
  }))

  return NextResponse.json({ categories })
}
