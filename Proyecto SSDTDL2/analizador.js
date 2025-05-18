import chalk from 'chalk';
import readline from 'readline';

// Clase para representar una gramática
class Grammar {
  constructor() {
    this.productions = new Map();
    this.startSymbol = null;
  }

  // Cargar una gramática desde una cadena de texto
  loadFromString(grammarText) {
    const lines = grammarText.trim().split('\n');
    
    for (const line of lines) {
      if (line.trim() === '' || line.trim().startsWith('//')) continue;
      
      const [left, right] = line.split('->').map(s => s.trim());
      
      if (!this.startSymbol) {
        this.startSymbol = left;
      }
      
      if (!this.productions.has(left)) {
        this.productions.set(left, []);
      }
      
      // Manejar múltiples producciones separadas por |
      const productions = right.split('|').map(p => p.trim());
      for (const prod of productions) {
        // Convertir la producción en un array de símbolos
        const symbols = [];
        let i = 0;
        while (i < prod.length) {
          if (prod[i] === '"' || prod[i] === "'") {
            const quote = prod[i];
            let terminal = '';
            i++;
            while (i < prod.length && prod[i] !== quote) {
              terminal += prod[i];
              i++;
            }
            symbols.push({ type: 'terminal', value: terminal });
            i++;
          } else if (/[A-Z]/.test(prod[i])) {
            let nonTerminal = '';
            while (i < prod.length && /[A-Z0-9_]/.test(prod[i])) {
              nonTerminal += prod[i];
              i++;
            }
            symbols.push({ type: 'nonTerminal', value: nonTerminal });
          } else if (prod[i] === 'ε' || prod[i] === 'ε') {
            symbols.push({ type: 'epsilon', value: 'ε' });
            i++;
          } else if (prod[i] !== ' ') {
            symbols.push({ type: 'terminal', value: prod[i] });
            i++;
          } else {
            i++;
          }
        }
        
        this.productions.get(left).push(symbols);
      }
    }
    
    return this;
  }

  // Mostrar la gramática
  display() {
    console.log(chalk.bold.green('\n=== GRAMÁTICA CARGADA ==='));
    console.log(chalk.yellow(`Símbolo inicial: ${this.startSymbol}`));
    console.log(chalk.yellow('Producciones:'));
    
    for (const [nonTerminal, productions] of this.productions.entries()) {
      let productionsStr = productions.map(prod => {
        return prod.map(symbol => {
          if (symbol.type === 'terminal') {
            return chalk.cyan(`"${symbol.value}"`);
          } else if (symbol.type === 'nonTerminal') {
            return chalk.magenta(symbol.value);
          } else if (symbol.type === 'epsilon') {
            return chalk.gray('ε');
          }
        }).join(' ');
      }).join(chalk.gray(' | '));
      
      console.log(`${chalk.magenta(nonTerminal)} ${chalk.gray('->')} ${productionsStr}`);
    }
    console.log();
  }
}

// Clase para el análisis recursivo descendente
class RecursiveDescentParser {
  constructor(grammar) {
    this.grammar = grammar;
    this.input = '';
    this.position = 0;
    this.steps = [];
    this.treeNodes = [];
    this.nodeId = 0;
  }

  // Establecer el texto de entrada
  setInput(input) {
    this.input = input;
    this.position = 0;
    this.steps = [];
    this.treeNodes = [];
    this.nodeId = 0;
  }

  // Analizar el texto según la gramática
  parse() {
    const startSymbol = this.grammar.startSymbol;
    const result = this.parseNonTerminal(startSymbol, 0);
    
    if (result.success && result.position === this.input.length) {
      return {
        success: true,
        tree: this.buildTree(),
        steps: this.steps
      };
    } else {
      return {
        success: false,
        error: `Error de análisis en la posición ${result.position}`,
        expectedSymbol: result.expected,
        steps: this.steps
      };
    }
  }

