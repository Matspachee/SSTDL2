import * as XLSX from "xlsx"

export async function parseGrammarFromExcel(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error("No se pudo leer el archivo"))
          return
        }

        // Parsear el archivo Excel
        const workbook = XLSX.read(data, { type: "binary" })

        // Obtener la primera hoja
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json<{ [key: string]: any }>(worksheet, { header: "A" })

        // Construir la gramática en formato BNF
        let grammarText = ""

        for (const row of jsonData) {
          // Verificar si la fila tiene al menos dos columnas (A y B)
          if (row.A && row.B) {
            // Formato esperado: A = no terminal, B = producción
            grammarText += `${row.A} -> ${row.B}\n`
          }
        }

        if (grammarText.trim() === "") {
          reject(new Error("El archivo no contiene definiciones de gramática válidas"))
          return
        }

        resolve(grammarText)
      } catch (error) {
        reject(new Error(`Error al procesar el archivo Excel: ${error}`))
      }
    }

    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"))
    }

    // Leer el archivo como binario
    reader.readAsBinaryString(file)
  })
}
