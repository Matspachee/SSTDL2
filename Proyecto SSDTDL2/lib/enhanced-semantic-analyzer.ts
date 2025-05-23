import type { Token, Symbol, SemanticError } from "./types"
import type { ProgrammingLanguage } from "./programming-languages"

export class EnhancedSemanticAnalyzer {
  private tokens: Token[]
  private language: ProgrammingLanguage | null
  private symbols: Symbol[]
  private errors: SemanticError[]
  private currentScope: string
  private scopeStack: string[]

  constructor(tokens: Token[], language: ProgrammingLanguage | null) {
    this.tokens = tokens
    this.language = language
    this.symbols = []
    this.errors = []
    this.currentScope = "global"
    this.scopeStack = ["global"]
  }

  analyze(): { symbols: Symbol[]; errors: SemanticError[] } {
    this.symbols = []
    this.errors = []
    this.currentScope = "global"
    this.scopeStack = ["global"]

    try {
      this.performAnalysis()
    } catch (error) {
      this.errors.push({
        message: `Error interno del analizador semántico: ${error}`,
        line: 0,
        column: 0,
        severity: "error",
        code: "E999",
      })
    }

    return {
      symbols: this.symbols,
      errors: this.errors,
    }
  }

  private performAnalysis(): void {
    // Primer paso: Identificar declaraciones
    this.identifyDeclarations()

    // Segundo paso: Verificar referencias
    this.verifyReferences()

    // Tercer paso: Verificar tipos
    this.verifyTypes()

    // Quinto paso: Añadir símbolos de bibliotecas estándar
    this.addStandardLibrarySymbols()

    // Sexto paso: Calcular métricas adicionales
    this.calculateAdditionalMetrics()

    // Cuarto paso: Verificar variables no utilizadas
    this.checkUnusedVariables()
  }

  private identifyDeclarations(): void {
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i]

