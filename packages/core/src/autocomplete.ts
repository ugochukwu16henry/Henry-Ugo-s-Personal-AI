/**
 * Ultra-fast Autocomplete Engine
 * Target: <80ms latency
 */

import { generateStream } from '@henry-ai/local-ai';
import { CodeIndexer } from './indexer';
import type { Symbol, CodeContext } from './types';

export interface AutocompleteRequest {
  prefix: string;           // Text before cursor
  suffix: string;           // Text after cursor (optional)
  filePath: string;         // Current file path
  language?: string;        // Language (auto-detected if not provided)
  maxTokens?: number;       // Max tokens to generate (default: 20)
  temperature?: number;     // Temperature (default: 0.1 for deterministic)
}

export interface AutocompleteResult {
  completions: string[];
  latency: number;
  contextUsed?: boolean;
}

export interface AutocompleteOptions {
  useIndexer?: boolean;     // Use codebase indexer for context (default: true)
  fastModel?: string;       // Model for fast completions (default: 'phi3:mini')
  maxContextSymbols?: number; // Max symbols to include in context (default: 5)
  timeout?: number;         // Max time to wait (ms) (default: 80)
}

/**
 * Fast autocomplete using Phi-3-mini (3.8B) for speed
 */
export async function* fastAutocomplete(
  request: AutocompleteRequest,
  options: AutocompleteOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    useIndexer = true,
    fastModel = 'phi3:mini',
    maxContextSymbols = 5,
    timeout = 80
  } = options;

  const startTime = Date.now();

  // Build prompt with context
  let prompt = '';
  
  // Get indexer from manager if available
  const indexer = (options as any).indexer || null;
  
  if (useIndexer && indexer) {
    // Get relevant context from indexer
    const context = await getRelevantContext(request, indexer, maxContextSymbols);
    if (context && context.length > 0) {
      prompt += `// Context from codebase:\n`;
      context.forEach(symbol => {
        if (symbol.signature) {
          prompt += `// ${symbol.name}: ${symbol.signature}\n`;
        }
      });
      prompt += `\n`;
    }
  }

  // Use FIM (Fill-in-the-Middle) format for better completions
  // Format: <PRE>prefix<SUF>suffix<MID>
  prompt += `<PRE>${request.prefix}<SUF>${request.suffix || ''}<MID>`;

  // Generate with fast model and minimal tokens for speed
  const model = process.env.OLLAMA_MODEL || fastModel;
  const maxTokens = request.maxTokens || 20;
  const temperature = request.temperature ?? 0.1;

  try {
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Autocomplete timeout')), timeout);
    });

    const generatePromise = (async function* () {
      for await (const token of generateStream({
        model,
        prompt,
        stream: true,
        options: {
          num_predict: maxTokens,
          temperature,
          top_p: 0.9,
          stop: ['\n\n', '<|end|>', '<PRE>', '<SUF>', '<MID>']
        }
      })) {
        yield token;
      }
    })();

    // Race against timeout
    const iterator = generatePromise[Symbol.asyncIterator]();
    let done = false;

    while (!done && Date.now() - startTime < timeout) {
      try {
        const result = await Promise.race([
          iterator.next(),
          timeoutPromise
        ]);
        
        if (result && 'value' in result && !result.done) {
          yield result.value;
        } else {
          done = true;
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Autocomplete timeout') {
          break;
        }
        throw error;
      }
    }
  } catch (error) {
    console.warn('Autocomplete error:', error);
    // Fallback to empty (don't throw, just return nothing)
  }
}

/**
 * Get relevant context from codebase indexer
 */
