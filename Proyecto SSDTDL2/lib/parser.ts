// Clase para representar una gramática
export class Grammar {
  productions: Map<string, Array<Array<{ type: string; value: string }>>>
  startSymbol: string | null

  constructor() {
    this.productions = new Map()
    this.startSymbol = null
  }

  // Cargar una gramática desde una cadena de texto
  loadFromString(grammarText: string) {
    const lines = grammarText.trim().split("\n")

    for (const line of lines) {
      if (line.trim() === "" || line.trim().startsWith("//")) continue

      const parts = line.split("->")
      if (parts.length !== 2) {
        throw new Error(`Formato inválido en la línea: ${line}`)
      }

      const left = parts[0].trim()
      const right = parts[1].trim()

      if (!this.startSymbol) {
        this.startSymbol = left
      }

      if (!this.productions.has(left)) {
        this.productions.set(left, [])
      }

      // Manejar múltiples producciones separadas por |
      const productions = right.split("|").map((p) => p.trim())
      for (const prod of productions) {
        // Convertir la producción en un array de símbolos
        const symbols = []
        let i = 0
        while (i < prod.length) {
          if (prod[i] === '"' || prod[i] === "'") {
            const quote = prod[i]
            let terminal = ""
            i++
            while (i < prod.length && prod[i] !== quote) {
              terminal += prod[i]
              i++
            }
            symbols.push({ type: "terminal", value: terminal })
            i++
          } else if (/[A-Z]/.test(prod[i])) {
            let nonTerminal = ""
            while (i < prod.length && /[A-Z0-9_]/.test(prod[i])) {
              nonTerminal += prod[i]
              i++
            }
            symbols.push({ type: "nonTerminal", value: nonTerminal })
          } else if (prod[i] === "ε" || prod[i] === "ε") {
            symbols.push({ type: "epsilon", value: "ε" })
            i++
          } else if (prod[i] !== " ") {
            symbols.push({ type: "terminal", value: prod[i] })
            i++
          } else {
            i++
          }
        }

        this.productions.get(left)!.push(symbols)
      }
    }

    if (!this.startSymbol) {
      throw new Error("No se pudo determinar el símbolo inicial de la gramática")
    }

    return this
  }
}

// Clase para el análisis recursivo descendente
export class RecursiveDescentParser {
  grammar: Grammar
  input: string
  position: number
  steps: string[]
  treeNodes: Record<number, any>
  nodeId: number

  constructor(grammar: Grammar) {
    this.grammar = grammar
    this.input = ""
    this.position = 0
    this.steps = []
    this.treeNodes = {}
    this.nodeId = 0
  }

  // Establecer el texto de entrada
  setInput(input: string) {
    this.input = input
    this.position = 0
    this.steps = []
    this.treeNodes = {}
    this.nodeId = 0
  }

  // Analizar el texto según la gramática
  parse() {
    if (!this.grammar.startSymbol) {
      throw new Error("La gramática no tiene un símbolo inicial")
    }

    const startSymbol = this.grammar.startSymbol
    const result = this.parseNonTerminal(startSymbol, 0)

    if (result.success && result.position === this.input.length) {
      return {
        success: true,
        tree: this.buildTree(),
        steps: this.steps,
      }
    } else {
      return {
        success: false,
        error: `Error de análisis en la posición ${result.position}`,
        expectedSymbol: result.expected,
        steps: this.steps,
      }
    }
  }

  // Analizar un símbolo no terminal
  parseNonTerminal(nonTerminal: string, level: number) {
    const indent = "  ".repeat(level)
    this.steps.push(`${indent}Intentando analizar ${nonTerminal} en posición ${this.position}`)

    const nodeId = this.nodeId++
    const node = {
      id: nodeId,
      label: nonTerminal,
      type: "nonTerminal",
      children: [],
    }

    if (!this.grammar.productions.has(nonTerminal)) {
      this.steps.push(`${indent}Error: No hay producciones para ${nonTerminal}`)
      return { success: false, position: this.position, expected: nonTerminal }
    }

    const productions = this.grammar.productions.get(nonTerminal)!
    const originalPosition = this.position

    for (const production of productions) {
      this.steps.push(`${indent}Probando producción: ${nonTerminal} -> ${this.formatProduction(production)}`)

      const childNodes: any[] = []
      let success = true
      this.position = originalPosition

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
        this.steps.push(`${indent}Éxito al analizar ${nonTerminal} hasta la posición ${this.position}`)
        node.children = childNodes
        this.treeNodes[nodeId] = node
        return { success: true, position: this.position, nodeId }
      } else {
        this.steps.push(`${indent}Fallo con la producción, probando otra alternativa...`)
      }
    }

