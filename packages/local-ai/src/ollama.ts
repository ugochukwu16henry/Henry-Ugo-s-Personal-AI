import axios from 'axios'
import type { LocalAIProvider, CompletionOptions } from './types'

/**
 * Ollama integration for local AI inference
 * Supports models like llama2, codellama, mistral, etc.
 */
export class OllamaProvider implements LocalAIProvider {
  private baseUrl: string
  private defaultModel: string

  constructor(options?: { baseUrl?: string; defaultModel?: string }) {
    this.baseUrl = options?.baseUrl || 'http://localhost:11434'
    // Default to CodeLlama 7B for code, or Phi-3-mini for speed
    this.defaultModel = options?.defaultModel || 'codellama:7b'
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 2000
      })
      return response.status === 200
    } catch {
      return false
    }
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const model = options?.model || this.defaultModel

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model,
          prompt,
          stream: false,
          options: {
            temperature: options?.temperature || 0.7,
            num_predict: options?.maxTokens || 2000
          }
        },
        {
          timeout: 120000 // 2 minutes for local inference
        }
      )

      return response.data.response || ''
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ollama API error: ${error.message}`)
      }
      throw error
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`)
      return response.data.models?.map((m: any) => m.name) || []
    } catch {
      return []
    }
  }

  /**
   * Recommended models for code tasks:
   * - codellama:7b - Best for code generation and understanding
   * - phi3:mini - Fastest, good for simple tasks
   * - mistral:7b - Balanced performance
   */
  static readonly RECOMMENDED_MODELS = {
    code: 'codellama:7b',
    fast: 'phi3:mini',
    balanced: 'mistral:7b'
  }
}

