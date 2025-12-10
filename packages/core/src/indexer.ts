import * as fs from 'fs/promises'
import * as path from 'path'
import type { CodeIndex, CodeFile, Symbol, Dependency, IndexMetadata } from './types'
import { TreeSitterParser } from '@henry-ai/tree-sitter-parser'
import { VectorDatabase } from '@henry-ai/vectordb'

/**
 * High-performance codebase indexer with Tree-sitter + LanceDB
 * Target: <15s for 10k LOC
 */
export class CodeIndexer {
  private index: CodeIndex | null = null
  private treeSitter: TreeSitterParser
  private vectorDb: VectorDatabase

  constructor() {
    this.treeSitter = new TreeSitterParser()
    this.vectorDb = new VectorDatabase()
  }

  async initialize(): Promise<void> {
    // Initialize Tree-sitter parser
    await this.treeSitter.initialize()
    
    // Initialize vector database
    await this.vectorDb.initialize()
  }

  async indexFile(filePath: string): Promise<void> {
    const code = await fs.readFile(filePath, 'utf-8')
    const language = this.detectLanguage(filePath)
    
    // Parse with Tree-sitter
    const parseResult = await this.treeSitter.parse(code, language as any, filePath)
    
    // Extract symbols
    const symbols = parseResult.symbols.map(s => ({
      name: s.name,
      type: s.type as 'function' | 'class' | 'interface' | 'variable' | 'type',
      file: s.file,
      line: s.line,
      column: s.column,
      signature: s.signature
    }))

    // Store in LanceDB for semantic search
    if (symbols.length > 0) {
      const embeddings = symbols
        .filter(s => s.type === 'function' || s.type === 'class')
        .map(s => {
          const lines = code.split('\n')
          const startLine = Math.max(0, s.line - 1)
          const endLine = Math.min(lines.length, s.line + 20) // Include more context
          
          return {
            id: `${filePath}:${s.line}`,
            filePath,
            code: lines.slice(startLine, endLine).join('\n'),
            embedding: [],
            metadata: {
              language,
              symbol: s.name,
              line: s.line,
              column: s.column,
              type: s.type
            }
          }
        })

      if (embeddings.length > 0) {
        await this.vectorDb.addEmbeddings(embeddings as any)
      }
    }
  }

  async indexDirectory(dirPath: string, options?: { enableVectorSearch?: boolean }): Promise<CodeIndex> {
    await this.initialize()
    
    const startTime = Date.now()
    const files: CodeFile[] = []
    const symbols: Symbol[] = []
    const dependencies: Dependency[] = []

    await this.walkDirectory(dirPath, files)

    // Parallel processing for performance
    await Promise.all(
      files.map(async (file) => {
        try {
          // Use Tree-sitter for accurate symbol extraction
          const parseResult = await this.treeSitter.parse(
            file.content,
            file.language as any,
            file.path
          )

          const fileSymbols = parseResult.symbols
            .filter(s => s.type === 'function' || s.type === 'class' || s.type === 'interface' || s.type === 'variable' || s.type === 'type')
            .map(s => ({
              name: s.name,
              type: s.type as 'function' | 'class' | 'interface' | 'variable' | 'type',
              file: s.file,
              line: s.line,
              column: s.column,
              signature: s.signature
            }))

          const fileDeps = await this.extractDependencies(file)
          symbols.push(...fileSymbols)
          dependencies.push(...fileDeps)

          // Index embeddings for semantic search
          if (options?.enableVectorSearch !== false) {
            await this.indexVectorEmbeddings(file, fileSymbols)
          }
        } catch (error) {
          console.warn(`Failed to index ${file.path}:`, error)
        }
      })
    )

    const metadata: IndexMetadata = {
      indexedAt: Date.now(),
      totalFiles: files.length,
      totalLines: files.reduce((sum, f) => sum + f.content.split('\n').length, 0),
      languages: this.countLanguages(files)
    }

    this.index = {
      files,
      symbols,
      dependencies,
      metadata
    }

    const elapsed = Date.now() - startTime
    console.log(`Indexed ${files.length} files in ${elapsed}ms`)

    return this.index
  }

  private async walkDirectory(dirPath: string, files: CodeFile[]): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      // Skip node_modules, .git, dist, etc.
      if (entry.name.startsWith('.') || 
          entry.name === 'node_modules' || 
          entry.name === 'dist' || 
          entry.name === 'build') {
        continue
      }

      if (entry.isDirectory()) {
        await this.walkDirectory(fullPath, files)
      } else if (this.isCodeFile(entry.name)) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8')
          const stats = await fs.stat(fullPath)
          
          files.push({
            path: fullPath,
            content,
            language: this.detectLanguage(entry.name),
            lastModified: stats.mtimeMs
          })
        } catch (error) {
          // Skip files that can't be read
          console.warn(`Skipping ${fullPath}:`, error)
        }
      }
    }
  }

  private isCodeFile(filename: string): boolean {
    const codeExtensions = [
      '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
      '.py', '.rs', '.go', '.java', '.cpp', '.c', '.h',
      '.rb', '.php', '.swift', '.kt', '.cs', '.scala',
      '.json', '.yaml', '.yml', '.toml', '.md'
    ]
    return codeExtensions.some(ext => filename.endsWith(ext))
  }

  private detectLanguage(filename: string): string {
    const ext = path.extname(filename)
    const langMap: Record<string, string> = {
      '.ts': 'typescript', '.tsx': 'typescript',
      '.js': 'javascript', '.jsx': 'javascript',
      '.py': 'python', '.rs': 'rust',
      '.go': 'go', '.java': 'java'
    }
    return langMap[ext] || 'unknown'
  }

  private async indexVectorEmbeddings(file: CodeFile, symbols: Symbol[]): Promise<void> {
    // Index function/class definitions for semantic search
    const codeSnippets = symbols
      .filter(s => s.type === 'function' || s.type === 'class')
      .map(s => {
        const lines = file.content.split('\n')
        const startLine = Math.max(0, s.line - 1)
        const endLine = Math.min(lines.length, s.line + 20) // More context
        return {
          id: `${file.path}:${s.line}`,
          filePath: file.path,
          code: lines.slice(startLine, endLine).join('\n'),
          embedding: [],
          metadata: {
            language: file.language,
            symbol: s.name,
            line: s.line,
            column: s.column,
            type: s.type
          }
        }
      })

    if (codeSnippets.length > 0) {
      await this.vectorDb.addEmbeddings(codeSnippets as any)
    }
  }

  private async extractDependencies(_file: CodeFile): Promise<Dependency[]> {
    // TODO: Implement dependency extraction using Tree-sitter
    return []
  }

  private countLanguages(files: CodeFile[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const file of files) {
      counts[file.language] = (counts[file.language] || 0) + 1
    }
    return counts
  }

  getIndex(): CodeIndex | null {
    return this.index
  }

  async getFile(filePath: string): Promise<CodeFile | null> {
    if (!this.index) return null
    return this.index.files.find(f => f.path === filePath) || null
  }

  async searchCode(query: string, limit: number = 10): Promise<any[]> {
    return await this.vectorDb.search(query, { limit })
  }
}
