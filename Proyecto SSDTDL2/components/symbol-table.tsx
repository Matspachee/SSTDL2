"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Variable, TypeIcon as FunctionIcon, Package } from "lucide-react"

interface SymbolTableProps {
  symbols: any[]
}

export function SymbolTable({ symbols }: SymbolTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSymbols = symbols.filter(
    (symbol) =>
      (symbol.id || symbol.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (symbol.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (symbol.block || symbol.scope || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Agrupar símbolos por tipo
  const variables = filteredSymbols.filter((s) => !s.isFunction && !s.isStandardLibrary)
  const functions = filteredSymbols.filter((s) => s.isFunction && !s.isStandardLibrary)
  const libraries = filteredSymbols.filter((s) => s.isStandardLibrary)

  const getSymbolIcon = (symbol: any) => {
    if (symbol.isFunction) return <FunctionIcon size={16} className="text-purple-400" />
    if (symbol.isStandardLibrary) return <Package size={16} className="text-purple-400" />
    return <Variable size={16} className="text-purple-400" />
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar símbolos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 bg-purple-900/30 border-purple-700 text-purple-200 placeholder:text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Variables */}
        {variables.length > 0 && (
          <div className="rounded-md border border-purple-700 overflow-hidden">
            <div className="bg-purple-900/50 px-4 py-2 flex items-center justify-between">
              <h3 className="text-purple-200 font-medium flex items-center">
                <Variable size={16} className="mr-2" />
                Variables
              </h3>
              <Badge className="bg-purple-700">{variables.length}</Badge>
            </div>
            <Table>
              <TableHeader className="bg-purple-900/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-purple-300 font-medium">Nombre</TableHead>
                  <TableHead className="text-purple-300 font-medium">Tipo</TableHead>
                  <TableHead className="text-purple-300 font-medium">Ámbito</TableHead>
                  <TableHead className="text-purple-300 font-medium">Línea</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variables.map((symbol, index) => (
                  <TableRow key={index} className="hover:bg-purple-800/30 border-purple-700/50">
                    <TableCell className="font-medium text-purple-200">{symbol.id || symbol.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-700 text-blue-100">{symbol.type}</Badge>
                    </TableCell>
                    <TableCell className="text-purple-300">{symbol.block || symbol.scope || "global"}</TableCell>
                    <TableCell className="text-purple-300">{symbol.line}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Funciones */}
        {functions.length > 0 && (
          <div className="rounded-md border border-purple-700 overflow-hidden">
            <div className="bg-purple-900/50 px-4 py-2 flex items-center justify-between">
              <h3 className="text-purple-200 font-medium flex items-center">
                <FunctionIcon size={16} className="mr-2" />
                Funciones
              </h3>
              <Badge className="bg-purple-700">{functions.length}</Badge>
            </div>
            <Table>
              <TableHeader className="bg-purple-900/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-purple-300 font-medium">Nombre</TableHead>
                  <TableHead className="text-purple-300 font-medium">Tipo</TableHead>
                  <TableHead className="text-purple-300 font-medium">Ámbito</TableHead>
                  <TableHead className="text-purple-300 font-medium">Línea</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {functions.map((symbol, index) => (
                  <TableRow key={index} className="hover:bg-purple-800/30 border-purple-700/50">
                    <TableCell className="font-medium text-purple-200">{symbol.id || symbol.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-purple-700 text-purple-100">función</Badge>
                    </TableCell>
                    <TableCell className="text-purple-300">{symbol.block || symbol.scope || "global"}</TableCell>
                    <TableCell className="text-purple-300">{symbol.line}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Bibliotecas */}
        {libraries.length > 0 && (
          <div className="rounded-md border border-purple-700 overflow-hidden">
            <div className="bg-purple-900/50 px-4 py-2 flex items-center justify-between">
              <h3 className="text-purple-200 font-medium flex items-center">
                <Package size={16} className="mr-2" />
                Bibliotecas
              </h3>
              <Badge className="bg-purple-700">{libraries.length}</Badge>
            </div>
            <Table>
              <TableHeader className="bg-purple-900/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-purple-300 font-medium">Nombre</TableHead>
                  <TableHead className="text-purple-300 font-medium">Tipo</TableHead>
                  <TableHead className="text-purple-300 font-medium">Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {libraries.map((symbol, index) => (
                  <TableRow key={index} className="hover:bg-purple-800/30 border-purple-700/50">
                    <TableCell className="font-medium text-purple-200">{symbol.id || symbol.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-700 text-green-100">biblioteca</Badge>
                    </TableCell>
                    <TableCell className="text-purple-300">{getLibraryDescription(symbol.id || symbol.name)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredSymbols.length === 0 && (
          <div className="text-center py-8 text-purple-400 bg-purple-900/20 rounded-lg border border-purple-700/50">
            No se encontraron símbolos que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  )
}

// Función para obtener descripciones de bibliotecas
function getLibraryDescription(name: string): string {
  const descriptions: Record<string, string> = {
    // JavaScript
    console: "Proporciona métodos para depuración",
    Math: "Funciones matemáticas y constantes",
    Array: "Manipulación de arrays",
    Object: "Manipulación de objetos",
    String: "Manipulación de cadenas de texto",
    JSON: "Parseo y serialización de JSON",
    Promise: "Manejo de operaciones asíncronas",
    setTimeout: "Ejecuta código después de un tiempo",
    document: "Manipulación del DOM",
    window: "Objeto global del navegador",
    fetch: "API para peticiones HTTP",

    // Python
    print: "Imprime texto en la consola",
    len: "Devuelve la longitud de un objeto",
    range: "Genera secuencias numéricas",
    input: "Lee entrada del usuario",
    int: "Convierte a entero",
    str: "Convierte a cadena de texto",
    list: "Crea o convierte a lista",
    dict: "Crea o manipula diccionarios",
    open: "Abre archivos para lectura/escritura",

    // C
    printf: "Imprime texto formateado",
    scanf: "Lee entrada formateada",
    malloc: "Asigna memoria dinámicamente",
    free: "Libera memoria asignada",
    strlen: "Calcula longitud de cadena",
    strcpy: "Copia cadenas de texto",
    fopen: "Abre archivos",
    fclose: "Cierra archivos",
    NULL: "Constante que representa un puntero nulo",
    main: "Función principal de un programa en C",
  }

  return descriptions[name] || "Biblioteca estándar del lenguaje"
}
