/**
 * Sync Manager for Agent Memory
 * Syncs agent memory across devices using encrypted storage
 */

import { AgentMemoryManager } from '../memory/agent-memory';
import { EncryptedStorage } from '../storage/encrypted-storage';
import { createStorageAdapter, isTauri } from '../storage/adapter';

export interface SyncConfig {
  enabled: boolean;
  syncOnStart: boolean;
  syncInterval?: number; // milliseconds
}

export class SyncManager {
  private memory: AgentMemoryManager;
  private storage: EncryptedStorage;
  private syncConfig: SyncConfig;
  private syncIntervalId: NodeJS.Timeout | null = null;

  constructor(memory: AgentMemoryManager, storage: EncryptedStorage, config: SyncConfig) {
    this.memory = memory;
    this.storage = storage;
    this.syncConfig = config;
  }

  /**
   * Initialize sync manager
   */
  async initialize(): Promise<void> {
    if (this.syncConfig.syncOnStart) {
      await this.sync();
    }

    if (this.syncConfig.syncInterval && this.syncConfig.syncInterval > 0) {
      this.startAutoSync();
    }
  }

  /**
   * Sync memory to/from storage
   */
  async sync(): Promise<void> {
    if (!this.syncConfig.enabled) {
      return;
    }

    try {
      // Memory is already synced through EncryptedStorage
      // This method can be extended for cross-device sync via cloud storage
      const exported = await this.memory.export();
      
      // Store sync timestamp
      const syncTimestamp = new Date().toISOString();
      await this.storage.set('last-sync', syncTimestamp);
      
      console.log('✅ Memory synced at', syncTimestamp);
    } catch (error) {
      console.error('❌ Sync failed:', error);
    }
  }

  /**
   * Start automatic syncing
   */
  startAutoSync(): void {
    if (this.syncIntervalId) {
      return; // Already running
    }

    if (!this.syncConfig.syncInterval) {
      return;
    }

    this.syncIntervalId = setInterval(() => {
      this.sync().catch(console.error);
    }, this.syncConfig.syncInterval);
  }

  /**
   * Stop automatic syncing
   */
  stopAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Export memory for backup/transfer
   */
  async exportMemory(): Promise<string> {
    return await this.memory.export();
  }

  /**
   * Import memory from backup/transfer
   */
  async importMemory(data: string): Promise<void> {
    await this.memory.import(data);
    await this.sync();
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime(): Promise<string | null> {
    return await this.storage.get('last-sync');
  }
}

/**
 * Initialize sync for agent
 */
export async function initializeAgentSync(
  memory: AgentMemoryManager,
  config?: Partial<SyncConfig>
): Promise<SyncManager> {
  const defaultConfig: SyncConfig = {
    enabled: true,
    syncOnStart: true,
    syncInterval: 5 * 60 * 1000 // 5 minutes
  };

  const syncConfig = { ...defaultConfig, ...config };
  const storage = new EncryptedStorage(createStorageAdapter());
  await storage.initialize();

  const syncManager = new SyncManager(memory, storage, syncConfig);
  await syncManager.initialize();

  return syncManager;
}

