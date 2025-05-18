"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"
import type { ProgrammingLanguage } from "@/lib/programming-languages"

interface LanguageDetailsProps {
  language: ProgrammingLanguage
  onContinue: () => void
}

export function LanguageDetails({ language, onContinue }: LanguageDetailsProps) {
  // Colores para las palabras reservadas
  const keywordColors = [
    "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200",
    "bg-cyan-200 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-200",
    "bg-teal-200 text-teal-800 dark:bg-teal-800 dark:text-teal-200",
    "bg-sky-200 text-sky-800 dark:bg-sky-800 dark:text-sky-200",
    "bg-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200",
  ]

  // Colores para los tipos de datos
  const datatypeColors = [
    "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200",
    "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200",
    "bg-lime-200 text-lime-800 dark:bg-lime-800 dark:text-lime-200",
    "bg-teal-200 text-teal-800 dark:bg-teal-800 dark:text-teal-200",
    "bg-cyan-200 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-200",
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-green-200 dark:border-green-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/50 dark:to-teal-900/50">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            <CardTitle className="text-green-800 dark:text-green-300">{language.name} seleccionado</CardTitle>
          </div>
          <CardDescription>{language.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 text-green-700 dark:text-green-300">Palabras Reservadas</h3>
              <div className="flex flex-wrap gap-2">
                {language.keywords.map((keyword, index) => (
                  <motion.span
                    key={index}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                      keywordColors[index % keywordColors.length]
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.1 } }}
                  >
                    {keyword}
                  </motion.span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 text-green-700 dark:text-green-300">Tipos de Datos</h3>
              <div className="flex flex-wrap gap-2">
                {language.datatypes.map((datatype, index) => (
                  <motion.span
                    key={index}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                      datatypeColors[index % datatypeColors.length]
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.02 + language.keywords.length * 0.02 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.1 } }}
                  >
                    {datatype}
                  </motion.span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 text-green-700 dark:text-green-300">Ejemplo de Código</h3>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto font-mono text-sm">
                <pre>{language.example}</pre>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-green-50 dark:bg-green-950 flex justify-end pt-4 pb-4">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={onContinue}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6"
            >
              Continuar con esta gramática
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
