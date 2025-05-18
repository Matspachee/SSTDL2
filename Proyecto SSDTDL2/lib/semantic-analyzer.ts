import type { Token } from "./lexer"
import type { ProgrammingLanguage } from "./programming-languages"

// Interfaz para representar un símbolo en la tabla de símbolos
export interface Symbol {
  id: string
  type: string
  block: string
  line: number
  column: number
  isFunction?: boolean
  parameters?: Symbol[]
  usage?: "declaration" | "reference"
  value?: string
  isStandardLibrary?: boolean
  isUsed?: boolean
  scope?: "global" | "local" | "parameter"
  returnType?: string
}

// Interfaz para errores semánticos
export interface SemanticError {
  message: string
  line: number
  column: number
  severity: "error" | "warning" | "info"
  code: string
}

// Clase para el análisis semántico
export class SemanticAnalyzer {
  tokens: Token[]
  language: ProgrammingLanguage | null
  symbols: Symbol[] = []
  standardLibrarySymbols: Symbol[] = []
  currentBlock = "global"
  blockStack: string[] = ["global"]
  errors: SemanticError[] = []
  usedStandardLibraries: Set<string> = new Set()
  standardLibraries: Record<string, string[]> = {
    javascript: [
      "console",
      "Math",
      "Array",
      "Object",
      "String",
      "Number",
      "Boolean",
      "Date",
      "RegExp",
      "JSON",
      "Promise",
      "setTimeout",
      "setInterval",
      "clearTimeout",
      "clearInterval",
      "document",
      "window",
      "fetch",
      "localStorage",
      "sessionStorage",
      "Map",
      "Set",
      "WeakMap",
      "WeakSet",
      "Symbol",
      "Proxy",
      "Reflect",
    ],
    python: [
      "print",
      "len",
      "range",
      "input",
      "int",
      "str",
      "float",
      "bool",
      "list",
      "dict",
      "tuple",
      "set",
      "sum",
      "min",
      "max",
      "sorted",
      "open",
      "enumerate",
      "zip",
      "map",
      "filter",
      "reduce",
      "any",
      "all",
      "abs",
      "round",
      "pow",
      "type",
      "isinstance",
      "super",
      "format",
      "globals",
      "locals",
      "hasattr",
      "getattr",
      "setattr",
      "delattr",
    ],
    c: [
      "printf",
      "scanf",
      "malloc",
      "free",
      "calloc",
      "realloc",
      "strlen",
      "strcpy",
      "strcat",
      "strcmp",
      "memcpy",
      "memset",
      "fopen",
      "fclose",
      "fread",
      "fwrite",
      "fprintf",
      "fscanf",
      "getchar",
      "putchar",
      "gets",
      "puts",
      "exit",
      "system",
      "rand",
      "srand",
      "time",
      "clock",
      "sizeof",
      "NULL",
      "EOF",
      "FILE",
      "size_t",
      "main",
    ],
  }

  constructor(tokens: Token[], language: ProgrammingLanguage | null) {
    this.tokens = tokens
    this.language = language
  }

  // Analizar los tokens para construir la tabla de símbolos
  analyze(): { symbols: Symbol[]; errors: SemanticError[]; usedLibraries: Symbol[] } {
    this.symbols = []
    this.standardLibrarySymbols = []
    this.errors = []
    this.currentBlock = "global"
    this.blockStack = ["global"]
    this.usedStandardLibraries = new Set()

    // Primer paso: identificar todas las declaraciones
    this.identifyDeclarations()

    // Segundo paso: identificar todas las referencias y verificar errores
    this.identifyReferencesAndErrors()

    // Tercer paso: verificar variables no utilizadas
    this.checkUnusedVariables()

    // Cuarto paso: verificar tipos y compatibilidad
    this.checkTypeCompatibility()

    // Quinto paso: recopilar bibliotecas estándar utilizadas
    const usedLibraries = this.collectUsedLibraries()

    return { symbols: this.symbols, errors: this.errors, usedLibraries }
  }

  // Recopilar bibliotecas estándar utilizadas
  collectUsedLibraries(): Symbol[] {
    const usedLibraries: Symbol[] = []

    // Convertir el Set a un array de símbolos
    this.usedStandardLibraries.forEach((libName) => {
      usedLibraries.push({
        id: libName,
        type: "standard_library",
        block: "global",
        line: 0,
        column: 0,
        usage: "reference",
        isStandardLibrary: true,
      })
    })

    return usedLibraries
  }

  // Identificar todas las declaraciones en el código
  identifyDeclarations() {
    let i = 0
    while (i < this.tokens.length) {
      const token = this.tokens[i]

      // Manejar bloques de código
      if (token.value === "{" || token.value === ":") {
        // Si estamos después de una condición o bucle, crear un nuevo bloque
        if (
          i > 0 &&
          (this.tokens[i - 1].value === ")" || this.tokens[i - 1].value === "else") &&
          this.blockStack[this.blockStack.length - 1] === "global"
        ) {
          const blockName = `block_${this.symbols.length}`
          this.blockStack.push(blockName)
          this.currentBlock = blockName
        }
      } else if (token.value === "}") {
        // Salir del bloque actual
        if (this.blockStack.length > 1) {
          this.blockStack.pop()
          this.currentBlock = this.blockStack[this.blockStack.length - 1]
        }
      }

      // Manejar declaraciones según el lenguaje
      if (this.language?.id === "javascript") {
        i = this.handleJavaScriptDeclaration(i)
      } else if (this.language?.id === "python") {
        i = this.handlePythonDeclaration(i)
      } else if (this.language?.id === "c") {
        i = this.handleCDeclaration(i)
      } else {
        // Lenguaje genérico
        i = this.handleGenericDeclaration(i)
      }

      i++
    }
  }

