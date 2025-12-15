# Web & Mobile Sync

This document explains the web and mobile sync system for Henry Ugo's Personal AI.

## Overview

The sync system enables:
- **PWA Support** - Web app works offline and can be installed
- **Cross-Platform** - Same codebase for desktop (Tauri) and web
- **Encrypted Storage** - Agent memory is encrypted before storage
- **Auto-Sync** - Memory syncs automatically across sessions

## Architecture

### Unified Storage Adapter

The storage system uses adapters that work on both platforms:

```typescript
import { createStorageAdapter, EncryptedStorage } from '@henry-ai/core';

// Automatically detects environment (Tauri or Web)
const adapter = createStorageAdapter();

// Wrap with encryption
const storage = new EncryptedStorage(adapter);
await storage.initialize(); // Optional: pass passphrase for encryption
```

**Storage Adapters:**
- `LocalStorageAdapter` - Browser localStorage
- `TauriStorageAdapter` - Tauri storage (uses localStorage with prefix)

### Encrypted Storage

All sensitive data is encrypted using Web Crypto API (AES-GCM):

```typescript
const encryptedStorage = new EncryptedStorage(adapter);

// Initialize with optional passphrase
await encryptedStorage.initialize('your-passphrase');

// Store encrypted data
await encryptedStorage.set('key', 'sensitive-data');

// Retrieve and decrypt
const value = await encryptedStorage.get('key');
```

**Security Features:**
- AES-256-GCM encryption
- Random IV for each encryption
- Key derivation from passphrase (optional)
- Automatic key management

### Agent Memory System

The agent memory system stores:
- Conversation history
- Learned preferences
- Code patterns
- Project-specific memories

```typescript
import { AgentMemoryManager, EncryptedStorage, createStorageAdapter } from '@henry-ai/core';

// Initialize
const storage = new EncryptedStorage(createStorageAdapter());
await storage.initialize();

const memory = new AgentMemoryManager(storage);
await memory.initialize();

// Add conversation
await memory.addConversation({
  task: 'Add login endpoint',
  steps: ['Create controller', 'Add route', 'Add validation'],
  result: 'success',
  filesModified: ['src/auth/controller.ts', 'src/auth/routes.ts']
});

// Update preferences
await memory.updatePreferences({
  codingStyle: 'MVC',
  preferredAuth: 'JWT'
});

// Learn code patterns
await memory.learnPattern(
  'async function validateJWT(token: string)',
  'authentication'
);

// Get context for AI prompts
const context = memory.getContextForTask('Add authentication');
```

### Sync Manager

The sync manager handles automatic syncing:

```typescript
import { initializeAgentSync } from '@henry-ai/core';

const syncManager = await initializeAgentSync(memory, {
  enabled: true,
  syncOnStart: true,
  syncInterval: 5 * 60 * 1000 // 5 minutes
});

// Manual sync
await syncManager.sync();

// Export/Import for backup
const backup = await syncManager.exportMemory();
await syncManager.importMemory(backup);
```

## Usage

### Desktop App (Tauri)

```typescript
import { HenryAgent } from '@henry-ai/core';

const agent = new HenryAgent();

// Initialize memory (encrypted storage)
await agent.initializeMemory();

// Use agent - memory is automatically saved
await agent.executeTask({ goal: 'Add feature' });

// Access memory
const memory = agent.getMemory();
if (memory) {
  const preferences = memory.getMemory().preferences;
}
```

### Web App (PWA)

Same code works in the web app:

```typescript
import { HenryAgent } from '@henry-ai/core';

const agent = new HenryAgent();

// Initialize memory (works in browser)
await agent.initializeMemory();

// Memory is stored in encrypted localStorage
await agent.executeTask({ goal: 'Add feature' });
```

### Shared Codebase

Both apps can share the same components and logic:

```typescript
// Shared component works in both
import { HenryAgent } from '@henry-ai/core';

function App() {
  const [agent, setAgent] = useState<HenryAgent | null>(null);

  useEffect(() => {
    const initAgent = async () => {
      const a = new HenryAgent();
      await a.initializeMemory();
      setAgent(a);
    };
    initAgent();
  }, []);

  // ... rest of component
}
```

## PWA Configuration

The web app is configured as a PWA:

**Features:**
- ✅ Offline support
- ✅ Installable (Add to Home Screen)
- ✅ Service Worker for caching
- ✅ Automatic updates

**Configuration:** `apps/web/vite.config.ts`

```typescript
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: "Henry Ugo's Personal AI",
    short_name: "Henry AI",
    display: 'standalone',
    // ...
  }
})
```

**Icons:**
- `apps/web/public/icon.png` - App icon (192x192 or 512x512)

## Storage Locations

### Desktop (Tauri)
- Uses Tauri's storage API
- Falls back to localStorage with `henry-ai:` prefix
- Files: `~/.config/henry-ai/` (platform-dependent)

### Web (PWA)
- Browser localStorage
- Encrypted before storage
- Persists across sessions
- Survives PWA uninstall/reinstall

## Memory Structure

```typescript
interface AgentMemory {
  id: string;
  version: number;
  conversations: Conversation[];      // Last 100 conversations
  preferences: {                      // Learned preferences
    codingStyle?: 'MVC' | 'functional';
    preferredAuth?: 'JWT' | 'OAuth2';
    // ...
  };
  codePatterns: CodePattern[];        // Top 50 patterns
  projects: ProjectMemory[];          // Project-specific data
}
```

## Security

### Encryption

- **Algorithm:** AES-256-GCM
- **Key Management:** Auto-generated or derived from passphrase
- **IV:** Random 12-byte IV per encryption
- **Storage:** Keys stored encrypted in storage

### Privacy

- All data encrypted at rest
- No cloud sync by default (local-only)
- Optional passphrase protection
- Clear separation between platforms

## Export/Import

### Backup Memory

```typescript
const memory = agent.getMemory();
if (memory) {
  const backup = await memory.export();
  // Save to file or cloud storage
}
```

### Restore Memory

```typescript
const backup = '...'; // Load from file
await memory.import(backup);
```

## Future Enhancements

- [ ] Cloud sync (encrypted, user-controlled)
- [ ] Cross-device sync via encrypted cloud storage
- [ ] Memory compression
- [ ] Selective sync (per-project)
- [ ] Conflict resolution for multi-device sync
- [ ] Memory analytics dashboard

## Troubleshooting

### Memory Not Persisting

- Check browser storage quota
- Verify encryption initialization
- Check console for errors

### Sync Not Working

- Verify sync is enabled in config
- Check network connectivity (if using cloud sync)
- Review sync logs

### Encryption Errors

- Ensure Web Crypto API is available
- Check browser compatibility
- Verify passphrase if using custom key

