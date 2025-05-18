// Clase para el análisis léxico
export interface Token {
  type: string
  value: string
  line: number
  column: number
}

export class Lexer {
  input: string
  position: number
  line: number
  column: number
  keywords: string[]
  datatypes: string[]

  constructor(input: string, keywords: string[] = [], datatypes: string[] = []) {
    this.input = input
    this.position = 0
    this.line = 1
    this.column = 1
    this.keywords = keywords
    this.datatypes = datatypes
  }

  // Obtener el siguiente token
  getNextToken(): Token | null {
    // Ignorar espacios en blanco
    this.skipWhitespace()

    // Si llegamos al final del input, retornar null
    if (this.position >= this.input.length) {
      return null
    }

    const char = this.input[this.position]

    // Identificar números
    if (this.isDigit(char)) {
      return this.getNumberToken()
    }

    // Identificar identificadores y palabras clave
    if (this.isAlpha(char)) {
      return this.getIdentifierOrKeywordToken()
    }

    // Identificar strings
    if (char === '"' || char === "'") {
      return this.getStringToken()
    }

    // Identificar operadores y símbolos
    return this.getSymbolToken()
  }

  // Obtener todos los tokens
  tokenize(): Token[] {
    const tokens: Token[] = []
    let token: Token | null

    while ((token = this.getNextToken()) !== null) {
      tokens.push(token)
    }

    return tokens
  }

  // Ignorar espacios en blanco y comentarios
  private skipWhitespace(): void {
    let continueSkipping = true

    while (continueSkipping && this.position < this.input.length) {
      continueSkipping = false

      // Saltar espacios en blanco
      while (
        this.position < this.input.length &&
        (this.input[this.position] === " " ||
          this.input[this.position] === "\t" ||
          this.input[this.position] === "\n" ||
          this.input[this.position] === "\r")
      ) {
        if (this.input[this.position] === "\n") {
          this.line++
          this.column = 1
        } else {
          this.column++
        }
        this.position++
        continueSkipping = true
      }

      // Verificar si hay comentarios
      if (this.position + 1 < this.input.length) {
        // Comentarios de una línea
        if (this.input[this.position] === "/" && this.input[this.position + 1] === "/") {
          this.skipComments()
          continueSkipping = true
        }
        // Comentarios multilínea
        else if (this.input[this.position] === "/" && this.input[this.position + 1] === "*") {
          this.skipComments()
          continueSkipping = true
        }
      }
    }
  }

  // Verificar si un carácter es un dígito
  private isDigit(char: string): boolean {
    return /[0-9]/.test(char)
  }

