import re

class LRParser:
    def __init__(self, parsing_table):
        self.parsing_table = parsing_table
        self.stack = [0]
    
    def parse(self, tokens):
        tokens.append("$")
        index = 0
        
        while True:
            state = self.stack[-1]
            token = tokens[index] if index < len(tokens) else "$"
            
            print(f"Estado actual: {state}, Token: {token}, Pila: {self.stack}")
            
            if token not in self.parsing_table[state]:
                print("Error: Token inesperado")
                return False
            
            action = self.parsing_table[state][token]
            print(f"Acción: {action}")
            
            if action.startswith("d"):
                self.stack.append(int(action[1:]))
                index += 1
            elif action == "r0 (acept)":
                print("Cadena aceptada")
                return True
            elif action.startswith("r"):
                rule_number = int(action[1:].split()[0]) 
                
                if rule_number == 1:
                    pop_count = 3
                elif rule_number == 2:
                    pop_count = 1
                else:
                    print("Error: Regla no reconocida")
                    return False
                
                for _ in range(pop_count):
                    self.stack.pop()
                
                new_state = self.stack[-1]
                if "E" in self.parsing_table[new_state]:
                    self.stack.append(int(self.parsing_table[new_state]["E"]))
                    print(f"Reducción aplicada, nueva pila: {self.stack}")
                else:
                    print("Error: No hay transición válida después de reducir")
                    return False
            else:
                print("Error: Acción no reconocida")
                return False


parsing_table_1 = {
    0: {"id": "d2", "+": "", "$": "", "E": "1"},
    1: {"$": "r0 (acept)"},
    2: {"+": "d3", "$": "r2"},
    3: {"id": "d4", "E": "4"},
    4: {"+": "", "$": "r1", "E": "1"}
}

parsing_table_2 = {
    0: {"id": "d2", "+": "", "$": "", "E": "1"},
    1: {"$": "r0 (acept)"},
    2: {"+": "d3", "$": "r2"},
    3: {"id": "d2", "E": "4"},
    4: {"+": "", "$": "r1", "E": "1"}
}

def tokenize(expression):
    tokens = re.findall(r'[a-zA-Z]+|\+|\$', expression)
    return ["id" if re.match(r'^[a-zA-Z]+$', token) else token for token in tokens]

parser = LRParser(parsing_table_2)

expression = input("Ingrese la expresión: ")
tokens = tokenize(expression)
print(f"Tokens generados: {tokens}")

print(f"{expression}: {'Aceptado' if parser.parse(tokens) else 'Rechazado'}")