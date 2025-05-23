export interface ProgrammingLanguage {
  id: string
  name: string
  keywords: string[]
  datatypes: string[]
  grammar: string
  example: string
  description: string
}

export const programmingLanguages: ProgrammingLanguage[] = [
  {
    id: "c",
    name: "C",
    keywords: ["if", "else", "while", "for", "return", "int", "float", "char", "void", "main"],
    datatypes: ["int", "float", "char", "void", "double", "long", "short"],
    grammar: `PROGRAM -> FUNCTION_LIST
FUNCTION_LIST -> FUNCTION FUNCTION_LIST | FUNCTION
FUNCTION -> DATATYPE IDENTIFIER "(" PARAMETER_LIST ")" "{" STATEMENT_LIST "}"
PARAMETER_LIST -> PARAMETER "," PARAMETER_LIST | PARAMETER | ε
PARAMETER -> DATATYPE IDENTIFIER
STATEMENT_LIST -> STATEMENT STATEMENT_LIST | STATEMENT | ε
STATEMENT -> DECLARATION | ASSIGNMENT | FUNCTION_CALL ";" | RETURN_STATEMENT | IF_STATEMENT
DECLARATION -> DATATYPE IDENTIFIER ";"
ASSIGNMENT -> IDENTIFIER "=" EXPRESSION ";"
FUNCTION_CALL -> IDENTIFIER "(" ARGUMENT_LIST ")"
ARGUMENT_LIST -> EXPRESSION "," ARGUMENT_LIST | EXPRESSION | ε
RETURN_STATEMENT -> "return" EXPRESSION ";"
IF_STATEMENT -> "if" "(" EXPRESSION ")" "{" STATEMENT_LIST "}"
EXPRESSION -> TERM "+" EXPRESSION | TERM "-" EXPRESSION | TERM
TERM -> FACTOR "*" TERM | FACTOR "/" TERM | FACTOR
FACTOR -> IDENTIFIER | NUMBER | "(" EXPRESSION ")" | FUNCTION_CALL
DATATYPE -> "int" | "float" | "char" | "void"`,
    example: `int suma(int x, int y) {
    int resultado;
    resultado = x + y;
    return resultado;
}

int main() {
    int a;
    int b;
    int total;
    
    a = 5;
    b = 10;
    total = suma(a, b);
    
    return 0;
}`,
    description: "Lenguaje de programación C con sintaxis básica",
  },
  {
    id: "javascript",
    name: "JavaScript",
    keywords: ["function", "var", "let", "const", "if", "else", "while", "for", "return"],
    datatypes: ["number", "string", "boolean", "object", "undefined"],
    grammar: `PROGRAM -> STATEMENT_LIST
STATEMENT_LIST -> STATEMENT STATEMENT_LIST | STATEMENT
STATEMENT -> VARIABLE_DECLARATION | FUNCTION_DECLARATION | ASSIGNMENT | FUNCTION_CALL ";"
VARIABLE_DECLARATION -> VAR_KEYWORD IDENTIFIER "=" EXPRESSION ";"
VAR_KEYWORD -> "var" | "let" | "const"
FUNCTION_DECLARATION -> "function" IDENTIFIER "(" PARAMETER_LIST ")" "{" STATEMENT_LIST "}"
PARAMETER_LIST -> IDENTIFIER "," PARAMETER_LIST | IDENTIFIER | ε
ASSIGNMENT -> IDENTIFIER "=" EXPRESSION ";"
FUNCTION_CALL -> IDENTIFIER "(" ARGUMENT_LIST ")"
ARGUMENT_LIST -> EXPRESSION "," ARGUMENT_LIST | EXPRESSION | ε
EXPRESSION -> TERM "+" EXPRESSION | TERM "-" EXPRESSION | TERM
TERM -> FACTOR "*" TERM | FACTOR "/" TERM | FACTOR
FACTOR -> IDENTIFIER | NUMBER | STRING | "(" EXPRESSION ")"`,
    example: `function suma(a, b) {
    return a + b;
}

let x = 5;
let y = 10;
let resultado = suma(x, y);`,
    description: "JavaScript con declaraciones de variables y funciones",
  },
  {
    id: "python",
    name: "Python",
    keywords: ["def", "if", "else", "while", "for", "return", "and", "or", "not"],
    datatypes: ["int", "float", "str", "bool", "list", "dict"],
    grammar: `PROGRAM -> STATEMENT_LIST
STATEMENT_LIST -> STATEMENT STATEMENT_LIST | STATEMENT
STATEMENT -> FUNCTION_DEFINITION | ASSIGNMENT | FUNCTION_CALL
FUNCTION_DEFINITION -> "def" IDENTIFIER "(" PARAMETER_LIST ")" ":" INDENTED_BLOCK
PARAMETER_LIST -> IDENTIFIER "," PARAMETER_LIST | IDENTIFIER | ε
INDENTED_BLOCK -> STATEMENT_LIST
ASSIGNMENT -> IDENTIFIER "=" EXPRESSION
FUNCTION_CALL -> IDENTIFIER "(" ARGUMENT_LIST ")"
ARGUMENT_LIST -> EXPRESSION "," ARGUMENT_LIST | EXPRESSION | ε
EXPRESSION -> TERM "+" EXPRESSION | TERM "-" EXPRESSION | TERM
TERM -> FACTOR "*" TERM | FACTOR "/" TERM | FACTOR
FACTOR -> IDENTIFIER | NUMBER | STRING | "(" EXPRESSION ")"`,
    example: `def factorial(n):
    if n <= 1:
        return 1
    else:
        return n * factorial(n - 1)

resultado = factorial(5)`,
    description: "Python con definiciones de funciones y recursión",
  },
]

export function getLanguageById(id: string): ProgrammingLanguage | null {
  return programmingLanguages.find((lang) => lang.id === id) || null
}

export function getAllLanguages(): ProgrammingLanguage[] {
  return programmingLanguages
}

export function getProgrammingLanguages(): ProgrammingLanguage[] {
  return programmingLanguages
}
