/**
 * Rules & Memories System
 * Manages project-specific rules and memories stored in .cursor/rules.mdc
 */

import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

export interface ProjectRule {
  id: string;
  scope: string; // File glob pattern (e.g., "apps/dashboard/**/*")
  rule: string; // The rule text
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectMemory {
  id: string;
  key: string;
  value: string;
  context?: string;
  createdAt: number;
  updatedAt: number;
}

export class RulesMemoryService {
  private projectRoot?: string;
  private rules: Map<string, ProjectRule> = new Map();
  private memories: Map<string, ProjectMemory> = new Map();

  /**
   * Initialize with project root
   */
  async initialize(projectRoot: string): Promise<void> {
    this.projectRoot = projectRoot;
    await this.loadRules();
    await this.loadMemories();
  }

  /**
   * Load rules from .cursor/rules.mdc
   */
  async loadRules(): Promise<void> {
    if (!this.projectRoot) return;

    try {
      const rulesPath = await join(this.projectRoot, '.cursor', 'rules.mdc');
      const content = await readTextFile(rulesPath);
      
      // Parse .mdc format (Markdown with metadata)
      const parsed = this.parseRulesFile(content);
      this.rules = new Map(parsed.map(rule => [rule.id, rule]));
    } catch (error) {
      // File doesn't exist yet, that's okay
      console.debug('No rules file found, starting fresh');
    }
  }

  /**
   * Save rules to .cursor/rules.mdc
   */
  async saveRules(): Promise<void> {
    if (!this.projectRoot) return;

    try {
      const rulesPath = await join(this.projectRoot, '.cursor', 'rules.mdc');
      const content = this.serializeRulesFile(Array.from(this.rules.values()));
      await writeTextFile(rulesPath, content);
    } catch (error: any) {
      console.error('Failed to save rules:', error);
      throw new Error(`Failed to save rules: ${error.message}`);
    }
  }

  /**
   * Add or update a rule
   */
  async addRule(scope: string, rule: string): Promise<ProjectRule> {
    const id = `${scope}:${rule.substring(0, 20)}`.replace(/[^a-zA-Z0-9]/g, '_');
    const projectRule: ProjectRule = {
      id,
      scope,
      rule,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.rules.set(id, projectRule);
    await this.saveRules();
    return projectRule;
  }

  /**
   * Get rules applicable to a file path
   */
  getRulesForFile(filePath: string): ProjectRule[] {
    return Array.from(this.rules.values())
      .filter(rule => {
        if (!rule.enabled) return false;
        return this.matchesGlob(filePath, rule.scope);
      });
  }

  /**
   * Get all rules
   */
  getAllRules(): ProjectRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Delete a rule
   */
  async deleteRule(id: string): Promise<void> {
    this.rules.delete(id);
    await this.saveRules();
  }

  /**
   * Toggle rule enabled state
   */
  async toggleRule(id: string): Promise<void> {
    const rule = this.rules.get(id);
    if (rule) {
      rule.enabled = !rule.enabled;
      rule.updatedAt = Date.now();
      await this.saveRules();
    }
  }

  /**
   * Add or update a memory
   */
  async addMemory(key: string, value: string, context?: string): Promise<ProjectMemory> {
    const id = `memory_${Date.now()}`;
    const memory: ProjectMemory = {
      id,
      key,
      value,
      context,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.memories.set(id, memory);
    await this.saveMemories();
    return memory;
  }

  /**
   * Get memory by key
   */
  getMemory(key: string): ProjectMemory | undefined {
    return Array.from(this.memories.values()).find(m => m.key === key);
  }

  /**
   * Get all memories
   */
  getAllMemories(): ProjectMemory[] {
    return Array.from(this.memories.values());
  }

  /**
   * Search memories
   */
  searchMemories(query: string): ProjectMemory[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.memories.values()).filter(memory =>
      memory.key.toLowerCase().includes(lowerQuery) ||
      memory.value.toLowerCase().includes(lowerQuery) ||
      memory.context?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Delete a memory
   */
  async deleteMemory(id: string): Promise<void> {
    this.memories.delete(id);
    await this.saveMemories();
  }

  /**
   * Load memories from storage
   */
  private async loadMemories(): Promise<void> {
    if (!this.projectRoot) return;

    try {
      const memoriesPath = await join(this.projectRoot, '.cursor', 'memories.json');
      const content = await readTextFile(memoriesPath);
      const memories: ProjectMemory[] = JSON.parse(content);
      this.memories = new Map(memories.map(m => [m.id, m]));
    } catch (error) {
      // File doesn't exist yet, that's okay
      console.debug('No memories file found');
    }
  }

  /**
   * Save memories to storage
   */
  private async saveMemories(): Promise<void> {
    if (!this.projectRoot) return;

    try {
      const memoriesPath = await join(this.projectRoot, '.cursor', 'memories.json');
      const content = JSON.stringify(Array.from(this.memories.values()), null, 2);
      await writeTextFile(memoriesPath, content);
    } catch (error: any) {
      console.error('Failed to save memories:', error);
    }
  }

  /**
   * Parse rules file (.mdc format)
   * Format:
   * ```mdc
   * # Scope: apps/dashboard/**/*
   * Use React Server Components
   * 
   * # Scope: **/*.ts
   * Validate all inputs
   * ```
   */
  private parseRulesFile(content: string): ProjectRule[] {
    const rules: ProjectRule[] = [];
    const lines = content.split('\n');
    let currentScope = '**/*';
    let currentRule: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for scope declaration
      if (line.startsWith('# Scope:')) {
        // Save previous rule if any
        if (currentRule.length > 0) {
          const ruleText = currentRule.join('\n').trim();
          if (ruleText) {
            const id = `${currentScope}:${ruleText.substring(0, 20)}`.replace(/[^a-zA-Z0-9]/g, '_');
            rules.push({
              id,
              scope: currentScope,
              rule: ruleText,
              enabled: true,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
          currentRule = [];
        }

        // Extract new scope
        currentScope = line.replace('# Scope:', '').trim() || '**/*';
      } else if (line && !line.startsWith('#')) {
        currentRule.push(line);
      }
    }

    // Save last rule
    if (currentRule.length > 0) {
      const ruleText = currentRule.join('\n').trim();
      if (ruleText) {
        const id = `${currentScope}:${ruleText.substring(0, 20)}`.replace(/[^a-zA-Z0-9]/g, '_');
        rules.push({
          id,
          scope: currentScope,
          rule: ruleText,
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    }

    return rules;
  }

  /**
   * Serialize rules to .mdc format
   */
  private serializeRulesFile(rules: ProjectRule[]): string {
    // Group by scope
    const byScope = new Map<string, ProjectRule[]>();
    for (const rule of rules) {
      if (!byScope.has(rule.scope)) {
        byScope.set(rule.scope, []);
      }
      byScope.get(rule.scope)!.push(rule);
    }

    // Serialize
    const lines: string[] = [];
    for (const [scope, scopeRules] of byScope) {
      lines.push(`# Scope: ${scope}`);
      lines.push('');
      for (const rule of scopeRules) {
        if (rule.enabled) {
          lines.push(rule.rule);
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Check if file path matches glob pattern
   */
  private matchesGlob(filePath: string, pattern: string): boolean {
    // Simple glob matching (supports ** and *)
    const regexPattern = pattern
      .replace(/\*\*/g, '___GLOB_DOUBLE_STAR___')
      .replace(/\*/g, '[^/]*')
      .replace(/___GLOB_DOUBLE_STAR___/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }
}

