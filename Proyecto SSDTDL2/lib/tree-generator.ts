import type { Grammar } from "./parser"
import type { Token } from "./lexer"
import type { TreeNode } from "./parser-enhanced"
import type { StackItem } from "./parser-enhanced"

// Asegurarse de que TreeGenerator pueda manejar el formato de árbol de RecursiveDescentParser
export class TreeGenerator {
  grammar: Grammar
  tokens: Token[]
  nodeId = 0

  constructor(grammar: Grammar, tokens: Token[]) {
    this.grammar = grammar
    this.tokens = tokens
  }

  /**
   * Genera un árbol de derivación y pilas a partir de los tokens
   */
  generate() {
    // Crear pilas de entrada y salida
    const inputStack: StackItem[] = []
    const outputStack: StackItem[] = []

    // Historial de pilas
    const stackHistory: Array<{
      input: StackItem[]
      output: StackItem[]
      action: string
    }> = []

    // Añadir tokens a la pila de entrada
    this.tokens.forEach((token) => {
      inputStack.push({
        type: "terminal",
        value: token.value,
      })
    })

    // Añadir marcador de fin a la pila de entrada
    inputStack.push({ type: "endMarker", value: "$" })

    // Inicializar pila de salida con el marcador de fin y el símbolo inicial
    outputStack.push(
      { type: "endMarker", value: "$" }, // Marcador de fin
      { type: "nonTerminal", value: this.grammar.startSymbol || "PROGRAM" }, // Símbolo inicial
    )

    // Registrar estado inicial
    stackHistory.push({
      input: [...inputStack],
      output: [...outputStack],
      action: "Inicialización",
    })

    // Generar árbol de derivación basado en los tokens
    const tree = this.generateTreeFromTokens()

    // Simular pasos de análisis para el historial de pilas
    this.simulateParsingSteps(inputStack, outputStack, stackHistory)

    return {
      tree,
      inputStack,
      outputStack,
      stackHistory,
    }
  }

  /**
   * Genera un árbol de derivación basado en los tokens y la gramática
   */
  generateTreeFromTokens(): TreeNode {
    // Crear nodo raíz con el símbolo inicial
    const rootNode: TreeNode = {
      id: this.nodeId++,
      label: this.grammar.startSymbol || "PROGRAM",
      type: "nonTerminal",
      children: [],
    }

    // Agrupar tokens por categorías para construir un árbol más representativo
    const tokenGroups = this.groupTokensByCategory()

    // Construir el árbol basado en los grupos de tokens
    this.buildTreeFromTokenGroups(rootNode, tokenGroups)

    return rootNode
  }

  /**
   * Agrupa tokens por categorías para facilitar la construcción del árbol
   */
  groupTokensByCategory() {
    const groups: any[] = []
    let statementTokens: Token[] = []
    let inFunction = false
    let functionName = ""
    let blockLevel = 0
    const blockStack: string[] = ["global"]

    // Recorrer todos los tokens
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i]

      // Detectar inicio de declaración o sentencia
      if (
        token.type === "KEYWORD" ||
        token.type === "DATATYPE" ||
        (token.type === "IDENTIFIER" &&
          i < this.tokens.length - 1 &&
          (this.tokens[i + 1].value === "=" || this.tokens[i + 1].value === "("))
      ) {
        // Si ya teníamos un grupo en proceso, guardarlo
        if (statementTokens.length > 0) {
          groups.push({
            type: "STATEMENT",
            tokens: [...statementTokens],
            block: blockStack[blockStack.length - 1],
            level: blockLevel,
          })
          statementTokens = []
        }

        // Detectar funciones
        if (
          (token.type === "KEYWORD" && (token.value === "function" || token.value === "def")) ||
          (token.type === "DATATYPE" &&
            i + 1 < this.tokens.length &&
            this.tokens[i + 1].type === "IDENTIFIER" &&
            i + 2 < this.tokens.length &&
            this.tokens[i + 2].value === "(")
        ) {
          inFunction = true
          functionName = i + 1 < this.tokens.length ? this.tokens[i + 1].value : "anonymous"
          blockStack.push(functionName)
        }
      }