  // Manejar declaraciones en JavaScript
  handleJavaScriptDeclaration(index: number): number {
    const token = this.tokens[index]

    // Declaración de variables con var, let, const
    if (token.type === "KEYWORD" && (token.value === "var" || token.value === "let" || token.value === "const")) {
      if (index + 1 < this.tokens.length && this.tokens[index + 1].type === "IDENTIFIER") {
        const varName = this.tokens[index + 1].value
        let varType = "any" // JavaScript tiene tipado dinámico
        let varValue = undefined

        // Verificar si hay una asignación
        if (index + 2 < this.tokens.length && this.tokens[index + 2].value === "=") {
          // Buscar el valor asignado
          let valueIndex = index + 3
          while (
            valueIndex < this.tokens.length &&
            this.tokens[valueIndex].value !== ";" &&
            this.tokens[valueIndex].value !== ","
          ) {
            if (varValue === undefined) varValue = this.tokens[valueIndex].value
            else varValue += " " + this.tokens[valueIndex].value
            valueIndex++
          }

          // Inferir tipo basado en el valor
          if (index + 3 < this.tokens.length) {
            if (this.tokens[index + 3].type === "NUMBER") varType = "number"
            else if (this.tokens[index + 3].type === "STRING") varType = "string"
            else if (this.tokens[index + 3].value === "true" || this.tokens[index + 3].value === "false")
              varType = "boolean"
            else if (this.tokens[index + 3].value === "null") varType = "null"
            else if (this.tokens[index + 3].value === "undefined") varType = "undefined"
            else if (this.tokens[index + 3].value === "[") varType = "array"
            else if (this.tokens[index + 3].value === "{") varType = "object"
            else if (this.tokens[index + 3].value === "new") {
              // Buscar el tipo del objeto creado con new
              if (index + 4 < this.tokens.length && this.tokens[index + 4].type === "IDENTIFIER") {
                varType = this.tokens[index + 4].value
              }
            }
          }
        }

        // Verificar si ya existe en el ámbito actual (solo para var que permite redeclaración)
        const existingSymbol = this.symbols.find(
          (s) => s.id === varName && s.usage === "declaration" && s.block === this.currentBlock,
        )

        if (!existingSymbol || token.value === "var") {
          // Verificar redeclaración con let/const (error)
          if ((token.value === "let" || token.value === "const") && existingSymbol) {
            this.errors.push({
              message: `La variable '${varName}' ya ha sido declarada en este ámbito`,
              line: this.tokens[index + 1].line,
              column: this.tokens[index + 1].column,
              severity: "error",
              code: "E001",
            })
          } else {
            // Añadir a la tabla de símbolos
            this.symbols.push({
              id: varName,
              type: varType,
              block: this.currentBlock,
              line: this.tokens[index + 1].line,
              column: this.tokens[index + 1].column,
              usage: "declaration",
              value: varValue,
              scope: this.currentBlock === "global" ? "global" : "local",
              isUsed: false,
            })
          }
        }

        // Avanzar hasta el final de la declaración
        let j = index + 2
        while (j < this.tokens.length && this.tokens[j].value !== ";") {
          j++
        }
        return j
      }
    }

    // Declaración de funciones
    else if (token.type === "KEYWORD" && token.value === "function") {
      if (index + 1 < this.tokens.length && this.tokens[index + 1].type === "IDENTIFIER") {
        const funcName = this.tokens[index + 1].value
        const oldBlock = this.currentBlock
        this.currentBlock = funcName
        this.blockStack.push(funcName)

        const parameters: Symbol[] = []

        // Buscar parámetros
        let j = index + 3 // Saltar 'function name ('
        while (j < this.tokens.length && this.tokens[j].value !== ")") {
          if (this.tokens[j].type === "IDENTIFIER") {
            parameters.push({
              id: this.tokens[j].value,
              type: "any", // JavaScript tiene tipado dinámico
              block: funcName,
              line: this.tokens[j].line,
              column: this.tokens[j].column,
              usage: "declaration",
              scope: "parameter",
              isUsed: false,
            })

            // Añadir el parámetro a la tabla de símbolos
            this.symbols.push({
              id: this.tokens[j].value,
              type: "any",
              block: funcName,
              line: this.tokens[j].line,
              column: this.tokens[j].column,
              usage: "declaration",
              scope: "parameter",
              isUsed: false,
            })
          }
          j++
        }

        // Añadir la función a la tabla de símbolos
        this.symbols.push({
          id: funcName,
          type: "function",
          block: oldBlock,
          line: this.tokens[index + 1].line,
          column: this.tokens[index + 1].column,
          isFunction: true,
          parameters: parameters,
          usage: "declaration",
          scope: oldBlock === "global" ? "global" : "local",
          returnType: "any", // Por defecto en JavaScript
          isUsed: false,
        })

        // Buscar el inicio del bloque de la función
        while (j < this.tokens.length && this.tokens[j].value !== "{") {
          j++
        }
        return j
      }
    }

    // Declaración de clases
    else if (token.type === "KEYWORD" && token.value === "class") {
      if (index + 1 < this.tokens.length && this.tokens[index + 1].type === "IDENTIFIER") {
        const className = this.tokens[index + 1].value
        const oldBlock = this.currentBlock
        this.currentBlock = className
        this.blockStack.push(className)

        // Añadir la clase a la tabla de símbolos
        this.symbols.push({
          id: className,
          type: "class",
          block: oldBlock,
          line: this.tokens[index + 1].line,
          column: this.tokens[index + 1].column,
          usage: "declaration",
          scope: oldBlock === "global" ? "global" : "local",
          isUsed: false,
        })

        // Buscar el inicio del bloque de la clase
        let j = index + 2
        while (j < this.tokens.length && this.tokens[j].value !== "{") {
          j++
        }
        return j
      }
    }

    // Expresiones de función flecha
    else if (
      token.type === "IDENTIFIER" &&
      index + 1 < this.tokens.length &&
      this.tokens[index + 1].value === "=" &&
      index + 2 < this.tokens.length &&
      this.tokens[index + 2].value === "("
    ) {
      const funcName = token.value
      const oldBlock = this.currentBlock
      this.currentBlock = funcName
      this.blockStack.push(funcName)

      const parameters: Symbol[] = []

      // Buscar parámetros
      let j = index + 3 // Saltar 'name = ('
      while (j < this.tokens.length && this.tokens[j].value !== ")") {
        if (this.tokens[j].type === "IDENTIFIER") {
          parameters.push({
            id: this.tokens[j].value,
            type: "any", // JavaScript tiene tipado dinámico
            block: funcName,
            line: this.tokens[j].line,
            column: this.tokens[j].column,
            usage: "declaration",
            scope: "parameter",
            isUsed: false,
          })

          // Añadir el parámetro a la tabla de símbolos
          this.symbols.push({
            id: this.tokens[j].value,
            type: "any",
            block: funcName,
            line: this.tokens[j].line,
            column: this.tokens[j].column,
            usage: "declaration",
            scope: "parameter",
            isUsed: false,
          })
        }
        j++
      }

      // Verificar si es una función flecha
      while (j < this.tokens.length && this.tokens[j].value !== "=>" && this.tokens[j].value !== "{") {
        j++
      }

      if (j < this.tokens.length && this.tokens[j].value === "=>") {
        // Es una función flecha
        this.symbols.push({
          id: funcName,
          type: "function",
          block: oldBlock,
          line: token.line,
          column: token.column,
          isFunction: true,
          parameters: parameters,
          usage: "declaration",
          scope: oldBlock === "global" ? "global" : "local",
          returnType: "any", // Por defecto en JavaScript
          isUsed: false,
        })
      }

      // Buscar el inicio del bloque de la función o la expresión
      while (j < this.tokens.length && this.tokens[j].value !== "{" && this.tokens[j].value !== ";") {
        j++
      }
      return j
    }

    return index
  }

