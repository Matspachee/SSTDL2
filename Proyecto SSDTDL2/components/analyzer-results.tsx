"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TokenDisplay } from "@/components/token-display"
import { DerivationTree } from "@/components/derivation-tree"
import { StackDisplay } from "@/components/stack-display"
import { SymbolTable } from "@/components/symbol-table"
import { SemanticErrors } from "@/components/semantic-errors"
import { CodePreview } from "@/components/code-preview"
import { AlertTriangle, Code, Database, FolderTreeIcon as FileTree } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AnalyzerResultsProps {
  sourceCode: string
  tokens: any[]
  symbols: any[]
  semanticErrors: any[]
  tree: any
  inputStack: any[]
  outputStack: any[]
  stackHistory: any[]
  steps: string[]
}

export function AnalyzerResults({
  sourceCode,
  tokens = [],
  symbols = [],
  semanticErrors = [],
  tree = null,
  inputStack = [],
  outputStack = [],
  stackHistory = [],
  steps = [],
}: AnalyzerResultsProps) {
  const [activeTab, setActiveTab] = useState("lexico")

  const errorCount = semanticErrors.length
  const warningCount = semanticErrors.filter((err) => err.severity === "warning").length
  const infoCount = semanticErrors.filter((err) => err.severity === "info").length

  return (
    <div className="space-y-6">
      {/* Código analizado */}
      <Card className="bg-purple-950/50 border-purple-800/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-purple-950/70 pb-3">
          <CardTitle className="text-xl text-purple-200">Código Analizado</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <CodePreview code={sourceCode} />
        </CardContent>
      </Card>

      {/* Pestañas de análisis */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-purple-950/70 p-1 rounded-xl w-full grid grid-cols-4">
          <TabsTrigger value="lexico" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            <Code className="mr-2 h-4 w-4" />
            Análisis Léxico
          </TabsTrigger>
          <TabsTrigger value="sintactico" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            <FileTree className="mr-2 h-4 w-4" />
            Análisis Sintáctico
          </TabsTrigger>
          <TabsTrigger value="semantico" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            <Database className="mr-2 h-4 w-4" />
            Análisis Semántico
          </TabsTrigger>
          <TabsTrigger value="errores" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Errores
            {errorCount > 0 && (
              <Badge variant="destructive" className="ml-2 bg-red-500 text-white">
                {errorCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Contenido de las pestañas */}
        <TabsContent value="lexico" className="mt-0">
          <Card className="bg-purple-950/50 border-purple-800/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-purple-950/70 pb-3">
              <CardTitle className="text-lg text-purple-200">Tokens Identificados</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <TokenDisplay tokens={tokens} sourceCode={sourceCode} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sintactico" className="mt-0 space-y-6">
          <Card className="bg-purple-950/50 border-purple-800/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-purple-950/70 pb-3">
              <CardTitle className="text-lg text-purple-200">Árbol de Derivación</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <DerivationTree tree={tree} />
            </CardContent>
          </Card>

          <Card className="bg-purple-950/50 border-purple-800/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-purple-950/70 pb-3">
              <CardTitle className="text-lg text-purple-200">Simulación de Pilas</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <StackDisplay inputStack={inputStack} outputStack={outputStack} stackHistory={stackHistory} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semantico" className="mt-0">
          <Card className="bg-purple-950/50 border-purple-800/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-purple-950/70 pb-3">
              <CardTitle className="text-lg text-purple-200">Tabla de Símbolos</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <SymbolTable symbols={symbols} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errores" className="mt-0">
          <Card className="bg-purple-950/50 border-purple-800/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-purple-950/70 pb-3">
              <CardTitle className="text-lg text-purple-200">Errores Semánticos</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <SemanticErrors errors={semanticErrors} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
