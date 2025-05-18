"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface GrammarInputProps {
  onLoadGrammar: (grammarText: string) => void
}

export function GrammarInput({ onLoadGrammar }: GrammarInputProps) {
  const [grammarText, setGrammarText] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (grammarText.trim()) {
      onLoadGrammar(grammarText)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder="Ingresa la gramática aquí..."
        className="font-mono min-h-[200px]"
        value={grammarText}
        onChange={(e) => setGrammarText(e.target.value)}
      />
      <Button type="submit" disabled={!grammarText.trim()}>
        Cargar Gramática
      </Button>
    </form>
  )
}