async function getRelevantContext(
  request: AutocompleteRequest,
  indexer: CodeIndexer | null,
  maxSymbols: number
): Promise<Symbol[] | null> {
  if (!indexer) {
    return null;
  }

  try {
    const index = indexer.getIndex();
    if (!index) {
      return null;
    }

    // Extract keywords from prefix for context matching
    const keywords = extractKeywords(request.prefix);
    if (keywords.length === 0) {
      return null;
    }

    // Find relevant symbols from the same file first
    const sameFileSymbols = index.symbols
      .filter(s => s.file === request.filePath)
      .slice(0, maxSymbols);

    if (sameFileSymbols.length > 0) {
      return sameFileSymbols;
    }

    // Fallback: find symbols matching keywords
    const relevantSymbols = index.symbols
      .filter(s => 
        keywords.some(kw => 
          s.name.toLowerCase().includes(kw.toLowerCase()) ||
          s.signature?.toLowerCase().includes(kw.toLowerCase())
        )
      )
      .slice(0, maxSymbols);

    return relevantSymbols.length > 0 ? relevantSymbols : null;
  } catch (error) {
    console.warn('Failed to get context from indexer:', error);
    return null;
  }
}

/**
 * Extract keywords from code prefix
 */
function extractKeywords(prefix: string): string[] {
  // Extract function names, variable names, class names
  const matches = prefix.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g);
  if (!matches) {
    return [];
  }

  // Get last 5 words as context
  return matches.slice(-5).filter(word => 
    word.length > 2 && 
    !['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'import', 'from'].includes(word)
  );
}

/**
 * Autocomplete Manager
 * Manages autocomplete state and provides completion suggestions
 */
export class AutocompleteManager {
  private indexer: CodeIndexer | null = null;
  private options: AutocompleteOptions;
  private cache: Map<string, { result: string[]; timestamp: number }> = new Map();
  private cacheTimeout = 5000; // 5 seconds cache

  constructor(options: AutocompleteOptions = {}) {
    this.options = {
      useIndexer: true,
      fastModel: 'phi3:mini',
      maxContextSymbols: 5,
      timeout: 80,
      ...options
    };
  }

  /**
   * Set indexer for context-aware completions
   */
  setIndexer(indexer: CodeIndexer): void {
    this.indexer = indexer;
  }

  /**
   * Get autocomplete suggestions
   */
  async getCompletions(request: AutocompleteRequest): Promise<AutocompleteResult> {
    const startTime = Date.now();
    
    // Check cache
    const cacheKey = `${request.filePath}:${request.prefix.slice(-50)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return {
        completions: cached.result,
        latency: Date.now() - startTime,
        contextUsed: false
      };
    }

    // Collect tokens
    const tokens: string[] = [];
    
    try {
      // Pass indexer to autocomplete function
      const autocompleteOptions = {
        ...this.options,
        indexer: this.indexer
      };
      
      for await (const token of fastAutocomplete(request, autocompleteOptions)) {
        tokens.push(token);
        
        // Break if we've exceeded timeout
        if (Date.now() - startTime >= (this.options.timeout || 80)) {
          break;
        }
      }
    } catch (error) {
      console.warn('Autocomplete generation error:', error);
    }

    const completion = tokens.join('').trim();
    const completions = completion ? [completion] : [];

    // Cache result
    if (completions.length > 0) {
      this.cache.set(cacheKey, {
        result: completions,
        timestamp: Date.now()
      });
    }

    const latency = Date.now() - startTime;

    return {
      completions,
      latency,
      contextUsed: this.options.useIndexer && this.indexer !== null
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get performance stats
   */
  getStats(): { cacheSize: number; avgLatency?: number } {
    return {
      cacheSize: this.cache.size
    };
  }
}

/**
 * Format code for FIM (Fill-in-the-Middle) prompting
 */
export function formatFIMPrompt(prefix: string, suffix: string = ''): string {
  return `<PRE>${prefix}<SUF>${suffix}<MID>`;
}

/**
 * Extract completion from FIM response
 */
export function extractFIMCompletion(response: string): string {
  // Remove FIM tokens and extract completion
  return response
    .replace(/<PRE>/g, '')
    .replace(/<SUF>/g, '')
    .replace(/<MID>/g, '')
    .replace(/<\|end\|>/g, '')
    .trim();
}

