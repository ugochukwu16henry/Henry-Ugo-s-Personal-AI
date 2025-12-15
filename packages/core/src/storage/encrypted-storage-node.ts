/**
 * Node.js compatible encrypted storage
 * Falls back to this implementation when Web Crypto API is not available
 */

import type { StorageAdapter } from './adapter';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class EncryptedStorageNode {
  private adapter: StorageAdapter;
  private encryptionKey: Buffer | null = null;
  private keyPrefix = 'henry-enc:';
  private algorithm = 'aes-256-gcm';

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  /**
   * Initialize encryption key
   */
  async initialize(passphrase?: string): Promise<void> {
    if (passphrase) {
      // Derive key from passphrase using SHA-256
      this.encryptionKey = createHash('sha256').update(passphrase).digest();
    } else {
      // Generate or retrieve stored key
      const storedKey = await this.adapter.get('encryption-key');
      
      if (storedKey) {
        this.encryptionKey = Buffer.from(storedKey, 'base64');
      } else {
        // Generate new key
        this.encryptionKey = randomBytes(32);
        
        // Store key
        await this.adapter.set('encryption-key', this.encryptionKey.toString('base64'));
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

    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv) as any;
    
    let encrypted = cipher.update(data, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = (cipher as any).getAuthTag();
    
    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([iv, authTag, encrypted]);
    
    return combined.toString('base64');
  }

  /**
   * Decrypt data
   */
  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized. Call initialize() first.');
    }

    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const iv = combined.slice(0, 12);
    const authTag = combined.slice(12, 28);
    const encrypted = combined.slice(28);
    
    const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv) as any;
    (decipher as any).setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }

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

  async set(key: string, value: string): Promise<void> {
    const encrypted = await this.encrypt(value);
    await this.adapter.set(this.keyPrefix + key, encrypted);
  }

  async remove(key: string): Promise<void> {
    await this.adapter.remove(this.keyPrefix + key);
  }

  async clear(): Promise<void> {
    const keys = await this.adapter.keys();
    const encryptedKeys = keys.filter(k => k.startsWith(this.keyPrefix));
    
    for (const key of encryptedKeys) {
      await this.adapter.remove(key);
    }
  }

  async keys(): Promise<string[]> {
    const keys = await this.adapter.keys();
    return keys
      .filter(k => k.startsWith(this.keyPrefix))
      .map(k => k.substring(this.keyPrefix.length));
  }
}