    this.steps.push(`${indent}No se pudo analizar ${nonTerminal} en la posición ${originalPosition}`)
    return { success: false, position: originalPosition, expected: nonTerminal }
  }

  // Analizar un símbolo terminal
  parseTerminal(terminal: string, level: number) {
    const indent = "  ".repeat(level)
    this.steps.push(`${indent}Esperando terminal "${terminal}" en posición ${this.position}`)

    if (this.position >= this.input.length) {
      this.steps.push(`${indent}Error: Fin de entrada inesperado, esperaba "${terminal}"`)
      return { success: false, position: this.position, expected: terminal }
    }

    // Manejo especial para terminales que representan categorías
    if (terminal === "IDENTIFIER" || terminal === "NUMBER" || terminal === "STRING") {
      // Aquí podríamos implementar lógica para reconocer identificadores, números o strings
      // Por ahora, simplemente verificamos si el siguiente carácter podría ser parte de esas categorías
      let matched = false
      let value = ""
      const originalPosition = this.position

      if (terminal === "IDENTIFIER") {
        // Un identificador comienza con letra o guión bajo
        if (/[a-zA-Z_]/.test(this.input[this.position])) {
          value += this.input[this.position++]
          // Seguido de letras, números o guiones bajos
          while (this.position < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.position])) {
            value += this.input[this.position++]
          }
          matched = true
        }
      } else if (terminal === "NUMBER") {
        // Un número comienza con un dígito
        if (/[0-9]/.test(this.input[this.position])) {
          value += this.input[this.position++]
          // Seguido de más dígitos
          while (this.position < this.input.length && /[0-9]/.test(this.input[this.position])) {
            value += this.input[this.position++]
          }
          matched = true
        }
      } else if (terminal === "STRING") {
        // Un string comienza con comilla simple o doble
        if (this.input[this.position] === '"' || this.input[this.position] === "'") {
          const quote = this.input[this.position]
          value += this.input[this.position++]
          // Leer hasta encontrar la comilla de cierre
          while (this.position < this.input.length && this.input[this.position] !== quote) {
            value += this.input[this.position++]
          }
          // Añadir la comilla de cierre si existe
          if (this.position < this.input.length) {
            value += this.input[this.position++]
            matched = true
          }
        }
      }

      if (matched) {
        this.steps.push(`${indent}Consumido ${terminal} "${value}" correctamente, nueva posición: ${this.position}`)
        return { success: true, position: this.position }
      } else {
        this.position = originalPosition // Restaurar posición
      }
    }

    // Verificar si es un identificador específico y el input es cualquier identificador
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(terminal)) {
      // Es un identificador específico, verificar si el input es cualquier identificador
      let value = ""
      const originalPosition = this.position

      if (/[a-zA-Z_]/.test(this.input[this.position])) {
        value += this.input[this.position++]
        while (this.position < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.position])) {
          value += this.input[this.position++]
        }

        this.steps.push(`${indent}Consumido identificador "${value}" correctamente, nueva posición: ${this.position}`)
        return { success: true, position: this.position }
      } else {
        this.position = originalPosition // Restaurar posición
      }
    }

    // Verificación normal para terminales específicos
    const inputSubstring = this.input.substring(this.position, this.position + terminal.length)

    if (inputSubstring === terminal) {
      this.position += terminal.length
      this.steps.push(`${indent}Consumido "${terminal}" correctamente, nueva posición: ${this.position}`)
      return { success: true, position: this.position }
    } else {
      this.steps.push(`${indent}Error: Esperaba "${terminal}", encontró "${inputSubstring}"`)
      return { success: false, position: this.position, expected: terminal }
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

  // Construir el árbol de derivación
  buildTree() {
    if (Object.keys(this.treeNodes).length === 0) return null
    return this.treeNodes[0]
  }
}
