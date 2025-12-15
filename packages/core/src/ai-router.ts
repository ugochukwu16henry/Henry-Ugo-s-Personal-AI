import type { AIRequest, AIResponse } from './types'
import { generateStream, isOllamaRunning, streamOpenAI } from '@henry-ai/local-ai'
import type { OllamaRequest } from '@henry-ai/local-ai'

/**
 * AI Router - intelligently routes requests to local or cloud AI
 * Auto-fallback strategy: local → OpenAI → Claude
 * 
 * Streaming version with automatic fallback
 */
export class AIRouter {
  private openAIApiKey?: string
  private claudeApiKey?: string

  constructor(options?: {
    openAIApiKey?: string
    claudeApiKey?: string
  }) {
    this.openAIApiKey = options?.openAIApiKey || process.env.OPENAI_API_KEY
    this.claudeApiKey = options?.claudeApiKey || process.env.ANTHROPIC_API_KEY
  }

  /**
   * Generate streaming response with automatic fallback
   * Priority: Ollama (local) → OpenAI → Error
   */
  async *generate(prompt: string, options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }): AsyncGenerator<string, void, unknown> {
    // Try Ollama first (local)
    if (await isOllamaRunning()) {
      const ollamaModel = options?.model || process.env.OLLAMA_MODEL || 'phi3:mini'
      
      try {
        console.log(`🤖 Using local AI (Ollama): ${ollamaModel}`)
        
        const ollamaRequest: OllamaRequest = {
          model: ollamaModel,
          prompt,
          stream: true,
          options: {
            temperature: options?.temperature || 0.7,
            num_predict: options?.maxTokens || 2000
          }
        }
        
        yield* generateStream(ollamaRequest)
        return // Success, exit early
      } catch (error: any) {
        console.warn(`⚠️  Ollama failed: ${error.message}, falling back to cloud AI`)
        // Fall through to cloud AI
      }
    }

    // Fallback to OpenAI
    if (this.openAIApiKey) {
      try {
        console.log('☁️  Using cloud AI (OpenAI)')
        
        yield* streamOpenAI(prompt, {
          apiKey: this.openAIApiKey,
          model: options?.model || 'gpt-4',
          temperature: options?.temperature || 0.7,
          maxTokens: options?.maxTokens || 2000
        })
        return // Success, exit early
      } catch (error: any) {
        console.warn(`⚠️  OpenAI failed: ${error.message}`)
        // Fall through to error
      }
    }

    // No AI backend available
    throw new Error(
      'No AI backend available. ' +
      'Please ensure Ollama is running (for local AI) or set OPENAI_API_KEY environment variable (for cloud AI).'
    )
  }

  /**
   * Simple wrapper for backward compatibility
   * Use this directly: yield* router.generate(prompt)
   */
  async *streamGenerate(prompt: string, options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }): AsyncGenerator<string, void, unknown> {
    yield* this.generate(prompt, options)
  }

  /**
   * Generate non-streaming response (collects all tokens)
   */
  async generateComplete(prompt: string, options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }): Promise<string> {
    let fullResponse = ''
    
    for await (const token of this.generate(prompt, options)) {
      fullResponse += token
    }
    
    return fullResponse
  }

  /**
   * Legacy route method (non-streaming) - for backwards compatibility
   */
  async route(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      const content = await this.generateComplete(request.prompt, {
        model: request.options?.model,
        temperature: request.options?.temperature,
        maxTokens: request.options?.maxTokens
      })
      
      const latency = Date.now() - startTime
      
      return {
        content,
        model: 'auto',
        latency
      }
    } catch (error: any) {
      throw new Error(`AI routing failed: ${error.message}`)
    }
  }
}
