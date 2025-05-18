"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface AnalysisStepsProps {
  steps: string[]
}

export function AnalysisSteps({ steps }: AnalysisStepsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [steps])

  return (
    <div ref={containerRef} className="space-y-1 font-mono text-sm">
      {steps.map((step, index) => {
        // Detectar indentación
        const indentMatch = step.match(/^(\s*)/)
        const indent = indentMatch ? indentMatch[0].length : 0

        // Detectar si es un paso de éxito, error o normal
        const isSuccess = step.includes("Éxito") || step.includes("Consumido")
        const isError = step.includes("Error") || step.includes("Fallo")

        // Aplicar clases según el tipo de paso
        let className = ""

        if (isSuccess) {
          className = "text-green-600 dark:text-green-400"
        } else if (isError) {
          className = "text-red-600 dark:text-red-400"
        } else if (step.includes("Intentando analizar") || step.includes("Esperando terminal")) {
          className = "text-blue-600 dark:text-blue-400"
        } else if (step.includes("Probando producción")) {
          className = "text-cyan-600 dark:text-cyan-400"
        } else if (step.includes("Análisis léxico")) {
          className = "text-blue-700 dark:text-blue-300 font-semibold"
        } else if (step.includes("Token")) {
          className = "text-teal-500 dark:text-teal-500"
        }

        return (
          <motion.div
            key={index}
            className={`whitespace-pre ${className}`}
            style={{ paddingLeft: `${indent * 0.25}rem` }}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.01 }}
          >
            {step}
          </motion.div>
        )
      })}
    </div>
  )
}
