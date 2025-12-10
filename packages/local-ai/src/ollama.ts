import axios from 'axios';

const OLLAMA_URL = 'http://localhost:11434/api/generate';

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: Record<string, any>;
}

export async function* generateStream(request: OllamaRequest) {
  const response = await axios.post(OLLAMA_URL, {
    ...request,
    stream: true
  }, {
    responseType: 'stream'
  });

  for await (const chunk of response.data) {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        try {
          const json = JSON.parse(line);
          if (json.response) yield json.response;
          if (json.done) break;
        } catch (e) {
          console.warn('Parse error:', line);
        }
      }
    }
  }
}

// Usage: for await (const token of generateStream({model: 'codellama', prompt: '...'})) { ... }
