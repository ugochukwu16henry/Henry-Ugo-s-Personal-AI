/**
 * Core types for Henry Ugo's Personal AI
 */

export interface CodeFile {
  path: string
  content: string
  language: string
  lastModified: number
}

export interface CodeIndex {
  files: CodeFile[]
  symbols: Symbol[]
  dependencies: Dependency[]
  metadata: IndexMetadata
}

export interface Symbol {
  name: string
  type: 'function' | 'class' | 'interface' | 'variable' | 'type'
  file: string
  line: number
  column: number
  signature?: string
}

export interface Dependency {
  from: string
  to: string
  type: 'import' | 'require' | 'reference'
}

export interface IndexMetadata {
  indexedAt: number
  totalFiles: number
  totalLines: number
  languages: Record<string, number>
}

export interface AIRequest {
  prompt: string
  context?: CodeContext
  options?: AIRequestOptions
}

export interface CodeContext {
  files: CodeFile[]
  symbols?: Symbol[]
  cursor?: {
    file: string
    line: number
    column: number
  }
}

export interface AIRequestOptions {
  model?: 'local' | 'openai' | 'claude'
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface AIResponse {
  content: string
  model: string
  tokensUsed?: number
  latency: number
}

export interface AgentTask {
  id: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  steps: AgentStep[]
  createdAt: number
  completedAt?: number
}

export interface AgentStep {
  id: string
  action: 'read' | 'write' | 'edit' | 'test' | 'document'
  target: string
  result?: string
  error?: string
}

