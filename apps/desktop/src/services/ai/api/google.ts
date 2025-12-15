/**
 * Google Gemini API Client
 */

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{
    text: string;
  }>;
}

export interface GeminiChatRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    maxOutputTokens?: number;
    temperature?: number;
  };
}

export interface GeminiChatResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GoogleGeminiClient {
  private apiKey: string;
  private baseURL: string = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get chat completion
   */
  async getChatCompletion(model: string, request: GeminiChatRequest): Promise<string> {
    const response = await fetch(
      `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`Google Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data: GeminiChatResponse = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  /**
   * Stream chat completion
   */
  async *streamChatCompletion(model: string, request: GeminiChatRequest): AsyncGenerator<string, void, unknown> {
    const response = await fetch(
      `${this.baseURL}/models/${model}:streamGenerateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`Google Gemini API error: ${error.error?.message || response.statusText}`);
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
      const chunks = buffer.split('\n');
      buffer = chunks.pop() || '';

      for (const chunk of chunks) {
        if (chunk.trim()) {
          try {
            const parsed = JSON.parse(chunk);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              yield text;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

