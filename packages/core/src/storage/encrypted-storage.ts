/**
 * Encrypted Storage Wrapper
 * Encrypts data before storing in any storage adapter
 * Uses Web Crypto API in browser, falls back to Node.js crypto in Node
 */

import type { StorageAdapter } from './adapter';
import { createStorageAdapter } from './adapter';

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof crypto !== 'undefined' && 'subtle' in crypto;
}

/**
 * Simple encryption using Web Crypto API
 * In production, use a proper encryption library
 */
export class EncryptedStorage {
  private adapter: StorageAdapter;
  private encryptionKey: CryptoKey | null = null;
  private keyPrefix = 'henry-enc:';

  constructor(adapter?: StorageAdapter) {
    this.adapter = adapter || createStorageAdapter();
  }

  /**
   * Initialize encryption key (derives from passphrase or generates new)
   */
  async initialize(passphrase?: string): Promise<void> {
    if (passphrase) {
      // Derive key from passphrase
      const encoder = new TextEncoder();
      const data = encoder.encode(passphrase);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      this.encryptionKey = await crypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
    } else {
      // Generate or retrieve stored key
      const storedKey = await this.adapter.get('encryption-key');
      
      if (storedKey) {
        // Import existing key
        const keyBuffer = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
        this.encryptionKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        this.encryptionKey = await crypto.subtle.generateKey(
          {
            name: 'AES-GCM',
            length: 256
          },
          true,
          ['encrypt', 'decrypt']
        );
        
        // Store key (exported)
        const exported = await crypto.subtle.exportKey('raw', this.encryptionKey);
        const keyString = btoa(String.fromCharCode(...new Uint8Array(exported)));
        await this.adapter.set('encryption-key', keyString);
      }
    }
  }

  /**
   * Encrypt data
   */
  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized. Call initialize() first.');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      dataBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt data
   */
  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized. Call initialize() first.');
    }

    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey!,
      encrypted
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Get encrypted value
   */
  async get(key: string): Promise<string | null> {
    const encrypted = await this.adapter.get(this.keyPrefix + key);
    if (!encrypted) {
      return null;
    }

    try {
      return await this.decrypt(encrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Set encrypted value
   */
  async set(key: string, value: string): Promise<void> {
    const encrypted = await this.encrypt(value);
    await this.adapter.set(this.keyPrefix + key, encrypted);
  }

  /**
   * Remove encrypted value
   */
  async remove(key: string): Promise<void> {
    await this.adapter.remove(this.keyPrefix + key);
  }

  /**
   * Clear all encrypted values
   */
  async clear(): Promise<void> {
    const keys = await this.adapter.keys();
    const encryptedKeys = keys.filter(k => k.startsWith(this.keyPrefix));
    
    for (const key of encryptedKeys) {
      await this.adapter.remove(key);
    }
  }

  /**
   * Get all encrypted keys
   */
  async keys(): Promise<string[]> {
    const keys = await this.adapter.keys();
    return keys
      .filter(k => k.startsWith(this.keyPrefix))
      .map(k => k.substring(this.keyPrefix.length));
  }
}

