"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"

interface ErrorDisplayProps {
  errors: Array<{
    message: string
    line: number
    column: number
    expected?: string
    found?: string
  }>
}

export function ErrorDisplay({ errors }: ErrorDisplayProps) {
  if (!errors || errors.length === 0) {
    return null
  }

  return (
    <ScrollArea className="h-[200px] w-full">
      <div className="space-y-2">
        {errors.map((error, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Alert variant="destructive" className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-red-800 dark:text-red-300">
                Error en línea {error.line}, columna {error.column}
              </AlertTitle>
              <AlertDescription className="mt-2 text-red-700 dark:text-red-400">
                {error.message}
                {error.expected && error.found && (
                  <div className="mt-1">
                    <span className="font-medium">Esperaba:</span> {error.expected},{" "}
                    <span className="font-medium">Encontró:</span> {error.found}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  )
}