      // Declaraciones de funciones (prioridad sobre variables)
      if (this.isFunctionDeclaration(i)) {
        i = this.processFunctionDeclaration(i)
      }
      // Declaraciones de variables
      else if (this.isVariableDeclaration(i)) {
        i = this.processVariableDeclaration(i)
      }
      // Cambios de scope
      else if (token.value === "{") {
        this.enterScope(`block_${i}`)
      } else if (token.value === "}") {
        this.exitScope()
      }
    }
  }

  private isVariableDeclaration(index: number): boolean {
    if (index >= this.tokens.length) return false

    const token = this.tokens[index]

    // Verificar si es un tipo de dato seguido de un identificador
    if (this.language?.datatypes.includes(token.value)) {
      // Asegurarse de que no es una función
      if (
        index + 2 < this.tokens.length &&
        this.tokens[index + 1].type === "IDENTIFIER" &&
        this.tokens[index + 2].value === "("
      ) {
        return false // Es una función, no una variable
      }
      return index + 1 < this.tokens.length && this.tokens[index + 1].type === "IDENTIFIER"
    }

    // Verificar declaraciones con var, let, const
    if (["var", "let", "const"].includes(token.value)) {
      return index + 1 < this.tokens.length && this.tokens[index + 1].type === "IDENTIFIER"
    }

    return false
  }

  private processVariableDeclaration(index: number): number {
    const typeToken = this.tokens[index]
    const nameToken = this.tokens[index + 1]

    // Verificar si ya existe en el scope actual
    const existing = this.symbols.find(
      (s) => s.id === nameToken.value && s.block === this.currentScope && s.usage === "declaration",
    )

    if (existing) {
      this.errors.push({
        message: `Variable '${nameToken.value}' ya declarada en este ámbito`,
        line: nameToken.line,
        column: nameToken.column,
        severity: "error",
        code: "E001",
      })
    } else {
      // Añadir símbolo
      this.symbols.push({
        id: nameToken.value,
        type: typeToken.value,
        block: this.currentScope,
        line: nameToken.line,
        column: nameToken.column,
        usage: "declaration",
        scope: this.currentScope === "global" ? "global" : "local",
        isUsed: false,
      })
    }

    // Buscar inicialización
    let nextIndex = index + 2
    if (nextIndex < this.tokens.length && this.tokens[nextIndex].value === "=") {
      // Saltar hasta el punto y coma o final de línea
      while (
        nextIndex < this.tokens.length &&
        this.tokens[nextIndex].value !== ";" &&
        this.tokens[nextIndex].value !== "\n"
      ) {
        nextIndex++
      }
    }

    return nextIndex
  }

  private isFunctionDeclaration(index: number): boolean {
    if (index >= this.tokens.length) return false

    const token = this.tokens[index]

    // Función con tipo de retorno
    if (this.language?.datatypes.includes(token.value)) {
      return (
        index + 2 < this.tokens.length &&
        this.tokens[index + 1].type === "IDENTIFIER" &&
        this.tokens[index + 2].value === "("
      )
    }

    // Función con palabra clave
    if (["function", "def"].includes(token.value)) {
      return index + 1 < this.tokens.length && this.tokens[index + 1].type === "IDENTIFIER"
    }

    return false
  }

  private processFunctionDeclaration(index: number): number {
    let nameIndex = index + 1
    let returnType = "void"

    // Si comienza con tipo de dato
    if (this.language?.datatypes.includes(this.tokens[index].value)) {
      returnType = this.tokens[index].value
      nameIndex = index + 1
    }

    const nameToken = this.tokens[nameIndex]
    const oldScope = this.currentScope

    // Entrar al scope de la función
    this.enterScope(nameToken.value)

    // Añadir función a la tabla de símbolos
    const functionSymbol = {
      id: nameToken.value,
      type: "function",
      returnType,
      block: oldScope,
      line: nameToken.line,
      column: nameToken.column,
      usage: "declaration",
      scope: oldScope === "global" ? "global" : "local",
      isFunction: true,
      parameters: [] as string[],
      isUsed: false,
    }

    // Procesar parámetros
    let paramIndex = nameIndex + 2 // Saltar nombre y '('
    let paramCount = 0

    while (paramIndex < this.tokens.length && this.tokens[paramIndex].value !== ")") {
      // Detectar tipo de parámetro
      if (
        this.language?.datatypes.includes(this.tokens[paramIndex].value) &&
        paramIndex + 1 < this.tokens.length &&
        this.tokens[paramIndex + 1].type === "IDENTIFIER"
      ) {
        const paramType = this.tokens[paramIndex].value
        const paramName = this.tokens[paramIndex + 1].value

        // Añadir parámetro a la función
        functionSymbol.parameters.push(paramName)

        // Añadir parámetro como símbolo
        this.symbols.push({
          id: paramName,
          type: paramType,
          block: this.currentScope,
          line: this.tokens[paramIndex + 1].line,
          column: this.tokens[paramIndex + 1].column,
          usage: "declaration",
          scope: "parameter",
          isParameter: true,
          parameterIndex: paramCount,
          isUsed: true, // Los parámetros se consideran usados por defecto
        })

        paramCount++
        paramIndex += 2 // Saltar tipo y nombre

        // Saltar coma si existe
        if (paramIndex < this.tokens.length && this.tokens[paramIndex].value === ",") {
          paramIndex++
        }
      } else {
        // Si no hay tipo explícito (como en JavaScript)
        if (this.tokens[paramIndex].type === "IDENTIFIER") {
          const paramName = this.tokens[paramIndex].value

          // Añadir parámetro a la función
          functionSymbol.parameters.push(paramName)

          // Añadir parámetro como símbolo
          this.symbols.push({
            id: paramName,
            type: "any", // Tipo genérico para lenguajes sin tipado explícito
            block: this.currentScope,
            line: this.tokens[paramIndex].line,
            column: this.tokens[paramIndex].column,
            usage: "declaration",
            scope: "parameter",
            isParameter: true,
            parameterIndex: paramCount,
            isUsed: true, // Los parámetros se consideran usados por defecto
          })

          paramCount++
          paramIndex++ // Saltar nombre

          // Saltar coma si existe
          if (paramIndex < this.tokens.length && this.tokens[paramIndex].value === ",") {
            paramIndex++
          }
        } else {
          paramIndex++ // Saltar token desconocido
        }
      }
    }

    // Añadir la función a la tabla de símbolos
    this.symbols.push(functionSymbol)

    // Buscar el final de la función
    let braceCount = 0
    let bodyIndex = paramIndex + 1 // Saltar el paréntesis de cierre

    while (bodyIndex < this.tokens.length) {
      if (this.tokens[bodyIndex].value === "{") {
        braceCount++
        break
      }
      bodyIndex++
    }

    return bodyIndex
  }

  private verifyReferences(): void {
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i]

      if (token.type === "IDENTIFIER" && !this.isPartOfDeclaration(i)) {
        // Verificar si es una llamada a función
        const isCall = i + 1 < this.tokens.length && this.tokens[i + 1].value === "("

        // Es una referencia, verificar si está declarada
        const symbol = this.findSymbol(token.value)

        if (symbol) {
          // Marcar como usado
          symbol.isUsed = true

          // Añadir referencia
          this.symbols.push({
            id: token.value,
            type: symbol.type,
            block: this.currentScope,
            line: token.line,
            column: token.column,
            usage: "reference",
            isCall: isCall,
          })

          // Si es una función, verificar que se use como tal
          if (symbol.isFunction && !isCall && !this.isPartOfFunctionDeclaration(i)) {
            this.errors.push({
              message: `'${token.value}' es una función pero se usa como variable`,
              line: token.line,
              column: token.column,
              severity: "warning",
              code: "W003",
            })
          }

          // Si es una variable, verificar que no se use como función
          if (!symbol.isFunction && isCall) {
            this.errors.push({
              message: `'${token.value}' es una variable pero se usa como función`,
              line: token.line,
              column: token.column,
              severity: "error",
              code: "E003",
            })
          }
        } else if (!this.isStandardLibraryFunction(token.value)) {
          this.errors.push({
            message: `Variable '${token.value}' no declarada`,
            line: token.line,
            column: token.column,
            severity: "error",
            code: "E002",
          })
        }
      }
    }
  }

  private isPartOfFunctionDeclaration(index: number): boolean {
    if (index <= 0) return false

    // Verificar si estamos en una declaración de función
    for (let i = index - 1; i >= 0 && i >= index - 5; i--) {
      if (this.tokens[i].value === "function" || this.language?.datatypes.includes(this.tokens[i].value)) {
        // Verificar si hay un paréntesis después del identificador actual
        for (let j = index + 1; j < this.tokens.length && j <= index + 3; j++) {
          if (this.tokens[j].value === "(") {
            return true
          }
        }
      }
    }

    return false
  }

  private verifyTypes(): void {
    // Verificar asignaciones de tipos
    for (let i = 0; i < this.tokens.length - 2; i++) {
      if (this.tokens[i].type === "IDENTIFIER" && this.tokens[i + 1].value === "=" && !this.isPartOfDeclaration(i)) {
        const varSymbol = this.findSymbol(this.tokens[i].value)
        if (varSymbol && this.language?.id === "c") {
          // En C, verificar compatibilidad de tipos más estrictamente
          const valueType = this.inferType(i + 2)
          if (valueType && !this.areTypesCompatible(varSymbol.type, valueType)) {
            this.errors.push({
              message: `Incompatibilidad de tipos: asignando '${valueType}' a '${varSymbol.type}'`,
              line: this.tokens[i].line,
              column: this.tokens[i].column,
              severity: "warning",
              code: "W001",
            })
          }
        }
      }
    }
  }

  private checkUnusedVariables(): void {
    for (const symbol of this.symbols) {
      if (symbol.usage === "declaration" && !symbol.isUsed && !symbol.isFunction && symbol.scope !== "parameter") {
        this.errors.push({
          message: `Variable '${symbol.id}' declarada pero no utilizada`,
          line: symbol.line,
          column: symbol.column,
          severity: "warning",
          code: "W002",
        })
      }
    }
  }

  private findSymbol(name: string): Symbol | null {
    // Buscar en scope actual y scopes padre
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scope = this.scopeStack[i]
      const symbol = this.symbols.find((s) => s.id === name && s.block === scope && s.usage === "declaration")
      if (symbol) return symbol
    }
    return null
  }

  private isPartOfDeclaration(index: number): boolean {
    if (index === 0) return false

    const prevToken = this.tokens[index - 1]

    // Después de tipo de dato
    if (this.language?.datatypes.includes(prevToken.value)) return true

    // Después de var, let, const
    if (["var", "let", "const", "function", "def"].includes(prevToken.value)) return true

    return false
  }

  private isStandardLibraryFunction(name: string): boolean {
    const stdFunctions = {
      c: ["printf", "scanf", "malloc", "free", "strlen", "strcpy"],
      javascript: ["console", "Math", "parseInt", "parseFloat"],
      python: ["print", "len", "range", "input", "int", "str"],
    }

    const langFunctions = stdFunctions[this.language?.id as keyof typeof stdFunctions] || []
    return langFunctions.includes(name)
  }

  private inferType(index: number): string | null {
    if (index >= this.tokens.length) return null

    const token = this.tokens[index]

    if (token.type === "NUMBER") return "int"
    if (token.type === "STRING") return "string"
    if (token.value === "true" || token.value === "false") return "bool"
    if (token.type === "IDENTIFIER") {
      const symbol = this.findSymbol(token.value)
      return symbol?.type || null
    }

    return null
  }

  private areTypesCompatible(type1: string, type2: string): boolean {
    if (type1 === type2) return true

    // Tipos numéricos compatibles
    const numericTypes = ["int", "float", "double", "number"]
    if (numericTypes.includes(type1) && numericTypes.includes(type2)) return true

    return false
  }

  private enterScope(scopeName: string): void {
    this.currentScope = scopeName
    this.scopeStack.push(scopeName)
  }

  private exitScope(): void {
    if (this.scopeStack.length > 1) {
      this.scopeStack.pop()
      this.currentScope = this.scopeStack[this.scopeStack.length - 1]
    }
  }

  private addStandardLibrarySymbols(): void {
    const stdSymbols = this.getStandardLibrarySymbols()

    for (const symbol of stdSymbols) {
      // Solo añadir si se usa en el código
      const isUsed = this.tokens.some((token) => token.value === symbol.id)
      if (isUsed) {
        this.symbols.push({
          ...symbol,
          isUsed: true,
          isStandardLibrary: true,
          usage: "reference",
        })
      }
    }
  }

  private getStandardLibrarySymbols(): Symbol[] {
    const symbols: Symbol[] = []

    if (this.language?.id === "c") {
      symbols.push(
        {
          id: "printf",
          type: "function",
          returnType: "int",
          block: "global",
          line: 0,
          column: 0,
          usage: "declaration",
          scope: "global",
          isFunction: true,
          isStandardLibrary: true,
          parameters: ["const char*", "..."],
          isUsed: false,
        },
        {
          id: "scanf",
          type: "function",
          returnType: "int",
          block: "global",
          line: 0,
          column: 0,
          usage: "declaration",
          scope: "global",
          isFunction: true,
          isStandardLibrary: true,
          parameters: ["const char*", "..."],
          isUsed: false,
        },
        {
          id: "malloc",
          type: "function",
          returnType: "void*",
          block: "global",
          line: 0,
          column: 0,
          usage: "declaration",
          scope: "global",
          isFunction: true,
          isStandardLibrary: true,
          parameters: ["size_t"],
          isUsed: false,
        },
        {
          id: "free",
          type: "function",
          returnType: "void",
          block: "global",
          line: 0,
          column: 0,
          usage: "declaration",
          scope: "global",
          isFunction: true,
          isStandardLibrary: true,
          parameters: ["void*"],
          isUsed: false,
        },
      )
    } else if (this.language?.id === "javascript") {
      symbols.push(
        {
          id: "console",
          type: "object",
          block: "global",
          line: 0,
          column: 0,
          usage: "declaration",
          scope: "global",
          isStandardLibrary: true,
          isUsed: false,
        },
        {
          id: "Math",
          type: "object",
          block: "global",
          line: 0,
          column: 0,
          usage: "declaration",
          scope: "global",
          isStandardLibrary: true,
          isUsed: false,
        },
        {
          id: "parseInt",
          type: "function",
          returnType: "number",
          block: "global",
          line: 0,
          column: 0,
          usage: "declaration",
          scope: "global",
          isFunction: true,
          isStandardLibrary: true,
          parameters: ["string"],
          isUsed: false,
        },
      )
    } else if (this.language?.id === "python") {
      symbols.push(
        {
          id: "print",
          type: "function",
          returnType: "None",
          block: "global",
          line: 0,
          column: 0,
          usage: "declaration",
          scope: "global",
          isFunction: true,
          isStandardLibrary: true,
          parameters: ["*args"],
          isUsed: false,
        },
        {
          id: "len",
          type: "function",
          returnType: "int",
          block: "global",
          line: 0,
          column: 0,
          usage: "declaration",
          scope: "global",
          isFunction: true,
          isStandardLibrary: true,
          parameters: ["object"],
          isUsed: false,
        },
        {
          id: "range",
          type: "function",
          returnType: "range",
          block: "global",
          line: 0,
          column: 0,
          usage: "declaration",
          scope: "global",
          isFunction: true,
          isStandardLibrary: true,
          parameters: ["int"],
          isUsed: false,
        },
      )
    }

    return symbols
  }

  private calculateAdditionalMetrics(): void {
    // Calcular métricas adicionales para cada símbolo
    for (const symbol of this.symbols) {
      if (symbol.usage === "declaration") {
        // Contar referencias
        const references = this.symbols.filter((s) => s.id === symbol.id && s.usage === "reference")
        symbol.referenceCount = references.length

        // Determinar complejidad
        if (symbol.isFunction) {
          symbol.complexity = this.calculateFunctionComplexity(symbol.id)
        }
      }
    }
  }

  private calculateFunctionComplexity(functionName: string): number {
    let complexity = 1 // Complejidad base

    // Buscar estructuras de control dentro de la función
    let inFunction = false
    let braceCount = 0

    for (const token of this.tokens) {
      if (token.value === functionName && token.type === "IDENTIFIER") {
        inFunction = true
        continue
      }

      if (inFunction) {
        if (token.value === "{") braceCount++
        if (token.value === "}") {
          braceCount--
          if (braceCount === 0) break
        }

        // Incrementar complejidad por estructuras de control
        if (["if", "while", "for", "switch"].includes(token.value)) {
          complexity++
        }
      }
    }

    return complexity
  }
}
