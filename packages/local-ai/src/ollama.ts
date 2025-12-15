import axios from 'axios';

<<<<<<< HEAD
const OLLAMA_URL = 'http://localhost:11434/api/generate';
=======
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
>>>>>>> 95459d513bf131b98dcf1635953ff16ab4512523

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: Record<string, any>;
}

export async function* generateStream(request: OllamaRequest) {
<<<<<<< HEAD
  const response = await axios.post(OLLAMA_URL, request, {
=======
  const response = await axios.post(OLLAMA_URL, {
    ...request,
    stream: true
  }, {
>>>>>>> 95459d513bf131b98dcf1635953ff16ab4512523
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
