import type { Grammar } from "./parser"
import { Lexer, type Token } from "./lexer"
import type { ProgrammingLanguage } from "./programming-languages"

// Asegurarse de que todos los nodos tengan la propiedad children inicializada
export interface TreeNode {
  id: number
  label: string
  type: "nonTerminal" | "terminal" | "epsilon"
  children: TreeNode[]
  token?: Token
}

// Interfaz para representar un elemento en la pila
export interface StackItem {
  type: "nonTerminal" | "terminal" | "epsilon" | "endMarker"
  value: string
}

// Clase para el análisis sintáctico mejorado
export class EnhancedParser {
  grammar: Grammar
  tokens: Token[]
  currentTokenIndex: number
  steps: string[]
  treeNodes: Record<number, TreeNode>
  nodeId: number
  language: ProgrammingLanguage
  errors: Array<{
    message: string
    line: number
    column: number
    expected?: string
    found?: string
  }>
  inputStack: StackItem[] // Pila de entrada
  outputStack: StackItem[] // Pila de salida
  stackHistory: Array<{
    input: StackItem[]
    output: StackItem[]
    action: string
  }>

  constructor(grammar: Grammar, language: ProgrammingLanguage) {
    this.grammar = grammar
    this.language = language
    this.tokens = []
    this.currentTokenIndex = 0
    this.steps = []
    this.treeNodes = {}
    this.nodeId = 0
    this.errors = []
    this.inputStack = []
    this.outputStack = []
    this.stackHistory = []
  }

  // Analizar código fuente
  parseCode(code: string) {
    // Realizar análisis léxico
    const lexer = new Lexer(code, this.language.keywords, this.datatypes)
    this.tokens = lexer.tokenize()
    this.currentTokenIndex = 0
    this.steps = []
    this.treeNodes = {}
    this.nodeId = 0
    this.errors = []
    this.inputStack = []
    this.outputStack = []
    this.stackHistory = []

    // Registrar los tokens encontrados
    this.steps.push(`Análisis léxico completado. Se encontraron ${this.tokens.length} tokens:`)
    this.tokens.forEach((token, index) => {
      this.steps.push(
        `  Token ${index + 1}: Tipo=${token.type}, Valor='${token.value}', Línea=${token.line}, Columna=${token.column}`,
      )
    })

    // Añadir token a la pila de entrada
    this.tokens.forEach((token) => {
      this.inputStack.push({
        type: "terminal",
        value: token.value,
      })
    })

    // Añadir marcador de fin a la pila de entrada
    this.inputStack.push({ type: "endMarker", value: "$" })

    // Inicializar pila de salida con el marcador de fin y el símbolo inicial
    this.outputStack = [
      { type: "endMarker", value: "$" }, // Marcador de fin
      { type: "nonTerminal", value: this.grammar.startSymbol || "PROGRAM" }, // Símbolo inicial
    ]

    // Iniciar análisis sintáctico
    if (!this.grammar.startSymbol) {
      throw new Error("La gramática no tiene un símbolo inicial")
    }

    this.steps.push("\nIniciando análisis sintáctico:")
    this.recordStackState("Inicialización")

    // Realizar análisis LL(1)
    const result = this.performLLParsing()

    return {
      success: result.success,
      tree: result.tree,
      steps: this.steps,
      tokens: this.tokens,
      errors: this.errors,
      stackHistory: this.stackHistory,
    }
  }

