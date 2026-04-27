'use client'

import { useState, useRef } from 'react'
import { UploadCloud } from 'lucide-react'
import FileItem from './FileItem'
import type { ParsedStatement } from '@/types/statements'

type ParsedResult = {
  name: string
  pages: number
  text: string
}

type UploadState = 'idle' | 'loading' | 'done' | 'error'

interface Props {
  onAnalysisComplete: (data: ParsedStatement) => void
}

export default function FileUpload({ onAnalysisComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<UploadState>('idle')
  const [results, setResults] = useState<ParsedResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (incoming: FileList | File[]) => {
    const pdfs = Array.from(incoming).filter(f => f.type === 'application/pdf')
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...pdfs.filter(f => !existing.has(f.name))]
    })
    setStatus('idle')
    setResults([])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setStatus('idle')
    setResults([])
  }

  const handleConfirm = async () => {
    if (!files.length) return
    setStatus('loading')
    setResults([])

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))

      const res = await fetch('/api/statements/parse-pdf', { method: 'POST', body: formData })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'Error al procesar los archivos')
      }

      const { results: parsed }: { results: ParsedResult[] } = await res.json()
      if (!parsed?.length) throw new Error('No se pudo extraer texto del PDF')

      setResults(parsed)

      for (const { text, name } of parsed) {
        const analyzeRes = await fetch('/api/statements/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, filename: name }),
        })
        if (!analyzeRes.ok) {
          const { error } = await analyzeRes.json()
          throw new Error(error ?? 'Error al analizar el estado de cuenta')
        }

        const { data } = await analyzeRes.json()
        onAnalysisComplete(data)
      }

      setStatus('done')
    } catch {
      setStatus('error')
    }
  }



  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">Cargar archivos</h2>

      <div className="grid grid-cols-2 gap-4 h-64">

        {/* Columna izquierda — zona de carga */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging
            ? 'border-violet-800 bg-violet-50'
            : 'border-neutral-200 hover:border-violet-800 hover:bg-violet-50'
            }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleChange}
          />
          <UploadCloud size={32} className="text-neutral-400 mb-3" />
          <p className="text-sm font-medium text-neutral-900">Arrastra tus archivos aquí</p>
          <p className="text-xs text-neutral-400 mt-1">
            o <span className="text-violet-800 font-medium">selecciona</span> desde tu equipo
          </p>
          <p className="text-xs text-neutral-400 mt-3">Solo PDF</p>
        </div>

        {/* Columna derecha — lista de archivos */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {files.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-neutral-400">Sin archivos cargados</p>
              </div>
            ) : (
              files.map((file, i) => (
                <FileItem key={file.name} file={file} onRemove={() => removeFile(i)} />
              ))
            )}
          </div>

          {status === 'error' && (
            <p className="text-xs text-red-500 text-center">Error al procesar los archivos. Intenta de nuevo.</p>
          )}

          {status === 'done' && (
            <p className="text-xs text-menta text-center">
              {results.length} archivo{results.length !== 1 ? 's' : ''} procesado{results.length !== 1 ? 's' : ''} correctamente
            </p>
          )}

          <button
            onClick={handleConfirm}
            disabled={files.length === 0 || status === 'loading'}
            className="w-full py-2.5 rounded-xl bg-violet-800 text-white text-sm font-semibold hover:bg-violet-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Procesando...' : 'Confirmar carga'}
          </button>
        </div>

      </div>
    </section>
  )
}



