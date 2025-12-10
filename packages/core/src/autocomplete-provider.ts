/**
 * Monaco Editor Autocomplete Provider
 * Integrates fast autocomplete with Monaco Editor
 */

import * as monaco from 'monaco-editor';
import { AutocompleteManager, AutocompleteRequest } from './autocomplete';
import { CodeIndexer } from './indexer';

export interface MonacoAutocompleteOptions {
  fastModel?: string;
  timeout?: number;
  useIndexer?: boolean;
  triggerCharacters?: string[];
}

/**
 * Create Monaco Editor completion item provider
 */
export function createMonacoAutocompleteProvider(
  manager: AutocompleteManager,
  options: MonacoAutocompleteOptions = {}
): monaco.languages.CompletionItemProvider {
  const {
    triggerCharacters = ['.', '('],
    ...autocompleteOptions
  } = options;

  return {
    triggerCharacters,
    
    async provideCompletionItems(
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      context: monaco.languages.CompletionContext,
      token: monaco.CancellationToken
    ): Promise<monaco.languages.ProviderResult<monaco.languages.CompletionList>> {
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
        const suggestions: monaco.languages.CompletionItem[] = result.completions.map(
          (completion, index) => ({
            label: completion.slice(0, 50), // First 50 chars as label
            kind: monaco.languages.CompletionItemKind.Text,
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
 */
export function registerAutocompleteProvider(
  language: string,
  manager: AutocompleteManager,
  options?: MonacoAutocompleteOptions
): monaco.IDisposable {
  const provider = createMonacoAutocompleteProvider(manager, options);
  return monaco.languages.registerCompletionItemProvider(language, provider);
}

/**
 * Setup autocomplete for all supported languages
 */
export function setupMonacoAutocomplete(
  manager: AutocompleteManager,
  indexer?: CodeIndexer,
  options?: MonacoAutocompleteOptions
): monaco.IDisposable[] {
  if (indexer) {
    manager.setIndexer(indexer);
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
    registerAutocompleteProvider(lang, manager, options)
  );
}