  // Analizar un símbolo no terminal
  parseNonTerminal(nonTerminal, level) {
    const indent = '  '.repeat(level);
    this.steps.push(`${indent}Intentando analizar ${chalk.magenta(nonTerminal)} en posición ${this.position}`);
    
    const nodeId = this.nodeId++;
    const node = {
      id: nodeId,
      label: nonTerminal,
      type: 'nonTerminal',
      children: []
    };
    
    if (!this.grammar.productions.has(nonTerminal)) {
      this.steps.push(`${indent}${chalk.red(`Error: No hay producciones para ${nonTerminal}`)}`);
      return { success: false, position: this.position, expected: nonTerminal };
    }
    
    const productions = this.grammar.productions.get(nonTerminal);
    const originalPosition = this.position;
    
    for (const production of productions) {
      this.steps.push(`${indent}Probando producción: ${chalk.magenta(nonTerminal)} ${chalk.gray('->')} ${this.formatProduction(production)}`);
      
      const childNodes = [];
      let success = true;
      this.position = originalPosition;
      
      for (const symbol of production) {
        if (symbol.type === 'terminal') {
          const result = this.parseTerminal(symbol.value, level + 1);
          if (!result.success) {
            success = false;
            break;
          }
          childNodes.push({
            id: this.nodeId++,
            label: symbol.value,
            type: 'terminal'
          });
        } else if (symbol.type === 'nonTerminal') {
          const result = this.parseNonTerminal(symbol.value, level + 1);
          if (!result.success) {
            success = false;
            break;
          }
          childNodes.push(this.treeNodes[result.nodeId]);
        } else if (symbol.type === 'epsilon') {
          this.steps.push(`${indent}  Consumiendo epsilon (ε)`);
          childNodes.push({
            id: this.nodeId++,
            label: 'ε',
            type: 'epsilon'
          });
        }
      }
      
      if (success) {
        this.steps.push(`${indent}${chalk.green(`Éxito al analizar ${nonTerminal} hasta la posición ${this.position}`)}`);
        node.children = childNodes;
        this.treeNodes[nodeId] = node;
        return { success: true, position: this.position, nodeId };
      } else {
        this.steps.push(`${indent}${chalk.yellow(`Fallo con la producción, probando otra alternativa...`)}`);
      }
    }
    
    this.steps.push(`${indent}${chalk.red(`No se pudo analizar ${nonTerminal} en la posición ${originalPosition}`)}`);
    return { success: false, position: originalPosition, expected: nonTerminal };
  }

  // Analizar un símbolo terminal
  parseTerminal(terminal, level) {
    const indent = '  '.repeat(level);
    this.steps.push(`${indent}Esperando terminal "${chalk.cyan(terminal)}" en posición ${this.position}`);
    
    if (this.position >= this.input.length) {
      this.steps.push(`${indent}${chalk.red(`Error: Fin de entrada inesperado, esperaba "${terminal}"`)}`);
      return { success: false, position: this.position, expected: terminal };
    }
    
    const inputSubstring = this.input.substring(this.position, this.position + terminal.length);
    
    if (inputSubstring === terminal) {
      this.position += terminal.length;
      this.steps.push(`${indent}${chalk.green(`Consumido "${terminal}" correctamente, nueva posición: ${this.position}`)}`);
      return { success: true, position: this.position };
    } else {
      this.steps.push(`${indent}${chalk.red(`Error: Esperaba "${terminal}", encontró "${inputSubstring}"`)}`);
      return { success: false, position: this.position, expected: terminal };
    }
  }

  // Formatear una producción para mostrarla
  formatProduction(production) {
    return production.map(symbol => {
      if (symbol.type === 'terminal') {
        return chalk.cyan(`"${symbol.value}"`);
      } else if (symbol.type === 'nonTerminal') {
        return chalk.magenta(symbol.value);
      } else if (symbol.type === 'epsilon') {
        return chalk.gray('ε');
      }
    }).join(' ');
  }