  // Modificar el método performLLParsing para mejorar el análisis sintáctico
  performLLParsing() {
    let iterations = 0
    const MAX_ITERATIONS = 1000 // Límite para evitar bucles infinitos
    let hasErrors = false

    // Inicializar el árbol con el símbolo inicial
    const rootId = this.nodeId++
    const rootNode: TreeNode = {
      id: rootId,
      label: this.grammar.startSymbol || "PROGRAM",
      type: "nonTerminal",
      children: [],
    }
    this.treeNodes[rootId] = rootNode

    // Mapa para rastrear qué nodos del árbol corresponden a qué símbolos en la pila
    const nodeStack: { node: TreeNode; symbol: StackItem }[] = [
      { node: rootNode, symbol: { type: "nonTerminal", value: this.grammar.startSymbol || "PROGRAM" } },
    ]

    while (iterations < MAX_ITERATIONS) {
      iterations++

      // Verificar si hemos terminado exitosamente
      if (
        this.outputStack.length === 1 &&
        this.outputStack[0].type === "endMarker" &&
        this.inputStack.length === 1 &&
        this.inputStack[0].type === "endMarker"
      ) {
        this.steps.push("Análisis completado" + (hasErrors ? " con errores." : " exitosamente."))
        this.recordStackState("Análisis completado" + (hasErrors ? " con errores" : ""))
        return { success: !hasErrors, tree: rootNode }
      }

      // Si no hay más símbolos en la pila de salida pero aún hay entrada, hay un error
      if (this.outputStack.length === 0 && this.inputStack.length > 0) {
        const error = "Error: Fin de análisis pero aún hay tokens de entrada."
        this.steps.push(error)
        this.recordStackState("Error: Fin prematuro")
        this.addError(error)
        hasErrors = true

        // Intentar recuperarse del error
        if (this.inputStack.length > 1) {
          // Descartar el token actual y continuar
          this.inputStack.shift()
          this.steps.push("Recuperación: Descartando token y continuando análisis.")
          this.recordStackState("Recuperación: Descartando token")
          continue
        } else {
          // No hay más tokens para descartar
          break
        }
      }

      // Si no hay más tokens en la entrada pero aún hay símbolos en la pila, hay un error
      if (this.inputStack.length === 0 && this.outputStack.length > 0) {
        const error = "Error: Fin de entrada inesperado, aún hay símbolos en la pila."
        this.steps.push(error)
        this.recordStackState("Error: Fin de entrada inesperado")
        this.addError(error)
        hasErrors = true

        // Intentar recuperarse del error
        if (this.outputStack.length > 1) {
          // Descartar el símbolo actual y continuar
          this.outputStack.pop()
          nodeStack.pop()
          this.steps.push("Recuperación: Descartando símbolo y continuando análisis.")
          this.recordStackState("Recuperación: Descartando símbolo")
          continue
        } else {
          // No hay más símbolos para descartar
          break
        }
      }

      // Obtener el símbolo superior de la pila de salida
      const topOutput = this.outputStack[this.outputStack.length - 1]

      // Si es un marcador de fin, pero aún hay entrada, hay un error
      if (topOutput.type === "endMarker" && this.inputStack.length > 1) {
        const error = "Error: Fin de análisis pero aún hay tokens de entrada."
        this.steps.push(error)
        this.recordStackState("Error: Fin prematuro")
        this.addError(error)
        hasErrors = true

        // Intentar recuperarse del error
        if (this.inputStack.length > 1) {
          // Descartar el token actual y continuar
          this.inputStack.shift()
          this.steps.push("Recuperación: Descartando token y continuando análisis.")
          this.recordStackState("Recuperación: Descartando token")
          continue
        } else {
          // No hay más tokens para descartar
          break
        }
      }

      // Obtener el símbolo actual de la entrada
      const currentInput = this.inputStack[0]

      // Si el símbolo de salida es terminal
      if (topOutput.type === "terminal") {
        // Si coincide con la entrada, consumir ambos
        if (
          topOutput.value === currentInput.value ||
          (this.isIdentifier(topOutput.value) && this.isIdentifier(currentInput.value))
        ) {
          this.steps.push(
            `Coincidencia: Terminal "${topOutput.value}" coincide con la entrada "${currentInput.value}".`,
          )

          // Encontrar el nodo correspondiente en el nodeStack
          const nodeEntry = nodeStack.pop()
          if (nodeEntry) {
            // Actualizar el nodo con el token consumido
            nodeEntry.node.token = this.tokens[this.currentTokenIndex]
            nodeEntry.node.label = currentInput.value // Actualizar la etiqueta con el valor real
            this.currentTokenIndex++
          }

          this.outputStack.pop() // Quitar de la pila de salida
          this.inputStack.shift() // Quitar de la pila de entrada
          this.recordStackState(`Consumido: "${currentInput.value}"`)
        } else {
          // Intentar manejar categorías de tokens (IDENTIFIER, NUMBER, etc.)
          if (this.matchTokenCategory(topOutput.value, currentInput.value)) {
            this.steps.push(`Coincidencia de categoría: "${topOutput.value}" coincide con "${currentInput.value}".`)

            // Encontrar el nodo correspondiente en el nodeStack
            const nodeEntry = nodeStack.pop()
            if (nodeEntry) {
              // Actualizar el nodo con el token consumido
              nodeEntry.node.token = this.tokens[this.currentTokenIndex]
              nodeEntry.node.label = currentInput.value // Actualizar la etiqueta con el valor real
              this.currentTokenIndex++
            }

            this.outputStack.pop() // Quitar de la pila de salida
            this.inputStack.shift() // Quitar de la pila de entrada
            this.recordStackState(`Consumido por categoría: "${currentInput.value}"`)
          } else {
            // Error: terminal esperado no coincide
            const error = `Error: Esperaba "${topOutput.value}", encontró "${currentInput.value}".`
            this.steps.push(error)
            this.recordStackState("Error: Terminal no coincide")
            this.addError(error)
            hasErrors = true

            // Intentar recuperarse del error
            // Estrategia 1: Descartar el token actual y continuar
            this.inputStack.shift()
            this.steps.push("Recuperación: Descartando token y continuando análisis.")
            this.recordStackState("Recuperación: Descartando token")
          }
        }
      }
      // Si el símbolo de salida es no terminal
      else if (topOutput.type === "nonTerminal") {
        const nonTerminal = topOutput.value

        // Buscar producción aplicable
        if (!this.grammar.productions.has(nonTerminal)) {
          const error = `Error: No hay producciones para el no terminal "${nonTerminal}".`
          this.steps.push(error)
          this.recordStackState("Error: No hay producción")
          this.addError(error)
          hasErrors = true

          // Intentar recuperarse del error
          this.outputStack.pop() // Quitar el no terminal de la pila
          nodeStack.pop() // Quitar el nodo correspondiente
          this.steps.push("Recuperación: Descartando no terminal y continuando análisis.")
          this.recordStackState("Recuperación: Descartando no terminal")
          continue
        }

        // Obtener producciones para este no terminal
        const productions = this.grammar.productions.get(nonTerminal)!

        // Encontrar la producción adecuada basada en el token actual
        const production = this.selectProduction(nonTerminal, productions, currentInput.value)

        if (!production) {
          const error = `Error: No se encontró una producción adecuada para "${nonTerminal}" con entrada "${currentInput.value}".`
          this.steps.push(error)
          this.recordStackState("Error: No hay producción aplicable")
          this.addError(error)
          hasErrors = true

          // Intentar recuperarse del error
          // Estrategia 1: Usar la primera producción disponible
          const fallbackProduction = productions[0]
          this.steps.push(`Recuperación: Usando producción por defecto para "${nonTerminal}".`)

          // Encontrar el nodo correspondiente en el nodeStack
          const nodeEntry = nodeStack.pop()
          if (!nodeEntry) {
            const error = "Error interno: Nodo no encontrado en la pila."
            this.steps.push(error)
            this.addError(error)
            hasErrors = true
            continue
          }

          const parentNode = nodeEntry.node

          // Quitar el no terminal de la pila de salida
          this.outputStack.pop()

          // Añadir los símbolos de la producción a la pila de salida (en orden inverso)
          const productionSymbols: StackItem[] = []
          const childNodes: TreeNode[] = []

          for (let i = 0; i < fallbackProduction.length; i++) {
            const symbol = fallbackProduction[i]
            const stackItem: StackItem = {
              type: symbol.type as "nonTerminal" | "terminal" | "epsilon",
              value: symbol.value,
            }
            productionSymbols.push(stackItem)

            // Crear nodo hijo para este símbolo
            const childId = this.nodeId++
            const childNode: TreeNode = {
              id: childId,
              label: symbol.value,
              type: symbol.type as "nonTerminal" | "terminal" | "epsilon",
              children: [],
            }
            childNodes.push(childNode)
          }

          // Añadir los nodos hijos al nodo padre
          parentNode.children = childNodes

          // Añadir los símbolos a la pila de salida en orden inverso
          for (let i = productionSymbols.length - 1; i >= 0; i--) {
            const symbol = productionSymbols[i]
            const node = childNodes[i]

            // Si no es epsilon, añadir a la pila de salida y al nodeStack
            if (symbol.type !== "epsilon") {
              this.outputStack.push(symbol)
              nodeStack.push({ node, symbol })
            }
          }

          const productionStr = productionSymbols.map((s) => s.value).join(" ")
          this.steps.push(`Recuperación: Aplicada producción por defecto: ${nonTerminal} -> ${productionStr}`)
          this.recordStackState(`Recuperación: Aplicada producción por defecto`)
          continue
        }

        // Encontrar el nodo correspondiente en el nodeStack
        const nodeEntry = nodeStack.pop()
        if (!nodeEntry) {
          const error = "Error interno: Nodo no encontrado en la pila."
          this.steps.push(error)
          this.addError(error)
          hasErrors = true
          continue
        }

        const parentNode = nodeEntry.node

        // Quitar el no terminal de la pila de salida
        this.outputStack.pop()

        // Añadir los símbolos de la producción a la pila de salida (en orden inverso)
        const productionSymbols: StackItem[] = []
        const childNodes: TreeNode[] = []

        for (let i = 0; i < production.length; i++) {
          const symbol = production[i]
          const stackItem: StackItem = {
            type: symbol.type as "nonTerminal" | "terminal" | "epsilon",
            value: symbol.value,
          }
          productionSymbols.push(stackItem)

          // Crear nodo hijo para este símbolo
          const childId = this.nodeId++
          const childNode: TreeNode = {
            id: childId,
            label: symbol.value,
            type: symbol.type as "nonTerminal" | "terminal" | "epsilon",
            children: [],
          }
          childNodes.push(childNode)
        }

        // Añadir los nodos hijos al nodo padre
        parentNode.children = childNodes

        // Añadir los símbolos a la pila de salida en orden inverso
        for (let i = productionSymbols.length - 1; i >= 0; i--) {
          const symbol = productionSymbols[i]
          const node = childNodes[i]

          // Si no es epsilon, añadir a la pila de salida y al nodeStack
          if (symbol.type !== "epsilon") {
            this.outputStack.push(symbol)
            nodeStack.push({ node, symbol })
          }
        }

        const productionStr = productionSymbols.map((s) => s.value).join(" ")
        this.steps.push(`Expansión: ${nonTerminal} -> ${productionStr}`)
        this.recordStackState(`Aplicada producción: ${nonTerminal} -> ${productionStr}`)
      }
      // Si el símbolo de salida es epsilon, simplemente quitarlo
      else if (topOutput.type === "epsilon") {
        this.steps.push("Consumiendo epsilon (ε).")
        this.outputStack.pop()
        nodeStack.pop() // Quitar el nodo correspondiente
        this.recordStackState("Consumido: ε")
      }
      // Si el símbolo de salida es un marcador de fin
      else if (topOutput.type === "endMarker") {
        // Si la entrada también es un marcador de fin, terminamos exitosamente
        if (currentInput.type === "endMarker") {
          this.steps.push("Análisis completado" + (hasErrors ? " con errores." : " exitosamente."))
          this.recordStackState("Análisis completado" + (hasErrors ? " con errores" : ""))
          return { success: !hasErrors, tree: rootNode }
        } else {
          // Error: esperaba fin de entrada
          const error = `Error: Esperaba fin de entrada, encontró "${currentInput.value}".`
          this.steps.push(error)
          this.recordStackState("Error: Esperaba fin de entrada")
          this.addError(error)
          hasErrors = true

          // Intentar recuperarse del error
          this.inputStack.shift()
          this.steps.push("Recuperación: Descartando token y continuando análisis.")
          this.recordStackState("Recuperación: Descartando token")
        }
      }
    }

    // Si llegamos aquí, probablemente hay un bucle infinito
    const error = "Error: Demasiadas iteraciones, posible bucle infinito en el análisis."
    this.steps.push(error)
    this.recordStackState("Error: Demasiadas iteraciones")
    this.addError(error)
    return { success: false, tree: rootNode }
  }