  // Manejar declaraciones en Python
  handlePythonDeclaration(index: number): number {
    const token = this.tokens[index]

    // Declaración de funciones con def
    if (token.type === "KEYWORD" && token.value === "def") {
      if (index + 1 < this.tokens.length && this.tokens[index + 1].type === "IDENTIFIER") {
        const funcName = this.tokens[index + 1].value
        const oldBlock = this.currentBlock
        this.currentBlock = funcName
        this.blockStack.push(funcName)

        const parameters: Symbol[] = []

        // Buscar parámetros
        let j = index + 3 // Saltar 'def name ('
        while (j < this.tokens.length && this.tokens[j].value !== ")") {
          if (this.tokens[j].type === "IDENTIFIER") {
            parameters.push({
              id: this.tokens[j].value,
              type: "any", // Python tiene tipado dinámico
              block: funcName,
              line: this.tokens[j].line,
              column: this.tokens[j].column,
              usage: "declaration",
              scope: "parameter",
              isUsed: false,
            })

            // Añadir el parámetro a la tabla de símbolos
            this.symbols.push({
              id: this.tokens[j].value,
              type: "any",
              block: funcName,
              line: this.tokens[j].line,
              column: this.tokens[j].column,
              usage: "declaration",
              scope: "parameter",
              isUsed: false,
            })
          }
          j++
        }

        // Buscar tipo de retorno (Python 3 type hints)
        let returnType = "any"
        while (j < this.tokens.length && this.tokens[j].value !== ":" && this.tokens[j].value !== "->") {
          j++
        }

        if (j < this.tokens.length && this.tokens[j].value === "->") {
          j++
          if (j < this.tokens.length && this.tokens[j].type === "IDENTIFIER") {
            returnType = this.tokens[j].value
          }
        }

        // Añadir la función a la tabla de símbolos
        this.symbols.push({
          id: funcName,
          type: "function",
          block: oldBlock,
          line: this.tokens[index + 1].line,
          column: this.tokens[index + 1].column,
          isFunction: true,
          parameters: parameters,
          usage: "declaration",
          scope: oldBlock === "global" ? "global" : "local",
          returnType: returnType,
          isUsed: false,
        })

        // Buscar el inicio del bloque de la función
        while (j < this.tokens.length && this.tokens[j].value !== ":") {
          j++
        }
        return j
      }
    }

    // Declaración de clases con class
    else if (token.type === "KEYWORD" && token.value === "class") {
      if (index + 1 < this.tokens.length && this.tokens[index + 1].type === "IDENTIFIER") {
        const className = this.tokens[index + 1].value
        const oldBlock = this.currentBlock
        this.currentBlock = className
        this.blockStack.push(className)

        // Añadir la clase a la tabla de símbolos
        this.symbols.push({
          id: className,
          type: "class",
          block: oldBlock,
          line: this.tokens[index + 1].line,
          column: this.tokens[index + 1].column,
          usage: "declaration",
          scope: oldBlock === "global" ? "global" : "local",
          isUsed: false,
        })

        // Buscar el inicio del bloque de la clase
        let j = index + 2
        while (j < this.tokens.length && this.tokens[j].value !== ":") {
          j++
        }
        return j
      }
    }

    // Asignación de variables (en Python, las variables se declaran al asignarles un valor)
    else if (token.type === "IDENTIFIER" && index + 1 < this.tokens.length && this.tokens[index + 1].value === "=") {
      const varName = token.value
      let varType = "any" // Python tiene tipado dinámico
      let varValue = undefined

      // Verificar si ya existe en algún ámbito accesible
      let existingSymbol = null
      for (let i = this.blockStack.length - 1; i >= 0; i--) {
        const block = this.blockStack[i]
        const symbol = this.symbols.find((s) => s.id === varName && s.usage === "declaration" && s.block === block)
        if (symbol) {
          existingSymbol = symbol
          break
        }
      }

      // Si no existe en ningún ámbito accesible, añadirla como nueva declaración
      if (!existingSymbol) {
        // Buscar el valor asignado
        let valueIndex = index + 2
        while (
          valueIndex < this.tokens.length &&
          this.tokens[valueIndex].value !== "\n" &&
          this.tokens[valueIndex].value !== ";" &&
          this.tokens[valueIndex].value !== ","
        ) {
          if (varValue === undefined) varValue = this.tokens[valueIndex].value
          else varValue += " " + this.tokens[valueIndex].value
          valueIndex++
        }

        // Inferir tipo basado en el valor
        if (index + 2 < this.tokens.length) {
          if (this.tokens[index + 2].type === "NUMBER") varType = "number"
          else if (this.tokens[index + 2].type === "STRING") varType = "string"
          else if (this.tokens[index + 2].value === "True" || this.tokens[index + 2].value === "False")
            varType = "boolean"
          else if (this.tokens[index + 2].value === "None") varType = "None"
          else if (this.tokens[index + 2].value === "[") varType = "list"
          else if (this.tokens[index + 2].value === "{") varType = "dict"
          else if (this.tokens[index + 2].value === "(") varType = "tuple"
        }

        this.symbols.push({
          id: varName,
          type: varType,
          block: this.currentBlock,
          line: token.line,
          column: token.column,
          usage: "declaration",
          value: varValue,
          scope: this.currentBlock === "global" ? "global" : "local",
          isUsed: false,
        })
      }
      // Si ya existe, actualizar su valor (reasignación)
      else {
        // Buscar el valor asignado
        let valueIndex = index + 2
        let newValue = undefined
        while (
          valueIndex < this.tokens.length &&
          this.tokens[valueIndex].value !== "\n" &&
          this.tokens[valueIndex].value !== ";" &&
          this.tokens[valueIndex].value !== ","
        ) {
          if (newValue === undefined) newValue = this.tokens[valueIndex].value
          else newValue += " " + this.tokens[valueIndex].value
          valueIndex++
        }

        // Actualizar el valor en la tabla de símbolos
        existingSymbol.value = newValue
        existingSymbol.isUsed = true // Marcar como usada al reasignar
      }

      // Avanzar hasta el final de la asignación
      let j = index + 2
      while (
        j < this.tokens.length &&
        this.tokens[j].value !== "\n" &&
        this.tokens[j].value !== ";" &&
        this.tokens[j].value !== ","
      ) {
        j++
      }
      return j
    }

    // Variables en bucles for
    else if (
      token.type === "KEYWORD" &&
      token.value === "for" &&
      index + 1 < this.tokens.length &&
      this.tokens[index + 1].type === "IDENTIFIER"
    ) {
      const varName = this.tokens[index + 1].value

      // Añadir la variable del bucle a la tabla de símbolos
      this.symbols.push({
        id: varName,
        type: "any", // El tipo dependerá del iterable
        block: this.currentBlock,
        line: this.tokens[index + 1].line,
        column: this.tokens[index + 1].column,
        usage: "declaration",
        scope: "local",
        isUsed: true, // Las variables de bucle se consideran usadas
      })

      // Avanzar hasta el final de la declaración del bucle
      let j = index + 2
      while (j < this.tokens.length && this.tokens[j].value !== ":") {
        j++
      }
      return j
    }

    return index
  }

