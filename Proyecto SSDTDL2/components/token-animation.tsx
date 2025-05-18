"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, FastForward, Rewind, Play, Pause } from "lucide-react"
import type { Token } from "@/lib/lexer"

interface TokenAnimationProps {
  tokens: Token[]
  sourceCode: string
}

export function TokenAnimation({ tokens, sourceCode }: TokenAnimationProps) {
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1000) // milisegundos entre tokens
  const [codeLines, setCodeLines] = useState<string[]>([])

  useEffect(() => {
    setCodeLines(sourceCode.split("\n"))
  }, [sourceCode])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isPlaying && currentTokenIndex < tokens.length - 1) {
      interval = setInterval(() => {
        setCurrentTokenIndex((prev) => {
          if (prev < tokens.length - 1) {
            return prev + 1
          } else {
            setIsPlaying(false)
            return prev
          }
        })
      }, speed)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, currentTokenIndex, tokens.length, speed])

  const currentToken = tokens[currentTokenIndex]

  const goToFirst = () => {
    setCurrentTokenIndex(0)
    setIsPlaying(false)
  }

  const goToLast = () => {
    setCurrentTokenIndex(tokens.length - 1)
    setIsPlaying(false)
  }

  const goToPrevious = () => {
    if (currentTokenIndex > 0) {
      setCurrentTokenIndex(currentTokenIndex - 1)
      setIsPlaying(false)
    }
  }

  const goToNext = () => {
    if (currentTokenIndex < tokens.length - 1) {
      setCurrentTokenIndex(currentTokenIndex + 1)
    } else {
      setIsPlaying(false)
    }
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  // Función para obtener el color de un token según su tipo
  const getTokenColor = (type: string) => {
    switch (type) {
      case "KEYWORD":
        return "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
      case "DATATYPE":
        return "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
      case "IDENTIFIER":
        return "bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
      case "NUMBER":
        return "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
      case "STRING":
        return "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
      case "OPERATOR":
        return "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
      case "COMPARISON":
        return "bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700"
      case "BRACKET":
        return "bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700"
      case "PUNCTUATION":
        return "bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700"
      default:
        return "bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700"
    }
  }

  return (
    <Card className="border-green-200 dark:border-green-800 mb-6">
      <CardHeader className="bg-green-100/50 dark:bg-green-900/50 pb-3">
        <CardTitle className="text-green-800 dark:text-green-300 text-base">
          Animación de Tokens ({currentTokenIndex + 1}/{tokens.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-4 border rounded-lg overflow-hidden shadow-inner bg-blue-50 dark:bg-blue-950 transition-colors duration-300">
          <div className="relative font-mono text-sm">
            <div className="flex">
              {/* Números de línea */}
              <div className="bg-blue-100 dark:bg-blue-900 border-r border-blue-200 dark:border-blue-800 text-blue-500 dark:text-blue-400 p-4 text-right select-none min-w-[3rem] transition-colors duration-300">
                {codeLines.map((_, i) => (
                  <div key={i} className="pr-2 transition-colors duration-300">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Código con resaltado de token actual */}
              <div className="p-4 overflow-auto w-full">
                {codeLines.map((line, lineIndex) => {
                  // Verificar si el token actual está en esta línea
                  const isCurrentTokenInLine = currentToken && currentToken.line === lineIndex + 1

                  if (!isCurrentTokenInLine) {
                    return <div key={lineIndex}>{line || " "}</div>
                  }

                  // Si el token está en esta línea, resaltarlo
                  const parts = []
                  let lastIndex = 0

                  // Parte antes del token
                  if (currentToken.column > 1) {
                    parts.push(<span key="before">{line.substring(0, currentToken.column - 1)}</span>)
                    lastIndex = currentToken.column - 1
                  }

                  // El token mismo
                  parts.push(
                    <motion.span
                      key="token"
                      className={`px-1 py-0.5 rounded ${getTokenColor(currentToken.type).replace("bg-", "bg-opacity-50 bg-")}`}
                      initial={{ backgroundColor: "transparent" }}
                      animate={{ backgroundColor: "currentColor" }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentToken.value}
                    </motion.span>,
                  )
                  lastIndex = currentToken.column - 1 + currentToken.value.length

                  // Parte después del token
                  if (lastIndex < line.length) {
                    parts.push(<span key="after">{line.substring(lastIndex)}</span>)
                  }

                  return <div key={lineIndex}>{parts}</div>
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <Badge className={`${getTokenColor(currentToken.type)} shadow-sm`}>
              {currentToken.value} <span className="ml-1 opacity-70">({currentToken.type})</span>
            </Badge>
            <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">
              Línea: {currentToken.line}, Columna: {currentToken.column}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSpeed((prev) => Math.min(prev * 2, 4000))}
              disabled={speed >= 4000}
              className="text-xs"
            >
              Más lento
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSpeed((prev) => Math.max(prev / 2, 250))}
              disabled={speed <= 250}
              className="text-xs"
            >
              Más rápido
            </Button>
          </div>
        </div>

        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToFirst}
            disabled={currentTokenIndex === 0}
            className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
          >
            <Rewind className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            disabled={currentTokenIndex === 0}
            className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={togglePlay}
            className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 w-20"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span className="ml-1">{isPlaying ? "Pausa" : "Play"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={currentTokenIndex === tokens.length - 1}
            className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToLast}
            disabled={currentTokenIndex === tokens.length - 1}
            className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
          >
            <FastForward className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
