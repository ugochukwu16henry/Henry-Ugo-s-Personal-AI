/**
 * Anthropic (Claude) API Client
 */

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicChatRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens?: number;
  temperature?: number;
  system?: string;
  stream?: boolean;
}

export interface AnthropicChatResponse {
  id: string;
  type: string;
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicClient {
  private apiKey: string;
  private baseURL: string = 'https://api.anthropic.com/v1';
  private version: string = '2023-06-01';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get chat completion
   */
  async getChatCompletion(request: AnthropicChatRequest): Promise<string> {
    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': this.version
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        max_tokens: request.max_tokens || 4096,
        temperature: request.temperature || 0.7,
        system: request.system
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data: AnthropicChatResponse = await response.json();
    return data.content[0]?.text || '';
  }

  /**
   * Stream chat completion
   */
  async *streamChatCompletion(request: AnthropicChatRequest): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': this.version
      },
      body: JSON.stringify({
        ...request,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              const text = parsed.delta?.text;
              if (text) {
                yield text;
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

