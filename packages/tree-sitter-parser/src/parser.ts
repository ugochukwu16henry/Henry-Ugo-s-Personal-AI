import Parser from 'web-tree-sitter'
import type { ParseResult, ExtractedSymbol, SupportedLanguage, ASTNode } from './types'
import * as path from 'path'
import * as fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createRequire } from 'module'

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

/**
 * Tree-sitter parser for multi-language AST parsing
 * Supports TypeScript, JavaScript, Python, Rust, Go, Java, C++
 */
export class TreeSitterParser {
  private parser: Parser | null = null
  private languages: Map<string, Parser.Language> = new Map()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return
    
    await Parser.init()
    this.parser = new Parser()
    this.initialized = true
  }

  async parse(
    code: string, 
    language: SupportedLanguage,
    filePath: string
  ): Promise<ParseResult> {
    if (!this.parser) {
      await this.initialize()
    }

    if (!this.parser) {
      throw new Error('Parser not initialized')
    }

    try {
      // Load language grammar
      const lang = await this.loadLanguage(language)
      this.parser.setLanguage(lang)
      
      // Parse code
      const tree = this.parser.parse(code)
      
      // Extract symbols from AST
      const symbols = this.extractSymbolsFromAST(tree.rootNode, filePath, code)
      const ast = this.buildAST(tree.rootNode, code)

      return {
        ast,
        symbols,
        language
      }
    } catch (error) {
      // Fallback to regex-based extraction
      console.warn(`Tree-sitter parse failed for ${language}, using fallback:`, error)
      const symbols = this.extractSymbols(code, language, filePath)
      const ast = this.buildAST(code)

      return {
        ast,
        symbols,
        language
      }
    }
  }

  private extractSymbolsFromAST(
    node: any,
    filePath: string,
    code: string
  ): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = []
    const lines = code.split('\n')

    const traverse = (n: any) => {
      // Extract function declarations
      if (n.type === 'function_declaration' || n.type === 'function' || n.type === 'method_definition') {
        const nameNode = n.childForFieldName('name') || n.firstChild
        if (nameNode) {
          const name = code.slice(nameNode.startIndex, nameNode.endIndex)
          const startPos = nameNode.startPosition
          symbols.push({
            name,
            type: 'function',
            file: filePath,
            line: startPos.row + 1,
            column: startPos.column,
            signature: code.slice(n.startIndex, Math.min(n.endIndex, n.startIndex + 100))
          })
        }
      }

      // Extract class declarations
      if (n.type === 'class_declaration' || n.type === 'class') {
        const nameNode = n.childForFieldName('name') || n.firstChild
        if (nameNode) {
          const name = code.slice(nameNode.startIndex, nameNode.endIndex)
          const startPos = nameNode.startPosition
          symbols.push({
            name,
            type: 'class',
            file: filePath,
            line: startPos.row + 1,
            column: startPos.column,
            signature: code.slice(n.startIndex, Math.min(n.endIndex, n.startIndex + 100))
          })
        }
      }

      // Extract interface/type declarations (TypeScript)
      if (n.type === 'interface_declaration' || n.type === 'type_alias_declaration') {
        const nameNode = n.childForFieldName('name') || n.firstChild
        if (nameNode) {
          const name = code.slice(nameNode.startIndex, nameNode.endIndex)
          const startPos = nameNode.startPosition
          symbols.push({
            name,
            type: n.type === 'interface_declaration' ? 'interface' : 'type',
            file: filePath,
            line: startPos.row + 1,
            column: startPos.column,
            signature: code.slice(n.startIndex, Math.min(n.endIndex, n.startIndex + 100))
          })
        }
      }

      // Recursively traverse children
      for (let i = 0; i < n.childCount; i++) {
        traverse(n.child(i))
      }
    }

    traverse(node)
    return symbols
  }

  private extractSymbols(
    code: string, 
    language: SupportedLanguage,
    filePath: string
  ): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = []
    const lines = code.split('\n')

    // Basic regex-based extraction (fallback)
    const patterns = this.getSymbolPatterns(language)

    lines.forEach((line, index) => {
      for (const pattern of patterns) {
        const match = line.match(pattern.regex)
        if (match) {
          symbols.push({
            name: match[1] || match[0],
            type: pattern.type,
            file: filePath,
            line: index + 1,
            column: line.indexOf(match[1] || match[0]),
            signature: line.trim()
          })
        }
      }
    })

    return symbols
  }

  private getSymbolPatterns(language: SupportedLanguage) {
    const patterns: Array<{ regex: RegExp; type: ExtractedSymbol['type'] }> = []

    switch (language) {
      case 'typescript':
      case 'javascript':
        patterns.push(
          { regex: /(?:export\s+)?(?:async\s+)?function\s+(\w+)/, type: 'function' },
          { regex: /(?:export\s+)?class\s+(\w+)/, type: 'class' },
          { regex: /(?:export\s+)?interface\s+(\w+)/, type: 'interface' },
          { regex: /(?:export\s+)?type\s+(\w+)/, type: 'type' },
          { regex: /const\s+(\w+)\s*=/, type: 'variable' }
        )
        break
      case 'python':
        patterns.push(
          { regex: /def\s+(\w+)/, type: 'function' },
          { regex: /class\s+(\w+)/, type: 'class' },
          { regex: /(\w+)\s*=/, type: 'variable' }
        )
        break
      case 'rust':
        patterns.push(
          { regex: /fn\s+(\w+)/, type: 'function' },
          { regex: /struct\s+(\w+)/, type: 'class' },
          { regex: /impl\s+(\w+)/, type: 'class' }
        )
        break
    }

    return patterns
  }

  private buildAST(node: any, code: string): ASTNode {
    if (node && typeof node.startPosition === 'function') {
      // Real Tree-sitter node
      const startPos = node.startPosition()
      const endPos = node.endPosition()
      const children: ASTNode[] = []
      
      for (let i = 0; i < node.childCount; i++) {
        children.push(this.buildAST(node.child(i), code))
      }

      return {
        type: node.type,
        text: code.slice(node.startIndex, node.endIndex),
        startPosition: { row: startPos.row, column: startPos.column },
        endPosition: { row: endPos.row, column: endPos.column },
        children
      }
    }

    // Fallback for placeholder
    return {
      type: 'program',
      text: code,
      startPosition: { row: 0, column: 0 },
      endPosition: { row: code.split('\n').length - 1, column: 0 },
      children: []
    }
  }

  async loadLanguage(language: SupportedLanguage): Promise<Parser.Language> {
    if (this.languages.has(language)) {
      return this.languages.get(language)!
    }

    // WASM file paths - try multiple locations
    const wasmFileNames: Record<string, string> = {
      'javascript': 'tree-sitter-javascript.wasm',
      'typescript': 'tree-sitter-typescript.wasm',
      'python': 'tree-sitter-python.wasm',
      'rust': 'tree-sitter-rust.wasm',
      'go': 'tree-sitter-go.wasm',
      'java': 'tree-sitter-java.wasm',
      'cpp': 'tree-sitter-cpp.wasm'
    }

    const wasmFileName = wasmFileNames[language]
    if (!wasmFileName) {
      throw new Error(`Language ${language} not supported`)
    }

    // Try loading from different paths
    const possiblePaths = [
      // Local wasm directory (for Node.js)
      path.join(__dirname, '../wasm', wasmFileName),
      // Try from node_modules if packages are installed
      ...(language === 'javascript' ? [require.resolve?.('tree-sitter-javascript/tree-sitter-javascript.wasm')] : []),
      ...(language === 'typescript' ? [require.resolve?.('tree-sitter-typescript/tree-sitter-typescript.wasm')] : []),
      // Public directory (for web)
      `/wasm/${wasmFileName}`,
      // Root wasm directory
      `./wasm/${wasmFileName}`,
      // Direct file name (if in same directory)
      wasmFileName
    ].filter(Boolean)

    for (const wasmPath of possiblePaths) {
      try {
        // For Node.js, read the file and load it
        if (wasmPath.startsWith('/') || wasmPath.includes(path.sep)) {
          try {
            const wasmBuffer = await fs.readFile(wasmPath)
            const Lang = await Parser.Language.load(wasmBuffer)
            this.languages.set(language, Lang)
            return Lang
          } catch {
            continue
          }
        } else {
          // For web/browser, use URL
          const Lang = await Parser.Language.load(wasmPath)
          this.languages.set(language, Lang)
          return Lang
        }
      } catch {
        continue
      }
    }

    // If all paths fail, throw error (will trigger regex fallback)
    throw new Error(`Could not load ${language} grammar from any location`)
  }
}
