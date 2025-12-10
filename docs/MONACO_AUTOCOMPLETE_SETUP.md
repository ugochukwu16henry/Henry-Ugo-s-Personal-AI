# Monaco Editor Autocomplete Setup

This document explains how the autocomplete integration works in the desktop app.

## Implementation

### File: `apps/desktop/src/editor/monaco.ts`

This file provides Monaco Editor integration for the fast autocomplete engine:

- **`initializeAutocomplete()`** - Initialize the autocomplete manager
- **`registerAutocompleteProvider()`** - Register provider for a specific language
- **`setupAutocompleteForAllLanguages()`** - Setup for all supported languages
- **`getAutocompleteManager()`** - Get the manager instance
- **`updateIndexer()`** - Update codebase indexer for context

### Usage

The autocomplete is automatically initialized when the `CodeEditor` component mounts:

```typescript
// In CodeEditor.tsx
useEffect(() => {
  setupAutocompleteForAllLanguages();
}, []);
```

### How It Works

1. User types in Monaco Editor
2. Monaco triggers completion provider
3. Provider extracts prefix/suffix around cursor
4. Calls `fastAutocomplete()` with context
5. Streams tokens back (collected for Monaco)
6. Returns completion suggestion

### Features

- **<80ms latency** - Fast completion
- **Context-aware** - Uses codebase indexer
- **Cached** - Intelligent caching for repeated patterns
- **Multi-language** - Works with TypeScript, JavaScript, Python, etc.

### Configuration

Autocomplete uses these defaults:
- Model: `phi3:mini` (fast, 3.8GB RAM)
- Timeout: 80ms
- Max tokens: 20
- Temperature: 0.1 (deterministic)

Override via environment variables:
```env
OLLAMA_MODEL=phi3:mini
OLLAMA_URL=http://localhost:11434/api/generate
```

## Status

✅ Implementation complete
⚠️ Requires core package rebuild to ensure exports are available
✅ Monaco integration code ready
⚠️ Testing needed once build issues resolved

