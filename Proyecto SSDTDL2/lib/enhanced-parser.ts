import type { Token, TreeNode, StackItem, StackState } from "./types"
import type { EnhancedGrammar } from "./enhanced-grammar"

export class EnhancedParser {
  private grammar: EnhancedGrammar
  private tokens: Token[]
  private currentTokenIndex: number
  private nodeIdCounter: number
  private stackHistory: StackState[]
  private steps: string[]

  constructor(grammar: EnhancedGrammar) {
    this.grammar = grammar
    this.tokens = []
    this.currentTokenIndex = 0
    this.nodeIdCounter = 0
    this.stackHistory = []
    this.steps = []
  }

  parse(tokens: Token[]): { success: boolean; tree: TreeNode | null; stackHistory: StackState[]; steps: string[] } {
    this.tokens = tokens
    this.currentTokenIndex = 0
    this.nodeIdCounter = 0
    this.stackHistory = []
    this.steps = []

    if (tokens.length === 0) {
      // Crear un árbol mínimo para mostrar algo
      const minimalTree = this.createMinimalTree("No hay tokens para analizar")
      return {
        success: false,
        tree: minimalTree,
        stackHistory: [],
        steps: ["Error: No hay tokens para analizar"],
      }
    }

    try {
      const tree = this.parseLL1()

      // Si no se pudo generar un árbol, crear uno mínimo
      if (!tree) {
        const minimalTree = this.createMinimalTree("Error en el análisis sintáctico")
        return {
          success: false,
          tree: minimalTree,
          stackHistory: this.stackHistory,
          steps: this.steps,
        }
      }

      return {
        success: tree !== null,
        tree,
        stackHistory: this.stackHistory,
        steps: this.steps,
      }
    } catch (error) {
      this.steps.push(`Error durante el análisis: ${error}`)
      const minimalTree = this.createMinimalTree(`Error: ${error}`)
      return {
        success: false,
        tree: minimalTree,
        stackHistory: this.stackHistory,
        steps: this.steps,
      }
    }
  }

  private createMinimalTree(message: string): TreeNode {
    return {
      id: this.nodeIdCounter++,
      label: this.grammar.startSymbol || "PROGRAM",
      type: "nonTerminal",
      children: [
        {
          id: this.nodeIdCounter++,
          label: message,
          type: "terminal",
          children: [],
        },
      ],
    }
  }

  private createTreeFromTokens(): TreeNode {
    const rootNode: TreeNode = {
      id: this.nodeIdCounter++,
      label: this.grammar.startSymbol || "PROGRAM",
      type: "nonTerminal",
      children: [],
    }

    // Crear nodos para cada token
    for (const token of this.tokens) {
      const tokenNode: TreeNode = {
        id: this.nodeIdCounter++,
        label: token.value,
        type: "terminal",
        children: [],
        token: token,
      }
      rootNode.children.push(tokenNode)
    }

    return rootNode
  }