  // Verificar si un carácter es una letra o guión bajo
  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char)
  }

  // Verificar si un carácter es alfanumérico
  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char)
  }

  // Obtener un token de número
  private getNumberToken(): Token {
    const startPosition = this.position
    const startLine = this.line
    const startColumn = this.column
    let value = ""

    // Leer dígitos
    while (this.position < this.input.length && this.isDigit(this.input[this.position])) {
      value += this.input[this.position]
      this.position++
      this.column++
    }

    // Manejar números decimales
    if (this.position < this.input.length && this.input[this.position] === ".") {
      value += "."
      this.position++
      this.column++

      while (this.position < this.input.length && this.isDigit(this.input[this.position])) {
        value += this.input[this.position]
        this.position++
        this.column++
      }
    }

    return {
      type: "NUMBER",
      value,
      line: startLine,
      column: startColumn,
    }
  }

  // Obtener un token de identificador o palabra clave
  private getIdentifierOrKeywordToken(): Token {
    const startPosition = this.position
    const startLine = this.line
    const startColumn = this.column
    let value = ""

    // Leer caracteres alfanuméricos
    while (this.position < this.input.length && this.isAlphaNumeric(this.input[this.position])) {
      value += this.input[this.position]
      this.position++
      this.column++
    }

    // Determinar si es una palabra clave, tipo de dato o identificador
    let type = "IDENTIFIER"
    if (this.keywords.includes(value)) {
      type = "KEYWORD"
    } else if (this.datatypes.includes(value)) {
      type = "DATATYPE"
    }

    return {
      type,
      value,
      line: startLine,
      column: startColumn,
    }
  }

  // Obtener un token de string
  private getStringToken(): Token {
    const startPosition = this.position
    const startLine = this.line
    const startColumn = this.column
    const quote = this.input[this.position]
    let value = quote

    this.position++
    this.column++

    // Leer hasta encontrar la comilla de cierre
    while (this.position < this.input.length && this.input[this.position] !== quote) {
      // Manejar caracteres de escape
      if (this.input[this.position] === "\\" && this.position + 1 < this.input.length) {
        value += this.input[this.position]
        this.position++
        this.column++
      }

      value += this.input[this.position]

      if (this.input[this.position] === "\n") {
        this.line++
        this.column = 1
      } else {
        this.column++
      }

      this.position++
    }

    // Añadir la comilla de cierre si existe
    if (this.position < this.input.length) {
      value += this.input[this.position]
      this.position++
      this.column++
    }

    return {
      type: "STRING",
      value,
      line: startLine,
      column: startColumn,
    }
  }

  // Obtener un token de símbolo u operador
  private getSymbolToken(): Token {
    const startPosition = this.position
    const startLine = this.line
    const startColumn = this.column
    let value = this.input[this.position]

    this.position++
    this.column++

    // Manejar operadores de dos caracteres (==, !=, <=, >=, etc.)
    if (
      this.position < this.input.length &&
      ((value === "=" && this.input[this.position] === "=") ||
        (value === "!" && this.input[this.position] === "=") ||
        (value === "<" && this.input[this.position] === "=") ||
        (value === ">" && this.input[this.position] === "=") ||
        (value === "&" && this.input[this.position] === "&") ||
        (value === "|" && this.input[this.position] === "|") ||
        (value === "+" && this.input[this.position] === "+") ||
        (value === "-" && this.input[this.position] === "-") ||
        (value === "+" && this.input[this.position] === "=") ||
        (value === "-" && this.input[this.position] === "=") ||
        (value === "*" && this.input[this.position] === "=") ||
        (value === "/" && this.input[this.position] === "="))
    ) {
      value += this.input[this.position]
      this.position++
      this.column++
    }

    // Determinar el tipo de símbolo
    let type
    if (/[+\-*/%]/.test(value)) {
      type = "OPERATOR"
    } else if (/[$$$${}[\]]/.test(value)) {
      type = "BRACKET"
    } else if (/[;,.]/.test(value)) {
      type = "PUNCTUATION"
    } else if (/[=!<>]/.test(value) || value === "==" || value === "!=" || value === "<=" || value === ">=") {
      type = "COMPARISON"
    } else {
      type = "SYMBOL"
    }

    return {
      type,
      value,
      line: startLine,
      column: startColumn,
    }
  }

  // Método para manejar comentarios
  skipComments(): void {
    // Comentarios de una línea
    if (
      this.position + 1 < this.input.length &&
      this.input[this.position] === "/" &&
      this.input[this.position + 1] === "/"
    ) {
      // Avanzar hasta el final de la línea
      while (this.position < this.input.length && this.input[this.position] !== "\n") {
        this.position++
        this.column++
      }
      // Consumir el salto de línea si existe
      if (this.position < this.input.length) {
        this.position++
        this.line++
        this.column = 1
      }
    }

    // Comentarios multilínea
    else if (
      this.position + 1 < this.input.length &&
      this.input[this.position] === "/" &&
      this.input[this.position + 1] === "*"
    ) {
      this.position += 2
      this.column += 2

      // Buscar el cierre del comentario
      while (
        this.position + 1 < this.input.length &&
        !(this.input[this.position] === "*" && this.input[this.position + 1] === "/")
      ) {
        if (this.input[this.position] === "\n") {
          this.line++
          this.column = 1
        } else {
          this.column++
        }
        this.position++
      }

      // Consumir el cierre del comentario si existe
      if (this.position + 1 < this.input.length) {
        this.position += 2
        this.column += 2
      }
    }
  }
}
