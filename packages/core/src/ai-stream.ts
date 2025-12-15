/**
 * Simple AI Streaming Interface with Auto-Fallback
 * 
 * Usage:
 *   for await (const token of streamGenerate(prompt)) {
 *     process.stdout.write(token);
 *   }
 */

import { AIRouter } from './ai-router';

// Singleton router instance
let routerInstance: AIRouter | null = null;

/**
 * Get or create router instance
 */
function getRouter(): AIRouter {
  if (!routerInstance) {
    routerInstance = new AIRouter({
      openAIApiKey: process.env.OPENAI_API_KEY,
      claudeApiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  return routerInstance;
}

/**
 * Generate streaming response with automatic fallback
 * Priority: Ollama (local) → OpenAI → Error
 * 
 * @param prompt - The prompt to generate
 * @param options - Optional generation options
 */
export async function* streamGenerate(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): AsyncGenerator<string, void, unknown> {
  const router = getRouter();
  yield* router.generate(prompt, options);
}

/**
 * Generate complete response (collects all tokens)
 */
export async function generateComplete(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const router = getRouter();
  return await router.generateComplete(prompt, options);
}

/**
 * Simple alias for backward compatibility
 */
export async function* generate(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): AsyncGenerator<string, void, unknown> {
  yield* streamGenerate(prompt, options);
}

