import type { TreeNode } from "@/lib/types"

interface StaticTreeViewProps {
  tree: TreeNode | null
}

export function StaticTreeView({ tree }: StaticTreeViewProps) {
  if (!tree) {
    return <div className="text-purple-300">No hay árbol disponible</div>
  }

  // Función recursiva para renderizar el árbol
  const renderNode = (node: TreeNode, level = 0) => {
    const indent = "  ".repeat(level)
    const nodeType = node.type === "nonTerminal" ? "[NT]" : node.type === "terminal" ? "[T]" : "[ε]"

    return (
      <div key={node.id} className="font-mono">
        <div className={`${level > 0 ? "ml-6 border-l-2 pl-2 border-purple-700/50" : ""}`}>
          <span className="text-purple-300">{nodeType}</span>{" "}
          <span className={node.type === "nonTerminal" ? "text-purple-200 font-bold" : "text-green-300"}>
            {node.label}
          </span>
          {node.children && node.children.length > 0 && (
            <div className="ml-2">{node.children.map((child) => renderNode(child, level + 1))}</div>
          )}
        </div>
      </div>
    )
  }

  return <div className="p-4 bg-purple-900/20 rounded-lg">{renderNode(tree)}</div>
}