  // Manejar declaraciones en C
  handleCDeclaration(index: number): number {
    const token = this.tokens[index]

    // Declaración de variables y funciones con tipo
    if (this.isDataType(token.value)) {
      if (index + 1 < this.tokens.length && this.tokens[index + 1].type === "IDENTIFIER") {
        const identifierName = this.tokens[index + 1].value
        const typeName = token.value

        // Verificar si es una función (tiene paréntesis después del identificador)
        if (index + 2 < this.tokens.length && this.tokens[index + 2].value === "(") {
          // Es una declaración de función
          const oldBlock = this.currentBlock
          this.currentBlock = identifierName
          this.blockStack.push(identifierName)

          const parameters: Symbol[] = []

          // Buscar parámetros
          let j = index + 3 // Saltar 'type name ('
          while (j < this.tokens.length && this.tokens[j].value !== ")") {
            // En C, los parámetros tienen formato "tipo nombre"
            if (
              this.isDataType(this.tokens[j].value) &&
              j + 1 < this.tokens.length &&
              this.tokens[j + 1].type === "IDENTIFIER"
            ) {
              parameters.push({
                id: this.tokens[j + 1].value,
                type: this.tokens[j].value,
                block: identifierName,
                line: this.tokens[j + 1].line,
                column: this.tokens[j + 1].column,
                usage: "declaration",
                scope: "parameter",
                isUsed: false,
              })

              // Añadir el parámetro a la tabla de símbolos
              this.symbols.push({
                id: this.tokens[j + 1].value,
                type: this.tokens[j].value,
                block: identifierName,
                line: this.tokens[j + 1].line,
                column: this.tokens[j + 1].column,
                usage: "declaration",
                scope: "parameter",
                isUsed: false,
              })

              j += 2 // Saltar el tipo y el nombre
            } else {
              j++
            }
          }

          // Añadir la función a la tabla de símbolos
          this.symbols.push({
            id: identifierName,
            type: "function",
            returnType: typeName,
            block: oldBlock,
            line: this.tokens[index + 1].line,
            column: this.tokens[index + 1].column,
            isFunction: true,
            parameters: parameters,
            usage: "declaration",
            scope: oldBlock === "global" ? "global" : "local",
            isUsed: false,
          })

          // Buscar el inicio del bloque de la función
          while (j < this.tokens.length && this.tokens[j].value !== "{") {
            j++
          }
          return j
        } else {
          // Es una declaración de variable
          let varValue = undefined

          // Verificar si hay una asignación
          if (index + 2 < this.tokens.length && this.tokens[index + 2].value === "=") {
            // Buscar el valor asignado
            let valueIndex = index + 3
            while (
              valueIndex < this.tokens.length &&
              this.tokens[valueIndex].value !== ";" &&
              this.tokens[valueIndex].value !== ","
            ) {
              if (varValue === undefined) varValue = this.tokens[valueIndex].value
              else varValue += " " + this.tokens[valueIndex].value
              valueIndex++
            }
          }

          // Verificar si ya existe en el ámbito actual
          const existingSymbol = this.symbols.find(
            (s) => s.id === identifierName && s.usage === "declaration" && s.block === this.currentBlock,
          )

          if (!existingSymbol) {
            this.symbols.push({
              id: identifierName,
              type: typeName,
              block: this.currentBlock,
              line: this.tokens[index + 1].line,
              column: this.tokens[index + 1].column,
              usage: "declaration",
              value: varValue,
              scope: this.currentBlock === "global" ? "global" : "local",
              isUsed: false,
            })
          } else {
            // Error: redeclaración de variable
            this.errors.push({
              message: `La variable '${identifierName}' ya ha sido declarada en este ámbito`,
              line: this.tokens[index + 1].line,
              column: this.tokens[index + 1].column,
              severity: "error",
              code: "E001",
            })
          }

          // Avanzar hasta el final de la declaración
          let j = index + 2
          while (j < this.tokens.length && this.tokens[j].value !== ";") {
            j++
          }
          return j
        }
      }
    }

    // Reasignación de variables (sin tipo)
    else if (token.type === "IDENTIFIER" && index + 1 < this.tokens.length && this.tokens[index + 1].value === "=") {
      const varName = token.value

      // Verificar si la variable ya está declarada en algún ámbito accesible
      if (this.isDeclared(varName)) {
        // Marcar la variable como usada
        this.markSymbolAsUsed(varName)

        // Es una reasignación, no una declaración
        // Avanzar hasta el final de la asignación
        let j = index + 2
        while (j < this.tokens.length && this.tokens[j].value !== ";") {
          j++
        }
        return j
      } else {
        // Error: variable no declarada
        this.errors.push({
          message: `La variable '${varName}' se usa antes de ser declarada`,
          line: token.line,
          column: token.column,
          severity: "error",
          code: "E002",
        })
      }
    }

    // Variables en bucles for
    else if (
      token.type === "KEYWORD" &&
      token.value === "for" &&
      index + 1 < this.tokens.length &&
      this.tokens[index + 1].value === "("
    ) {
      // Buscar declaraciones dentro del for
      let j = index + 2
      while (j < this.tokens.length && this.tokens[j].value !== ";") {
        if (
          this.isDataType(this.tokens[j].value) &&
          j + 1 < this.tokens.length &&
          this.tokens[j + 1].type === "IDENTIFIER"
        ) {
          // Añadir la variable del bucle a la tabla de símbolos
          this.symbols.push({
            id: this.tokens[j + 1].value,
            type: this.tokens[j].value,
            block: this.currentBlock,
            line: this.tokens[j + 1].line,
            column: this.tokens[j + 1].column,
            usage: "declaration",
            scope: "local",
            isUsed: true, // Las variables de bucle se consideran usadas
          })

          j += 2 // Saltar el tipo y el nombre
        } else {
          j++
        }
      }

      // Avanzar hasta el final de la declaración del bucle
      while (j < this.tokens.length && this.tokens[j].value !== ")") {
        j++
      }
      return j
    }

    // Estructuras y uniones en C
    else if (
      token.type === "KEYWORD" &&
      (token.value === "struct" || token.value === "union" || token.value === "enum")
    ) {
      if (index + 1 < this.tokens.length && this.tokens[index + 1].type === "IDENTIFIER") {
        const structName = this.tokens[index + 1].value

        // Añadir la estructura a la tabla de símbolos
        this.symbols.push({
          id: structName,
          type: token.value, // struct, union o enum
          block: this.currentBlock,
          line: this.tokens[index + 1].line,
          column: this.tokens[index + 1].column,
          usage: "declaration",
          scope: this.currentBlock === "global" ? "global" : "local",
          isUsed: false,
        })

        // Avanzar hasta el final de la declaración
        let j = index + 2
        // Buscar el inicio del bloque
        while (j < this.tokens.length && this.tokens[j].value !== "{") {
          j++
        }

        // Buscar el final del bloque
        let braceCount = 1
        j++
        while (j < this.tokens.length && braceCount > 0) {
          if (this.tokens[j].value === "{") braceCount++
          else if (this.tokens[j].value === "}") braceCount--
          j++
        }

        return j
      }
    }

    return index
  }

