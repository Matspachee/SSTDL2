"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AlertCircle, AlertTriangle, Info, Search } from "lucide-react"

interface SemanticErrorsProps {
  errors: any[]
}

export function SemanticErrors({ errors }: SemanticErrorsProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Normalizar errores para manejar tanto strings como objetos
  const normalizedErrors = errors.map((error) => {
    if (typeof error === "string") {
      return {
        message: error,
        line: 0,
        column: 0,
        severity: "error",
      }
    }
    return error
  })

  // Filtrar errores según la búsqueda
  const filteredErrors = normalizedErrors.filter((error) =>
    error.message.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Renderizar icono según la severidad
  const renderSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle size={18} className="text-red-400" />
      case "warning":
        return <AlertTriangle size={18} className="text-yellow-400" />
      case "info":
        return <Info size={18} className="text-blue-400" />
      default:
        return <AlertCircle size={18} className="text-red-400" />
    }
  }

  // Obtener color según la severidad
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-900/30 border-red-700"
      case "warning":
        return "bg-yellow-900/30 border-yellow-700"
      case "info":
        return "bg-blue-900/30 border-blue-700"
      default:
        return "bg-red-900/30 border-red-700"
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar errores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 bg-purple-900/30 border-purple-700 text-purple-200 placeholder:text-purple-400"
        />
      </div>

      {filteredErrors.length > 0 ? (
        <div className="space-y-3">
          {filteredErrors.map((error, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(error.severity)}`}>
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">{renderSeverityIcon(error.severity)}</div>
                <div className="flex-1">
                  <div className="flex items-center flex-wrap">
                    <h4 className="font-medium text-purple-200">{error.message}</h4>
                    <Badge
                      className={
                        error.severity === "error"
                          ? "ml-2 bg-red-700 text-red-100"
                          : error.severity === "warning"
                            ? "ml-2 bg-yellow-700 text-yellow-100"
                            : "ml-2 bg-blue-700 text-blue-100"
                      }
                    >
                      {error.severity}
                    </Badge>
                  </div>
                  {(error.line > 0 || error.column > 0) && (
                    <p className="text-sm mt-1 text-purple-300">
                      Ubicación: Línea {error.line}, Columna {error.column}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-purple-400 bg-purple-900/20 rounded-lg border border-purple-700/50">
          {errors.length === 0
            ? "No se encontraron errores semánticos en el código."
            : "No se encontraron errores que coincidan con la búsqueda."}
        </div>
      )}
    </div>
  )
}
