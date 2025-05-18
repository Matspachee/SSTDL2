"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { TokenDisplay } from "@/components/token-display"
import { DerivationTree } from "@/components/derivation-tree"
import { StackDisplay } from "@/components/stack-display"
import { AnalysisSteps } from "@/components/analysis-steps"
import { SymbolTable } from "@/components/symbol-table"
import { SemanticErrors } from "@/components/semantic-errors"
import {
  Code,
  FolderTreeIcon as FileTree,
  Layers,
  List,
  AlertTriangle,
  Database,
  Search,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface AnalyzerTabsProps {
  tokens: any[]
  sourceCode: string
  symbols: any[]
  semanticErrors: any[]
  tree: any
  inputStack: any[]
  outputStack: any[]
  stackHistory: any[]
  steps: string[]
}

export function AnalyzerTabs({
  tokens,
  sourceCode,
  symbols,
  semanticErrors,
  tree,
  inputStack,
  outputStack,
  stackHistory,
  steps,
}: AnalyzerTabsProps) {
  const [activeTab, setActiveTab] = useState("tokens")
  const [searchTerm, setSearchTerm] = useState("")
  const [isFullscreen, setIsFullscreen] = useState(false)

  const filteredTokens = searchTerm
    ? tokens.filter(
        (token) =>
          token.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          token.value.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : tokens

  const filteredSymbols = searchTerm
    ? symbols.filter(
        (symbol) =>
          symbol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          symbol.type.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : symbols

  const errorCount = semanticErrors.length
  const warningCount = semanticErrors.filter((err) => err.severity === "warning").length
  const infoCount = semanticErrors.filter((err) => err.severity === "info").length

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)

    // Aplicar clase al contenedor principal para expandir a pantalla completa
    const mainContainer = document.querySelector("main")
    if (mainContainer) {
      if (!isFullscreen) {
        mainContainer.classList.add("fullscreen-mode")
      } else {
        mainContainer.classList.remove("fullscreen-mode")
      }
    }
  }

  return (
    <div
      className={`analyzer-tabs-container ${isFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4 overflow-auto" : ""}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-green-700 dark:text-green-300">Resultados del Análisis</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          <span className="ml-2">{isFullscreen ? "Salir" : "Pantalla completa"}</span>
        </Button>
      </div>

      <div className="flex items-center mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar en resultados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 border-green-200 dark:border-green-800 focus:ring-green-500 dark:focus:ring-green-400"
          />
        </div>
        <div className="flex gap-2 ml-4">
          {errorCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle size={12} />
              {errorCount} {errorCount === 1 ? "error" : "errores"}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="warning" className="flex items-center gap-1 bg-yellow-500">
              <AlertTriangle size={12} />
              {warningCount} {warningCount === 1 ? "advertencia" : "advertencias"}
            </Badge>
          )}
          {infoCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertTriangle size={12} />
              {infoCount} {infoCount === 1 ? "info" : "infos"}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full bg-green-100 dark:bg-green-900 p-1 rounded-xl mb-4 overflow-x-auto">
          <TabsTrigger
            value="tokens"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-green-800 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-200"
          >
            <Code size={16} />
            <span>Tokens</span>
            <Badge variant="secondary" className="ml-1 bg-green-200 dark:bg-green-700 text-xs">
              {tokens.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="tree"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-green-800 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-200"
          >
            <FileTree size={16} />
            <span>Árbol</span>
          </TabsTrigger>
          <TabsTrigger
            value="stack"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-green-800 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-200"
          >
            <Layers size={16} />
            <span>Pilas</span>
          </TabsTrigger>
          <TabsTrigger
            value="steps"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-green-800 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-200"
          >
            <List size={16} />
            <span>Pasos</span>
          </TabsTrigger>
          <TabsTrigger
            value="symbols"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-green-800 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-200"
          >
            <Database size={16} />
            <span>Símbolos</span>
            <Badge variant="secondary" className="ml-1 bg-green-200 dark:bg-green-700 text-xs">
              {symbols.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="errors"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-green-800 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-200"
          >
            <AlertTriangle size={16} />
            <span>Errores</span>
            {errorCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {errorCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-green-200 dark:border-green-800 overflow-hidden">
          <TabsContent value="tokens" className="p-0 m-0">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="p-4">
                  <TokenDisplay tokens={filteredTokens} sourceCode={sourceCode} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tree" className="p-0 m-0">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="p-4">
                  <DerivationTree tree={tree} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stack" className="p-0 m-0">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="p-4">
                  <StackDisplay inputStack={inputStack} outputStack={outputStack} stackHistory={stackHistory} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="steps" className="p-0 m-0">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="p-4">
                  <AnalysisSteps steps={steps} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="symbols" className="p-0 m-0">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="p-4">
                  <SymbolTable symbols={filteredSymbols} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="p-0 m-0">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="p-4">
                  <SemanticErrors errors={semanticErrors} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