  // Manejar declaraciones genéricas
  handleGenericDeclaration(index: number): number {
    // Implementación básica para lenguajes no específicos
    return index
  }

  // Identificar referencias y verificar errores
  identifyReferencesAndErrors() {
    // Añadir bibliotecas estándar según el lenguaje
    this.addStandardLibraries()

    // Verificar referencias
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i]

      // Si es un identificador, verificar si es una referencia o una declaración
      if (token.type === "IDENTIFIER") {
        // Verificar si es parte de una declaración
        const isPartOfDeclaration = this.isPartOfDeclaration(i)

        if (!isPartOfDeclaration) {
          // Es una referencia, verificar si está declarada
          const isDeclared = this.isDeclared(token.value)

          if (isDeclared) {
            // Marcar el símbolo como usado
            this.markSymbolAsUsed(token.value)

            // Añadir como referencia a la tabla de símbolos
            this.symbols.push({
              id: token.value,
              type: this.getSymbolType(token.value),
              block: this.currentBlock,
              line: token.line,
              column: token.column,
              usage: "reference",
              isUsed: true,
            })
          } else {
            // Verificar si es una función o variable de biblioteca estándar
            const isStandardLibrary = this.isStandardLibrary(token.value)

            if (isStandardLibrary) {
              // Añadir a la lista de bibliotecas estándar utilizadas
              this.usedStandardLibraries.add(token.value)
            } else {
              // No está declarada ni es de biblioteca estándar, añadir error
              this.errors.push({
                message: `Variable o función '${token.value}' no declarada`,
                line: token.line,
                column: token.column,
                severity: "error",
                code: "E002",
              })
            }
          }
        }
      }
    }
  }

  // Marcar un símbolo como usado
  markSymbolAsUsed(symbolName: string) {
    // Buscar en todos los ámbitos accesibles
    for (let i = this.blockStack.length - 1; i >= 0; i--) {
      const block = this.blockStack[i]
      const symbol = this.symbols.find((s) => s.id === symbolName && s.usage === "declaration" && s.block === block)
      if (symbol) {
        symbol.isUsed = true
        return
      }
    }
  }

  // Verificar variables no utilizadas
  checkUnusedVariables() {
    // Recorrer todos los símbolos declarados
    for (const symbol of this.symbols) {
      if (symbol.usage === "declaration" && !symbol.isUsed && !symbol.isFunction) {
        // Ignorar variables globales y parámetros de funciones principales
        if (symbol.scope === "global" || (symbol.scope === "parameter" && symbol.block === "main")) {
          continue
        }

        // Añadir advertencia para variables no utilizadas
        this.errors.push({
          message: `La variable '${symbol.id}' está declarada pero no se utiliza`,
          line: symbol.line,
          column: symbol.column,
          severity: "warning",
          code: "W001",
        })
      }
    }
  }

  // Verificar compatibilidad de tipos
  checkTypeCompatibility() {
    // Recorrer todos los tokens para encontrar asignaciones
    for (let i = 0; i < this.tokens.length; i++) {
      if (
        i + 2 < this.tokens.length &&
        this.tokens[i].type === "IDENTIFIER" &&
        this.tokens[i + 1].value === "=" &&
        !this.isPartOfDeclaration(i)
      ) {
        const varName = this.tokens[i].value
        const varSymbol = this.getSymbolDeclaration(varName)

        if (varSymbol) {
          // Determinar el tipo del valor asignado
          const valueType = this.inferTypeFromToken(i + 2)

          // Verificar compatibilidad de tipos
          if (this.language?.id === "c" && varSymbol.type !== valueType && valueType !== "unknown") {
            // En C, la compatibilidad de tipos es más estricta
            if (!this.areTypesCompatible(varSymbol.type, valueType)) {
              this.errors.push({
                message: `Posible incompatibilidad de tipos: se asigna '${valueType}' a variable de tipo '${varSymbol.type}'`,
                line: this.tokens[i].line,
                column: this.tokens[i].column,
                severity: "warning",
                code: "W002",
              })
            }
          }
        }
      }
    }
  }

  // Obtener la declaración de un símbolo
  getSymbolDeclaration(symbolName: string): Symbol | null {
    // Buscar en todos los ámbitos accesibles
    for (let i = this.blockStack.length - 1; i >= 0; i--) {
      const block = this.blockStack[i]
      const symbol = this.symbols.find((s) => s.id === symbolName && s.usage === "declaration" && s.block === block)
      if (symbol) {
        return symbol
      }
    }

    // Buscar en el ámbito global
    const globalSymbol = this.symbols.find(
      (s) => s.id === symbolName && s.usage === "declaration" && s.block === "global",
    )

    return globalSymbol || null
  }

  // Inferir tipo a partir de un token
  inferTypeFromToken(index: number): string {
    if (index >= this.tokens.length) return "unknown"

    const token = this.tokens[index]

    if (token.type === "NUMBER") return "number"
    if (token.type === "STRING") return "string"
    if (token.value === "true" || token.value === "false") return "boolean"
    if (token.value === "null" || token.value === "NULL") return "null"
    if (token.value === "undefined") return "undefined"
    if (token.value === "None") return "None"

    if (token.type === "IDENTIFIER") {
      // Buscar el tipo del identificador
      const symbolType = this.getSymbolType(token.value)
      return symbolType
    }

    return "unknown"
  }

  // Verificar si dos tipos son compatibles
  areTypesCompatible(type1: string, type2: string): boolean {
    // Tipos numéricos son compatibles entre sí
    const numericTypes = ["int", "float", "double", "long", "short", "number"]
    if (numericTypes.includes(type1) && numericTypes.includes(type2)) {
      return true
    }

    // Tipos de caracteres son compatibles entre sí
    const charTypes = ["char", "string"]
    if (charTypes.includes(type1) && charTypes.includes(type2)) {
      return true
    }

    // Tipos booleanos
    const boolTypes = ["bool", "boolean"]
    if (boolTypes.includes(type1) && boolTypes.includes(type2)) {
      return true
    }

    // Tipos iguales son compatibles
    return type1 === type2
  }

  // Verificar si un token es parte de una declaración
  isPartOfDeclaration(index: number): boolean {
    const token = this.tokens[index]

    // JavaScript
    if (this.language?.id === "javascript") {
      // Declaración de variable
      if (
        index > 0 &&
        (this.tokens[index - 1].value === "var" ||
          this.tokens[index - 1].value === "let" ||
          this.tokens[index - 1].value === "const")
      ) {
        return true
      }

      // Declaración de función
      if (index > 0 && this.tokens[index - 1].value === "function") {
        return true
      }

      // Declaración de clase
      if (index > 0 && this.tokens[index - 1].value === "class") {
        return true
      }

      // Parámetros de función
      if (
        index > 0 &&
        this.tokens[index - 1].value === "(" &&
        index > 1 &&
        (this.tokens[index - 2].type === "IDENTIFIER" || this.tokens[index - 2].value === "function")
      ) {
        return true
      }

      // Propiedades de objeto en declaración
      if (
        index > 0 &&
        this.tokens[index - 1].value === "." &&
        index > 1 &&
        this.tokens[index - 2].type === "IDENTIFIER"
      ) {
        return false // Es una referencia a una propiedad, no una declaración
      }
    }

    // Python
    else if (this.language?.id === "python") {
      // Declaración de función
      if (index > 0 && this.tokens[index - 1].value === "def") {
        return true
      }

      // Declaración de clase
      if (index > 0 && this.tokens[index - 1].value === "class") {
        return true
      }

      // Parámetros de función
      if (
        index > 0 &&
        this.tokens[index - 1].value === "(" &&
        index > 1 &&
        this.tokens[index - 2].type === "IDENTIFIER" &&
        index > 2 &&
        this.tokens[index - 3].value === "def"
      ) {
        return true
      }

      // Variable en bucle for
      if (index > 0 && this.tokens[index - 1].value === "for") {
        return true
      }

      // Importaciones
      if (index > 0 && (this.tokens[index - 1].value === "import" || this.tokens[index - 1].value === "from")) {
        return true
      }
    }

    // C
    else if (this.language?.id === "c") {
      // Declaración de variable o función
      if (index > 0 && this.isDataType(this.tokens[index - 1].value)) {
        return true
      }

      // Parámetros de función
      if (
        index > 0 &&
        this.isDataType(this.tokens[index - 1].value) &&
        index < this.tokens.length - 1 &&
        (this.tokens[index + 1].value === "," || this.tokens[index + 1].value === ")")
      ) {
        return true
      }

      // Estructuras, uniones y enumeraciones
      if (
        index > 0 &&
        (this.tokens[index - 1].value === "struct" ||
          this.tokens[index - 1].value === "union" ||
          this.tokens[index - 1].value === "enum")
      ) {
        return true
      }

      // Miembros de estructuras
      if (
        index > 0 &&
        this.tokens[index - 1].value === "." &&
        index > 1 &&
        this.tokens[index - 2].type === "IDENTIFIER"
      ) {
        return false // Es una referencia a un miembro, no una declaración
      }
    }

    return false
  }

  // Verificar si un símbolo está declarado
  isDeclared(symbolName: string): boolean {
    // Buscar en la tabla de símbolos, considerando el ámbito actual y los ámbitos superiores
    for (let i = this.blockStack.length - 1; i >= 0; i--) {
      const block = this.blockStack[i]
      const symbol = this.symbols.find((s) => s.id === symbolName && s.usage === "declaration" && s.block === block)
      if (symbol) return true
    }

    // Verificar en el ámbito global
    const globalSymbol = this.symbols.find(
      (s) => s.id === symbolName && s.usage === "declaration" && s.block === "global",
    )

    return !!globalSymbol
  }

  // Verificar si un símbolo es de biblioteca estándar
  isStandardLibrary(symbolName: string): boolean {
    if (!this.language) return false

    const libraries = this.standardLibraries[this.language.id]
    if (!libraries) return false

    return libraries.includes(symbolName)
  }

  // Añadir bibliotecas estándar a la tabla de símbolos
  addStandardLibraries() {
    if (!this.language) return

    const libraries = this.standardLibraries[this.language.id]
    if (!libraries) return

    // Añadir cada biblioteca estándar como un símbolo global
    libraries.forEach((lib) => {
      // Verificar si ya existe en la tabla de símbolos
      const exists = this.standardLibrarySymbols.some((s) => s.id === lib)

      if (!exists) {
        this.standardLibrarySymbols.push({
          id: lib,
          type: "standard_library",
          block: "global",
          line: 0,
          column: 0,
          usage: "declaration",
          isStandardLibrary: true,
        })
      }
    })
  }

  // Obtener el tipo de un símbolo
  getSymbolType(symbolName: string): string {
    // Buscar en el ámbito actual y los ámbitos superiores
    for (let i = this.blockStack.length - 1; i >= 0; i--) {
      const block = this.blockStack[i]
      const symbol = this.symbols.find((s) => s.id === symbolName && s.usage === "declaration" && s.block === block)
      if (symbol) return symbol.type
    }

    // Buscar en el ámbito global
    const globalSymbol = this.symbols.find(
      (s) => s.id === symbolName && s.usage === "declaration" && s.block === "global",
    )

    // Si es una biblioteca estándar
    if (this.isStandardLibrary(symbolName)) {
      return "standard_library"
    }

    return globalSymbol ? globalSymbol.type : "unknown"
  }

  // Extraer parámetros de una función
  extractFunctionParameters(startIndex: number): Symbol[] {
    const parameters: Symbol[] = []
    let i = startIndex
    let paramType = ""
    let expectingType = true
    let expectingIdentifier = false

    while (i < this.tokens.length && this.tokens[i].value !== ")") {
      const token = this.tokens[i]

      if (token.value === ",") {
        expectingType = true
        expectingIdentifier = false
      } else if (expectingType && this.isDataType(token.value)) {
        paramType = token.value
        expectingType = false
        expectingIdentifier = true
      } else if (expectingIdentifier && token.type === "IDENTIFIER") {
        parameters.push({
          id: token.value,
          type: paramType,
          block: this.currentBlock,
          line: token.line,
          column: token.column,
          usage: "declaration",
          scope: "parameter",
          isUsed: false,
        })
        expectingIdentifier = false
      }

      i++
    }

    return parameters
  }

  // Verificar si un token es un tipo de dato
  isDataType(value: string): boolean {
    if (!this.language) return false
    return this.language.datatypes.includes(value)
  }

  // Verificar si un bloque está en el ámbito de otro
  isInScope(symbolBlock: string, currentBlock: string): boolean {
    if (symbolBlock === currentBlock) return true
    if (symbolBlock === "global") return true

    // Verificar si symbolBlock es un ancestro de currentBlock
    let block = currentBlock
    let index = this.blockStack.indexOf(block)

    while (index > 0) {
      block = this.blockStack[index - 1]
      if (block === symbolBlock) return true
      index = this.blockStack.indexOf(block)
    }

    return false
  }
}
