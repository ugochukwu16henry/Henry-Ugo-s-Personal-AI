/**
 * Agent Memory System
 * Stores conversation history, preferences, and learned patterns
 */
import type { StorageAdapter } from '../storage/adapter';

export interface AgentMemory {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  
  // Conversation history
  conversations: Conversation[];
  
  // Learned preferences
  preferences: {
    codingStyle?: 'MVC' | 'functional';
    preferredAuth?: 'JWT' | 'OAuth2';
    preferredDocs?: 'Swagger' | 'OpenAPI';
    preferredTestFramework?: 'jest' | 'vitest';
  };
  
  // Code patterns learned from user
  codePatterns: CodePattern[];
  
  // Project-specific memories
  projects: ProjectMemory[];
}

export interface Conversation {
  id: string;
  timestamp: string;
  task: string;
  steps: string[];
  result: 'success' | 'partial' | 'failed';
  filesModified: string[];
}

export interface CodePattern {
  id: string;
  pattern: string;
  context: string;
  usageCount: number;
  lastUsed: string;
}

export interface ProjectMemory {
  projectPath: string;
  rules: Record<string, any>;
  commonFiles: string[];
  dependencies: string[];
  lastIndexed: string;
}

export class AgentMemoryManager {
  private storage: StorageAdapter;
  private memory: AgentMemory | null = null;
  private memoryKey = 'henry-agent-memory';

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Initialize memory from storage
   */
  async initialize(): Promise<void> {
    try {
      const data = await this.storage.get(this.memoryKey);
      if (data) {
        this.memory = JSON.parse(data);
      } else {
        this.memory = this.createDefaultMemory();
        await this.save();
      }
    } catch (error) {
      console.warn('Failed to load memory, creating new:', error);
      this.memory = this.createDefaultMemory();
      await this.save();
    }
  }

  /**
   * Create default memory structure
   */
  private createDefaultMemory(): AgentMemory {
    return {
      id: this.generateId(),
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      conversations: [],
      preferences: {},
      codePatterns: [],
      projects: []
    };
  }

  /**
   * Get current memory
   */
  getMemory(): AgentMemory {
    if (!this.memory) {
      throw new Error('Memory not initialized. Call initialize() first.');
    }
    return this.memory;
  }

  /**
   * Save memory to storage
   */
  async save(): Promise<void> {
    if (!this.memory) {
      throw new Error('Memory not initialized');
    }
    
    this.memory.updatedAt = new Date().toISOString();
    this.memory.version += 1;
    
    await this.storage.set(this.memoryKey, JSON.stringify(this.memory));
  }

  /**
   * Add a conversation to memory
   */
  async addConversation(conversation: Omit<Conversation, 'id' | 'timestamp'>): Promise<void> {
    const memory = this.getMemory();
    
    memory.conversations.push({
      ...conversation,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 conversations
    if (memory.conversations.length > 100) {
      memory.conversations = memory.conversations.slice(-100);
    }
    
    await this.save();
  }

  /**
   * Update preferences
   */
  async updatePreferences(preferences: Partial<AgentMemory['preferences']>): Promise<void> {
    const memory = this.getMemory();
    memory.preferences = { ...memory.preferences, ...preferences };
    await this.save();
  }

  /**
   * Learn a code pattern
   */
  async learnPattern(pattern: string, context: string): Promise<void> {
    const memory = this.getMemory();
    
    // Check if pattern already exists
    const existing = memory.codePatterns.find(p => p.pattern === pattern);
    
    if (existing) {
      existing.usageCount += 1;
      existing.lastUsed = new Date().toISOString();
    } else {
      memory.codePatterns.push({
        id: this.generateId(),
        pattern,
        context,
        usageCount: 1,
        lastUsed: new Date().toISOString()
      });
    }
    
    // Keep only top 50 patterns
    memory.codePatterns.sort((a, b) => b.usageCount - a.usageCount);
    if (memory.codePatterns.length > 50) {
      memory.codePatterns = memory.codePatterns.slice(0, 50);
    }
    
    await this.save();
  }

  /**
   * Get or create project memory
   */
  getProjectMemory(projectPath: string): ProjectMemory {
    const memory = this.getMemory();
    let projectMem = memory.projects.find(p => p.projectPath === projectPath);
    
    if (!projectMem) {
      projectMem = {
        projectPath,
        rules: {},
        commonFiles: [],
        dependencies: [],
        lastIndexed: new Date().toISOString()
      };
      memory.projects.push(projectMem);
    }
    
    return projectMem;
  }

  /**
   * Update project memory
   */
  async updateProjectMemory(projectPath: string, updates: Partial<ProjectMemory>): Promise<void> {
    const memory = this.getMemory();
    const projectMem = this.getProjectMemory(projectPath);
    
    Object.assign(projectMem, updates);
    await this.save();
  }

  /**
   * Get context for AI prompts (relevant memories)
   */
  getContextForTask(task: string): string {
    const memory = this.getMemory();
    const context: string[] = [];
    
    // Add preferences
    if (memory.preferences.codingStyle) {
      context.push(`Preferred coding style: ${memory.preferences.codingStyle}`);
    }
    
    // Add relevant patterns
    const relevantPatterns = memory.codePatterns
      .filter(p => task.toLowerCase().includes(p.context.toLowerCase()) || 
                   p.context.toLowerCase().includes(task.toLowerCase()))
      .slice(0, 5);
    
    if (relevantPatterns.length > 0) {
      context.push('Relevant patterns:');
      relevantPatterns.forEach(p => {
        context.push(`- ${p.pattern} (used ${p.usageCount} times)`);
      });
    }
    
    // Add recent similar tasks
    const recentSimilar = memory.conversations
      .filter(c => c.task.toLowerCase().includes(task.toLowerCase()) || 
                   task.toLowerCase().includes(c.task.toLowerCase()))
      .slice(-3);
    
    if (recentSimilar.length > 0) {
      context.push('Recent similar tasks:');
      recentSimilar.forEach(c => {
        context.push(`- ${c.task} (${c.result})`);
      });
    }
    
    return context.join('\n');
  }

  /**
   * Clear all memory (use with caution)
   */
  async clear(): Promise<void> {
    this.memory = this.createDefaultMemory();
    await this.save();
  }

  /**
   * Export memory for backup
   */
  async export(): Promise<string> {
    return JSON.stringify(this.getMemory(), null, 2);
  }

  /**
   * Import memory from backup
   */
  async import(data: string): Promise<void> {
    const imported = JSON.parse(data) as AgentMemory;
    
    // Validate structure
    if (!imported.id || !imported.version || !Array.isArray(imported.conversations)) {
      throw new Error('Invalid memory format');
    }
    
    this.memory = imported;
    await this.save();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

