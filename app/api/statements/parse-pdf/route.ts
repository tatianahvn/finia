import { NextRequest, NextResponse } from "next/server"
import { extractTextFromPdf, validatePdfFile } from "@/lib/services/pdf"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const files = formData.getAll("files") as File[]

  if (files.length !== 1) {
    return NextResponse.json(
      { error: "Debes enviar exactamente un archivo PDF" },
      { status: 400 }
    )
  }
  const file = files[0]

  const validationError = validatePdfFile(file)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 415 })
  }

  try {
    const result = await extractTextFromPdf(file)
    return NextResponse.json({ result })
  } catch (error: unknown) {
    console.error("[parse-pdf] error:", error)
    const message = error instanceof Error ? error.message : "Error al leer el PDF"
    return NextResponse.json({ error: message }, { status: 422 })
  }
}