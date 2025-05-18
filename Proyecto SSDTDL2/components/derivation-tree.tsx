"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from "lucide-react"
import type { TreeNode } from "@/lib/parser-enhanced"

interface DerivationTreeProps {
  tree: TreeNode | null
}

export function DerivationTree({ tree }: DerivationTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Colores para los diferentes tipos de nodos
  const nodeColors = {
    nonTerminal: { fill: "#9333ea", stroke: "#7e22ce", text: "#f3e8ff" },
    terminal: { fill: "#10b981", stroke: "#059669", text: "#ecfdf5" },
    epsilon: { fill: "#6b7280", stroke: "#4b5563", text: "#f9fafb" },
  }

  // Función para dibujar el árbol
  const drawTree = () => {
    const canvas = canvasRef.current
    if (!canvas || !tree) return

    setIsLoading(true)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calcular dimensiones del árbol
    const nodeWidth = 120 * zoom
    const nodeHeight = 40 * zoom
    const horizontalSpacing = 20 * zoom
    const verticalSpacing = 60 * zoom
    const fontSize = 12 * zoom

    // Función para calcular la posición de los nodos
    const calculateNodePositions = (
      node: TreeNode,
      x: number,
      y: number,
      level: number,
      positions: Map<number, { x: number; y: number; width: number }>,
    ) => {
      if (!node) return { width: 0 }

      if (node.children.length === 0) {
        positions.set(node.id, { x, y, width: nodeWidth })
        return { width: nodeWidth }
      }

      let totalWidth = 0
      const childWidths: number[] = []

      // Calcular el ancho de cada hijo
      for (const child of node.children) {
        const result = calculateNodePositions(
          child,
          0, // Temporal, se actualizará después
          y + nodeHeight + verticalSpacing,
          level + 1,
          positions,
        )
        childWidths.push(result.width)
        totalWidth += result.width
      }

      // Añadir espaciado entre nodos
      totalWidth += horizontalSpacing * (node.children.length - 1)

      // Calcular la posición x del nodo actual
      const nodeX = x - totalWidth / 2 + nodeWidth / 2

      // Actualizar la posición del nodo actual
      positions.set(node.id, { x: nodeX, y, width: totalWidth })

      // Actualizar las posiciones x de los hijos
      let childX = nodeX - totalWidth / 2 + childWidths[0] / 2
      for (let i = 0; i < node.children.length; i++) {
        const childPos = positions.get(node.children[i].id)
        if (childPos) {
          positions.set(node.children[i].id, { ...childPos, x: childX })
        }
        childX += childWidths[i] + horizontalSpacing
      }

      return { width: totalWidth }
    }

    // Calcular posiciones de los nodos
    const positions = new Map<number, { x: number; y: number; width: number }>()
    const rootWidth = calculateNodePositions(tree, canvas.width / 2, 50 * zoom, 0, positions).width

    // Dibujar conexiones
    ctx.lineWidth = 2 * zoom
    ctx.strokeStyle = "#a78bfa"

    for (const [id, pos] of positions.entries()) {
      const node = findNodeById(tree, id)
      if (node && node.children.length > 0) {
        for (const child of node.children) {
          const childPos = positions.get(child.id)
          if (childPos) {
            ctx.beginPath()
            ctx.moveTo(pos.x, pos.y + nodeHeight / 2)
            ctx.lineTo(childPos.x, childPos.y - nodeHeight / 2)
            ctx.stroke()
          }
        }
      }
    }

    // Dibujar nodos
    for (const [id, pos] of positions.entries()) {
      const node = findNodeById(tree, id)
      if (node) {
        drawNode(ctx, node, pos.x, pos.y, nodeWidth, nodeHeight, fontSize)
      }
    }

    setIsLoading(false)
  }

  // Función para encontrar un nodo por su ID
  const findNodeById = (node: TreeNode | null, id: number): TreeNode | null => {
    if (!node) return null
    if (node.id === id) return node

    for (const child of node.children) {
      const found = findNodeById(child, id)
      if (found) return found
    }

    return null
  }

  // Función para dibujar un nodo
  const drawNode = (
    ctx: CanvasRenderingContext2D,
    node: TreeNode,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
  ) => {
    const colors = nodeColors[node.type as keyof typeof nodeColors] || nodeColors.nonTerminal

    // Dibujar sombra
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
    ctx.shadowBlur = 5 * zoom
    ctx.shadowOffsetX = 2 * zoom
    ctx.shadowOffsetY = 2 * zoom

    // Dibujar fondo del nodo
    ctx.fillStyle = colors.fill
    ctx.beginPath()
    ctx.roundRect(x - width / 2, y - height / 2, width, height, 8 * zoom)
    ctx.fill()

    // Dibujar borde
    ctx.shadowColor = "transparent"
    ctx.strokeStyle = colors.stroke
    ctx.lineWidth = 2 * zoom
    ctx.stroke()

    // Dibujar texto
    ctx.fillStyle = colors.text
    ctx.font = `${fontSize}px sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Truncar texto si es demasiado largo
    let label = node.label
    const maxWidth = width - 20 * zoom
    if (ctx.measureText(label).width > maxWidth) {
      let truncated = label
      while (ctx.measureText(truncated + "...").width > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1)
      }
      label = truncated + "..."
    }

    ctx.fillText(label, x, y)

    // Dibujar tipo de nodo
    ctx.font = `${fontSize * 0.8}px sans-serif`
    ctx.fillText(node.type, x, y + height / 4)
  }

  // Ajustar el tamaño del canvas cuando cambia el zoom o el contenedor
  const resizeCanvas = () => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Calcular la altura necesaria basada en la profundidad del árbol
    const treeDepth = calculateTreeDepth(tree)
    const minHeight = Math.max(400, (treeDepth + 1) * 100 * zoom)

    // Calcular el ancho necesario basado en el número de nodos
    const nodeCount = countNodes(tree)
    const minWidth = Math.max(container.clientWidth, nodeCount * 80 * zoom)

    canvas.width = minWidth
    canvas.height = minHeight

    drawTree()
  }

  // Calcular la profundidad del árbol
  const calculateTreeDepth = (node: TreeNode | null): number => {
    if (!node || node.children.length === 0) return 0

    let maxDepth = 0
    for (const child of node.children) {
      const depth = calculateTreeDepth(child)
      if (depth > maxDepth) maxDepth = depth
    }

    return maxDepth + 1
  }

  // Contar el número de nodos en el árbol
  const countNodes = (node: TreeNode | null): number => {
    if (!node) return 0

    let count = 1
    for (const child of node.children) {
      count += countNodes(child)
    }

    return count
  }

  // Alternar pantalla completa
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Efecto para dibujar el árbol cuando cambia el zoom o el árbol
  useEffect(() => {
    resizeCanvas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, tree, isFullscreen])

  // Efecto para ajustar el tamaño del canvas cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      resizeCanvas()
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, tree])

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-64 bg-purple-900/20 rounded-lg border border-purple-700/30">
        <p className="text-purple-300">No hay árbol de derivación disponible</p>
      </div>
    )
  }

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-purple-950 p-4" : ""}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <div className="w-32">
            <Slider
              value={[zoom * 100]}
              min={50}
              max={200}
              step={10}
              onValueChange={(value) => setZoom(value[0] / 100)}
              className="bg-purple-900/50"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <span className="text-xs text-purple-300">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setZoom(1)
              drawTree()
            }}
            className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`overflow-auto bg-purple-900/20 rounded-lg border border-purple-700/30 ${
          isFullscreen ? "h-[calc(100%-80px)]" : "max-h-[500px]"
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-purple-950/50 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-300"></div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="min-w-full"
          style={{ minHeight: isFullscreen ? "calc(100vh - 120px)" : "500px" }}
        />
      </div>
    </div>
  )
}
