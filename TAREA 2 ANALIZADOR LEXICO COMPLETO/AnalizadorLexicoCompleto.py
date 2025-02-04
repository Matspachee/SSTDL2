class Lexer:
    def __init__(self):
        self.keywords = {"int": 4, "float": 4, "void": 4, "if": 19, "while": 20, "return": 21, "else": 22}
        self.symbols = {"+": 5, "-": 5, "*": 6, "/": 6, "<": 7, "<=": 7, ">": 7, ">=": 7,
                       "||": 8, "&&": 9, "!": 10, "==": 11, "!=": 11, ";": 12, ",": 13,
                       "(": 14, ")": 15, "{": 16, "}": 17, "=": 18, "$": 23}
        self.token_descriptions = {
            0: "Identificador",
            1: "Entero",
            2: "Real",
            3: "Cadena",
            4: "Tipo",
            5: "Operador Suma",
            6: "Operador Multiplicación",
            7: "Operador Relacional",
            8: "Operador OR",
            9: "Operador AND",
            10: "Operador NOT",
            11: "Operador Igualdad",
            12: "Punto y coma",
            13: "Coma",
            14: "Paréntesis izquierdo",
            15: "Paréntesis derecho",
            16: "Llave izquierda",
            17: "Llave derecha",
            18: "Asignación",
            19: "Palabra reservada IF",
            20: "Palabra reservada WHILE",
            21: "Palabra reservada RETURN",
            22: "Palabra reservada ELSE",
            23: "Fin de entrada"
        }
    
    def analyze_token(self, token):
        if token in self.symbols:
            return (token, self.symbols[token])
        if token in self.keywords:
            return (token, self.keywords[token])
        
        state = 0
        has_decimal = False
        
        for i, char in enumerate(token):
            if state == 0:
                if char.isalpha() or char == "_":
                    state = 1
                elif char.isdigit():
                    state = 2
                elif char == '"':
                    state = 4
                else:
                    return (token, "ERROR")
            elif state == 1:
                if not (char.isalnum() or char == "_"):
                    return (token, "ERROR")
            elif state == 2:
                if char == ".":
                    if has_decimal or i == len(token) - 1:
                        return (token, "ERROR")
                    has_decimal = True
                    state = 3
                elif not char.isdigit():
                    return (token, "ERROR")
            elif state == 3:
                if not char.isdigit():
                    return (token, "ERROR")
            elif state == 4:
                if char == '"' and i == len(token) - 1:
                    return (token, 3)
        
        if state == 1:
            return (token, 0)
        elif state == 2:
            return (token, 1)
        elif state == 3:
            return (token, 2)
        else:
            return (token, "ERROR")
    
    def lexical_analyzer(self, input_string):
        tokens = []
        token = ""
        i = 0
        while i < len(input_string):
            char = input_string[i]
            
            if char.isspace():
                if token:
                    tokens.append(token)
                    token = ""
            elif char in self.symbols:
                if token:
                    tokens.append(token)
                    token = ""
                if i + 1 < len(input_string) and input_string[i:i+2] in self.symbols:
                    tokens.append(input_string[i:i+2])
                    i += 1
                else:
                    tokens.append(char)
            else:
                token += char
            
            i += 1
        
        if token:
            tokens.append(token)
        
        results = [self.analyze_token(token) for token in tokens]
        return results
    
    def print_table(self, results):
        print("{:<15} {:<10} {:<20}".format("TOKEN", "TYPE", "DESCRIPTION"))
        print("-" * 50)
        for token, token_type in results:
            description = self.token_descriptions.get(token_type, "ERROR")
            print("{:<15} {:<10} {:<20}".format(token, token_type, description))

# Prueba del analizador
if __name__ == "__main__":
    lexer = Lexer()
    test_cases = 'int x = 10; float y = 10.5; string s = "hello"; if (x >= 5) { return 20; } else { return y + 1.0; }'
    results = lexer.lexical_analyzer(test_cases)
    lexer.print_table(results)