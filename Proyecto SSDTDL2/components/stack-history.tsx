"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"

interface StackHistoryProps {
  history: Array<{
    input: any[]
    output: any[]
    action: string
  }>
}

export function StackHistory({ history }: StackHistoryProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(1000) // ms entre pasos

  // Iniciar/detener la reproducción automática
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  // Efecto para la reproducción automática
  useState(() => {
    let interval: NodeJS.Timeout | null = null

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < history.length - 1) return prev + 1
          setIsPlaying(false)
          return prev
        })
      }, playSpeed)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  })

  // Navegar a paso anterior
  const prevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  // Navegar a paso siguiente
  const nextStep = () => {
    setCurrentStep((prev) => Math.min(history.length - 1, prev + 1))
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-purple-400 bg-purple-900/20 rounded-lg border border-purple-700/50">
        No hay historial de pilas disponible.
      </div>
    )
  }

  const currentState = history[currentStep]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-purple-200">
          Paso {currentStep + 1} de {history.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="h-8 w-8 p-0 bg-purple-900/30 border-purple-700 text-purple-300 hover:bg-purple-800 hover:text-purple-200 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
            <span className="sr-only">Anterior</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={togglePlay}
            className="h-8 bg-purple-900/30 border-purple-700 text-purple-300 hover:bg-purple-800 hover:text-purple-200"
          >
            {isPlaying ? <Pause size={16} className="mr-1" /> : <Play size={16} className="mr-1" />}
            {isPlaying ? "Pausar" : "Reproducir"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextStep}
            disabled={currentStep === history.length - 1}
            className="h-8 w-8 p-0 bg-purple-900/30 border-purple-700 text-purple-300 hover:bg-purple-800 hover:text-purple-200 disabled:opacity-50"
          >
            <ChevronRight size={16} />
            <span className="sr-only">Siguiente</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pila de entrada */}
        <div className="bg-purple-900/20 rounded-lg border border-purple-700/50 p-4">
          <h3 className="text-purple-200 font-medium mb-3">Pila de Entrada</h3>
          <div className="flex flex-col-reverse space-y-reverse space-y-2 min-h-[200px]">
            {currentState.input.map((item, index) => (
              <div
                key={index}
                className="p-2 bg-purple-800/30 border border-purple-700 rounded text-purple-200 text-center"
              >
                {item.value || item}
              </div>
            ))}
            {currentState.input.length === 0 && <div className="text-center text-purple-400 italic">Pila vacía</div>}
          </div>
        </div>

        {/* Pila de salida */}
        <div className="bg-purple-900/20 rounded-lg border border-purple-700/50 p-4">
          <h3 className="text-purple-200 font-medium mb-3">Pila de Salida</h3>
          <div className="flex flex-col-reverse space-y-reverse space-y-2 min-h-[200px]">
            {currentState.output.map((item, index) => (
              <div
                key={index}
                className="p-2 bg-purple-800/30 border border-purple-700 rounded text-purple-200 text-center"
              >
                {item.value || item}
              </div>
            ))}
            {currentState.output.length === 0 && <div className="text-center text-purple-400 italic">Pila vacía</div>}
          </div>
        </div>
      </div>

      {/* Acción actual */}
      <div className="bg-purple-900/20 rounded-lg border border-purple-700/50 p-4">
        <h3 className="text-purple-200 font-medium mb-2">Acción</h3>
        <Badge className="bg-purple-700 text-purple-100 text-sm">{currentState.action || "Inicio del análisis"}</Badge>
      </div>
    </div>
  )
}
