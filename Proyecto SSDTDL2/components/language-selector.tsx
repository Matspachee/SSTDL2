"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getProgrammingLanguages } from "@/lib/programming-languages"

interface LanguageSelectorProps {
  onSelectLanguage: (languageId: string) => void
  selectedLanguage: string | null
}

export function LanguageSelector({ onSelectLanguage, selectedLanguage }: LanguageSelectorProps) {
  const [languages, setLanguages] = useState<any[]>([])

  useEffect(() => {
    const availableLanguages = getProgrammingLanguages()
    setLanguages(availableLanguages)
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {languages.map((language) => (
          <Button
            key={language.id}
            variant={selectedLanguage === language.id ? "default" : "outline"}
            className={
              selectedLanguage === language.id
                ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
                : "bg-purple-900/30 border-purple-700 text-purple-200 hover:bg-purple-800 hover:text-white"
            }
            onClick={() => onSelectLanguage(language.id)}
          >
            {language.name}
          </Button>
        ))}
      </div>

      {selectedLanguage && (
        <div className="bg-purple-900/20 rounded-lg border border-purple-700/50 p-4 mt-4">
          <h3 className="text-purple-200 font-medium mb-2">
            {languages.find((l) => l.id === selectedLanguage)?.name || "Lenguaje seleccionado"}
          </h3>
          <p className="text-purple-300 text-sm">
            {languages.find((l) => l.id === selectedLanguage)?.description ||
              "Se ha cargado la gramática para este lenguaje. Ahora puedes escribir código para analizarlo."}
          </p>
        </div>
      )}
    </div>
  )
}
