// Clase principal del Analizador
class LanguageAnalyzer {
  constructor() {
    this.grammar = null;
    this.currentLanguage = null;
    this.predefinedGrammars = {
      'c': this.createCGrammar(),
      'java': this.createJavaGrammar(),
      'python': this.createPythonGrammar()
    };
  }

  // Gramáticas predefinidas
  createCGrammar() {
    return {
      "PROGRAM": [["DECLARATION", "PROGRAM"], []],
      "DECLARATION": [["TYPE", "IDENTIFIER", ";"]],
      "TYPE": [["int"], ["float"], ["char"]]
    };
  }

  createJavaGrammar() {
    return {
      "CLASS": [["class", "IDENTIFIER", "{", "MEMBERS", "}"]],
      "MEMBERS": [["FIELD", "MEMBERS"], ["METHOD", "MEMBERS"], []],
      "FIELD": [["MODIFIER", "TYPE", "IDENTIFIER", ";"]]
    };
  }

  createPythonGrammar() {
    return {
      "STMT": [["EXPR", "NEWLINE"], ["if", "EXPR", ":", "SUITE"]],
      "SUITE": [["NEWLINE", "INDENT", "STMTS", "DEDENT"]]
    };
  }

  // Analizar código
  analyze(code) {
    if (!this.grammar) {
      throw new Error("No se ha cargado ninguna gramática");
    }

    const tokens = this.tokenize(code);
    const { ast, errors } = this.parse(tokens);
    
    return {
      tokens,
      ast,
      errors,
      steps: this.analysisSteps
    };
  }

