export interface ASTNode {
  type: string
  text: string
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
  children: ASTNode[]
}

export interface ExtractedSymbol {
  name: string
  type: 'function' | 'class' | 'interface' | 'variable' | 'type' | 'method' | 'property'
  file: string
  line: number
  column: number
  signature?: string
  documentation?: string
  scope?: string
}

export interface ParseResult {
  ast: ASTNode
  symbols: ExtractedSymbol[]
  language: string
}

export type SupportedLanguage = 
  | 'typescript' 
  | 'javascript' 
  | 'python' 
  | 'rust' 
  | 'go' 
  | 'java' 
  | 'cpp'

