"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"
import type { StackState } from "@/lib/types"

interface StackDisplayProps {
  stackHistory: StackState[]
}

export function StackDisplay({ stackHistory = [] }: StackDisplayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  if (stackHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-purple-900/20 rounded-lg border border-purple-700/30">
        <p className="text-purple-300">No hay historial de pilas disponible</p>
      </div>
    )
  }

  const currentState = stackHistory[currentStep] || stackHistory[0]

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }

    setIsPlaying(true)
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= stackHistory.length - 1) {
          setIsPlaying(false)
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }

  const handleReset = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const handleNext = () => {
    if (currentStep < stackHistory.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-purple-300">
          Paso {currentStep + 1} de {stackHistory.length}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700 disabled:opacity-50"
          >
            ←
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlay}
            className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentStep === stackHistory.length - 1}
            className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700 disabled:opacity-50"
          >
            →
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(stackHistory.length - 1)}
            className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-purple-900/20 rounded-lg border border-purple-700/30 p-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium text-purple-200">{currentState.action}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-purple-300 mb-2">Pila de Entrada</h4>
            <div className="bg-purple-950/50 rounded border border-purple-700/50 max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-purple-200">Símbolo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentState.input.length > 0 ? (
                    currentState.input.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-purple-300 font-mono">{item.value}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="text-purple-400 text-center">Vacía</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-purple-300 mb-2">Pila de Salida</h4>
            <div className="bg-purple-950/50 rounded border border-purple-700/50 max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-purple-200">Símbolo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentState.output.length > 0 ? (
                    currentState.output
                      .slice()
                      .reverse()
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-purple-300 font-mono">{item.value}</TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell className="text-purple-400 text-center">Vacía</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
