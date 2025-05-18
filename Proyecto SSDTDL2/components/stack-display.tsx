"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipForward, SkipBack } from "lucide-react"
import type { StackItem } from "@/lib/parser-enhanced"

interface StackDisplayProps {
  inputStack?: StackItem[]
  outputStack?: StackItem[]
  stackHistory?: Array<{
    input: StackItem[]
    output: StackItem[]
    action: string
  }>
}

export function StackDisplay({ inputStack = [], outputStack = [], stackHistory = [] }: StackDisplayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState("current")

  // Función para obtener el color de un elemento según su tipo
  const getItemColor = (type: string) => {
    switch (type) {
      case "nonTerminal":
        return "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
      case "terminal":
        return "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
      case "epsilon":
        return "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      case "endMarker":
        return "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
      default:
        return "bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200"
    }
  }

  // Avanzar al siguiente paso
  const nextStep = () => {
    if (currentStep < stackHistory.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsPlaying(false)
    }
  }

  // Retroceder al paso anterior
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Renderizar una pila
  const renderStack = (stack: StackItem[] = []) => {
    if (!stack || stack.length === 0) {
      return <div className="text-center py-4 text-purple-300">Pila vacía</div>
    }

    return (
      <div className="flex flex-col-reverse items-center space-y-reverse space-y-2">
        {stack.map((item, index) => (
          <div
            key={index}
            className={`${getItemColor(
              item.type,
            )} px-4 py-2 rounded-md shadow-sm w-full max-w-xs text-center font-mono transition-all duration-300`}
          >
            <div className="font-bold">{item.value}</div>
            <div className="text-xs opacity-70">{item.type}</div>
          </div>
        ))}
      </div>
    )
  }

  // Renderizar el historial de pilas
  const renderHistory = () => {
    if (!stackHistory || stackHistory.length === 0) {
      return <div className="text-center py-4 text-purple-300">No hay historial disponible</div>
    }

    const currentHistory = stackHistory[currentStep]

    if (!currentHistory) {
      return <div className="text-center py-4 text-purple-300">Paso no disponible</div>
    }

    return (
      <div className="space-y-6">
        <div className="bg-purple-900/40 p-3 rounded-md">
          <h3 className="text-purple-200 font-medium mb-2">Acción:</h3>
          <p className="text-purple-100">{currentHistory.action}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-purple-800/20 border-purple-700/30">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm text-purple-200">Pila de Entrada</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ScrollArea className="h-[200px]">{renderStack(currentHistory.input)}</ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-purple-800/20 border-purple-700/30">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm text-purple-200">Pila de Salida</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ScrollArea className="h-[200px]">{renderStack(currentHistory.output)}</ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="bg-purple-800/50 border-purple-700 text-purple-200 hover:bg-purple-700"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-purple-800/50 border-purple-700 text-purple-200 hover:bg-purple-700"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={nextStep}
            disabled={currentStep === stackHistory.length - 1}
            className="bg-purple-800/50 border-purple-700 text-purple-200 hover:bg-purple-700"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center text-sm text-purple-300">
          Paso {currentStep + 1} de {stackHistory.length}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-purple-900/50 w-full grid grid-cols-2">
          <TabsTrigger value="current" className="data-[state=active]:bg-purple-700">
            Estado Actual
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-purple-700">
            Historial de Pasos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-purple-800/20 border-purple-700/30">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm text-purple-200">Pila de Entrada</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-[200px]">{renderStack(inputStack)}</ScrollArea>
              </CardContent>
            </Card>

            <Card className="bg-purple-800/20 border-purple-700/30">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm text-purple-200">Pila de Salida</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-[200px]">{renderStack(outputStack)}</ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {renderHistory()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
