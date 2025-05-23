"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Maximize2, Search, ChevronRight, ChevronDown, Code, Box, Type, Download, ZoomIn, ZoomOut } from "lucide-react"
import type { TreeNode } from "@/lib/types"

interface DerivationTreeProps {
  tree: TreeNode | null
}

export function DerivationTree({ tree }: DerivationTreeProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [zoomLevel, setZoomLevel] = useState(1)

  // Si no hay árbol, crear uno mínimo para mostrar
  const defaultTree: TreeNode = tree || {
    id: 0,
    label: "PROGRAM",
    type: "nonTerminal",
    children: [
      {
        id: 1,
        label: "No hay árbol de derivación disponible",
        type: "terminal",
        children: [],
      },
    ],
  }

  // Función para expandir todos los nodos
  const expandAll = () => {
    const allNodeIds = new Set<number>()

    const collectIds = (node: TreeNode) => {
      allNodeIds.add(node.id)
      node.children?.forEach(collectIds)
    }

    collectIds(defaultTree)
    setExpandedNodes(allNodeIds)
  }

  // Función para colapsar todos los nodos
  const collapseAll = () => {
    setExpandedNodes(new Set([defaultTree.id]))
  }

  // Expandir el nodo raíz por defecto
  if (expandedNodes.size === 0) {
    expandedNodes.add(defaultTree.id)
  }

  // Función para alternar la expansión de un nodo
  const toggleNode = (nodeId: number) => {
    const newExpandedNodes = new Set(expandedNodes)
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId)
    } else {
      newExpandedNodes.add(nodeId)
    }
    setExpandedNodes(newExpandedNodes)
  }

  // Función para exportar el árbol como JSON
  const exportTree = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(defaultTree, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "derivation-tree.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  // Función recursiva para renderizar el árbol
  const renderNode = (node: TreeNode, level = 0, isLastChild = true) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const isHighlighted = searchTerm && node.label.toLowerCase().includes(searchTerm.toLowerCase())

    // Determinar el icono según el tipo de nodo
    let NodeIcon = Code
    if (node.type === "nonTerminal") NodeIcon = Box
    if (node.type === "terminal") NodeIcon = Type

    // Determinar el color según el tipo de nodo
    let nodeColor = "text-gray-400 bg-gray-800"
    if (node.type === "nonTerminal") nodeColor = "text-purple-300 bg-purple-900"
    if (node.type === "terminal") nodeColor = "text-green-300 bg-green-900"
    if (node.type === "epsilon") nodeColor = "text-gray-300 bg-gray-800"

    // Añadir resaltado si coincide con la búsqueda
    if (isHighlighted) nodeColor += " ring-2 ring-yellow-400"

    return (
      <div key={node.id} className="relative" style={{ fontSize: `${Math.max(0.8, zoomLevel)}rem` }}>
        <div className={`flex items-start group ${level > 0 ? "mt-1" : "mt-0"}`}>
          {/* Líneas conectoras */}
          {level > 0 && (
            <div className="absolute left-0 top-0 h-full">
              <div
                className={`absolute left-0 top-0 border-l-2 border-purple-700/30 h-full ${isLastChild ? "h-3" : "h-full"}`}
                style={{ left: `${(level - 1) * 20}px` }}
              ></div>
              <div
                className="absolute border-t-2 border-purple-700/30 w-5"
                style={{ left: `${(level - 1) * 20}px`, top: "10px" }}
              ></div>
            </div>
          )}

          {/* Indentación */}
          <div style={{ width: `${level * 20}px` }} className="flex-shrink-0"></div>

          {/* Botón de expansión */}
          <div className="flex-shrink-0 w-5">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div className="w-5"></div>
            )}
          </div>

          {/* Contenido del nodo */}
          <div
            className={`flex items-center px-2 py-1 rounded-md ${nodeColor} transition-all duration-200 hover:brightness-110`}
          >
            <NodeIcon size={14} className="mr-2 flex-shrink-0" />
            <span className="font-medium">{node.label}</span>
            {node.token && (
              <span className="ml-2 text-xs opacity-70">
                (línea: {node.token.line}, col: {node.token.column})
              </span>
            )}
          </div>

          {/* Tipo de nodo (visible en hover) */}
          <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-purple-400">
            {node.type}
          </div>
        </div>

        {/* Nodos hijos */}
        {isExpanded && hasChildren && (
          <div className="ml-5">
            {node.children.map((child, index) => renderNode(child, level + 1, index === node.children.length - 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-purple-950 p-4" : ""}`}>
      <div className="flex flex-col gap-4 mb-4">
        {/* Barra superior con controles */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-purple-200">Árbol de Derivación</h3>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
              className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <span className="flex items-center text-xs text-purple-300 min-w-[40px] justify-center">
              {Math.round(zoomLevel * 100)}%
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
              className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
            >
              Expandir Todo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
            >
              Colapsar Todo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={exportTree}
              className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-purple-900/50 border-purple-700 text-purple-200 hover:bg-purple-700"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
          <Input
            type="text"
            placeholder="Buscar en el árbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-purple-900/30 border-purple-700 text-purple-200 placeholder:text-purple-400"
          />
        </div>
      </div>

      {/* Contenedor del árbol */}
      <div
        className={`overflow-auto bg-purple-900/20 rounded-lg border border-purple-700/30 ${
          isFullscreen ? "h-[calc(100%-120px)]" : "max-h-[500px]"
        }`}
      >
        <div className="p-4">{renderNode(defaultTree)}</div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 justify-center text-sm mt-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-purple-900 border border-purple-700 mr-2"></div>
          <span className="text-purple-300">No Terminal</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-green-900 border border-green-700 mr-2"></div>
          <span className="text-purple-300">Terminal</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-gray-800 border border-gray-700 mr-2"></div>
          <span className="text-purple-300">Épsilon</span>
        </div>
      </div>
    </div>
  )
}
