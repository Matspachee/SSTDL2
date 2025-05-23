import type { GrammarData, Production } from "./types"

export class EnhancedGrammar {
  startSymbol: string
  productions: Map<string, Array<Array<{ type: string; value: string }>>>
  terminals: Set<string>
  nonTerminals: Set<string>

  constructor() {
    this.startSymbol = ""
    this.productions = new Map()
    this.terminals = new Set()
    this.nonTerminals = new Set()
  }

  loadFromString(grammarText: string): EnhancedGrammar {
    this.productions.clear()
    this.terminals.clear()
    this.nonTerminals.clear()

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

      this.nonTerminals.add(left)

      if (!this.productions.has(left)) {
        this.productions.set(left, [])
      }

      // Manejar múltiples producciones separadas por |
      const productions = right.split("|").map((p) => p.trim())

      for (const prod of productions) {
        const symbols = this.parseProduction(prod)
        this.productions.get(left)!.push(symbols)

        // Identificar terminales y no terminales
        for (const symbol of symbols) {
          if (symbol.type === "terminal") {
            this.terminals.add(symbol.value)
          } else if (symbol.type === "nonTerminal") {
            this.nonTerminals.add(symbol.value)
          }
        }
      }
    }

    if (!this.startSymbol) {
      throw new Error("No se pudo determinar el símbolo inicial de la gramática")
    }

    return this
  }

  private parseProduction(production: string): Array<{ type: string; value: string }> {
    const symbols = []
    let i = 0

    while (i < production.length) {
      // Saltar espacios
      while (i < production.length && production[i] === " ") {
        i++
      }

      if (i >= production.length) break

      // Manejar strings entre comillas
      if (production[i] === '"' || production[i] === "'") {
        const quote = production[i]
        let terminal = ""
        i++
        while (i < production.length && production[i] !== quote) {
          terminal += production[i]
          i++
        }
        if (i < production.length) i++ // Saltar comilla de cierre
        symbols.push({ type: "terminal", value: terminal })
      }
      // Manejar epsilon
      else if (production.substring(i, i + 1) === "ε" || production.substring(i, i + 7) === "epsilon") {
        symbols.push({ type: "epsilon", value: "ε" })
        i += production.substring(i, i + 7) === "epsilon" ? 7 : 1
      }
      // Manejar no terminales (mayúsculas)
      else if (/[A-Z]/.test(production[i])) {
        let nonTerminal = ""
        while (i < production.length && /[A-Z0-9_]/.test(production[i])) {
          nonTerminal += production[i]
          i++
        }
        symbols.push({ type: "nonTerminal", value: nonTerminal })
      }
      // Manejar identificadores especiales
      else if (production.substring(i).startsWith("IDENTIFIER")) {
        symbols.push({ type: "terminal", value: "IDENTIFIER" })
        i += 10
      } else if (production.substring(i).startsWith("NUMBER")) {
        symbols.push({ type: "terminal", value: "NUMBER" })
        i += 6
      } else if (production.substring(i).startsWith("STRING")) {
        symbols.push({ type: "terminal", value: "STRING" })
        i += 6
      }
      // Manejar otros terminales
      else {
        let terminal = ""
        while (i < production.length && production[i] !== " " && production[i] !== '"' && production[i] !== "'") {
          terminal += production[i]
          i++
        }
        if (terminal) {
          symbols.push({ type: "terminal", value: terminal })
        }
      }
    }

    return symbols
  }

  getGrammarData(): GrammarData {
    const productions: Production[] = []

    for (const [left, rightSides] of this.productions.entries()) {
      for (const right of rightSides) {
        productions.push({ left, right })
      }
    }

    return {
      startSymbol: this.startSymbol,
      productions,
      terminals: Array.from(this.terminals),
      nonTerminals: Array.from(this.nonTerminals),
    }
  }

  isTerminal(symbol: string): boolean {
    return this.terminals.has(symbol)
  }

  isNonTerminal(symbol: string): boolean {
    return this.nonTerminals.has(symbol)
  }

  getProductionsFor(nonTerminal: string): Array<Array<{ type: string; value: string }>> {
    return this.productions.get(nonTerminal) || []
  }
}