  private parseLL1(): TreeNode | null {
    // Crear nodo raíz
    const rootNode: TreeNode = {
      id: this.nodeIdCounter++,
      label: this.grammar.startSymbol,
      type: "nonTerminal",
      children: [],
    }

    // Inicializar pilas
    const inputStack: string[] = []
    const outputStack: string[] = []

    // Llenar pila de entrada con tokens
    for (const token of this.tokens) {
      inputStack.push(token.value)
    }
    inputStack.push("$")

    // Inicializar pila de salida
    outputStack.push("$")
    outputStack.push(this.grammar.startSymbol)

    this.recordStackState(
      inputStack.map((v) => ({ type: "terminal", value: v })),
      outputStack.map((v) => ({ type: v === "$" ? "endMarker" : "nonTerminal", value: v })),
      "Inicialización",
      0,
    )

    let step = 1
    const maxSteps = 1000
    const nodeStack: TreeNode[] = [rootNode]

    while (step < maxSteps && outputStack.length > 1) {
      const topOutput = outputStack[outputStack.length - 1]
      const topInput = inputStack[0]

      // Si el símbolo de salida es terminal
      if (this.isTerminal(topOutput)) {
        if (this.matchTerminals(topOutput, topInput)) {
          outputStack.pop()
          inputStack.shift()
          this.currentTokenIndex++

          // Actualizar nodo en el árbol
          const currentNode = nodeStack.pop()
          if (currentNode && currentNode.children.length === 0) {
            currentNode.type = "terminal"
            if (this.currentTokenIndex - 1 < this.tokens.length) {
              currentNode.token = this.tokens[this.currentTokenIndex - 1]
            }
          }

          this.steps.push(`Consumido terminal: "${topOutput}"`)
          this.recordStackState(
            inputStack.map((v) => ({ type: "terminal", value: v })),
            outputStack.map((v) => ({
              type: v === "$" ? "endMarker" : this.isTerminal(v) ? "terminal" : "nonTerminal",
              value: v,
            })),
            `Consumido: "${topOutput}"`,
            step,
          )
        } else {
          this.steps.push(`Error: Esperaba "${topOutput}", encontró "${topInput}"`)
          return this.createTreeFromTokens()
        }
      }
      // Si el símbolo de salida es no terminal
      else if (topOutput !== "$") {
        const production = this.selectProduction(topOutput, topInput)

        if (production) {
          outputStack.pop()
          const currentNode = nodeStack.pop()

          // Crear nodos hijos
          const childNodes: TreeNode[] = []
          for (const symbol of production) {
            if (symbol.type !== "epsilon") {
              const childNode: TreeNode = {
                id: this.nodeIdCounter++,
                label: symbol.value,
                type: symbol.type as "nonTerminal" | "terminal" | "epsilon",
                children: [],
              }
              childNodes.push(childNode)

              // Añadir a la pila de salida en orden inverso
              outputStack.push(symbol.value)
            } else {
              // Nodo epsilon
              const epsilonNode: TreeNode = {
                id: this.nodeIdCounter++,
                label: "ε",
                type: "epsilon",
                children: [],
              }
              childNodes.push(epsilonNode)
            }
          }

          // Añadir hijos al nodo actual
          if (currentNode) {
            currentNode.children = childNodes
          }

          // Añadir nodos a la pila en orden inverso
          for (let i = childNodes.length - 1; i >= 0; i--) {
            if (childNodes[i].type !== "epsilon") {
              nodeStack.push(childNodes[i])
            }
          }

          const productionStr = production.map((s) => s.value).join(" ")
          this.steps.push(`Aplicada producción: ${topOutput} -> ${productionStr}`)
          this.recordStackState(
            inputStack.map((v) => ({ type: "terminal", value: v })),
            outputStack.map((v) => ({
              type: v === "$" ? "endMarker" : this.isTerminal(v) ? "terminal" : "nonTerminal",
              value: v,
            })),
            `${topOutput} -> ${productionStr}`,
            step,
          )
        } else {
          this.steps.push(`Error: No se encontró producción para "${topOutput}" con entrada "${topInput}"`)
          return this.createTreeFromTokens()
        }
      }

      step++
    }

    if (step >= maxSteps) {
      this.steps.push("Error: Demasiadas iteraciones")
      return this.createTreeFromTokens()
    }

    if (inputStack.length === 1 && inputStack[0] === "$" && outputStack.length === 1 && outputStack[0] === "$") {
      this.steps.push("Análisis completado exitosamente")
      return rootNode
    }

    return this.createTreeFromTokens()
  }

  private selectProduction(nonTerminal: string, currentToken: string): Array<{ type: string; value: string }> | null {
    const productions = this.grammar.getProductionsFor(nonTerminal)

    if (productions.length === 0) {
      return null
    }

    // Buscar producción que comience con el token actual
    for (const production of productions) {
      if (production.length === 0) continue

      const firstSymbol = production[0]

      if (firstSymbol.type === "terminal") {
        if (this.matchTerminals(firstSymbol.value, currentToken)) {
          return production
        }
      } else if (firstSymbol.type === "epsilon") {
        return production
      }
    }

    // Si no se encuentra coincidencia exacta, usar la primera producción
    return productions[0]
  }

  private matchTerminals(expected: string, actual: string): boolean {
    // Coincidencia exacta
    if (expected === actual) return true

    // Categorías especiales
    if (expected === "IDENTIFIER" && this.isIdentifier(actual)) return true
    if (expected === "NUMBER" && this.isNumber(actual)) return true
    if (expected === "STRING" && this.isString(actual)) return true

    // Identificadores genéricos
    if (this.isIdentifier(expected) && this.isIdentifier(actual)) return true

    return false
  }

  private isIdentifier(token: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)
  }

  private isNumber(token: string): boolean {
    return /^[0-9]+(\.[0-9]+)?$/.test(token)
  }

  private isString(token: string): boolean {
    return (token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))
  }

  private recordStackState(input: StackItem[], output: StackItem[], action: string, step: number): void {
    this.stackHistory.push({
      input: [...input],
      output: [...output],
      action,
      step,
    })
  }

  private isTerminal(symbol: string): boolean {
    // Un símbolo es terminal si:
    // 1. Está entre comillas
    // 2. Es un token conocido (IDENTIFIER, NUMBER, etc.)
    // 3. Es un símbolo especial

    if (symbol.startsWith('"') && symbol.endsWith('"')) return true
    if (["IDENTIFIER", "NUMBER", "STRING", "DATATYPE"].includes(symbol)) return true
    if (this.grammar && this.grammar.isTerminal(symbol)) return true

    // Verificar si es una palabra clave o símbolo del lenguaje
    const keywords = [
      "int",
      "float",
      "char",
      "void",
      "if",
      "else",
      "while",
      "for",
      "return",
      "function",
      "var",
      "let",
      "const",
      "def",
    ]
    const operators = ["+", "-", "*", "/", "=", "(", ")", "{", "}", ";", ","]

    return keywords.includes(symbol) || operators.includes(symbol)
  }
}
