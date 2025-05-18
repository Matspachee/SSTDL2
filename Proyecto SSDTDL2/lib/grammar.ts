// Clase para representar una gramática
class Grammar {
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

export { Grammar }
