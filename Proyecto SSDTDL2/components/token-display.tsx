"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

interface TokenDisplayProps {
  tokens: any[]
  sourceCode: string
}

export function TokenDisplay({ tokens, sourceCode }: TokenDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTokens = tokens.filter(
    (token) =>
      token.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.value.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getTokenColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "keyword":
        return "bg-blue-700 text-blue-100"
      case "identifier":
        return "bg-green-700 text-green-100"
      case "number":
        return "bg-amber-700 text-amber-100"
      case "string":
        return "bg-red-700 text-red-100"
      case "operator":
        return "bg-purple-700 text-purple-100"
      case "punctuation":
        return "bg-gray-700 text-gray-100"
      default:
        return "bg-indigo-700 text-indigo-100"
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar tokens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 bg-purple-900/30 border-purple-700 text-purple-200 placeholder:text-purple-400"
        />
      </div>

      <div className="rounded-md border border-purple-700 overflow-hidden">
        <Table>
          <TableHeader className="bg-purple-900/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-purple-300 font-medium">Tipo</TableHead>
              <TableHead className="text-purple-300 font-medium">Valor</TableHead>
              <TableHead className="text-purple-300 font-medium">Línea</TableHead>
              <TableHead className="text-purple-300 font-medium">Columna</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token, index) => (
                <TableRow key={index} className="hover:bg-purple-800/30 border-purple-700/50">
                  <TableCell>
                    <Badge className={getTokenColor(token.type)}>{token.type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-purple-200">{token.value}</TableCell>
                  <TableCell className="text-purple-300">{token.line}</TableCell>
                  <TableCell className="text-purple-300">{token.column}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-purple-400">
                  No se encontraron tokens que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