  // Tokenización
  tokenize(code) {
    const tokenSpec = [
      // Tipos de tokens comunes
      [/\/\/.*/, "COMMENT"],
      [/\/\*[\s\S]*?\*\//, "MULTILINE_COMMENT"],
      [/\b(int|float|char|void|if|else|while|for|return)\b/, "KEYWORD"],
      [/\b\d+\b/, "NUMBER"],
      [/"[^"]*"/, "STRING"],
      /['][^']*[']/, "CHAR"],
      [/[a-zA-Z_]\w*/, "IDENTIFIER"],
      [/[+\-*/=<>!&|^%]/, "OPERATOR"],
      [/[();{},.:[\]]/, "SYMBOL"],
      [/\s+/, "WHITESPACE"]
    ];

    const tokens = [];
    let remainingCode = code;
    let position = 0;

    while (remainingCode.length > 0) {
      let matched = false;

      for (const [pattern, type] of tokenSpec) {
        const regex = new RegExp(`^${pattern.source || pattern}`);
        const match = regex.exec(remainingCode);

        if (match) {
          if (type !== "WHITESPACE") {
            tokens.push({
              type,
              value: match[0],
              position: position + match.index,
              line: this.getLineNumber(code, position + match.index)
            });
          }

          remainingCode = remainingCode.slice(match[0].length);
          position += match[0].length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        throw new Error(`Token desconocido: ${remainingCode[0]}`);
      }
    }

    return tokens;
  }

  // Análisis sintáctico
  parse(tokens) {
    this.analysisSteps = [];
    const errors = [];
    let currentIndex = 0;

    const parseNonTerminal = (nonTerminal) => {
      this.analysisSteps.push(`Procesando ${nonTerminal}`);
      
      for (const production of this.grammar[nonTerminal]) {
        const savedIndex = currentIndex;
        const children = [];
        let match = true;

        for (const symbol of production) {
          if (this.grammar[symbol]) {
            // Es un no terminal
            const result = parseNonTerminal(symbol);
            if (!result) {
              match = false;
              break;
            }
            children.push(result);
          } else {
            // Es un terminal
            if (currentIndex >= tokens.length || 
                tokens[currentIndex].value !== symbol && 
                tokens[currentIndex].type !== symbol) {
              match = false;
              break;
            }
            children.push({
              type: "TERMINAL",
              value: tokens[currentIndex].value,
              tokenType: tokens[currentIndex].type
            });
            currentIndex++;
          }
        }

        if (match) {
          return {
            type: nonTerminal,
            children
          };
        }

        currentIndex = savedIndex;
      }

      return null;
    };

    try {
      const ast = parseNonTerminal(Object.keys(this.grammar)[0]);
      
      if (!ast || currentIndex < tokens.length) {
        errors.push(`Error de sintaxis cerca de: ${tokens[currentIndex]?.value}`);
      }

      return {
        ast: ast || { type: "ERROR", children: [] },
        errors
      };
    } catch (error) {
      return {
        ast: null,
        errors: [error.message]
      };
    }
  }

  // Helper para número de línea
  getLineNumber(code, position) {
    return code.substring(0, position).split('\n').length;
  }

  // Cargar gramática personalizada
  loadCustomGrammar(grammarText) {
    const lines = grammarText.split('\n').filter(line => line.trim());
    const grammar = {};

    for (const line of lines) {
      const [left, right] = line.split('->').map(part => part.trim());
      
      if (!left || !right) {
        throw new Error(`Formato inválido en gramática: ${line}`);
      }

      const productions = right.split('|').map(prod => 
        prod.trim().split(/\s+/).filter(s => s)
      );

      grammar[left] = productions;
    }

    this.grammar = grammar;
    return grammar;
  }
}

// UI Controller
class UIController {
  constructor() {
    this.analyzer = new LanguageAnalyzer();
    this.initElements();
    this.setupEventListeners();
  }

  initElements() {
    this.elements = {
      // Secciones
      lenguaje: document.getElementById("seccion-lenguaje"),
      codigo: document.getElementById("seccion-codigo"),
      resultados: document.getElementById("seccion-resultados"),
      
      // Botones
      btnLenguaje: document.getElementById("btn-lenguaje"),
      btnCodigo: document.getElementById("btn-codigo"),
      btnResultados: document.getElementById("btn-resultados"),
      
      // Inputs
      selectorLenguaje: document.getElementById("selector-lenguaje"),
      gramaticaTextarea: document.getElementById("gramatica-textarea"),
      codigoInput: document.getElementById("codigo-input"),
      
      // Botones de acción
      cargarGramatica: document.getElementById("cargar-gramatica"),
      ejemploGramatica: document.getElementById("ejemplo-gramatica"),
      ejemploCodigo: document.getElementById("ejemplo-codigo"),
      analizarCodigo: document.getElementById("analizar-codigo"),
      
      // Resultados
      errores: document.getElementById("errores"),
      tokens: document.getElementById("tokens"),
      arbolDerivacion: document.getElementById("arbol-derivacion"),
      pasosAnalisis: document.getElementById("pasos-analisis"),
      gramaticaContainer: document.getElementById("gramatica-container")
    };
  }

  setupEventListeners() {
    // Navegación entre pestañas
    this.elements.btnLenguaje.addEventListener("click", () => this.showSection("lenguaje"));
    this.elements.btnCodigo.addEventListener("click", () => this.showSection("codigo"));
    this.elements.btnResultados.addEventListener("click", () => this.showSection("resultados"));

    // Selector de lenguaje
    this.elements.selectorLenguaje.addEventListener("change", (e) => {
      if (e.target.value === "custom") {
        this.elements.gramaticaContainer.classList.remove("hidden");
      } else {
        this.elements.gramaticaContainer.classList.add("hidden");
        this.analyzer.grammar = this.analyzer.predefinedGrammars[e.target.value];
        this.analyzer.currentLanguage = e.target.value;
      }
    });

    // Ejemplo de gramática
    this.elements.ejemploGramatica.addEventListener("click", () => {
      this.elements.gramaticaTextarea.value = `E -> E + T | T
T -> T * F | F
F -> ( E ) | id`;
    });

    // Ejemplo de código
    this.elements.ejemploCodigo.addEventListener("click", () => {
      if (this.analyzer.currentLanguage === "c") {
        this.elements.codigoInput.value = `int main() {
  int x = 5;
  return x * 2;
}`;
      } else if (this.analyzer.currentLanguage === "java") {
        this.elements.codigoInput.value = `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello");
  }
}`;
      } else {
        this.elements.codigoInput.value = `def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)`;
      }
    });

    // Cargar gramática
    this.elements.cargarGramatica.addEventListener("click", () => {
      try {
        this.analyzer.loadCustomGrammar(this.elements.gramaticaTextarea.value);
        this.showSection("codigo");
        this.showMessage("Gramática cargada correctamente", "success");
      } catch (error) {
        this.showMessage(`Error en gramática: ${error.message}`, "error");
      }
    });

    // Analizar código
    this.elements.analizarCodigo.addEventListener("click", () => {
      try {
        const result = this.analyzer.analyze(this.elements.codigoInput.value);
        this.displayResults(result);
        this.showSection("resultados");
      } catch (error) {
        this.showMessage(`Error de análisis: ${error.message}`, "error");
      }
    });
  }

  showSection(section) {
    // Ocultar todas las secciones
    this.elements.lenguaje.classList.remove("visible");
    this.elements.codigo.classList.remove("visible");
    this.elements.resultados.classList.remove("visible");
    
    // Desactivar todos los botones
    this.elements.btnLenguaje.classList.remove("active");
    this.elements.btnCodigo.classList.remove("active");
    this.elements.btnResultados.classList.remove("active");
    
    // Mostrar sección seleccionada
    this.elements[section].classList.add("visible");
    this.elements[`btn${section.charAt(0).toUpperCase() + section.slice(1)}`].classList.add("active");
  }

  displayResults(result) {
    // Mostrar tokens
    this.elements.tokens.innerHTML = result.tokens
      .filter(token => token.type !== "WHITESPACE")
      .map(token => `<span class="token" data-line="${token.line}">${token.value} <small>(${token.type})</small></span>`)
      .join("");
    
    // Mostrar errores
    this.elements.errores.innerHTML = result.errors.length > 0
      ? result.errors.map(err => `<div class="error">❌ ${err}</div>`).join("")
      : `<div class="success">✓ El código se analizó correctamente</div>`;
    
    // Mostrar árbol de derivación
    this.elements.arbolDerivacion.textContent = JSON.stringify(result.ast, null, 2);
    
    // Mostrar pasos
    this.elements.pasosAnalisis.textContent = result.steps.join("\n");
  }

  showMessage(message, type) {
    const alert = document.createElement("div");
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
  }
}

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", () => {
  new UIController();
});