  // Añadir método para seleccionar la producción adecuada basada en el token actual
  selectProduction(
    nonTerminal: string,
    productions: Array<Array<{ type: string; value: string }>>,
    currentToken: string,
  ): Array<{ type: string; value: string }> | null {
    // Para Python, manejar casos específicos
    if (this.language.id === "python") {
      // Para STATEMENT, elegir la producción adecuada según el token
      if (nonTerminal === "STATEMENT") {
        // Si es un identificador, probablemente es una asignación o llamada a función
        if (this.isIdentifier(currentToken)) {
          return (
            productions.find((p) => p[0]?.value === "VARIABLE_ASSIGNMENT" || p[0]?.value === "EXPRESSION_STATEMENT") ||
            productions[0]
          )
        }
        // Si es una palabra clave, buscar la producción correspondiente
        if (this.isKeyword(currentToken)) {
          if (currentToken === "if") {
            return productions.find((p) => p[0]?.value === "IF_STATEMENT") || productions[0]
          }
          if (currentToken === "for") {
            return productions.find((p) => p[0]?.value === "FOR_STATEMENT") || productions[0]
          }
          if (currentToken === "while") {
            return productions.find((p) => p[0]?.value === "WHILE_STATEMENT") || productions[0]
          }
          if (currentToken === "def") {
            return productions.find((p) => p[0]?.value === "FUNCTION_DEFINITION") || productions[0]
          }
          if (currentToken === "return") {
            return productions.find((p) => p[0]?.value === "RETURN_STATEMENT") || productions[0]
          }
        }
      }

      // Para EXPRESSION, elegir según el token
      if (nonTerminal === "EXPRESSION") {
        if (this.isIdentifier(currentToken) || this.isNumber(currentToken) || this.isString(currentToken)) {
          return productions.find((p) => p[0]?.value === "TERM") || productions[0]
        }
      }
    }

    // Para JavaScript, manejar casos específicos
    if (this.language.id === "javascript") {
      // Lógica similar a Python pero adaptada a JavaScript
      if (nonTerminal === "STATEMENT") {
        if (this.isKeyword(currentToken)) {
          if (currentToken === "var" || currentToken === "let" || currentToken === "const") {
            return productions.find((p) => p[0]?.value === "VARIABLE_DECLARATION") || productions[0]
          }
          if (currentToken === "function") {
            return productions.find((p) => p[0]?.value === "FUNCTION_DECLARATION") || productions[0]
          }
          if (currentToken === "if") {
            return productions.find((p) => p[0]?.value === "IF_STATEMENT") || productions[0]
          }
          if (currentToken === "for") {
            return productions.find((p) => p[0]?.value === "FOR_STATEMENT") || productions[0]
          }
          if (currentToken === "while") {
            return productions.find((p) => p[0]?.value === "WHILE_STATEMENT") || productions[0]
          }
          if (currentToken === "return") {
            return productions.find((p) => p[0]?.value === "RETURN_STATEMENT") || productions[0]
          }
        }
        if (this.isIdentifier(currentToken)) {
          return productions.find((p) => p[0]?.value === "EXPRESSION_STATEMENT") || productions[0]
        }
      }
    }

    // Para gramáticas personalizadas o casos no específicos, usar la primera producción
    // En un analizador LL(1) real, aquí usaríamos una tabla de análisis
    return productions[0]
  }

