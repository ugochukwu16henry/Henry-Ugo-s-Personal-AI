/**
 * Monaco Editor Autocomplete Integration
 * Registers fast autocomplete provider for Monaco Editor
 */

import * as monaco from 'monaco-editor';
import { fastAutocomplete, AutocompleteManager, AutocompleteRequest } from '@henry-ai/core';
import type { CodeIndexer } from '@henry-ai/core';

let autocompleteManager: AutocompleteManager | null = null;
let indexer: CodeIndexer | null = null;

/**
 * Initialize autocomplete system
 */
export function initializeAutocomplete(manager?: AutocompleteManager, codeIndexer?: CodeIndexer) {
  autocompleteManager = manager || new AutocompleteManager({
    fastModel: 'phi3:mini',
    timeout: 80,
    useIndexer: true,
    maxContextSymbols: 5
  });

  if (codeIndexer) {
    indexer = codeIndexer;
    autocompleteManager.setIndexer(codeIndexer);
  }

  return autocompleteManager;
}

/**
 * Register autocomplete provider for a language
 */
export function registerAutocompleteProvider(language: string): monaco.IDisposable {
  return monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters: ['.', '(', '[', '{', ' '],
    provideCompletionItems: async (model, position) => {
      try {
        const word = model.getWordUntilPosition(position);
        
        const range = new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        );

        // Get prefix (text before cursor, limited to last 500 chars for performance)
        const prefixStartLine = Math.max(1, position.lineNumber - 20);
        const prefix = model.getValueInRange({
          startLineNumber: prefixStartLine,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        // Get suffix (text after cursor, limited to next 100 chars)
        const suffixEndLine = Math.min(model.getLineCount(), position.lineNumber + 5);
        const suffix = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: suffixEndLine,
          endColumn: model.getLineMaxColumn(suffixEndLine)
        });

        // Create autocomplete request
        const request: AutocompleteRequest = {
          prefix: prefix.slice(-500), // Last 500 chars
          suffix: suffix.slice(0, 100), // First 100 chars
          filePath: model.uri.toString(),
          language: model.getLanguageId(),
          maxTokens: 20,
          temperature: 0.1
        };

        // Use manager if available, otherwise use direct function
        let completion = '';
        const startTime = Date.now();

        if (autocompleteManager) {
          // Use manager (includes caching)
          const result = await autocompleteManager.getCompletions(request);
          if (result.completions.length > 0) {
            completion = result.completions[0];
          }
        } else {
          // Fallback: use direct function
          for await (const token of fastAutocomplete(request)) {
            completion += token;
            
            // Break if taking too long
            if (Date.now() - startTime > 75) {
              break;
            }
          }
        }

        if (!completion || completion.trim().length === 0) {
          return { suggestions: [] };
        }

        // Create completion item
        const completionItem: monaco.languages.CompletionItem = {
          label: completion.slice(0, 50), // First 50 chars as label
          kind: monaco.languages.CompletionItemKind.Text,
          insertText: completion,
          detail: `AI Completion${autocompleteManager ? ` (${Date.now() - startTime}ms)` : ''}`,
          sortText: '0', // Prioritize AI completions
          range,
          preselect: false,
          documentation: {
            value: `**AI-powered completion**\n\n${completion.slice(0, 200)}${completion.length > 200 ? '...' : ''}`,
            isTrusted: true
          }
        };

        return {
          suggestions: [completionItem],
          incomplete: false
        };
      } catch (error) {
        console.warn('Autocomplete error:', error);
        // Return empty suggestions on error (don't break editor)
        return { suggestions: [] };
      }
    }
  });
}

/**
 * Setup autocomplete for all supported languages
 */
export function setupAutocompleteForAllLanguages(): monaco.IDisposable[] {
  const languages = [
    'typescript',
    'javascript',
    'typescriptreact',
    'javascriptreact',
    'python',
    'rust',
    'go',
    'java',
    'cpp',
    'c'
  ];

  return languages.map(lang => registerAutocompleteProvider(lang));
}

/**
 * Get autocomplete manager instance
 */
export function getAutocompleteManager(): AutocompleteManager | null {
  return autocompleteManager;
}

/**
 * Update indexer for context-aware completions
 */
export function updateIndexer(newIndexer: CodeIndexer) {
  indexer = newIndexer;
  if (autocompleteManager) {
    autocompleteManager.setIndexer(newIndexer);
  }
}

