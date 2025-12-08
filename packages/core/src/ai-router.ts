import type { AIRequest, AIResponse, AIRequestOptions } from './types'
import type { LocalAIProvider } from '@henry-ai/local-ai'

/**
 * AI Router - intelligently routes requests to local or cloud AI
 * Auto-fallback strategy: local → OpenAI → Claude
 */
export class AIRouter {
  private localAI: LocalAIProvider | null = null
  private openAIApiKey?: string
  private claudeApiKey?: string

  constructor(options?: {
    localAI?: LocalAIProvider
    openAIApiKey?: string
    claudeApiKey?: string
  }) {
    this.localAI = options?.localAI || null
    this.openAIApiKey = options?.openAIApiKey
    this.claudeApiKey = options?.claudeApiKey
  }

  async route(request: AIRequest): Promise<AIResponse> {
    const options = request.options || {}
    const preferredModel = options.model || 'local'

    // Route based on preference
    if (preferredModel === 'local' && this.localAI) {
      try {
        return await this.callLocalAI(request)
      } catch (error) {
        console.warn('Local AI failed, falling back to cloud:', error)
        // Fall through to cloud
      }
    }

    // Cloud fallback
    if (preferredModel === 'openai' && this.openAIApiKey) {
      try {
        return await this.callOpenAI(request)
      } catch (error) {
        console.warn('OpenAI failed, trying Claude:', error)
      }
    }

    if (preferredModel === 'claude' && this.claudeApiKey) {
      try {
        return await this.callClaude(request)
      } catch (error) {
        throw new Error('All AI providers failed')
      }
    }

    throw new Error('No available AI provider')
  }

  private async callLocalAI(request: AIRequest): Promise<AIResponse> {
    if (!this.localAI) {
      throw new Error('Local AI not configured')
    }

    const startTime = Date.now()
    const content = await this.localAI.complete(request.prompt, {
      temperature: request.options?.temperature || 0.7,
      maxTokens: request.options?.maxTokens || 2000
    })
    const latency = Date.now() - startTime

    return {
      content,
      model: 'local',
      latency
    }
  }

  private async callOpenAI(request: AIRequest): Promise<AIResponse> {
    if (!this.openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const startTime = Date.now()
    
    // TODO: Implement OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openAIApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: request.prompt }],
        temperature: request.options?.temperature || 0.7,
        max_tokens: request.options?.maxTokens || 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const latency = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      model: 'openai-gpt-4',
      tokensUsed: data.usage?.total_tokens,
      latency
    }
  }

  private async callClaude(request: AIRequest): Promise<AIResponse> {
    if (!this.claudeApiKey) {
      throw new Error('Claude API key not configured')
    }

    const startTime = Date.now()
    
    // TODO: Implement Claude API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: request.options?.maxTokens || 2000,
        messages: [{ role: 'user', content: request.prompt }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`)
    }

    const data = await response.json()
    const latency = Date.now() - startTime

    return {
      content: data.content[0].text,
      model: 'claude-3-opus',
      latency
    }
  }
}

