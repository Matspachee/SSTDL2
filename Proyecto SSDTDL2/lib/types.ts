export interface Symbol {
  id: string
  type: string
  returnType?: string
  block: string
  line: number
  column: number
  usage: "declaration" | "reference"
  scope?: string
  isFunction?: boolean
  isStandardLibrary?: boolean
  parameters?: string[]
  isUsed?: boolean
  referenceCount?: number
  complexity?: number
}
