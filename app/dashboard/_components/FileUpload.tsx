'use client'

import { useState, useRef } from 'react'
import { UploadCloud, FlaskConical } from 'lucide-react'
import FileItem from './FileItem'
import StatementReviewModal from './StatementReviewModal'
import StatementSavedModal from './StatementSavedModal'
import { DUMMY_FILENAME, DUMMY_STATEMENT } from '@/lib/fixtures/dummyStatement'
import { generateMonthlyAdvice, monthsOf } from '@/lib/services/advice'
import type { ParsedStatement } from '@/types/statements'

type ParsedResult = {
  name: string
  pages: number
  text: string
}

type UploadState = 'idle' | 'loading' | 'error'

interface Props {
  /** Se invoca tras guardar el estado de cuenta en la BD. */
  onSaved: () => void | Promise<void>
}

export default function FileUpload({ onSaved }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [review, setReview] = useState<{ filename: string; data: ParsedStatement } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const setSingleFile = (incoming: FileList | File[]) => {
    const pdf = Array.from(incoming).find(f => f.type === 'application/pdf')
    if (!pdf) return
    const tooMany = Array.from(incoming).filter(f => f.type === 'application/pdf').length > 1
    setFile(pdf)
    setStatus('idle')
    setErrorMsg(tooMany ? 'Solo puedes cargar un PDF a la vez. Se tomó el primero.' : null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setSingleFile(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSingleFile(e.target.files)
  }

  const removeFile = () => {
    setFile(null)
    setStatus('idle')
    setErrorMsg(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleConfirm = async () => {
    if (!file) return
    setStatus('loading')
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('files', file)

      const res = await fetch('/api/statements/parse-pdf', { method: 'POST', body: formData })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'Error al procesar el archivo')
      }

      const { result }: { result: ParsedResult } = await res.json()
      if (!result?.text) throw new Error('No se pudo extraer texto del PDF')

      const categorizeRes = await fetch('/api/statements/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: result.text, filename: result.name }),
      })
      if (!categorizeRes.ok) {
        const { error } = await categorizeRes.json()
        throw new Error(error ?? 'Error al categorizar el estado de cuenta')
      }

      const { data }: { data: ParsedStatement } = await categorizeRes.json()
      setReview({ filename: result.name, data })
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar el archivo. Intenta de nuevo.')
    }
  }

  const handleSave = async (edited: ParsedStatement) => {
    if (!review) return
    setSaving(true)
    try {
      const res = await fetch('/api/statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: review.filename, data: edited }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'No se pudo guardar el estado de cuenta')
      }

      const { id: statementId }: { id: string } = await res.json()

      // Genera los consejos financieros automáticamente para cada mes del estado
      // de cuenta recién guardado. Best-effort: un fallo aquí no impide el éxito
      // del guardado (el usuario podrá generarlos manualmente desde Análisis).
      const tx = edited.transacciones
      await Promise.all(
        monthsOf(tx).map(month =>
          generateMonthlyAdvice({
            transactions: tx.filter(t => t.fecha.startsWith(month)),
            month,
            statementId,
          }).catch(err => console.error('[advice] auto-generación falló:', err))
        )
      )

      setReview(null)
      removeFile()
      setSaved(true)
      await onSaved()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo guardar el estado de cuenta')
    } finally {
      setSaving(false)
    }
  }

  // Abre el modal con datos de prueba, sin llamar a parse/categorize: cero créditos
  // y cero tokens de IA. Solo visible en desarrollo.
  const loadDummy = () => {
    setErrorMsg(null)
    setReview({ filename: DUMMY_FILENAME, data: structuredClone(DUMMY_STATEMENT) })
  }

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Cargar archivo</h2>
        {process.env.NODE_ENV !== 'production' && (
          <button
            onClick={loadDummy}
            title="Abre el modal con datos de prueba, sin consumir créditos ni tokens"
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-violet-700 transition-colors"
          >
            <FlaskConical size={13} />
            Probar con PDF demo
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex-1 min-h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging
          ? 'border-violet-700 bg-violet-50'
          : 'border-violet-200 hover:border-violet-700 hover:bg-violet-50'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleChange}
        />
        <UploadCloud size={36} className="text-violet-300 mb-3" />
        <p className="text-base font-semibold text-neutral-900">Arrastra tu estado de cuenta aquí</p>
        <p className="text-sm text-neutral-400 mt-1">
          o <span className="text-violet-700 font-semibold">selecciona</span> desde tu equipo
        </p>
        <p className="text-sm text-neutral-400 mt-3">📄 Solo archivos PDF · Uno a la vez</p>
      </div>

      {/* File selected */}
      {file && (
        <div className="mt-3">
          <FileItem file={file} onRemove={removeFile} />
        </div>
      )}

      {errorMsg && (
        <p className="text-sm text-red-500 text-center mt-3">{errorMsg}</p>
      )}

      <button
        onClick={handleConfirm}
        disabled={!file || status === 'loading'}
        className="w-full mt-3 py-3 rounded-xl bg-violet-700 text-white text-base font-bold
          hover:bg-violet-800 transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {status === 'loading' ? 'Procesando...' : '✨ Analizar estado de cuenta'}
      </button>

      <p className="mt-2 text-sm text-neutral-400 text-center flex items-center justify-center gap-1.5">
        <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 font-semibold text-xs px-2 py-0.5 rounded-full">
          ⚡ 1 crédito
        </span>
        por análisis realizado
      </p>

      <StatementReviewModal
        open={!!review}
        filename={review?.filename ?? ''}
        statement={review?.data ?? null}
        saving={saving}
        onSave={handleSave}
      />

      <StatementSavedModal open={saved} onClose={() => setSaved(false)} />
    </section>
  )
}
