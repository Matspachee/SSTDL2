import type { AnalysisResult, Token, TreeNode, Symbol, SemanticError } from "./types"
import type { ProgrammingLanguage } from "./programming-languages"
import { EnhancedGrammar } from "./enhanced-grammar"
import { EnhancedLexer } from "./enhanced-lexer"
import { EnhancedParser } from "./enhanced-parser"
import { EnhancedSemanticAnalyzer } from "./enhanced-semantic-analyzer"

export class AnalyzerEngine {
  private grammar: EnhancedGrammar | null = null
  private language: ProgrammingLanguage | null = null

  setGrammar(grammarText: string): void {
    this.grammar = new EnhancedGrammar().loadFromString(grammarText)
  }

  setLanguage(language: ProgrammingLanguage): void {
    this.language = language
    this.setGrammar(language.grammar)
  }

  analyze(sourceCode: string): AnalysisResult {
    if (!this.grammar) {
      throw new Error("No se ha cargado una gramática")
    }

    if (!sourceCode.trim()) {
      throw new Error("El código fuente está vacío")
    }

    try {
      // Análisis léxico
      const lexer = new EnhancedLexer(sourceCode, this.language?.keywords || [], this.language?.datatypes || [])
      const tokens = lexer.tokenize()

      if (tokens.length === 0) {
        // Crear tokens mínimos si no se encontraron
        const minimalTokens = [
          {
            type: "IDENTIFIER",
            value: "empty",
            line: 1,
            column: 1,
            startIndex: 0,
            endIndex: 0,
          },
        ]

        const parser = new EnhancedParser(this.grammar)
        const parseResult = parser.parse(minimalTokens)

        return {
          success: false,
          tokens: minimalTokens,
          tree: parseResult.tree,
          symbols: [],
          semanticErrors: [
            {
              type: "No tokens found",
              message: "No se encontraron tokens válidos en el código",
              severity: "error",
              line: 1,
              column: 1,
            },
          ],
          stackHistory: parseResult.stackHistory,
          steps: parseResult.steps,
          statistics: {
            tokenCount: 0,
            symbolCount: 0,
            errorCount: 1,
            warningCount: 0,
            treeDepth: 1,
          },
        }
      }

      // Análisis sintáctico
      const parser = new EnhancedParser(this.grammar)
      const parseResult = parser.parse(tokens)

      // Análisis semántico
      const semanticAnalyzer = new EnhancedSemanticAnalyzer(tokens, this.language)
      const semanticResult = semanticAnalyzer.analyze()

      // Calcular estadísticas
      const statistics = this.calculateStatistics(
        tokens,
        semanticResult.symbols,
        semanticResult.errors,
        parseResult.tree,
      )

      return {
        success: parseResult.success && semanticResult.errors.filter((e) => e.severity === "error").length === 0,
        tokens,
        tree: parseResult.tree,
        symbols: semanticResult.symbols,
        semanticErrors: semanticResult.errors,
        stackHistory: parseResult.stackHistory,
        steps: parseResult.steps,
        statistics,
      }
    } catch (error) {
      // En caso de error, crear un resultado mínimo
      const minimalTokens = [
        {
          type: "ERROR",
          value: "error",
          line: 1,
          column: 1,
          startIndex: 0,
          endIndex: 0,
        },
      ]

      const parser = new EnhancedParser(this.grammar)
      const parseResult = parser.parse(minimalTokens)

      return {
        success: false,
        tokens: minimalTokens,
        tree: parseResult.tree,
        symbols: [],
        semanticErrors: [
          {
            type: "Analysis Error",
            message: `Error durante el análisis: ${error}`,
            severity: "error",
            line: 1,
            column: 1,
          },
        ],
        stackHistory: parseResult.stackHistory,
        steps: [`Error durante el análisis: ${error}`],
        statistics: {
          tokenCount: 0,
          symbolCount: 0,
          errorCount: 1,
          warningCount: 0,
          treeDepth: 1,
        },
      }
    }
  }

  private calculateStatistics(tokens: Token[], symbols: Symbol[], errors: SemanticError[], tree: TreeNode | null) {
    return {
      tokenCount: tokens.length,
      symbolCount: symbols.filter((s) => s.usage === "declaration").length,
      errorCount: errors.filter((e) => e.severity === "error").length,
      warningCount: errors.filter((e) => e.severity === "warning").length,
      treeDepth: this.calculateTreeDepth(tree),
    }
  }

  private calculateTreeDepth(node: TreeNode | null): number {
    if (!node || !node.children || node.children.length === 0) {
      return 1
    }

    let maxDepth = 0
    for (const child of node.children) {
      const depth = this.calculateTreeDepth(child)
      if (depth > maxDepth) {
        maxDepth = depth
      }
    }

    return maxDepth + 1
  }

  getGrammarInfo() {
    if (!this.grammar) return null
    return this.grammar.getGrammarData()
  }

  isReady(): boolean {
    return this.grammar !== null
  }
}
