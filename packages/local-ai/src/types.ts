export interface LocalAIProvider {
  complete(prompt: string, options?: CompletionOptions): Promise<string>
  isAvailable(): Promise<boolean>
}

export interface CompletionOptions {
  temperature?: number
  maxTokens?: number
  model?: string
}

