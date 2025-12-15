/**
 * Monaco Editor Autocomplete Provider
 * Integrates fast autocomplete with Monaco Editor
 * 
 * Note: Monaco Editor must be available globally when using these functions
 * For apps: npm install monaco-editor
 * 
 * Usage in your app:
 * import * as monaco from 'monaco-editor';
 * import { setupMonacoAutocomplete } from '@henry-ai/core';
 * 
 * window.monaco = monaco; // Make available globally, or pass as parameter
 * setupMonacoAutocomplete(manager, indexer);
 */

import { AutocompleteManager, AutocompleteRequest } from './autocomplete';
import { CodeIndexer } from './indexer';

// Monaco will be available at runtime, but not at compile time
declare global {
  const monaco: any;
}

export interface MonacoAutocompleteOptions {
  fastModel?: string;
  timeout?: number;
  useIndexer?: boolean;
  triggerCharacters?: string[];
}

/**
 * Create Monaco Editor completion item provider
 * Requires Monaco Editor to be available globally
 */
export function createMonacoAutocompleteProvider(
  manager: AutocompleteManager,
  options: MonacoAutocompleteOptions = {},
  monacoInstance?: any
): any {
  const monaco = monacoInstance || (typeof globalThis !== 'undefined' && (globalThis as any).monaco);
  
  if (!monaco) {
    throw new Error('Monaco Editor is not available. Pass monaco instance or make it available globally.');
  }
  const {
    triggerCharacters = ['.', '('],
    ...autocompleteOptions
  } = options;

  return {
    triggerCharacters,
    
    async provideCompletionItems(
      model: any, // monaco.editor.ITextModel
      position: any, // monaco.Position
      context: any, // monaco.languages.CompletionContext
      token: any // monaco.CancellationToken
    ): Promise<any> { // monaco.languages.ProviderResult<monaco.languages.CompletionList>
      // Get text around cursor
      const word = model.getWordUntilPosition(position);
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      const textAfterPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: model.getLineCount(),
        endColumn: model.getLineContent(model.getLineCount()).length + 1
      });

      // Get prefix (last 500 chars for context)
      const prefix = textUntilPosition.slice(-500);
      
      // Get suffix (next 100 chars)
      const suffix = textAfterPosition.slice(0, 100);

      // Create autocomplete request
      const request: AutocompleteRequest = {
        prefix,
        suffix,
        filePath: model.uri.toString(),
        language: model.getLanguageId(),
        maxTokens: 20,
        temperature: 0.1
      };

      try {
        // Get completions
        const result = await manager.getCompletions(request);

        if (result.completions.length === 0) {
          return { suggestions: [] };
        }

        // Convert to Monaco completion items
        const suggestions = result.completions.map(
          (completion, index) => ({
            label: completion.slice(0, 50), // First 50 chars as label
            kind: monaco.languages?.CompletionItemKind?.Text || 0,
            insertText: completion,
            detail: `AI Completion (${result.latency}ms)`,
            sortText: `0${index}`, // Prioritize AI completions
            range: {
              startLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endLineNumber: position.lineNumber,
              endColumn: word.endColumn
            }
          })
        );

        return {
          suggestions,
          incomplete: result.latency >= (options.timeout || 80) - 10 // Mark incomplete if near timeout
        };
      } catch (error) {
        console.warn('Monaco autocomplete error:', error);
        return { suggestions: [] };
      }
    }
  };
}

/**
 * Register autocomplete provider with Monaco Editor
 * Requires Monaco Editor to be available globally
 */
export function registerAutocompleteProvider(
  language: string,
  manager: AutocompleteManager,
  options?: MonacoAutocompleteOptions,
  monacoInstance?: any
): any { // monaco.IDisposable
  const monaco = monacoInstance || (typeof globalThis !== 'undefined' && (globalThis as any).monaco);
  
  if (!monaco) {
    throw new Error('Monaco Editor is not available. Pass monaco instance or make it available globally.');
  }
  
  const provider = createMonacoAutocompleteProvider(manager, options, monaco);
  return monaco.languages?.registerCompletionItemProvider(language, provider);
}

/**
 * Setup autocomplete for all supported languages
 * Requires Monaco Editor to be available globally
 */
export function setupMonacoAutocomplete(
  manager: AutocompleteManager,
  indexer?: CodeIndexer,
  options?: MonacoAutocompleteOptions,
  monacoInstance?: any
): any[] { // monaco.IDisposable[]
  if (indexer) {
    manager.setIndexer(indexer);
  }

  const monaco = monacoInstance || (typeof globalThis !== 'undefined' && (globalThis as any).monaco);
  
  if (!monaco) {
    throw new Error('Monaco Editor is not available. Pass monaco instance or make it available globally.');
  }

  const languages = [
    'typescript',
    'javascript',
    'python',
    'rust',
    'go',
    'java',
    'cpp',
    'c'
  ];

  return languages.map(lang => 
    registerAutocompleteProvider(lang, manager, options, monaco)
  );
}

