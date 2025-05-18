// Definición de lenguajes de programación con sus gramáticas
export interface ProgrammingLanguage {
  id: string
  name: string
  grammar: string
  description: string
  example: string
  keywords: string[]
  datatypes: string[]
}

export const programmingLanguages: ProgrammingLanguage[] = [
  {
    id: "javascript",
    name: "JavaScript",
    description: "Un lenguaje de programación interpretado de alto nivel",
    keywords: [
      "if",
      "else",
      "for",
      "while",
      "function",
      "return",
      "var",
      "let",
      "const",
      "break",
      "continue",
      "switch",
      "case",
      "default",
      "try",
      "catch",
      "finally",
    ],
    datatypes: ["number", "string", "boolean", "object", "array", "null", "undefined"],
    grammar: `PROGRAM -> STATEMENTS
STATEMENTS -> STATEMENT STATEMENTS | STATEMENT | ε
STATEMENT -> VARIABLE_DECLARATION | FUNCTION_DECLARATION | IF_STATEMENT | WHILE_STATEMENT | FOR_STATEMENT | RETURN_STATEMENT | EXPRESSION_STATEMENT
VARIABLE_DECLARATION -> VAR_KEYWORD IDENTIFIER "=" EXPRESSION ";" | VAR_KEYWORD IDENTIFIER ";"
VAR_KEYWORD -> "var" | "let" | "const"
FUNCTION_DECLARATION -> "function" IDENTIFIER "(" PARAMETER_LIST ")" "{" STATEMENTS "}"
PARAMETER_LIST -> IDENTIFIER "," PARAMETER_LIST | IDENTIFIER | ε
IF_STATEMENT -> "if" "(" EXPRESSION ")" "{" STATEMENTS "}" ELSE_PART
ELSE_PART -> "else" "{" STATEMENTS "}" | ε
WHILE_STATEMENT -> "while" "(" EXPRESSION ")" "{" STATEMENTS "}"
FOR_STATEMENT -> "for" "(" VARIABLE_DECLARATION EXPRESSION ";" EXPRESSION ")" "{" STATEMENTS "}"
RETURN_STATEMENT -> "return" EXPRESSION ";" | "return" ";"
EXPRESSION_STATEMENT -> EXPRESSION ";"
EXPRESSION -> TERM | TERM "+" EXPRESSION | TERM "-" EXPRESSION | TERM "<=" EXPRESSION | TERM ">=" EXPRESSION | TERM "==" EXPRESSION | TERM "!=" EXPRESSION | TERM "<" EXPRESSION | TERM ">" EXPRESSION
TERM -> FACTOR | FACTOR "*" TERM | FACTOR "/" TERM
FACTOR -> NUMBER | STRING | BOOLEAN | IDENTIFIER | FUNCTION_CALL | "(" EXPRESSION ")"
FUNCTION_CALL -> IDENTIFIER "(" ARGUMENT_LIST ")"
ARGUMENT_LIST -> EXPRESSION "," ARGUMENT_LIST | EXPRESSION | ε
NUMBER -> DIGIT NUMBER | DIGIT
DIGIT -> "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
STRING -> '"' CHARACTERS '"' | "'" CHARACTERS "'"
CHARACTERS -> CHARACTER CHARACTERS | ε
CHARACTER -> LETTER | DIGIT | SYMBOL
BOOLEAN -> "true" | "false"
IDENTIFIER -> LETTER ALPHANUMERIC
ALPHANUMERIC -> LETTER ALPHANUMERIC | DIGIT ALPHANUMERIC | ε
LETTER -> "a" | "b" | "c" | ... | "z" | "A" | "B" | "C" | ... | "Z" | "_"
SYMBOL -> "!" | "@" | "#" | "$" | "%" | "^" | "&" | "*" | "(" | ")" | "-" | "+" | "=" | "{" | "}" | "[" | "]" | ":" | ";" | "," | "." | "<" | ">" | "/" | "?" | "|" | "\\" | "~"`,
    example: `function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

var result = factorial(5);
console.log(result);`,
  },
  {
    id: "python",
    name: "Python",
    description: "Un lenguaje de programación interpretado de alto nivel con sintaxis simple",
    keywords: [
      "if",
      "elif",
      "else",
      "for",
      "while",
      "def",
      "return",
      "class",
      "import",
      "from",
      "as",
      "try",
      "except",
      "finally",
      "with",
      "pass",
      "break",
      "continue",
      "print",
    ],
    datatypes: ["int", "float", "str", "bool", "list", "tuple", "dict", "set", "None"],
    grammar: `PROGRAM -> STATEMENTS
STATEMENTS -> STATEMENT STATEMENTS | STATEMENT | ε
STATEMENT -> VARIABLE_ASSIGNMENT | FUNCTION_DEFINITION | IF_STATEMENT | WHILE_STATEMENT | FOR_STATEMENT | RETURN_STATEMENT | EXPRESSION_STATEMENT | PRINT_STATEMENT
VARIABLE_ASSIGNMENT -> IDENTIFIER "=" EXPRESSION
FUNCTION_DEFINITION -> "def" IDENTIFIER "(" PARAMETER_LIST ")" ":" INDENTED_BLOCK
PARAMETER_LIST -> IDENTIFIER "," PARAMETER_LIST | IDENTIFIER | ε
INDENTED_BLOCK -> INDENT STATEMENTS DEDENT
INDENT -> "    "
DEDENT -> ""
IF_STATEMENT -> "if" EXPRESSION ":" INDENTED_BLOCK ELIF_PARTS ELSE_PART
ELIF_PARTS -> ELIF_PART ELIF_PARTS | ε
ELIF_PART -> "elif" EXPRESSION ":" INDENTED_BLOCK
ELSE_PART -> "else" ":" INDENTED_BLOCK | ε
WHILE_STATEMENT -> "while" EXPRESSION ":" INDENTED_BLOCK
FOR_STATEMENT -> "for" IDENTIFIER "in" EXPRESSION ":" INDENTED_BLOCK
RETURN_STATEMENT -> "return" EXPRESSION | "return"
EXPRESSION_STATEMENT -> EXPRESSION
PRINT_STATEMENT -> "print" "(" EXPRESSION ")"
EXPRESSION -> TERM | TERM "+" EXPRESSION | TERM "-" EXPRESSION | TERM "<=" EXPRESSION | TERM ">=" EXPRESSION | TERM "==" EXPRESSION | TERM "!=" EXPRESSION | TERM "<" EXPRESSION | TERM ">" EXPRESSION
TERM -> FACTOR | FACTOR "*" TERM | FACTOR "/" TERM
FACTOR -> NUMBER | STRING | BOOLEAN | IDENTIFIER | FUNCTION_CALL | "(" EXPRESSION ")" | LIST | DICT
FUNCTION_CALL -> IDENTIFIER "(" ARGUMENT_LIST ")"
ARGUMENT_LIST -> EXPRESSION "," ARGUMENT_LIST | EXPRESSION | ε
LIST -> "[" LIST_ITEMS "]"
LIST_ITEMS -> EXPRESSION "," LIST_ITEMS | EXPRESSION | ε
DICT -> "{" DICT_ITEMS "}"
DICT_ITEMS -> EXPRESSION ":" EXPRESSION "," DICT_ITEMS | EXPRESSION ":" EXPRESSION | ε
NUMBER -> DIGIT NUMBER | DIGIT
DIGIT -> "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
STRING -> '"' CHARACTERS '"' | "'" CHARACTERS "'"
CHARACTERS -> CHARACTER CHARACTERS | ε
CHARACTER -> LETTER | DIGIT | SYMBOL
BOOLEAN -> "True" | "False"
IDENTIFIER -> LETTER ALPHANUMERIC
ALPHANUMERIC -> LETTER ALPHANUMERIC | DIGIT ALPHANUMERIC | ε
LETTER -> "a" | "b" | "c" | ... | "z" | "A" | "B" | "C" | ... | "Z" | "_"
SYMBOL -> "!" | "@" | "#" | "$" | "%" | "^" | "&" | "*" | "(" | ")" | "-" | "+" | "=" | "{" | "}" | "[" | "]" | ":" | ";" | "," | "." | "<" | ">" | "/" | "?" | "|" | "\\" | "~"`,
    example: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(5)
print(result)`,
  },
  {
    id: "c",
    name: "C",
    description: "Un lenguaje de programación de propósito general de bajo nivel",
    keywords: [
      "if",
      "else",
      "for",
      "while",
      "do",
      "switch",
      "case",
      "default",
      "break",
      "continue",
      "return",
      "goto",
      "typedef",
      "struct",
      "enum",
      "union",
      "sizeof",
    ],
    datatypes: ["int", "float", "double", "char", "void", "long", "short", "unsigned", "signed"],
    grammar: `PROGRAM -> DECLARATIONS
DECLARATIONS -> DECLARATION DECLARATIONS | DECLARATION | ε
DECLARATION -> FUNCTION_DECLARATION | VARIABLE_DECLARATION
FUNCTION_DECLARATION -> TYPE IDENTIFIER "(" PARAMETER_LIST ")" "{" STATEMENTS "}"
PARAMETER_LIST -> PARAMETER "," PARAMETER_LIST | PARAMETER | ε
PARAMETER -> TYPE IDENTIFIER
VARIABLE_DECLARATION -> TYPE IDENTIFIER ";" | TYPE IDENTIFIER "=" EXPRESSION ";"
TYPE -> "int" | "float" | "double" | "char" | "void" | "long" | "short" | "unsigned" | "signed"
STATEMENTS -> STATEMENT STATEMENTS | STATEMENT | ε
STATEMENT -> VARIABLE_DECLARATION | IF_STATEMENT | WHILE_STATEMENT | FOR_STATEMENT | RETURN_STATEMENT | EXPRESSION_STATEMENT
IF_STATEMENT -> "if" "(" EXPRESSION ")" "{" STATEMENTS "}" ELSE_PART
ELSE_PART -> "else" "{" STATEMENTS "}" | ε
WHILE_STATEMENT -> "while" "(" EXPRESSION ")" "{" STATEMENTS "}"
FOR_STATEMENT -> "for" "(" EXPRESSION ";" EXPRESSION ";" EXPRESSION ")" "{" STATEMENTS "}"
RETURN_STATEMENT -> "return" EXPRESSION ";" | "return" ";"
EXPRESSION_STATEMENT -> EXPRESSION ";"
EXPRESSION -> TERM | TERM "+" EXPRESSION | TERM "-" EXPRESSION | TERM "<=" EXPRESSION | TERM ">=" EXPRESSION | TERM "==" EXPRESSION | TERM "!=" EXPRESSION | TERM "<" EXPRESSION | TERM ">" EXPRESSION
TERM -> FACTOR | FACTOR "*" TERM | FACTOR "/" TERM
FACTOR -> NUMBER | CHARACTER | IDENTIFIER | FUNCTION_CALL | "(" EXPRESSION ")"
FUNCTION_CALL -> IDENTIFIER "(" ARGUMENT_LIST ")"
ARGUMENT_LIST -> EXPRESSION "," ARGUMENT_LIST | EXPRESSION | ε
NUMBER -> DIGIT NUMBER | DIGIT
DIGIT -> "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
CHARACTER -> "'" LETTER "'"
IDENTIFIER -> LETTER ALPHANUMERIC
ALPHANUMERIC -> LETTER ALPHANUMERIC | DIGIT ALPHANUMERIC | ε
LETTER -> "a" | "b" | "c" | ... | "z" | "A" | "B" | "C" | ... | "Z" | "_"`,
    example: `int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    int result = factorial(5);
    printf("%d", result);
    return 0;
}`,
  },
]

// Función para obtener un lenguaje por su ID
export function getLanguageById(id: string): ProgrammingLanguage | undefined {
  return programmingLanguages.find((lang) => lang.id === id)
}

// Function to get all programming languages
export function getProgrammingLanguages(): ProgrammingLanguage[] {
  return programmingLanguages
}
