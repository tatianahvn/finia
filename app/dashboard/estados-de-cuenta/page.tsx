'use client'

import { useState } from 'react'
import { useAnalysis } from '@/lib/context/analysis'
import FileUpload from '../_components/FileUpload'
import BankStatements from '../_components/BankStatements'

export default function EstadosDeCuentaPage() {
  const { refresh } = useAnalysis()
  const [reloadKey, setReloadKey] = useState(0)

  async function handleSaved() {
    setReloadKey(k => k + 1)
    await refresh()
  }

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-neutral-900">Estados de cuenta</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Sube nuevos estados de cuenta y administra los que ya cargaste. Cada archivo cargado consume 1 crédito.
        </p>
      </div>

      <div className="shrink-0">
        <FileUpload onSaved={handleSaved} />
      </div>

      <BankStatements reloadKey={reloadKey} />
    </div>
  )
}
