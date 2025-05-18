"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  onAnalyze: () => void
  grammarLoaded: boolean
}

export function TextInput({ value, onChange, onAnalyze, grammarLoaded }: TextInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAnalyze()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!grammarLoaded && (
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mb-2">
          <AlertCircle className="h-4 w-4" />
          <span>Primero debes cargar una gramática</span>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Ingresa el texto a analizar..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!grammarLoaded}
          className="font-mono"
        />
        <Button type="submit" disabled={!grammarLoaded || !value.trim()}>
          Analizar
        </Button>
      </div>
    </form>
  )
}
