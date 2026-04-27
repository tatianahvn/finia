'use client'

import { useRouter } from 'next/navigation'
import { useAnalysis } from '@/lib/context/analysis'
import FileUpload from '../_components/FileUpload'
import type { ParsedStatement } from '@/types/statements'

export default function AnalizarPage() {
  const router = useRouter()
  const { addStatement } = useAnalysis()

  function handleAnalysisComplete(data: ParsedStatement) {
    addStatement(data)
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Analizar estado de cuenta</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Sube un PDF para extraer y categorizar tus transacciones automáticamente. Consume 1 crédito.
        </p>
      </div>

      <FileUpload onAnalysisComplete={handleAnalysisComplete} />
    </div>
  )
}
