import re

class ElementoPila:
    def __init__(self, valor):
        self.valor = valor
    
    def __str__(self):
        return str(self.valor)

class Terminal(ElementoPila):
    def __init__(self, valor):
        super().__init__(valor)
    
    def __str__(self):
        return f"Terminal({self.valor})"

class NoTerminal(ElementoPila):
    def __init__(self, valor):
        super().__init__(valor)
    
    def __str__(self):
        return f"NoTerminal({self.valor})"

class Estado(ElementoPila):
    def __init__(self, estado):
        super().__init__(estado)
    
    def __str__(self):
        return f"Estado({self.valor})"

class LRParser:
    def __init__(self, parsing_table):
        self.parsing_table = parsing_table
        self.stack = [Estado(0)]
    
    def mostrar_pila(self):
        return " | ".join(str(item) for item in self.stack)

    def parse(self, tokens):
        tokens.append(Terminal("$"))
        index = 0
        
        print(f"{'Estado':<10} {'Token':<15} {'Pila':<40} {'Accion':<10}")
        print("=" * 80)
        
        while True:
            state = self.stack[-1]
            token = tokens[index] if index < len(tokens) else Terminal("$")
            
            pila_str = self.mostrar_pila()
            print(f"{str(state):<10} {str(token):<15} {pila_str:<40}", end="")

            if token.valor not in self.parsing_table.get(state.valor, {}):
                print(" Error: Token inesperado")
                return False
            
            action = self.parsing_table[state.valor][token.valor]
            print(f"{action:<10}")

            if action.startswith("d"):  
                self.stack.append(Estado(int(action[1:])))
                index += 1
            elif action == "r0 (acept)": 
                print("\nCadena aceptada")
                return True
            elif action.startswith("r"):
                rule_number = int(action[1:].split()[0])
                pop_count = 3 if rule_number == 1 else 1
                
                for _ in range(pop_count):
                    self.stack.pop()
                
                new_state = self.stack[-1]
                if "E" in self.parsing_table[new_state.valor]:
                    self.stack.append(Estado(int(self.parsing_table[new_state.valor]["E"])))
                else:
                    print("Error: No se puede reducir")
                    return False
            else:
                print("Error: Accion no reconocida")
                return False
        
        return False

def tokenize(expression):
    tokens = re.findall(r'[a-zA-Z]+|\+|\$', expression)
    return [Terminal("id") if re.match(r'^[a-zA-Z]+$', token) else Terminal(token) for token in tokens]

parsing_table = {
    0: {"id": "d2", "+": "", "$": "", "E": "1"},
    1: {"$": "r0 (acept)"},
    2: {"+": "d3", "$": "r2"},
    3: {"id": "d4", "E": "4"},
    4: {"+": "", "$": "r1", "E": "1"}
}

def main():
    expression = input("Entrada: ")
    tokens = tokenize(expression)
    print(f"Tokens generados: {tokens}")
    
    parser = LRParser(parsing_table)
    print(f"{expression}: {'Aceptado' if parser.parse(tokens) else 'Rechazado'}")

if __name__ == "__main__":
    main()