      // Detectar inicio de bloque
      if (token.value === "{" || token.value === ":") {
        blockLevel++
        if (!inFunction) {
          const blockName = `block_${blockLevel}_${i}`
          blockStack.push(blockName)
        }
      }

      // Detectar fin de bloque
      if (token.value === "}") {
        blockLevel = Math.max(0, blockLevel - 1)
        if (blockStack.length > 1) {
          blockStack.pop()
          if (inFunction && blockLevel === 0) {
            inFunction = false
            functionName = ""
          }
        }
      }

      // Añadir token al grupo actual
      statementTokens.push(token)

      // Detectar fin de sentencia
      if (
        token.value === ";" ||
        token.value === "}" ||
        (token.value === "{" && statementTokens.length > 1) ||
        (token.value === ":" && statementTokens.length > 1)
      ) {
        groups.push({
          type: "STATEMENT",
          tokens: [...statementTokens],
          block: blockStack[blockStack.length - 1],
          level: blockLevel,
        })
        statementTokens = []
      }
    }

    // Añadir el último grupo si quedó algo
    if (statementTokens.length > 0) {
      groups.push({
        type: "STATEMENT",
        tokens: statementTokens,
        block: blockStack[blockStack.length - 1],
        level: blockLevel,
      })
    }

    return groups
  }

  /**
   * Construye el árbol a partir de los grupos de tokens
   */
  buildTreeFromTokenGroups(parentNode: TreeNode, tokenGroups: any[]) {
    // Organizar grupos por bloques para crear una estructura jerárquica
    const blockGroups: Record<string, any[]> = {}
    const globalGroups: any[] = []

    // Primero, agrupar por bloques
    tokenGroups.forEach((group) => {
      if (group.block === "global") {
        globalGroups.push(group)
      } else {
        if (!blockGroups[group.block]) {
          blockGroups[group.block] = []
        }
        blockGroups[group.block].push(group)
      }
    })

    // Procesar grupos globales primero
    const processedGroups = this.processTokenGroups(globalGroups)
    parentNode.children = processedGroups

    // Luego, procesar bloques y añadirlos como hijos de sus respectivos padres
    Object.entries(blockGroups).forEach(([blockName, groups]) => {
      // Encontrar el nodo padre para este bloque
      const findBlockParent = (node: TreeNode): TreeNode | null => {
        if (
          node.label === blockName ||
          (node.label === "FUNCTION_DEFINITION" && node.children.some((c) => c.label === blockName))
        ) {
          return node
        }

        for (const child of node.children) {
          const found = findBlockParent(child)
          if (found) return found
        }

        return null
      }

      const blockParent = findBlockParent(parentNode)

      if (blockParent) {
        // Procesar los grupos de este bloque
        const blockChildren = this.processTokenGroups(groups)

        // Si el padre es una definición de función, añadir los hijos al nodo de bloque
        if (blockParent.label === "FUNCTION_DEFINITION") {
          // Buscar o crear el nodo de bloque
          let blockNode = blockParent.children.find((c) => c.label === "BLOCK")

          if (!blockNode) {
            blockNode = {
              id: this.nodeId++,
              label: "BLOCK",
              type: "nonTerminal",
              children: [],
            }
            blockParent.children.push(blockNode)
          }

          blockNode.children = blockChildren
        } else {
          // Añadir directamente al padre
          blockParent.children = blockParent.children.concat(blockChildren)
        }
      } else {
        // Si no se encuentra un padre, añadir al nodo raíz
        const blockChildren = this.processTokenGroups(groups)
        parentNode.children = parentNode.children.concat(blockChildren)
      }
    })

    return parentNode
  }

  /**
   * Procesa grupos de tokens para crear nodos del árbol
   */
  processTokenGroups(groups: any[]): TreeNode[] {
    return groups.map((group, index) => {
      // Determinar el tipo de nodo basado en el primer token
      let nodeType = "STATEMENT"
      let nodeLabel = "STATEMENT"

      if (group.tokens.length > 0) {
        const firstToken = group.tokens[0]

        if (firstToken.type === "KEYWORD") {
          switch (firstToken.value) {
            case "function":
            case "def":
              nodeType = "FUNCTION_DEFINITION"
              nodeLabel = "FUNCTION_DEFINITION"
              break
            case "if":
              nodeType = "IF_STATEMENT"
              nodeLabel = "IF_STATEMENT"
              break
            case "for":
              nodeType = "FOR_STATEMENT"
              nodeLabel = "FOR_STATEMENT"
              break
            case "while":
              nodeType = "WHILE_STATEMENT"
              nodeLabel = "WHILE_STATEMENT"
              break
            case "return":
              nodeType = "RETURN_STATEMENT"
              nodeLabel = "RETURN_STATEMENT"
              break
            case "var":
            case "let":
            case "const":
              nodeType = "VARIABLE_DECLARATION"
              nodeLabel = "VARIABLE_DECLARATION"
              break
            default:
              nodeType = "KEYWORD_STATEMENT"
              nodeLabel = `${firstToken.value.toUpperCase()}_STATEMENT`
          }
        } else if (firstToken.type === "DATATYPE") {
          // Verificar si es una declaración de función o variable
          if (group.tokens.length > 2 && group.tokens[2].value === "(") {
            nodeType = "FUNCTION_DECLARATION"
            nodeLabel = "FUNCTION_DECLARATION"
          } else {
            nodeType = "VARIABLE_DECLARATION"
            nodeLabel = "VARIABLE_DECLARATION"
          }
        } else if (firstToken.type === "IDENTIFIER") {
          // Verificar si es una asignación o llamada a función
          if (group.tokens.length > 1) {
            if (group.tokens[1].value === "=") {
              nodeType = "ASSIGNMENT"
              nodeLabel = "VARIABLE_ASSIGNMENT"
            } else if (group.tokens[1].value === "(") {
              nodeType = "FUNCTION_CALL"
              nodeLabel = "FUNCTION_CALL"
            }
          }
        }
      }

      // Crear el nodo para este grupo
      const node: TreeNode = {
        id: this.nodeId++,
        label: nodeLabel,
        type: "nonTerminal",
        children: [],
      }

      // Añadir tokens como hijos terminales
      node.children = this.createChildNodes(group.tokens, nodeType)

      return node
    })
  }

  /**
   * Crea nodos hijos a partir de tokens
   */
  createChildNodes(tokens: Token[], parentType: string): TreeNode[] {
    const children: TreeNode[] = []

    // Procesar tokens según el tipo de nodo padre
    if (parentType === "FUNCTION_DEFINITION" || parentType === "FUNCTION_DECLARATION") {
      // Crear nodos para la firma de la función
      let i = 0

      // Añadir palabra clave o tipo de retorno
      children.push({
        id: this.nodeId++,
        label: tokens[i].value,
        type: "terminal",
        token: tokens[i],
        children: [], // Asegurarse de que children esté inicializado
      })
      i++

      // Añadir nombre de la función
      if (i < tokens.length && tokens[i].type === "IDENTIFIER") {
        children.push({
          id: this.nodeId++,
          label: tokens[i].value,
          type: "terminal",
          token: tokens[i],
          children: [],
        })
        i++
      }

      // Buscar parámetros
      if (i < tokens.length && tokens[i].value === "(") {
        // Crear nodo para parámetros
        const paramsNode: TreeNode = {
          id: this.nodeId++,
          label: "PARAMETERS",
          type: "nonTerminal",
          children: [],
        }

        i++ // Saltar el paréntesis de apertura

        // Recopilar tokens de parámetros
        const paramTokens: Token[] = []
        while (i < tokens.length && tokens[i].value !== ")") {
          paramTokens.push(tokens[i])
          i++
        }

        // Procesar parámetros
        if (paramTokens.length > 0) {
          paramsNode.children = paramTokens.map((token) => ({
            id: this.nodeId++,
            label: token.value,
            type: "terminal",
            token: token,
            children: [],
          }))
        }

        children.push(paramsNode)

        // Saltar el paréntesis de cierre
        if (i < tokens.length && tokens[i].value === ")") {
          i++
        }
      }

      // Buscar el cuerpo de la función
      if (i < tokens.length && (tokens[i].value === "{" || tokens[i].value === ":")) {
        // Crear nodo para el cuerpo
        const bodyNode: TreeNode = {
          id: this.nodeId++,
          label: "BODY",
          type: "nonTerminal",
          children: [],
        }

        // Añadir el resto de tokens como hijos del cuerpo
        bodyNode.children = tokens.slice(i).map((token) => ({
          id: this.nodeId++,
          label: token.value,
          type: "terminal",
          token: token,
          children: [],
        }))

        children.push(bodyNode)
      }
    } else if (parentType === "IF_STATEMENT" || parentType === "WHILE_STATEMENT" || parentType === "FOR_STATEMENT") {
      // Crear nodos para estructuras de control
      let i = 0

      // Añadir palabra clave
      children.push({
        id: this.nodeId++,
        label: tokens[i].value,
        type: "terminal",
        token: tokens[i],
        children: [],
      })
      i++

      // Buscar condición
      if (i < tokens.length && tokens[i].value === "(") {
        // Crear nodo para la condición
        const conditionNode: TreeNode = {
          id: this.nodeId++,
          label: "CONDITION",
          type: "nonTerminal",
          children: [],
        }

        i++ // Saltar el paréntesis de apertura

        // Recopilar tokens de la condición
        const conditionTokens: Token[] = []
        let parenCount = 1

        while (i < tokens.length && parenCount > 0) {
          if (tokens[i].value === "(") parenCount++
          else if (tokens[i].value === ")") parenCount--

          if (parenCount > 0) {
            conditionTokens.push(tokens[i])
          }
          i++
        }

        // Procesar condición
        if (conditionTokens.length > 0) {
          conditionNode.children = conditionTokens.map((token) => ({
            id: this.nodeId++,
            label: token.value,
            type: "terminal",
            token: token,
            children: [],
          }))
        }

        children.push(conditionNode)
      } else if (i < tokens.length && parentType === "IF_STATEMENT" && this.isPythonStyle(tokens)) {
        // Condición en estilo Python (sin paréntesis)
        const conditionNode: TreeNode = {
          id: this.nodeId++,
          label: "CONDITION",
          type: "nonTerminal",
          children: [],
        }

        // Recopilar tokens de la condición
        const conditionTokens: Token[] = []
        while (i < tokens.length && tokens[i].value !== ":") {
          conditionTokens.push(tokens[i])
          i++
        }

        // Procesar condición
        if (conditionTokens.length > 0) {
          conditionNode.children = conditionTokens.map((token) => ({
            id: this.nodeId++,
            label: token.value,
            type: "terminal",
            token: token,
            children: [],
          }))
        }

        children.push(conditionNode)
      }

      // Buscar el cuerpo
      if (i < tokens.length && (tokens[i].value === "{" || tokens[i].value === ":")) {
        // Crear nodo para el cuerpo
        const bodyNode: TreeNode = {
          id: this.nodeId++,
          label: "BODY",
          type: "nonTerminal",
          children: [],
        }

        // Añadir el resto de tokens como hijos del cuerpo
        bodyNode.children = tokens.slice(i).map((token) => ({
          id: this.nodeId++,
          label: token.value,
          type: "terminal",
          token: token,
          children: [],
        }))

        children.push(bodyNode)
      }
    } else if (parentType === "VARIABLE_DECLARATION" || parentType === "VARIABLE_ASSIGNMENT") {
      // Crear nodos para declaraciones y asignaciones de variables
      let i = 0

      // Añadir tipo o identificador
      children.push({
        id: this.nodeId++,
        label: tokens[i].value,
        type: "terminal",
        token: tokens[i],
        children: [],
      })
      i++

      // Añadir identificador si es una declaración
      if (parentType === "VARIABLE_DECLARATION" && i < tokens.length) {
        children.push({
          id: this.nodeId++,
          label: tokens[i].value,
          type: "terminal",
          token: tokens[i],
          children: [],
        })
        i++
      }

      // Buscar asignación
      if (i < tokens.length && tokens[i].value === "=") {
        children.push({
          id: this.nodeId++,
          label: tokens[i].value,
          type: "terminal",
          token: tokens[i],
          children: [],
        })
        i++

        // Crear nodo para el valor
        const valueNode: TreeNode = {
          id: this.nodeId++,
          label: "VALUE",
          type: "nonTerminal",
          children: [],
        }

        // Recopilar tokens del valor
        const valueTokens: Token[] = []
        while (i < tokens.length && tokens[i].value !== ";" && tokens[i].value !== ",") {
          valueTokens.push(tokens[i])
          i++
        }

        // Procesar valor
        if (valueTokens.length > 0) {
          valueNode.children = valueTokens.map((token) => ({
            id: this.nodeId++,
            label: token.value,
            type: "terminal",
            token: token,
            children: [],
          }))
        }

        children.push(valueNode)
      }

      // Añadir punto y coma si existe
      if (i < tokens.length && tokens[i].value === ";") {
        children.push({
          id: this.nodeId++,
          label: tokens[i].value,
          type: "terminal",
          token: tokens[i],
          children: [],
        })
      }
    } else {
      // Para otros tipos, simplemente añadir todos los tokens como hijos
      children.push(
        ...tokens.map((token) => ({
          id: this.nodeId++,
          label: token.value,
          type: "terminal",
          token: token,
          children: [],
        })),
      )
    }

    // Asegurarse de que todos los nodos tengan children inicializado
    return children
  }

  /**
   * Verifica si los tokens siguen el estilo de Python (sin paréntesis)
   */
  isPythonStyle(tokens: Token[]): boolean {
    return tokens.some((token) => token.value === ":")
  }

  /**
   * Simula pasos de análisis para generar un historial de pilas
   */
  simulateParsingSteps(
    inputStack: StackItem[],
    outputStack: StackItem[],
    stackHistory: Array<{
      input: StackItem[]
      output: StackItem[]
      action: string
    }>,
  ) {
    // Copia de las pilas para no modificar las originales
    const inputCopy = [...inputStack]
    const outputCopy = [...outputStack]

    // Simular pasos de análisis
    let steps = 0
    const maxSteps = 100 // Aumentado para análisis más completos

    while (steps < maxSteps && inputCopy.length > 0 && outputCopy.length > 0) {
      steps++

      // Obtener el símbolo superior de la pila de salida
      const topOutput = outputCopy[outputCopy.length - 1]

      // Si es un no terminal, expandirlo
      if (topOutput.type === "nonTerminal") {
        const nonTerminal = topOutput.value

        // Verificar si hay producciones para este no terminal
        if (this.grammar.productions.has(nonTerminal)) {
          const productions = this.grammar.productions.get(nonTerminal)!

          // Seleccionar la producción más adecuada basada en el token actual
          const nextInput = inputCopy[0]
          const production = this.selectBestProduction(nonTerminal, productions, nextInput)

          // Quitar el no terminal de la pila
          outputCopy.pop()

          // Añadir los símbolos de la producción en orden inverso
          for (let i = production.length - 1; i >= 0; i--) {
            const symbol = production[i]
            if (symbol.type !== "epsilon") {
              outputCopy.push({
                type: symbol.type as "nonTerminal" | "terminal",
                value: symbol.value,
              })
            }
          }

          // Registrar este paso
          stackHistory.push({
            input: [...inputCopy],
            output: [...outputCopy],
            action: `Expansión: ${nonTerminal} -> ${production.map((s) => s.value).join(" ")}`,
          })
        } else {
          // No hay producciones, simplemente quitar el no terminal
          outputCopy.pop()
          stackHistory.push({
            input: [...inputCopy],
            output: [...outputCopy],
            action: `No hay producciones para ${nonTerminal}, se elimina de la pila`,
          })
        }
      }
      // Si es un terminal, intentar consumirlo
      else if (topOutput.type === "terminal") {
        const terminal = topOutput.value
        const nextInput = inputCopy[0]

        // Si coinciden, consumir ambos
        if (nextInput && (nextInput.value === terminal || this.matchTokenCategory(terminal, nextInput.value))) {
          outputCopy.pop()
          inputCopy.shift()

          stackHistory.push({
            input: [...inputCopy],
            output: [...outputCopy],
            action: `Consumido: "${terminal}"`,
          })
        } else {
          // No coinciden, error
          outputCopy.pop()
          stackHistory.push({
            input: [...inputCopy],
            output: [...outputCopy],
            action: `Error: Esperaba "${terminal}", encontró "${nextInput?.value || "fin de entrada"}"`,
          })
        }
      }
      // Si es un marcador de fin, verificar si la entrada también es un marcador de fin
      else if (topOutput.type === "endMarker") {
        const nextInput = inputCopy[0]

        if (nextInput && nextInput.type === "endMarker") {
          // Éxito, ambos son marcadores de fin
          outputCopy.pop()
          inputCopy.shift()

          stackHistory.push({
            input: [...inputCopy],
            output: [...outputCopy],
            action: "Análisis completado exitosamente",
          })
          break
        } else {
          // Error, esperaba fin de entrada
          stackHistory.push({
            input: [...inputCopy],
            output: [...outputCopy],
            action: `Error: Esperaba fin de entrada, encontró "${nextInput?.value || "desconocido"}"`,
          })
          break
        }
      }
    }

    // Si se alcanzó el límite de pasos, registrar
    if (steps >= maxSteps) {
      stackHistory.push({
        input: [...inputCopy],
        output: [...outputCopy],
        action: "Límite de pasos alcanzado",
      })
    }
  }

  /**
   * Selecciona la mejor producción basada en el token actual
   */
  selectBestProduction(
    nonTerminal: string,
    productions: Array<Array<{ type: string; value: string }>>,
    nextInput?: StackItem,
  ) {
    // Si no hay token siguiente, usar la primera producción
    if (!nextInput) return productions[0]

    // Buscar una producción que comience con el token actual
    for (const production of productions) {
      if (production.length > 0) {
        const firstSymbol = production[0]

        // Si el primer símbolo es terminal y coincide con el token actual
        if (
          firstSymbol.type === "terminal" &&
          (firstSymbol.value === nextInput.value || this.matchTokenCategory(firstSymbol.value, nextInput.value))
        ) {
          return production
        }

        // Si el primer símbolo es epsilon y no hay más tokens
        if (firstSymbol.type === "epsilon" && nextInput.type === "endMarker") {
          return production
        }
      }
    }

    // Si no se encuentra una coincidencia, usar la primera producción
    return productions[0]
  }

  /**
   * Verifica si un token coincide con una categoría
   */
  matchTokenCategory(expected: string, actual: string): boolean {
    // Verificar si el token esperado es una categoría
    if (expected === "IDENTIFIER") {
      return this.isIdentifier(actual)
    }
    if (expected === "NUMBER") {
      return this.isNumber(actual)
    }
    if (expected === "STRING") {
      return this.isString(actual)
    }

    // Si el token esperado es un identificador específico y el token actual es cualquier identificador
    if (this.isIdentifier(expected) && this.isIdentifier(actual)) {
      return true
    }

    // Si no es una categoría, verificar coincidencia exacta
    return expected === actual
  }

  // Métodos auxiliares para verificar tipos de tokens
  isIdentifier(token: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)
  }

  isNumber(token: string): boolean {
    return /^[0-9]+(\.[0-9]+)?$/.test(token)
  }

  isString(token: string): boolean {
    return (token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))
  }

  // Método para convertir el árbol al formato esperado por DerivationTree
  convertTreeFormat(node: TreeNode): any {
    if (!node) return null

    return {
      id: node.id,
      label: node.label,
      type: node.type,
      children: (node.children || []).map((child) => this.convertTreeFormat(child)),
    }
  }
}
