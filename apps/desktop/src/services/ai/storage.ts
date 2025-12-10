/**
 * API Key Storage Service
 * Stores API keys securely using Tauri's secure storage
 */

export class APIKeyStorage {
  private storageKey = 'henry_ai_api_keys';

  /**
   * Store API key for a provider
   */
  async setApiKey(provider: string, apiKey: string): Promise<void> {
    try {
      // Try using Tauri store if available
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        try {
          const { Store } = await import('@tauri-apps/plugin-store');
          const store = await Store.load('.api-keys.dat');
          await store.set(`${this.storageKey}.${provider}`, apiKey);
          await store.save();
          return;
        } catch (storeError) {
          // Store plugin not available, fall through to localStorage
          console.debug('Tauri store not available, using localStorage');
        }
      }

      // Fallback to localStorage
      const keys = this.getStoredKeys();
      keys[provider] = apiKey;
      localStorage.setItem(this.storageKey, JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to store API key:', error);
      // Fallback to localStorage
      const keys = this.getStoredKeys();
      keys[provider] = apiKey;
      localStorage.setItem(this.storageKey, JSON.stringify(keys));
    }
  }

  /**
   * Get API key for a provider
   */
  async getApiKey(provider: string): Promise<string | null> {
    try {
      // Try using Tauri store if available
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        try {
          const { Store } = await import('@tauri-apps/plugin-store');
          const store = await Store.load('.api-keys.dat');
          const value = await store.get(`${this.storageKey}.${provider}`);
          return (value as string) || null;
        } catch (error) {
          // Fall through to localStorage
          console.debug('Tauri store not available, using localStorage');
        }
      }

      // Fallback to localStorage
      const keys = this.getStoredKeys();
      return keys[provider] || null;
    } catch (error) {
      console.error('Failed to get API key:', error);
      // Fallback to localStorage
      const keys = this.getStoredKeys();
      return keys[provider] || null;
    }
  }

  /**
   * Get all stored API keys
   */
  async getAllApiKeys(): Promise<Record<string, string>> {
    try {
      // Try using Tauri store if available
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        try {
          const { Store } = await import('@tauri-apps/plugin-store');
          const store = await Store.load('.api-keys.dat');
          const all = await store.entries();
          const keys: Record<string, string> = {};
          
          for (const [key, value] of all) {
            if (key.startsWith(`${this.storageKey}.`)) {
              const provider = key.replace(`${this.storageKey}.`, '');
              keys[provider] = value as string;
            }
          }
          
          return keys;
        } catch (error) {
          // Fall through to localStorage
          console.debug('Tauri store not available, using localStorage');
        }
      }

      // Fallback to localStorage
      return this.getStoredKeys();
    } catch (error) {
      console.error('Failed to get API keys:', error);
      return this.getStoredKeys();
    }
  }

  /**
   * Delete API key for a provider
   */
  async deleteApiKey(provider: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        try {
          const { Store } = await import('@tauri-apps/plugin-store');
          const store = await Store.load('.api-keys.dat');
          await store.delete(`${this.storageKey}.${provider}`);
          await store.save();
          return;
        } catch (error) {
          // Fall through to localStorage
          console.debug('Tauri store not available, using localStorage');
        }
      }

      const keys = this.getStoredKeys();
      delete keys[provider];
      localStorage.setItem(this.storageKey, JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to delete API key:', error);
      const keys = this.getStoredKeys();
      delete keys[provider];
      localStorage.setItem(this.storageKey, JSON.stringify(keys));
    }
  }

  /**
   * Get stored keys from localStorage
   */
  private getStoredKeys(): Record<string, string> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
}

