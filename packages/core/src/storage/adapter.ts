/**
 * Unified Storage Adapter
 * Works on both Tauri (desktop) and Web (browser storage)
 */

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

/**
 * Detect if running in Tauri
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Browser LocalStorage adapter
 */
export class LocalStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is not available');
    }
    localStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.clear();
  }

  async keys(): Promise<string[]> {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    return Object.keys(localStorage);
  }
}

/**
 * Tauri storage adapter (uses Tauri's store plugin or filesystem)
 */
export class TauriStorageAdapter implements StorageAdapter {
  private prefix = 'henry-ai:';

  async get(key: string): Promise<string | null> {
    try {
      // Use Tauri's store plugin if available
      // Otherwise fallback to localStorage
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return localStorage.getItem(this.prefix + key);
      }
      return null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      // Use Tauri's store plugin if available
      // Otherwise fallback to localStorage
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.setItem(this.prefix + key, value);
      }
    } catch (error) {
      console.error('Failed to set value in Tauri storage:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.removeItem(this.prefix + key);
      }
    } catch (error) {
      console.error('Failed to remove value from Tauri storage:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const keys = await this.keys();
        for (const key of keys) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Failed to clear Tauri storage:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        const allKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            allKeys.push(key.substring(this.prefix.length));
          }
        }
        return allKeys;
      }
      return [];
    } catch {
      return [];
    }
  }
}

/**
 * Create appropriate storage adapter based on environment
 */
export function createStorageAdapter(): StorageAdapter {
  if (isTauri()) {
    return new TauriStorageAdapter();
  } else {
    return new LocalStorageAdapter();
  }
}

