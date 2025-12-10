/**
 * Example: Using Agent Memory and Sync
 */

import { 
  HenryAgent, 
  AgentMemoryManager, 
  EncryptedStorage, 
  createStorageAdapter,
  initializeAgentSync 
} from '@henry-ai/core';

async function example() {
  // 1. Initialize Agent with Memory
  const agent = new HenryAgent();
  await agent.initializeMemory(); // Uses encrypted storage automatically

  // 2. Use Agent - Memory is automatically saved
  await agent.executeTask({ 
    goal: 'Add JWT authentication endpoint' 
  });

  // 3. Access Memory
  const memory = agent.getMemory();
  if (memory) {
    // Get preferences
    const prefs = memory.getMemory().preferences;
    console.log('Learned preferences:', prefs);

    // Get context for new task
    const context = memory.getContextForTask('Add OAuth endpoint');
    console.log('Context:', context);

    // Update preferences
    await memory.updatePreferences({
      codingStyle: 'MVC',
      preferredAuth: 'JWT'
    });

    // Learn code pattern
    await memory.learnPattern(
      'async function validateJWT(token: string)',
      'authentication'
    );
  }

  // 4. Initialize Sync Manager
  if (memory) {
    const syncManager = await initializeAgentSync(memory, {
      enabled: true,
      syncOnStart: true,
      syncInterval: 5 * 60 * 1000 // 5 minutes
    });

    // Export memory for backup
    const backup = await syncManager.exportMemory();
    console.log('Backup created');

    // Get last sync time
    const lastSync = await syncManager.getLastSyncTime();
    console.log('Last synced:', lastSync);
  }
}

// Example: Manual Storage Usage
async function manualStorageExample() {
  const storage = new EncryptedStorage(createStorageAdapter());
  
  // Initialize with optional passphrase
  await storage.initialize('my-secure-passphrase');

  // Store encrypted data
  await storage.set('api-key', 'sensitive-api-key-123');

  // Retrieve and decrypt
  const apiKey = await storage.get('api-key');
  console.log('Retrieved:', apiKey);

  // Clear all encrypted data
  await storage.clear();
}

// Example: Cross-Platform Usage
async function crossPlatformExample() {
  // Same code works in both Tauri and Web
  const adapter = createStorageAdapter(); // Auto-detects environment
  const storage = new EncryptedStorage(adapter);
  
  await storage.initialize();
  
  // Storage works the same way on both platforms
  await storage.set('test', 'value');
  const value = await storage.get('test');
  
  console.log('Value:', value); // Works on desktop and web!
}

// Run examples
if (require.main === module) {
  example().catch(console.error);
}

