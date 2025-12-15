/**
 * Deep Codebase Intelligence
 * Provides semantic search, codebase understanding, and cross-file reasoning
 */

import { AIModel } from '../ai/models';
import { UnifiedAIClient, ChatRequest } from '../ai/api';

export interface CodeSearchResult {
  file: string;
  content: string;
  score: number;
  context?: {
    line?: number;
    symbols?: string[];
  };
}

export interface CodebaseQuery {
  question: string;
  context?: {
    currentFile?: string;
    selection?: string;
    relatedFiles?: string[];
  };
}

export interface CodebaseInsight {
  type: 'answer' | 'suggestion' | 'warning';
  content: string;
  references?: Array<{
    file: string;
    line?: number;
    snippet: string;
  }>;
}

export class CodebaseIntelligenceService {
  private model: AIModel;
  private apiClient?: UnifiedAIClient;
  private indexedFiles: Map<string, { content: string; language: string; lastModified: number }> = new Map();

  constructor(model: AIModel, apiClient?: UnifiedAIClient) {
    this.model = model;
    this.apiClient = apiClient;
  }

  /**
   * Index a file for semantic search
   */
  indexFile(filePath: string, content: string, language: string): void {
    this.indexedFiles.set(filePath, {
      content,
      language,
      lastModified: Date.now()
    });
  }

  /**
   * Remove file from index
   */
  removeFile(filePath: string): void {
    this.indexedFiles.delete(filePath);
  }

  /**
   * Clear all indexed files
   */
  clearIndex(): void {
    this.indexedFiles.clear();
  }

