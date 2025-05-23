"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import type { Symbol } from "@/lib/types"

interface SymbolTableProps {
  symbols: Symbol[]
}

export function SymbolTable({ symbols }: SymbolTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")

  if (!symbols || symbols.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-purple-900/20 rounded-lg border border-purple-700/30">
        <p className="text-purple-300">No hay símbolos disponibles</p>
      </div>
    )
  }

  // Filtrar símbolos
  const filteredSymbols = symbols.filter((symbol) => {
    // Filtrar por término de búsqueda
    const matchesSearch = symbol.id.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtrar por tipo
    if (filter === "all") return matchesSearch
    if (filter === "variables" && !symbol.isFunction) return matchesSearch
    if (filter === "functions" && symbol.isFunction) return matchesSearch
    if (filter === "parameters" && symbol.scope === "parameter") return matchesSearch
    if (filter === "declarations" && symbol.usage === "declaration") return matchesSearch
    if (filter === "references" && symbol.usage === "reference") return matchesSearch

    return false
  })

  // Agrupar símbolos por ID para mostrar información consolidada
  const groupedSymbols = filteredSymbols.reduce(
    (acc, symbol) => {
      if (!acc[symbol.id]) {
        acc[symbol.id] = []
      }
      acc[symbol.id].push(symbol)
      return acc
    },
    {} as Record<string, Symbol[]>,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-purple-400" />
          <Input
            placeholder="Buscar símbolos..."
            className="pl-8 bg-purple-900/30 border-purple-700/50 text-purple-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-purple-400" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] bg-purple-900/30 border-purple-700/50 text-purple-200">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent className="bg-purple-900 border-purple-700 text-purple-200">
              <SelectItem value="all">Todos los símbolos</SelectItem>
              <SelectItem value="variables">Variables</SelectItem>
              <SelectItem value="functions">Funciones</SelectItem>
              <SelectItem value="parameters">Parámetros</SelectItem>
              <SelectItem value="declarations">Declaraciones</SelectItem>
              <SelectItem value="references">Referencias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border border-purple-700/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-purple-900/50">
            <TableRow className="hover:bg-purple-800/50">
              <TableHead className="text-purple-200">Identificador</TableHead>
              <TableHead className="text-purple-200">Tipo</TableHead>
              <TableHead className="text-purple-200">Ámbito</TableHead>
              <TableHead className="text-purple-200">Línea</TableHead>
              <TableHead className="text-purple-200">Uso</TableHead>
              <TableHead className="text-purple-200">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedSymbols).map(([id, symbolGroup]) => {
              // Obtener la declaración principal (si existe)
              const declaration = symbolGroup.find((s) => s.usage === "declaration")
              const symbol = declaration || symbolGroup[0]

              return (
                <TableRow key={id} className="hover:bg-purple-800/20 border-t border-purple-700/30">
                  <TableCell className="font-medium text-purple-200">
                    {id}
                    {symbol.isFunction && <Badge className="ml-2 bg-blue-600 text-white">Función</Badge>}
                    {symbol.isParameter && <Badge className="ml-2 bg-amber-600 text-white">Parámetro</Badge>}
                    {symbol.isStandardLibrary && <Badge className="ml-2 bg-green-600 text-white">Biblioteca</Badge>}
                  </TableCell>
                  <TableCell className="text-purple-300">
                    {symbol.isFunction
                      ? `${symbol.returnType || "void"} → (${symbol.parameters?.join(", ") || ""})`
                      : symbol.type}
                  </TableCell>
                  <TableCell className="text-purple-300">
                    {symbol.scope === "global" ? (
                      <Badge variant="outline" className="border-green-500 text-green-400">
                        Global
                      </Badge>
                    ) : symbol.scope === "parameter" ? (
                      <Badge variant="outline" className="border-amber-500 text-amber-400">
                        Parámetro
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-blue-500 text-blue-400">
                        {symbol.block}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-purple-300">{symbol.line}</TableCell>
                  <TableCell className="text-purple-300">
                    {symbol.usage === "declaration" ? (
                      <Badge className="bg-purple-600 text-white">Declaración</Badge>
                    ) : (
                      <Badge className="bg-indigo-600 text-white">
                        Referencia{" "}
                        {symbolGroup.filter((s) => s.usage === "reference").length > 1 &&
                          `(${symbolGroup.filter((s) => s.usage === "reference").length})`}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {symbol.isUsed ? (
                      <Badge className="bg-green-600 text-white">Usado</Badge>
                    ) : (
                      <Badge className="bg-amber-600 text-white">No usado</Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-purple-400 text-right">Total: {filteredSymbols.length} símbolos</div>
    </div>
  )
}
