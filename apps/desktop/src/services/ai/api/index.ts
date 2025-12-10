/**
 * Unified AI API Client
 * Routes requests to the appropriate provider
 */

import { AIModel, AIModelProvider } from '../models';
import { OpenAIClient } from './openai';
import { AnthropicClient } from './anthropic';
import { GoogleGeminiClient } from './google';

export interface CompletionRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  stop?: string[];
}

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
  system?: string;
}

export class UnifiedAIClient {
  private apiKeys: Map<AIModelProvider, string> = new Map();
  private clients: Map<AIModelProvider, OpenAIClient | AnthropicClient | GoogleGeminiClient> = new Map();

  /**
   * Set API key for a provider
   */
  setApiKey(provider: AIModelProvider, apiKey: string): void {
    this.apiKeys.set(provider, apiKey);
    this.createClient(provider, apiKey);
  }

  /**
   * Create client for provider
   */
  private createClient(provider: AIModelProvider, apiKey: string): void {
    switch (provider) {
      case AIModelProvider.OPENAI:
        this.clients.set(provider, new OpenAIClient(apiKey));
        break;
      case AIModelProvider.ANTHROPIC:
        this.clients.set(provider, new AnthropicClient(apiKey));
        break;
      case AIModelProvider.GOOGLE:
        this.clients.set(provider, new GoogleGeminiClient(apiKey));
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Get completion from a model
   */
  async getCompletion(model: AIModel, request: CompletionRequest): Promise<string> {
    const client = this.getClient(model.provider);
    
    if (model.provider === AIModelProvider.OPENAI) {
      return await (client as OpenAIClient).getCompletion({
        model: model.id,
        prompt: request.prompt,
        max_tokens: request.maxTokens || 256,
        temperature: request.temperature || 0.2,
        stop: request.stop
      });
    }

    // For other providers, use chat completion
    return await this.getChatCompletion(model, {
      messages: [{ role: 'user', content: request.prompt }],
      maxTokens: request.maxTokens,
      temperature: request.temperature
    });
  }

  /**
   * Get chat completion from a model
   */
  async getChatCompletion(model: AIModel, request: ChatRequest): Promise<string> {
    const client = this.getClient(model.provider);

    if (model.provider === AIModelProvider.OPENAI) {
      return await (client as OpenAIClient).getChatCompletion({
        model: model.id,
        messages: request.messages,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.7
      });
    }

    if (model.provider === AIModelProvider.ANTHROPIC) {
      // Convert messages format for Anthropic
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = request.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.content
        }));

      return await (client as AnthropicClient).getChatCompletion({
        model: model.id,
        messages,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.7,
        system: request.messages.find(m => m.role === 'system')?.content
      });
    }

    if (model.provider === AIModelProvider.GOOGLE) {
      // Convert messages format for Gemini
      const contents = request.messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      return await (client as GoogleGeminiClient).getChatCompletion(model.id, {
        contents: contents as any,
        generationConfig: {
          maxOutputTokens: request.maxTokens || 4096,
          temperature: request.temperature || 0.7
        }
      });
    }

    throw new Error(`Unsupported provider: ${model.provider}`);
  }

  /**
   * Stream chat completion
   */
  async *streamChatCompletion(model: AIModel, request: ChatRequest): AsyncGenerator<string, void, unknown> {
    const client = this.getClient(model.provider);

    if (model.provider === AIModelProvider.OPENAI) {
      const openAIClient = client as OpenAIClient;
      yield* openAIClient.streamChatCompletion({
        model: model.id,
        messages: request.messages,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.7
      });
      return;
    }

    if (model.provider === AIModelProvider.ANTHROPIC) {
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = request.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.content
        }));

      const anthropicClient = client as AnthropicClient;
      yield* anthropicClient.streamChatCompletion({
        model: model.id,
        messages,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.7,
        system: request.messages.find(m => m.role === 'system')?.content
      });
      return;
    }

    if (model.provider === AIModelProvider.GOOGLE) {
      const contents = request.messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const geminiClient = client as GoogleGeminiClient;
      yield* geminiClient.streamChatCompletion(model.id, {
        contents: contents as any,
        generationConfig: {
          maxOutputTokens: request.maxTokens || 4096,
          temperature: request.temperature || 0.7
        }
      });
      return;
    }

    throw new Error(`Unsupported provider: ${model.provider}`);
  }

  /**
   * Get client for provider
   */
  private getClient(provider: AIModelProvider): OpenAIClient | AnthropicClient | GoogleGeminiClient {
    const client = this.clients.get(provider);
    if (!client) {
      const apiKey = this.apiKeys.get(provider);
      if (!apiKey) {
        throw new Error(`No API key set for provider: ${provider}`);
      }
      this.createClient(provider, apiKey);
      return this.clients.get(provider)!;
    }
    return client;
  }

  /**
   * Check if provider is configured
   */
  isConfigured(provider: AIModelProvider): boolean {
    return this.apiKeys.has(provider) && this.apiKeys.get(provider) !== null;
  }
}

