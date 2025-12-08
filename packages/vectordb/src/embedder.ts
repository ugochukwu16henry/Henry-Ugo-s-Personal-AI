import { pipeline, Pipeline } from '@xenova/transformers'
import type { EmbeddingOptions } from './types'

/**
 * Code embedding generator using local transformers
 * Default: All-MiniLM-L6-v2 (384 dimensions, fast)
 */
export class CodeEmbedder {
  private model: Pipeline | null = null
  private modelName: string = 'Xenova/all-MiniLM-L6-v2'

  async initialize(options?: EmbeddingOptions): Promise<void> {
    if (this.model) return

    try {
      this.model = await pipeline(
        'feature-extraction',
        this.modelName,
        {
          quantized: true, // Use quantized model for faster loading
          device: 'cpu' // Can be 'gpu' if available
        }
      )
    } catch (error) {
      throw new Error(`Failed to load embedding model: ${error}`)
    }
  }

  async embed(code: string): Promise<number[]> {
    if (!this.model) {
      await this.initialize()
    }

    if (!this.model) {
      throw new Error('Embedding model not initialized')
    }

    try {
      const output = await this.model(code, {
        pooling: 'mean',
        normalize: true
      })

      // Extract embedding vector from output
      return Array.from(output.data) as number[]
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error}`)
    }
  }

  async embedBatch(codeSnippets: string[]): Promise<number[][]> {
    if (!this.model) {
      await this.initialize()
    }

    // Process in parallel for better performance
    const embeddings = await Promise.all(
      codeSnippets.map(code => this.embed(code))
    )

    return embeddings
  }

  getDimension(): number {
    // All-MiniLM-L6-v2 has 384 dimensions
    return 384
  }
}