  // Construir el árbol de derivación
  buildTree() {
    if (this.treeNodes.length === 0) return null;
    return this.treeNodes[0];
  }

  // Mostrar el árbol de derivación
  displayTree(node = null, prefix = '', isLast = true) {
    if (node === null) {
      if (this.treeNodes.length === 0) {
        console.log(chalk.red('No hay árbol de derivación disponible.'));
        return;
      }
      node = this.treeNodes[0];
      console.log(chalk.bold.green('\n=== ÁRBOL DE DERIVACIÓN ===\n'));
    }
    
    const connector = isLast ? '└── ' : '├── ';
    const nodeColor = node.type === 'terminal' ? chalk.cyan : 
                     node.type === 'nonTerminal' ? chalk.magenta : 
                     chalk.gray;
    
    console.log(`${prefix}${connector}${nodeColor(node.label)}`);
    
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const isLastChild = i === node.children.length - 1;
        this.displayTree(node.children[i], childPrefix, isLastChild);
      }
    }
  }

  // Mostrar los pasos del análisis
  displaySteps() {
    console.log(chalk.bold.green('\n=== PASOS DEL ANÁLISIS ===\n'));
    for (const step of this.steps) {
      console.log(step);
    }
  }
}

// Función principal para ejecutar el programa
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log(chalk.bold.blue('=== ANALIZADOR DE GRAMÁTICAS Y TEXTOS ==='));
  console.log(chalk.blue('Este programa analiza si un texto pertenece a un lenguaje definido por una gramática.'));
  console.log(chalk.blue('Primero, debes ingresar la gramática en formato BNF simplificado.'));
  console.log(chalk.blue('Ejemplo:'));
  console.log(chalk.gray('S -> A B'));
  console.log(chalk.gray('A -> "a" A | "a"'));
  console.log(chalk.gray('B -> "b" B | "b"'));
  console.log(chalk.blue('Esto define un lenguaje de una o más "a" seguidas de una o más "b".'));
  console.log();

  // Ejemplo de gramática predefinida
  const exampleGrammar = `S -> A B
A -> "a" A | "a"
B -> "b" B | "b"`;

  console.log(chalk.yellow('¿Deseas usar la gramática de ejemplo? (s/n)'));
  let useExample = await question('> ');
  
  let grammarText;
  if (useExample.toLowerCase() === 's') {
    grammarText = exampleGrammar;
    console.log(chalk.green('Usando gramática de ejemplo:'));
    console.log(chalk.gray(grammarText));
  } else {
    console.log(chalk.yellow('Ingresa tu gramática línea por línea. Termina con una línea vacía:'));
    let line;
    grammarText = '';
    while ((line = await question('> ')) !== '') {
      grammarText += line + '\n';
    }
  }

  // Cargar la gramática
  const grammar = new Grammar().loadFromString(grammarText);
  grammar.display();

  // Solicitar texto para analizar
  console.log(chalk.yellow('Ingresa el texto a analizar:'));
  const inputText = await question('> ');

  // Analizar el texto
  const parser = new RecursiveDescentParser(grammar);
  parser.setInput(inputText);
  const result = parser.parse();

  // Mostrar resultados
  parser.displaySteps();
  
  if (result.success) {
    console.log(chalk.bold.green('\n=== RESULTADO DEL ANÁLISIS ==='));
    console.log(chalk.green(`El texto "${inputText}" pertenece al lenguaje definido por la gramática.`));
    parser.displayTree();
  } else {
    console.log(chalk.bold.red('\n=== RESULTADO DEL ANÁLISIS ==='));
    console.log(chalk.red(`El texto "${inputText}" NO pertenece al lenguaje definido por la gramática.`));
    console.log(chalk.red(`Error: ${result.error}`));
  }

  rl.close();
}

// Ejecutar el programa
main().catch(console.error);
