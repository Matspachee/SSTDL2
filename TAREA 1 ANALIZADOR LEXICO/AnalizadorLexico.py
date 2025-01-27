class Lexer:
    def __init__(self):
        pass

    def analyze_token(self, token):
        state = 0  # Estado inicial identificado con el número 0
        for char in token:
            if state == 0:  # Estado inicial
                if char.isdigit():
                    state = 1  # Estado para números enteros
                elif char.isalpha() or char == "_":
                    state = 3  # Estado para identificadores
                elif char == ".":
                    state = 5  # Estado de error inmediato
                else:
                    state = 5  # Estado de error
            elif state == 1:  # Estado para números enteros
                if char.isdigit():
                    state = 1
                elif char == ".":
                    state = 2  # Posible número flotante
                else:
                    state = 5  # Estado de error
            elif state == 2:  # Estado para números flotantes
                if char.isdigit():
                    state = 2
                else:
                    state = 5  # Estado de error
            elif state == 3:  # Estado para identificadores
                if char.isalnum() or char == "_":
                    state = 3
                else:
                    state = 5  # Estado de error
            elif state == 5:  # Estado de error
                break

        # Determina el tipo final según el estado alcanzado
        if state == 1:
            return f"{token} = INT"
        elif state == 2:
            return f"{token} = FLOAT"
        elif state == 3:
            return f"{token} = ID"
        else:
            return f"{token} = ERROR"

    def lexical_analyzer(self, input_string):
        tokens = input_string.split()
        results = [self.analyze_token(token) for token in tokens]
        return results

# Prueba del analizador
if __name__ == "__main__":
    lexer = Lexer()
    test_cases = "10 10.1 .5 0. hola _hola 3hola"
    results = lexer.lexical_analyzer(test_cases)
    for result in results:
        print(result)