  // Añadir método para verificar si un token coincide con una categoría
  matchTokenCategory(expected: string, actual: string): boolean {
    // Verificar si el token esperado es una categoría
    if (expected === "IDENTIFIER") {
      return this.isIdentifier(actual)
    }
    if (expected === "NUMBER") {
      return this.isNumber(actual)
    }
    if (expected === "STRING") {
      return this.isString(actual)
    }
    if (expected === "KEYWORD") {
      return this.isKeyword(actual)
    }

    // Si el token esperado es un identificador específico (como "a", "factorial", etc.)
    // y el token actual es cualquier identificador válido, considerarlo una coincidencia
    if (this.isIdentifier(expected) && this.isIdentifier(actual)) {
      return true
    }

    // Si no es una categoría, verificar coincidencia exacta
    return expected === actual
  }

  // Métodos auxiliares para verificar tipos de tokens
  isIdentifier(token: string): boolean {
    // Verificar si es un identificador válido (comienza con letra o _ y sigue con letras, números o _)
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token) && !this.isKeyword(token)
  }

  isNumber(token: string): boolean {
    // Verificar si es un número
    return /^[0-9]+(\.[0-9]+)?$/.test(token)
  }

  isString(token: string): boolean {
    // Verificar si es una cadena (entre comillas)
    return (token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))
  }

  isKeyword(token: string): boolean {
    // Verificar si es una palabra clave del lenguaje
    return this.language.keywords.includes(token)
  }

  // Registrar estado actual de las pilas
  recordStackState(action: string) {
    this.stackHistory.push({
      input: [...this.inputStack],
      output: [...this.outputStack],
      action,
    })
  }

  // Añadir un error al registro
  addError(message: string) {
    const currentToken = this.currentTokenIndex < this.tokens.length ? this.tokens[this.currentTokenIndex] : null
    this.errors.push({
      message,
      line: currentToken?.line || 0,
      column: currentToken?.column || 0,
      expected: this.outputStack[this.outputStack.length - 1]?.value,
      found: this.inputStack[0]?.value,
    })
  }

  // En la función generateDummyTree, asegurarse de que todos los nodos tengan children inicializado
  generateDummyTree() {
    const rootId = 0
    const root: TreeNode = {
      id: rootId,
      label: this.grammar.startSymbol || "PROGRAM",
      type: "nonTerminal",
      children: [],
    }

    // Añadir algunos nodos hijos para visualización
    if (this.language.id === "python") {
      root.children = [
        {
          id: 1,
          label: "FUNCTION_DEFINITION",
          type: "nonTerminal",
          children: [
            { id: 2, label: "def", type: "terminal", children: [] },
            { id: 3, label: "factorial", type: "terminal", children: [] },
            { id: 4, label: "(", type: "terminal", children: [] },
            { id: 5, label: "n", type: "terminal", children: [] },
            { id: 6, label: ")", type: "terminal", children: [] },
            { id: 7, label: ":", type: "terminal", children: [] },
            {
              id: 8,
              label: "INDENTED_BLOCK",
              type: "nonTerminal",
              children: [{ id: 9, label: "IF_STATEMENT", type: "nonTerminal", children: [] }],
            },
          ],
        },
      ]
    } else if (this.language.id === "javascript") {
      root.children = [
        {
          id: 1,
          label: "FUNCTION_DECLARATION",
          type: "nonTerminal",
          children: [
            { id: 2, label: "function", type: "terminal" },
            { id: 3, label: "factorial", type: "terminal" },
            { id: 4, label: "(", type: "terminal" },
            { id: 5, label: "n", type: "terminal" },
            { id: 6, label: ")", type: "terminal" },
            { id: 7, label: "{", type: "terminal" },
            {
              id: 8,
              label: "STATEMENTS",
              type: "nonTerminal",
              children: [{ id: 9, label: "IF_STATEMENT", type: "nonTerminal" }],
            },
            { id: 10, label: "}", type: "terminal" },
          ],
        },
      ]
    } else if (this.language.id === "c") {
      root.children = [
        {
          id: 1,
          label: "FUNCTION_DECLARATION",
          type: "nonTerminal",
          children: [
            { id: 2, label: "int", type: "terminal" },
            { id: 3, label: "factorial", type: "terminal" },
            { id: 4, label: "(", type: "terminal" },
            { id: 5, label: "int n", type: "terminal" },
            { id: 6, label: ")", type: "terminal" },
            { id: 7, label: "{", type: "terminal" },
            {
              id: 8,
              label: "STATEMENTS",
              type: "nonTerminal",
              children: [{ id: 9, label: "IF_STATEMENT", type: "nonTerminal" }],
            },
            { id: 10, label: "}", type: "terminal" },
          ],
        },
      ]
    }

    this.treeNodes[rootId] = root
    return root
  }

  // Analizar un símbolo no terminal
  parseNonTerminal(nonTerminal: string, level: number) {
    const indent = "  ".repeat(level)
    this.steps.push(`${indent}Intentando analizar ${nonTerminal} en posición ${this.currentTokenIndex}`)

    const nodeId = this.nodeId++
    const node = {
      id: nodeId,
      label: nonTerminal,
      type: "nonTerminal",
      children: [],
    }

    if (!this.grammar.productions.has(nonTerminal)) {
      const errorMsg = `No hay producciones para ${nonTerminal}`
      this.steps.push(`${indent}Error: ${errorMsg}`)
      return {
        success: false,
        error: errorMsg,
        expected: nonTerminal,
      }
    }

    const productions = this.grammar.productions.get(nonTerminal)!
    const originalTokenIndex = this.currentTokenIndex

    for (const production of productions) {
      this.steps.push(`${indent}Probando producción: ${nonTerminal} -> ${this.formatProduction(production)}`)

      const childNodes: any[] = []
      let success = true
      this.currentTokenIndex = originalTokenIndex

      for (const symbol of production) {
        if (symbol.type === "terminal") {
          const result = this.parseTerminal(symbol.value, level + 1)
          if (!result.success) {
            success = false
            break
          }
          childNodes.push({
            id: this.nodeId++,
            label: symbol.value,
            type: "terminal",
          })
        } else if (symbol.type === "nonTerminal") {
          const result = this.parseNonTerminal(symbol.value, level + 1)
          if (!result.success) {
            success = false
            break
          }
          childNodes.push(this.treeNodes[result.nodeId])
        } else if (symbol.type === "epsilon") {
          this.steps.push(`${indent}  Consumiendo epsilon (ε)`)
          childNodes.push({
            id: this.nodeId++,
            label: "ε",
            type: "epsilon",
          })
        }
      }

      if (success) {
        this.steps.push(`${indent}Éxito al analizar ${nonTerminal} hasta el token ${this.currentTokenIndex}`)
        node.children = childNodes
        this.treeNodes[nodeId] = node
        return { success: true, nodeId }
      } else {
        this.steps.push(`${indent}Fallo con la producción, probando otra alternativa...`)
      }
    }

    // Si ninguna producción tuvo éxito, registrar el error
    const currentToken =
      this.currentTokenIndex < this.tokens.length
        ? this.tokens[this.currentTokenIndex]
        : { value: "fin de entrada", line: -1, column: -1 }

    const errorMsg = `No se pudo analizar ${nonTerminal}. Se encontró '${currentToken.value}' en línea ${currentToken.line}, columna ${currentToken.column}`
    this.steps.push(`${indent}Error: ${errorMsg}`)

    this.errors.push({
      message: errorMsg,
      line: currentToken.line,
      column: currentToken.column,
      expected: nonTerminal,
      found: currentToken.value,
    })

    return {
      success: false,
      error: errorMsg,
      expected: nonTerminal,
    }
  }

  // Analizar un símbolo terminal
  parseTerminal(terminal: string, level: number) {
    const indent = "  ".repeat(level)

    // Si no hay más tokens, error
    if (this.currentTokenIndex >= this.tokens.length) {
      const errorMsg = `Fin de entrada inesperado, esperaba "${terminal}"`
      this.steps.push(`${indent}Error: ${errorMsg}`)

      this.errors.push({
        message: errorMsg,
        line: -1,
        column: -1,
        expected: terminal,
        found: "fin de entrada",
      })

      return {
        success: false,
        error: errorMsg,
        expected: terminal,
      }
    }

    const currentToken = this.tokens[this.currentTokenIndex]
    this.steps.push(
      `${indent}Esperando terminal "${terminal}" en token ${this.currentTokenIndex} (${currentToken.value})`,
    )

    // Manejo especial para terminales que representan categorías de tokens
    if (terminal === "IDENTIFIER") {
      if (currentToken.type === "IDENTIFIER") {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumido identificador "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    } else if (terminal === "NUMBER") {
      if (currentToken.type === "NUMBER") {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumido número "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    } else if (terminal === "STRING") {
      if (currentToken.type === "STRING") {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumido string "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    } else if (terminal === "KEYWORD") {
      if (currentToken.type === "KEYWORD") {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumida palabra clave "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    } else if (terminal === "DATATYPE") {
      if (currentToken.type === "DATATYPE") {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumido tipo de dato "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    } else if (terminal === "OPERATOR") {
      if (currentToken.type === "OPERATOR") {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumido operador "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    } else if (terminal === "COMPARISON") {
      if (currentToken.type === "COMPARISON") {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumido operador de comparación "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    } else if (terminal === "BRACKET") {
      if (currentToken.type === "BRACKET") {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumido delimitador "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    } else if (terminal === "PUNCTUATION") {
      if (currentToken.type === "PUNCTUATION") {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumido signo de puntuación "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    } else if (terminal === "BOOLEAN") {
      if (
        currentToken.value === "true" ||
        currentToken.value === "false" ||
        currentToken.value === "True" ||
        currentToken.value === "False"
      ) {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumido booleano "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    } else if (terminal.startsWith("KEYWORD_")) {
      // Para palabras clave específicas como KEYWORD_IF, KEYWORD_FOR, etc.
      const keyword = terminal.substring(8).toLowerCase()
      if (currentToken.type === "KEYWORD" && currentToken.value.toLowerCase() === keyword) {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumida palabra clave "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    } else if (terminal.startsWith("DATATYPE_")) {
      // Para tipos de datos específicos como DATATYPE_INT, DATATYPE_STRING, etc.
      const datatype = terminal.substring(9).toLowerCase()
      if (currentToken.type === "DATATYPE" && currentToken.value.toLowerCase() === datatype) {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumido tipo de dato "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    } else {
      // Comprobar si el token actual coincide con el terminal esperado
      if (currentToken.value === terminal || (this.isIdentifier(terminal) && this.isIdentifier(currentToken.value))) {
        this.currentTokenIndex++
        this.steps.push(
          `${indent}Consumido "${currentToken.value}" correctamente, avanzando al token ${this.currentTokenIndex}`,
        )
        return { success: true }
      }
    }

    // Si llegamos aquí, hay un error
    const errorMsg = `Esperaba "${terminal}", encontró "${currentToken.value}" en línea ${currentToken.line}, columna ${currentToken.column}`
    this.steps.push(`${indent}Error: ${errorMsg}`)

    this.errors.push({
      message: errorMsg,
      line: currentToken.line,
      column: currentToken.column,
      expected: terminal,
      found: currentToken.value,
    })

    return {
      success: false,
      error: errorMsg,
      expected: terminal,
    }
  }

  // Formatear una producción para mostrarla
  formatProduction(production: Array<{ type: string; value: string }>) {
    return production
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
  }

  // En la función buildTree, asegurarse de que el nodo raíz tenga children inicializado
  buildTree() {
    // Si no hay nodos, crear un árbol básico
    if (Object.keys(this.treeNodes).length === 0) {
      const rootId = 0
      const root: TreeNode = {
        id: rootId,
        label: this.grammar.startSymbol || "PROGRAM",
        type: "nonTerminal",
        children: [], // Asegurarse de que children esté inicializado
      }
      this.treeNodes[rootId] = root
    }

    // Devolver el nodo raíz (asumimos que es el nodo 0)
    return this.treeNodes[0] || null
  }

  get datatypes() {
    return this.language.datatypes
  }
}
