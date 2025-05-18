"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, EyeOff } from "lucide-react"
import type { Grammar } from "@/lib/parser"

interface GrammarPreviewProps {
  grammar: Grammar
  fileName?: string
}

export function GrammarPreview({ grammar, fileName }: GrammarPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  const togglePreview = () => {
    setIsOpen(!isOpen)
  }

  // Convertir la gramática a un formato de tabla
  const grammarRows = Array.from(grammar.productions.entries()).map(([nonTerminal, productions]) => {
    const productionsText = productions
      .map((prod) => {
        return prod
          .map((symbol) => {
            if (symbol.type === "terminal") {
              return `"${symbol.value}"`
            } else if (symbol.type === "nonTerminal") {
              return symbol.value
            } else if (symbol.type === "epsilon") {
              return "ε"
            }
            return ""
          })
          .join(" ")
      })
      .join(" | ")

    return {
      nonTerminal,
      productions: productionsText,
    }
  })

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePreview}
          className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-300"
        >
          {isOpen ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Ocultar Gramática
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Previsualizar Gramática
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="overflow-hidden border-green-200 dark:border-green-800 shadow-lg transition-colors duration-300">
              <CardHeader className="bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/50 dark:to-teal-900/50 py-4 transition-colors duration-300">
                <CardTitle className="text-green-800 dark:text-green-300 flex items-center transition-colors duration-300">
                  <span>Gramática{fileName ? ` de ${fileName}` : ""}</span>
                  <span className="ml-2 text-sm font-normal text-green-600 dark:text-green-400 transition-colors duration-300">
                    (Símbolo inicial: {grammar.startSymbol})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 bg-white dark:bg-green-950/30 transition-colors duration-300">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-green-50 dark:bg-green-950 transition-colors duration-300">
                        <TableHead className="w-1/4 font-bold text-green-700 dark:text-green-300 transition-colors duration-300">
                          No Terminal
                        </TableHead>
                        <TableHead className="font-bold text-green-700 dark:text-green-300 transition-colors duration-300">
                          Producciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grammarRows.map((row, index) => (
                        <TableRow
                          key={index}
                          className={`transition-colors duration-300 ${
                            index % 2 === 0 ? "bg-white dark:bg-green-950/50" : "bg-green-50/50 dark:bg-green-900/20"
                          }`}
                        >
                          <TableCell className="font-medium text-green-600 dark:text-green-400 transition-colors duration-300">
                            {row.nonTerminal}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {row.productions.split(" | ").map((prod, i) => (
                              <span key={i} className="inline-block">
                                {i > 0 && (
                                  <span className="text-green-400 dark:text-green-600 mx-2 transition-colors duration-300">
                                    |
                                  </span>
                                )}
                                {prod.split(" ").map((symbol, j) => {
                                  if (symbol.startsWith('"') && symbol.endsWith('"')) {
                                    return (
                                      <span
                                        key={j}
                                        className="text-teal-600 dark:text-teal-400 mr-1 transition-colors duration-300"
                                      >
                                        {symbol}
                                      </span>
                                    )
                                  } else if (symbol === "ε") {
                                    return (
                                      <span
                                        key={j}
                                        className="text-green-400 dark:text-green-600 mr-1 transition-colors duration-300"
                                      >
                                        {symbol}
                                      </span>
                                    )
                                  } else {
                                    return (
                                      <span
                                        key={j}
                                        className="text-green-600 dark:text-green-400 mr-1 transition-colors duration-300"
                                      >
                                        {symbol}
                                      </span>
                                    )
                                  }
                                })}
                              </span>
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
