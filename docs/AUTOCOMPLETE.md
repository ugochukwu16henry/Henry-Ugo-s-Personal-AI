# Autocomplete Engine

Ultra-fast autocomplete engine targeting <80ms latency using Phi-3-mini (3.8B) model.

## Overview

The autocomplete engine provides AI-powered code completions that are:
- **Fast**: <80ms target latency
- **Context-aware**: Uses codebase indexer for relevant context
- **Smart**: FIM (Fill-in-the-Middle) format for better predictions
- **Cached**: Intelligent caching for repeated patterns

## Quick Start

### Basic Usage

```typescript
import { fastAutocomplete, AutocompleteRequest } from '@henry-ai/core';

const request: AutocompleteRequest = {
  prefix: 'function greet(name: string): string {\n  return `Hello, ',
  suffix: '`;\n}',
  filePath: './src/example.ts',
  language: 'typescript'
};

for await (const token of fastAutocomplete(request)) {
  process.stdout.write(token);
}
```

### Using AutocompleteManager

```typescript
import { AutocompleteManager } from '@henry-ai/core';

const manager = new AutocompleteManager({
  fastModel: 'phi3:mini',
  timeout: 80,
  useIndexer: true
});

const result = await manager.getCompletions({
  prefix: 'const result = await fetch(',
  suffix: ');',
  filePath: './src/api.ts',
  language: 'typescript'
});

console.log('Completions:', result.completions);
console.log(`Latency: ${result.latency}ms`);
```

## Integration with Monaco Editor

### Desktop/Web App Integration

```typescript
import * as monaco from 'monaco-editor';
import { setupMonacoAutocomplete, AutocompleteManager, CodeIndexer } from '@henry-ai/core';

// Initialize components
const manager = new AutocompleteManager({
  fastModel: 'phi3:mini',
  timeout: 80
});

const indexer = new CodeIndexer();
await indexer.initialize();
await indexer.indexDirectory('./src');

// Setup autocomplete for all languages
const disposables = setupMonacoAutocomplete(
  manager,
  indexer, // Optional: provides context from codebase
  {
    triggerCharacters: ['.', '('],
    fastModel: 'phi3:mini',
    timeout: 80
  },
  monaco // Pass Monaco instance
);

// Cleanup when done
// disposables.forEach(d => d.dispose());
```

### Custom Provider

```typescript
import { createMonacoAutocompleteProvider } from '@henry-ai/core';
import * as monaco from 'monaco-editor';

const provider = createMonacoAutocompleteProvider(manager, {
  triggerCharacters: ['.', '(']
}, monaco);

monaco.languages.registerCompletionItemProvider('typescript', provider);
```

## Configuration

### AutocompleteManager Options

```typescript
interface AutocompleteOptions {
  useIndexer?: boolean;       // Use codebase indexer (default: true)
  fastModel?: string;         // Model name (default: 'phi3:mini')
  maxContextSymbols?: number; // Max context symbols (default: 5)
  timeout?: number;           // Max latency in ms (default: 80)
}
```

### Environment Variables

```env
# Override default model
OLLAMA_MODEL=phi3:mini

# Ollama URL
OLLAMA_URL=http://localhost:11434/api/generate
```

## Performance

### Target Metrics

- **Latency**: <80ms average
- **Cache Hit Rate**: >50% for repeated patterns
- **Completion Quality**: Context-aware, relevant suggestions

### Optimization Tips

1. **Use Fast Models**: Phi-3-mini (3.8B) is recommended
2. **Enable Caching**: Manager automatically caches completions
3. **Limit Tokens**: Default is 20 tokens (fast enough)
4. **Use Indexer**: Provides context for better completions

### Performance Monitoring

```typescript
const manager = new AutocompleteManager();

// Get stats
const stats = manager.getStats();
console.log('Cache size:', stats.cacheSize);

// Clear cache if needed
manager.clearCache();
```

## FIM (Fill-in-the-Middle) Format

The engine uses FIM format for better completions:

```
<PRE>prefix code<SUF>suffix code<MID>
```

This allows the model to understand context from both before and after the cursor.

## Context-Aware Completions

When using the indexer, completions include relevant context:

```typescript
// Indexer finds relevant symbols
const indexer = new CodeIndexer();
await indexer.initialize();
await indexer.indexDirectory('./src');

// Manager uses context automatically
manager.setIndexer(indexer);
```

The manager will:
1. Extract keywords from prefix
2. Find relevant symbols from codebase
3. Include context in prompt
4. Generate more accurate completions

## API Reference

### `fastAutocomplete(request, options)`

Async generator that yields completion tokens.

**Parameters:**
- `request: AutocompleteRequest` - Completion request
- `options: AutocompleteOptions` - Configuration

**Returns:** `AsyncGenerator<string>`

### `AutocompleteManager`

Manages autocomplete state and caching.

**Methods:**
- `getCompletions(request)` - Get completions with caching
- `setIndexer(indexer)` - Set codebase indexer
- `clearCache()` - Clear completion cache
- `getStats()` - Get performance stats

### `setupMonacoAutocomplete(manager, indexer?, options?, monaco?)`

Setup autocomplete for Monaco Editor.

**Returns:** Array of disposables

## Troubleshooting

### Slow Completions

- Check Ollama is running: `ollama serve`
- Use faster model: `phi3:mini` or `tinyllama`
- Reduce `maxTokens` in request
- Check network latency to Ollama

### No Completions

- Verify model is downloaded: `ollama list`
- Check prompt format (FIM tokens)
- Verify timeout is sufficient
- Check console for errors

### Poor Quality

- Enable indexer for context
- Increase `maxContextSymbols`
- Use larger model (trade-off: slower)
- Improve prefix/suffix context

## Examples

See `examples/autocomplete-usage.ts` for complete examples.

## Future Enhancements

- [ ] Multi-line completions
- [ ] Completion ranking/scoring
- [ ] User preference learning
- [ ] Cloud fallback for faster models
- [ ] Incremental indexing updates