  /**
   * Semantic search across codebase
   * Uses AI to find relevant code based on natural language query
   */
  async semanticSearch(query: string, limit: number = 10): Promise<CodeSearchResult[]> {
    if (this.indexedFiles.size === 0) {
      return [];
    }

    // If no API client, use simple text matching
    if (!this.apiClient) {
      return this.textSearch(query, limit);
    }

    try {
      // Use AI to understand query and find relevant code
      const searchPrompt = `Given this codebase, find code relevant to: "${query}"

Return a list of files and code snippets that match the query. For each result, provide:
- File path
- Relevant code snippet (2-3 lines)
- Why it's relevant

Codebase files:\n${Array.from(this.indexedFiles.entries())
  .slice(0, 20) // Limit context size
  .map(([path, data]) => `\n=== ${path} ===\n${data.content.slice(0, 500)}...`)
  .join('\n')}`;

      const chatRequest: ChatRequest = {
        messages: [
          {
            role: 'system',
            content: 'You are a codebase search assistant. Find and return relevant code snippets based on queries.'
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        maxTokens: 2048,
        temperature: 0.3
      };

      const response = await this.apiClient.getChatCompletion(this.model, chatRequest);

      // Parse AI response to extract file paths and snippets
      // This is simplified - in production, use structured output
      const results: CodeSearchResult[] = [];
      const fileMatches = response.matchAll(/=== ([^\n]+) ===/g);

      for (const match of fileMatches) {
        const filePath = match[1];
        if (this.indexedFiles.has(filePath)) {
          results.push({
            file: filePath,
            content: this.indexedFiles.get(filePath)!.content.slice(0, 200),
            score: 0.8
          });
        }
      }

      return results.slice(0, limit);
    } catch (error) {
      console.error('Semantic search error:', error);
      return this.textSearch(query, limit);
    }
  }

  /**
   * Text-based search fallback
   */
  private textSearch(query: string, limit: number): CodeSearchResult[] {
    const queryLower = query.toLowerCase();
    const results: CodeSearchResult[] = [];

    for (const [filePath, fileData] of this.indexedFiles.entries()) {
      const contentLower = fileData.content.toLowerCase();
      if (contentLower.includes(queryLower)) {
        // Calculate simple relevance score
        const matches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
        const score = Math.min(matches / 10, 1.0);

        results.push({
          file: filePath,
          content: fileData.content.slice(0, 200),
          score
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Answer questions about the codebase
   */
  async answerQuestion(query: CodebaseQuery): Promise<CodebaseInsight> {
    if (!this.apiClient) {
      return {
        type: 'answer',
        content: 'AI service not available. Please configure an API key.'
      };
    }

    try {
      // Build context from indexed files
      const contextFiles = Array.from(this.indexedFiles.entries())
        .slice(0, 10)
        .map(([path, data]) => `\n=== ${path} ===\n${data.content.slice(0, 500)}`)
        .join('\n');

      const chatRequest: ChatRequest = {
        messages: [
          {
            role: 'system',
            content: `You are a codebase assistant. Answer questions about the codebase based on the provided code.

When referencing code, always include the file path and line number if available.`
          },
          {
            role: 'user',
            content: `Question: ${query.question}

${query.context?.currentFile ? `Current file: ${query.context.currentFile}\n` : ''}
${query.context?.selection ? `Selected code:\n\`\`\`\n${query.context.selection}\n\`\`\`\n` : ''}

Codebase context:\n${contextFiles}

Provide a detailed answer with references to specific files and code snippets.`
          }
        ],
        maxTokens: 2048,
        temperature: 0.4
      };

      const response = await this.apiClient.getChatCompletion(this.model, chatRequest);

      // Extract references from response
      const references: CodebaseInsight['references'] = [];
      const fileRefMatches = response.matchAll(/`([^`]+):(\d+)`/g);
      for (const match of fileRefMatches) {
        const filePath = match[1];
        const line = parseInt(match[2]);
        if (this.indexedFiles.has(filePath)) {
          const content = this.indexedFiles.get(filePath)!.content;
          const lines = content.split('\n');
          references.push({
            file: filePath,
            line,
            snippet: lines[line - 1] || ''
          });
        }
      }

      return {
        type: 'answer',
        content: response,
        references
      };
    } catch (error: any) {
      return {
        type: 'warning',
        content: `Error answering question: ${error.message}`
      };
    }
  }

  /**
   * Get code context for a file
   */
  getFileContext(filePath: string, lineNumber?: number): {
    file: string;
    content: string;
    symbols?: string[];
    imports?: string[];
  } | null {
    const fileData = this.indexedFiles.get(filePath);
    if (!fileData) return null;

    // Extract imports (simplified)
    const imports: string[] = [];
    const importMatches = fileData.content.matchAll(/import\s+.*?\s+from\s+['"](.+?)['"]/g);
    for (const match of importMatches) {
      imports.push(match[1]);
    }

    // Extract symbols (simplified - would use AST in production)
    const symbols: string[] = [];
    const functionMatches = fileData.content.matchAll(/(?:function|const|export\s+function)\s+(\w+)/g);
    for (const match of functionMatches) {
      symbols.push(match[1]);
    }

    return {
      file: filePath,
      content: fileData.content,
      symbols,
      imports
    };
  }

  /**
   * Find related files (based on imports, exports, usage)
   */
  findRelatedFiles(filePath: string): string[] {
    const fileData = this.indexedFiles.get(filePath);
    if (!fileData) return [];

    const related = new Set<string>();

    // Find imports
    const importMatches = fileData.content.matchAll(/from\s+['"](.+?)['"]/g);
    for (const match of importMatches) {
      const importPath = match[1];
      // Try to resolve to actual file
      const resolvedPath = this.resolveImport(filePath, importPath);
      if (resolvedPath && this.indexedFiles.has(resolvedPath)) {
        related.add(resolvedPath);
      }
    }

    // Find exports and see where they're used
    const exportMatches = fileData.content.matchAll(/export\s+(?:const|function|class|default)\s+(\w+)/g);
    for (const exportName of exportMatches) {
      // Search for usage in other files
      for (const [otherPath, otherData] of this.indexedFiles.entries()) {
        if (otherPath !== filePath && otherData.content.includes(exportName[1])) {
          related.add(otherPath);
        }
      }
    }

    return Array.from(related);
  }

  /**
   * Resolve import path to actual file path
   */
  private resolveImport(fromFile: string, importPath: string): string | null {
    // Simplified resolution - in production, use proper module resolution
    // This is a basic implementation
    if (importPath.startsWith('.')) {
      // Relative import
      const dir = fromFile.substring(0, fromFile.lastIndexOf('/'));
      return `${dir}/${importPath}`.replace(/\/+/g, '/');
    }

    // Try to find in indexed files
    for (const path of this.indexedFiles.keys()) {
      if (path.endsWith(importPath) || path.includes(importPath)) {
        return path;
      }
    }

    return null;
  }

  /**
   * Cross-file reasoning: Analyze how changes in one file affect others
   */
  async analyzeImpact(
    filePath: string,
    changeDescription: string
  ): Promise<{
    affectedFiles: string[];
    breakingChanges: string[];
    suggestions: string[];
  }> {
    const relatedFiles = this.findRelatedFiles(filePath);
    const affectedFiles = [filePath, ...relatedFiles];

    // Use AI to analyze impact
    if (this.apiClient) {
      try {
        const context = affectedFiles
          .map(path => {
            const data = this.indexedFiles.get(path);
            return data ? `\n=== ${path} ===\n${data.content.slice(0, 500)}` : '';
          })
          .join('\n');

        const chatRequest: ChatRequest = {
          messages: [
            {
              role: 'system',
              content: 'You are a code impact analyzer. Analyze how changes affect related files and identify breaking changes.'
            },
            {
              role: 'user',
              content: `Change in ${filePath}: ${changeDescription}

Related files:\n${context}

Analyze:
1. Which files will be affected
2. Potential breaking changes
3. Suggestions for safe implementation`
            }
          ],
          maxTokens: 2048,
          temperature: 0.3
        };

        const response = await this.apiClient.getChatCompletion(this.model, chatRequest);

        // Parse response (simplified)
        const breakingChanges: string[] = [];
        const suggestions: string[] = [];

        if (response.includes('BREAKING')) {
          breakingChanges.push('Potential breaking changes detected');
        }

        if (response.includes('suggestion') || response.includes('recommend')) {
          suggestions.push(response);
        }

        return {
          affectedFiles,
          breakingChanges,
          suggestions
        };
      } catch (error) {
        console.error('Impact analysis error:', error);
      }
    }

    return {
      affectedFiles,
      breakingChanges: [],
      suggestions: ['Review related files manually']
    };
  }
}

