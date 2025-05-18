"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"

interface GrammarUploaderProps {
  onFileUpload: (file: File) => void
  isLoading: boolean
}

export function GrammarUploader({ onFileUpload, isLoading }: GrammarUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragActive ? "border-purple-500 bg-purple-900/40" : "border-purple-700 bg-purple-900/20 hover:bg-purple-900/30"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleChange} className="hidden" />

      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-purple-800/50 p-3">
          <Upload className="h-6 w-6 text-purple-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-purple-200 font-medium">Arrastra un archivo Excel o haz clic para seleccionar</h3>
          <p className="text-purple-400 text-sm">Sube un archivo Excel con la definición de tu gramática</p>
        </div>
        <Button
          type="button"
          onClick={handleButtonClick}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Seleccionar archivo
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
