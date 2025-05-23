"use client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Play, Loader2 } from "lucide-react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  onAnalyze: () => void
  language: any
  grammarLoaded: boolean
  isLoading?: boolean
}

export function CodeEditor({
  value,
  onChange,
  onAnalyze,
  language,
  grammarLoaded,
  isLoading = false,
}: CodeEditorProps) {
  const handleAnalyze = () => {
    if (!isLoading && grammarLoaded && value.trim()) {
      onAnalyze()
    }
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={language ? `Escribe código en ${language.name}...` : "Escribe código para analizar..."}
        className="min-h-[300px] font-mono text-sm bg-purple-900/30 border-purple-700 text-purple-200 placeholder:text-purple-400 resize-none"
      />

      <div className="flex justify-end">
        <Button
          onClick={handleAnalyze}
          disabled={!grammarLoaded || isLoading || !value.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Analizar código
            </>
          )}
        </Button>
      </div>

      {!grammarLoaded && (
        <p className="text-purple-400 text-sm">Primero selecciona un lenguaje o carga una gramática para comenzar.</p>
      )}
    </div>
  )
}
