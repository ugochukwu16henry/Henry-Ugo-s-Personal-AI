/**
 * OpenAI Streaming API
 */

export interface OpenAIRequest {
  model?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface OpenAIStreamOptions {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Stream responses from OpenAI API
 */
export async function* streamOpenAI(
  prompt: string,
  options: OpenAIStreamOptions
): AsyncGenerator<string, void, unknown> {
  const { apiKey, model = 'gpt-4', temperature = 0.7, maxTokens = 2000 } = options;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    if (!response.body) {
      throw new Error('No response body from OpenAI');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content;
              
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error: any) {
    throw new Error(`OpenAI streaming error: ${error.message}`);
  }
}

/**
 * Generate a single completion from OpenAI (non-streaming)
 */
export async function generateOpenAI(
  prompt: string,
  options: OpenAIStreamOptions
): Promise<string> {
  let fullContent = '';
  
  for await (const chunk of streamOpenAI(prompt, options)) {
    fullContent += chunk;
  }
  
  return fullContent;
}

