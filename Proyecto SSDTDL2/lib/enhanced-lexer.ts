import type { Token } from "./types"

export class EnhancedLexer {
  private input: string
  private position: number
  private line: number
  private column: number
  private keywords: string[]
  private datatypes: string[]

  constructor(input: string, keywords: string[] = [], datatypes: string[] = []) {
    this.input = input
    this.position = 0
    this.line = 1
    this.column = 1
    this.keywords = keywords
    this.datatypes = datatypes
  }

  tokenize(): Token[] {
    const tokens: Token[] = []

    while (this.position < this.input.length) {
      this.skipWhitespace()

      if (this.position >= this.input.length) break

      const token = this.getNextToken()
      if (token) {
        tokens.push(token)
      }
    }

    return tokens
  }

  private getNextToken(): Token | null {
    const char = this.input[this.position]
    const startLine = this.line
    const startColumn = this.column

    // Números
    if (this.isDigit(char)) {
      return this.readNumber(startLine, startColumn)
    }

    // Identificadores y palabras clave
    if (this.isAlpha(char)) {
      return this.readIdentifier(startLine, startColumn)
    }

    // Strings
    if (char === '"' || char === "'") {
      return this.readString(startLine, startColumn)
    }

    // Operadores de dos caracteres
    if (this.position + 1 < this.input.length) {
      const twoChar = this.input.substring(this.position, this.position + 2)
      if (["==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/="].includes(twoChar)) {
        this.position += 2
        this.column += 2
        return {
          type: this.getOperatorType(twoChar),
          value: twoChar,
          line: startLine,
          column: startColumn,
        }
      }
    }

    // Operadores y símbolos de un carácter
    if (this.isOperator(char) || this.isPunctuation(char)) {
      this.position++
      this.column++
      return {
        type: this.getSymbolType(char),
        value: char,
        line: startLine,
        column: startColumn,
      }
    }

    // Carácter desconocido
    this.position++
    this.column++
    return {
      type: "UNKNOWN",
      value: char,
      line: startLine,
      column: startColumn,
    }
  }

  private readNumber(startLine: number, startColumn: number): Token {
    let value = ""

    while (this.position < this.input.length && this.isDigit(this.input[this.position])) {
      value += this.input[this.position]
      this.position++
      this.column++
    }

    // Manejar decimales
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

  private readIdentifier(startLine: number, startColumn: number): Token {
    let value = ""

    while (this.position < this.input.length && this.isAlphaNumeric(this.input[this.position])) {
      value += this.input[this.position]
      this.position++
      this.column++
    }

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

  private readString(startLine: number, startColumn: number): Token {
    const quote = this.input[this.position]
    let value = quote
    this.position++
    this.column++

    while (this.position < this.input.length && this.input[this.position] !== quote) {
      if (this.input[this.position] === "\\") {
        value += this.input[this.position]
        this.position++
        this.column++
        if (this.position < this.input.length) {
          value += this.input[this.position]
          this.position++
          this.column++
        }
      } else {
        if (this.input[this.position] === "\n") {
          this.line++
          this.column = 1
        } else {
          this.column++
        }
        value += this.input[this.position]
        this.position++
      }
    }

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

  private skipWhitespace(): void {
    while (this.position < this.input.length) {
      const char = this.input[this.position]

      if (char === " " || char === "\t" || char === "\r") {
        this.position++
        this.column++
      } else if (char === "\n") {
        this.position++
        this.line++
        this.column = 1
      } else if (this.position + 1 < this.input.length) {
        // Comentarios de línea
        if (char === "/" && this.input[this.position + 1] === "/") {
          this.skipLineComment()
        }
        // Comentarios de bloque
        else if (char === "/" && this.input[this.position + 1] === "*") {
          this.skipBlockComment()
        } else {
          break
        }
      } else {
        break
      }
    }
  }

  private skipLineComment(): void {
    while (this.position < this.input.length && this.input[this.position] !== "\n") {
      this.position++
      this.column++
    }
  }

  private skipBlockComment(): void {
    this.position += 2
    this.column += 2

    while (this.position + 1 < this.input.length) {
      if (this.input[this.position] === "*" && this.input[this.position + 1] === "/") {
        this.position += 2
        this.column += 2
        break
      }

      if (this.input[this.position] === "\n") {
        this.line++
        this.column = 1
      } else {
        this.column++
      }
      this.position++
    }
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char)
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char)
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char)
  }

  private isOperator(char: string): boolean {
    return "+-*/%=<>!&|".includes(char)
  }

  private isPunctuation(char: string): boolean {
    return "(){}[];,.".includes(char)
  }

  private getOperatorType(op: string): string {
    if (["==", "!=", "<=", ">="].includes(op)) return "COMPARISON"
    if (["&&", "||"].includes(op)) return "LOGICAL"
    if (["++", "--"].includes(op)) return "INCREMENT"
    if (["+=", "-=", "*=", "/="].includes(op)) return "ASSIGNMENT"
    return "OPERATOR"
  }

  private getSymbolType(char: string): string {
    if ("+-*/%".includes(char)) return "OPERATOR"
    if ("=<>!".includes(char)) return "COMPARISON"
    if ("&|".includes(char)) return "LOGICAL"
    if ("(){}[]".includes(char)) return "BRACKET"
    if (";,.".includes(char)) return "PUNCTUATION"
    return "SYMBOL"
  }
}
