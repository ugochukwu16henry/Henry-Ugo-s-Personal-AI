# File Watcher for Incremental Indexing

Automatic file watching and incremental indexing for real-time codebase updates.

## Overview

The file watcher monitors your codebase for changes and automatically re-indexes files when they're modified, created, or deleted. This keeps the index up-to-date without manual re-indexing.

## Features

- ✅ **Automatic re-indexing** on file changes
- ✅ **Debounced updates** to avoid excessive re-indexing
- ✅ **File addition/deletion** tracking
- ✅ **Performance optimized** with debouncing
- ✅ **Configurable** ignore patterns
- ✅ **Error handling** for file access issues

## Usage

### Basic Setup

```typescript
import { CodeIndexer } from '@henry-ai/core';

const indexer = new CodeIndexer();
await indexer.initialize();

// Start watching a directory
indexer.startWatching('./src', {
  ignored: /node_modules|\.git|dist|build/,
  debounce: 500 // 500ms debounce
});
```

### Desktop App Integration

The file watcher is automatically initialized in the desktop app (`apps/desktop/src/main.tsx`):

```typescript
// Automatically starts when app launches
indexer.startWatching(projectPath, {
  ignored: /node_modules|\.git|dist|build|\.next|coverage|\.henry-db/,
  debounce: 500
});
```

### Custom Configuration

```typescript
indexer.startWatching('./my-project', {
  // Ignore patterns (regex or array)
  ignored: [
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    '*.test.js'
  ],
  
  // Debounce delay in milliseconds
  debounce: 1000 // Wait 1 second after last change
});
```

### Stop Watching

```typescript
// Stop the file watcher
indexer.stopWatching();
```

### Check Status

```typescript
// Check if watcher is running
if (indexer.isWatching()) {
  console.log('Watcher is active');
}

// Get watched paths
const paths = indexer.getWatchedPaths();
console.log('Watched:', paths);
```

## How It Works

### Event Flow

```
File Changed
   ↓
Debounce (500ms default)
   ↓
Update File Index
   ├─ Parse with Tree-sitter
   ├─ Extract symbols
   ├─ Update vector embeddings
   └─ Update index metadata
   ↓
Index Updated ✅
```

### Debouncing

Changes are debounced to avoid excessive re-indexing:
- Default: 500ms delay
- Only the last change within the delay window is processed
- Prevents rapid re-indexing when saving files multiple times quickly

### Ignore Patterns

Files matching ignore patterns are not watched:
- `node_modules/` - Dependencies
- `.git/` - Git repository
- `dist/`, `build/` - Build outputs
- `.next/`, `coverage/` - Framework/tool outputs

## Events Handled

### File Changes (`change`)
- Files modified are re-indexed
- Symbols and embeddings updated

### File Additions (`add`)
- New files are indexed
- Added to codebase index

### File Deletions (`unlink`)
- Removed from index
- Symbols and embeddings cleaned up

## Performance

### Optimization Features

1. **Debouncing** - Prevents rapid re-indexing
2. **Stability Threshold** - Waits for file writes to complete
3. **Ignore Patterns** - Skips unnecessary files
4. **Incremental Updates** - Only changed files are re-indexed

### Expected Performance

- **Small files** (<100 LOC): <100ms
- **Medium files** (100-1000 LOC): 100-500ms
- **Large files** (>1000 LOC): 500-2000ms

## Configuration

### Environment Variables

```env
# No specific env vars needed
# Watcher uses indexer's existing configuration
```

### Options

```typescript
interface WatchOptions {
  ignored?: RegExp | string[]  // Patterns to ignore
  debounce?: number            // Debounce delay (ms)
}
```

## Desktop App Integration

### Automatic Initialization

The desktop app automatically initializes the file watcher on startup:

```typescript
// apps/desktop/src/main.tsx
import { CodeIndexer } from '@henry-ai/core';

async function initializeIndexer() {
  const indexer = new CodeIndexer();
  await indexer.initialize();
  
  indexer.startWatching(process.cwd(), {
    ignored: /node_modules|\.git|dist|build/,
    debounce: 500
  });
  
  // Make available globally
  (window as any).__henryIndexer = indexer;
}
```

### Accessing from App

```typescript
// Access indexer from anywhere
const indexer = (window as any).__henryIndexer;

if (indexer) {
  // Use indexer methods
  const results = await indexer.searchCode('function login');
}
```

## Limitations

### Platform Support

- ✅ **Node.js** - Full support
- ✅ **Tauri Desktop** - Full support (uses Node.js)
- ❌ **Browser** - Not supported (no file system access)

### File System Access

- Requires file system permissions
- May not work in restricted environments
- Tauri handles permissions automatically

## Troubleshooting

### Watcher Not Starting

**Issue:** Watcher doesn't start or stops immediately

**Solutions:**
- Check file system permissions
- Verify directory path exists
- Check console for errors
- Ensure not running in browser-only mode

### Excessive Re-indexing

**Issue:** Too many re-index operations

**Solutions:**
- Increase debounce delay
- Add more ignore patterns
- Check for rapid file saves from editor

### Memory Usage

**Issue:** High memory usage

**Solutions:**
- Limit watch scope to specific directories
- Add more ignore patterns
- Restart watcher periodically for large projects

## Best Practices

1. **Limit scope** - Only watch relevant directories
2. **Ignore patterns** - Exclude build outputs and dependencies
3. **Debounce** - Use appropriate delay (500-1000ms)
4. **Error handling** - Handle file access errors gracefully
5. **Monitor performance** - Watch for excessive CPU usage

## Future Enhancements

- [ ] Watch multiple directories
- [ ] Configurable debounce per file type
- [ ] Priority queue for indexing
- [ ] Background worker for indexing
- [ ] WebSocket notifications for changes

