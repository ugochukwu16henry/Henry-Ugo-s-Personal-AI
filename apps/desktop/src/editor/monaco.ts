/**
 * Monaco Editor Autocomplete Integration
 * Registers fast autocomplete provider for Monaco Editor with AI-powered suggestions
 */

import * as monaco from 'monaco-editor';
import { AutocompleteService, type AutocompleteRequest as ServiceRequest } from '../services/ai/autocomplete';
import { AVAILABLE_MODELS } from '../services/ai/models';
import { UnifiedAIClient } from '../services/ai/api';

let autocompleteService: AutocompleteService | null = null;

/**
 * Initialize autocomplete system
 */
export function initializeAutocomplete(apiClient?: UnifiedAIClient, modelId?: string) {
  const model = modelId ? AVAILABLE_MODELS[modelId] : AVAILABLE_MODELS['composer-1'];
  autocompleteService = new AutocompleteService(model, apiClient);
  return autocompleteService;
}

/**
 * Update autocomplete service with new API client or model
 */
export function updateAutocompleteService(apiClient?: UnifiedAIClient, modelId?: string) {
  if (!autocompleteService) {
    initializeAutocomplete(apiClient, modelId);
    return;
  }

  if (apiClient) {
    autocompleteService.setApiClient(apiClient);
  }

  if (modelId && AVAILABLE_MODELS[modelId]) {
    autocompleteService.setModel(AVAILABLE_MODELS[modelId]);
  }
}

/**
 * Register autocomplete provider for a language
 */
export function registerAutocompleteProvider(language: string): monaco.IDisposable {
  return monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters: ['.', '(', '[', '{', ' ', '\n'],
    provideCompletionItems: async (model, position) => {
      try {
        const word = model.getWordUntilPosition(position);
        
        const range = new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        );

        // Get full code content
        const code = model.getValue();
        
        // Create autocomplete request for our service
        const serviceRequest: ServiceRequest = {
          code,
          cursorLine: position.lineNumber,
          cursorColumn: position.column,
          filePath: model.uri.toString(),
          language: model.getLanguageId()
        };

        // Use autocomplete service if available
        if (autocompleteService) {
          const startTime = Date.now();
          const suggestions = await autocompleteService.getSuggestions(serviceRequest);
          const elapsed = Date.now() - startTime;

          if (suggestions.length === 0) {
            return { suggestions: [] };
          }

          // Convert suggestions to Monaco completion items
          const completionItems: monaco.languages.CompletionItem[] = suggestions.map((suggestion, index) => {
            const replaceRange = new monaco.Range(
              suggestion.replaceRange.startLine,
              suggestion.replaceRange.startColumn,
              suggestion.replaceRange.endLine,
              suggestion.replaceRange.endColumn
            );

            return {
              label: {
                label: suggestion.text.slice(0, 50),
                description: suggestion.metadata?.type === 'ai' ? 'AI' : 'Pattern'
              },
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: suggestion.text,
              detail: `AI Completion (${elapsed}ms)${suggestion.metadata?.source ? ` - ${suggestion.metadata.source}` : ''}`,
              sortText: `0${index}`, // Prioritize AI completions
              range: replaceRange,
              preselect: index === 0, // Preselect first suggestion
              documentation: {
                value: `**AI-powered completion**\n\n\`\`\`\n${suggestion.text.slice(0, 200)}${suggestion.text.length > 200 ? '...' : ''}\n\`\`\`\n\nConfidence: ${(suggestion.score * 100).toFixed(0)}%`,
                isTrusted: true
              }
            };
          });

          return {
            suggestions: completionItems,
            incomplete: false
          };
        }

        // No autocomplete service available
        return { suggestions: [] };
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
 * Get autocomplete service instance
 */
export function getAutocompleteService(): AutocompleteService | null {
  return autocompleteService;
}

