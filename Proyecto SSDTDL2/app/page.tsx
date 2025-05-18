"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Grammar } from "@/lib/parser"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Code, FileText, Moon, Sun, Download } from "lucide-react"
import { CodeEditor } from "@/components/code-editor"
import { getLanguageById, type ProgrammingLanguage } from "@/lib/programming-languages"
import { GrammarUploader } from "@/components/grammar-uploader"
import { parseGrammarFromExcel } from "@/lib/excel-parser"
import { LanguageSelector } from "@/components/language-selector"
import { AnalyzerResults } from "@/components/analyzer-results"
import { useTheme } from "next-themes"
import { Lexer } from "@/lib/lexer"
import { TreeGenerator } from "@/lib/tree-generator"
import { SemanticAnalyzer } from "@/lib/semantic-analyzer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  const [grammar, setGrammar] = useState<Grammar | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("setup")
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
  const [languageData, setLanguageData] = useState<ProgrammingLanguage | null>(null)
  const [sourceCode, setSourceCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedGrammarName, setUploadedGrammarName] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Evitar hidratación incorrecta
  useEffect(() => {
    setMounted(true)
  }, [])

  // Actualizar los datos del lenguaje cuando cambia la selección
  useEffect(() => {
    if (selectedLanguage) {
      const language = getLanguageById(selectedLanguage)
      setLanguageData(language || null)

      if (language) {
        try {
          setError(null)
          const newGrammar = new Grammar().loadFromString(language.grammar)
          setGrammar(newGrammar)
          setSourceCode(language.example)
          setUploadedGrammarName(null)
        } catch (err: any) {
          setError(`Error al cargar la gramática: ${err.message}`)
        }
      }
    } else {
      setLanguageData(null)
      setGrammar(null)
      setSourceCode("")
    }
  }, [selectedLanguage])

  const handleSelectLanguage = (languageId: string) => {
    setSelectedLanguage(languageId)
    setAnalysisResult(null)
  }

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const grammarText = await parseGrammarFromExcel(file)
      const newGrammar = new Grammar().loadFromString(grammarText)
      setGrammar(newGrammar)
      setSelectedLanguage(null)
      setLanguageData(null)
      setUploadedGrammarName(file.name)
      setSourceCode("")
    } catch (err: any) {
      setError(`Error al procesar el archivo: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeCode = () => {
    if (!grammar) {
      setError("Primero debes seleccionar un lenguaje o cargar una gramática")
      return
    }

    if (!sourceCode.trim()) {
      setError("Ingresa código para analizar")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Crear un analizador léxico
      const lexer = new Lexer(
        sourceCode,
        languageData ? languageData.keywords : [],
        languageData ? languageData.datatypes : [],
      )
      const tokens = lexer.tokenize()

      // Generar un árbol de derivación y pilas
      const treeGenerator = new TreeGenerator(grammar, tokens)
      const { tree, inputStack, outputStack, stackHistory } = treeGenerator.generate()

      // Realizar análisis semántico
      const semanticAnalyzer = new SemanticAnalyzer(tokens, languageData)
      const { symbols, errors: semanticErrors } = semanticAnalyzer.analyze()

      // Establecer el resultado del análisis
      setAnalysisResult({
        tokens,
        tree,
        inputStack,
        outputStack,
        stackHistory,
        steps: [`Análisis léxico completado. Se encontraron ${tokens.length} tokens.`],
        symbols,
        semanticErrors,
      })

      setActiveTab("results")
    } catch (err: any) {
      setError(`Error durante el análisis: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportResults = () => {
    if (!analysisResult) return

    const exportData = {
      sourceCode,
      tokens: analysisResult.tokens,
      symbols: analysisResult.symbols,
      semanticErrors: analysisResult.semanticErrors,
      language: languageData?.name || uploadedGrammarName || "Custom Grammar",
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    const exportFileDefaultName = `analysis-results-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  if (!mounted) {
    return null // Evitar renderizado durante la hidratación
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f0a1e] via-[#1a1033] to-[#1a0f2e] text-white relative overflow-hidden">
      {/* Estrellas de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars-container">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8 relative z-10">
        <motion.header
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-purple-200">Analizador</h1>
          </div>
          <div className="flex items-center gap-4">
            {analysisResult && (
              <Button
                variant="outline"
                className="flex items-center gap-2 border-purple-400 text-purple-200 hover:bg-purple-800"
                onClick={handleExportResults}
              >
                <Download size={16} />
                <span>Exportar</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-purple-200 hover:text-white hover:bg-purple-800"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </motion.header>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-500 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto bg-purple-800/50 p-1 rounded-xl">
            <TabsTrigger
              value="setup"
              className="flex items-center gap-2 data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-lg transition-all"
            >
              <FileText size={16} />
              <span>Configuración</span>
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="flex items-center gap-2 data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-lg transition-all"
              disabled={!analysisResult}
            >
              <Code size={16} />
              <span>Resultados</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="bg-purple-800/30 border-purple-600/50 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-purple-200 mb-4 flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Selecciona un lenguaje o carga una gramática
                    </h2>
                    <div className="space-y-6">
                      <LanguageSelector onSelectLanguage={handleSelectLanguage} selectedLanguage={selectedLanguage} />
                      <div className="border-t border-purple-700 my-6"></div>
                      <GrammarUploader onFileUpload={handleFileUpload} isLoading={isLoading} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-purple-800/30 border-purple-600/50 backdrop-blur-sm overflow-hidden h-full">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-purple-200 mb-4 flex items-center">
                      <Code className="mr-2 h-5 w-5" />
                      Editor de código
                    </h2>
                    <CodeEditor
                      value={sourceCode}
                      onChange={setSourceCode}
                      onAnalyze={handleAnalyzeCode}
                      language={languageData}
                      grammarLoaded={!!grammar}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            {analysisResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <AnalyzerResults
                  sourceCode={sourceCode}
                  tokens={analysisResult.tokens || []}
                  symbols={analysisResult.symbols || []}
                  semanticErrors={analysisResult.semanticErrors || []}
                  tree={analysisResult.tree}
                  inputStack={analysisResult.inputStack || []}
                  outputStack={analysisResult.outputStack || []}
                  stackHistory={analysisResult.stackHistory || []}
                  steps={analysisResult.steps || []}
                />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="bg-purple-800/30 border-purple-600/50 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center py-12">
                      <Code className="h-16 w-16 text-purple-400 mb-4" />
                      <h3 className="text-xl font-medium mb-2 text-purple-200">No hay resultados disponibles</h3>
                      <p className="text-purple-300 max-w-md mb-6">
                        Primero debes seleccionar un lenguaje o cargar una gramática y analizar código para ver los
                        resultados.
                      </p>
                      <Button
                        variant="default"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => setActiveTab("setup")}
                      >
                        Comenzar análisis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
