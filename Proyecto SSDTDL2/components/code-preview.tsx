"use client"

import { useEffect, useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Card } from "@/components/ui/card"

interface CodePreviewProps {
  code: string
  language?: string
}

export function CodePreview({ code, language = "c" }: CodePreviewProps) {
  const [cleanedCode, setCleanedCode] = useState(code)

  // Limpiar el código de marcas CSS incorrectas
  useEffect(() => {
    if (!code) return

    // Eliminar las marcas CSS incorrectas (300">"text-pink-400">)
    const cleaned = code.replace(/\d+">">"text-[a-z0-9-]+">/g, "")
    setCleanedCode(cleaned)
  }, [code])

  return (
    <Card className="overflow-hidden border-none">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          backgroundColor: "#1e1b2e",
          fontSize: "0.9rem",
          lineHeight: "1.5",
        }}
        showLineNumbers
        wrapLines
      >
        {cleanedCode}
      </SyntaxHighlighter>
    </Card>
  )
}
