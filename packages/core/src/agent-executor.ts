/**
 * Multi-step Task Execution Engine
 * Chains plan() and edit() with validation and rollback
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { HenryAgent } from './agent';
import { Sandbox } from './security/sandbox';
import { TestRunner } from './security/test-runner';

export interface ExecutionStep {
  description: string;
  file?: string;
  operation: 'edit' | 'create' | 'delete';
}

export interface ExecutionResult {
  success: boolean;
  stepsCompleted: number;
  totalSteps: number;
  filesModified: string[];
  error?: string;
  rollbackPerformed: boolean;
}

export interface ExecutionHistory {
  file: string;
  backupPath: string;
  originalContent: string;
}

/**
 * Extracts file path from step description
 * Handles patterns like:
 * - "Edit src/routes/auth.js to add /login"
 * - "Create src/utils/logger.ts"
 * - "Update src/controllers/user.ts: add validateUser function"
 */
export function extractFileFromStep(step: string): string | null {
  // Pattern 1: "Edit <file> to ..."
  let match = step.match(/Edit\s+([^\s]+(?:\.(?:js|ts|jsx|tsx|py|rs|go|java|cpp|c|h)))/i);
  if (match) return match[1];

  // Pattern 2: "Create <file>"
  match = step.match(/Create\s+([^\s]+(?:\.(?:js|ts|jsx|tsx|py|rs|go|java|cpp|c|h)))/i);
  if (match) return match[1];

  // Pattern 3: "Update <file>: ..."
  match = step.match(/Update\s+([^\s]+(?:\.(?:js|ts|jsx|tsx|py|rs|go|java|cpp|c|h)))/i);
  if (match) return match[1];

  // Pattern 4: "In <file>, ..."
  match = step.match(/In\s+([^\s]+(?:\.(?:js|ts|jsx|tsx|py|rs|go|java|cpp|c|h)))/i);
  if (match) return match[1];

  // Pattern 5: Just a file path at the start
  match = step.match(/^([^\s]+(?:\.(?:js|ts|jsx|tsx|py|rs|go|java|cpp|c|h)))/);
  if (match) return match[1];

  return null;
}

/**
 * Determines operation type from step description
 */
export function extractOperationFromStep(step: string): 'edit' | 'create' | 'delete' {
  const lower = step.toLowerCase();
  if (lower.includes('create') || lower.includes('add new file')) {
    return 'create';
  }
  if (lower.includes('delete') || lower.includes('remove file')) {
    return 'delete';
  }
  return 'edit';
}

/**
 * Task Executor
 * Executes multi-step tasks with validation and rollback
 */
export class TaskExecutor {
  private agent: HenryAgent;
  private sandbox: Sandbox;
  private testRunner: TestRunner;
  private history: ExecutionHistory[] = [];

  constructor(agent: HenryAgent, sandbox: Sandbox, testRunner: TestRunner) {
    this.agent = agent;
    this.sandbox = sandbox;
    this.testRunner = testRunner;
  }

  /**
   * Execute a multi-step task
   */
  async executeTask(task: { goal: string; cwd?: string }): Promise<ExecutionResult> {
    const cwd = task.cwd || process.cwd();
    this.history = [];

    try {
      // Step 1: Plan the task
      console.log(`📋 Planning task: "${task.goal}"`);
      const steps = await this.agent.plan(task.goal);
      
      console.log(`\n📝 Execution plan (${steps.length} steps):`);
      steps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
      });

      const filesModified: string[] = [];
      let stepsCompleted = 0;

      // Step 2: Execute each step
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        console.log(`\n▶️  Executing step ${i + 1}/${steps.length}: ${step}`);

        try {
          const filePath = extractFileFromStep(step);
          const operation = extractOperationFromStep(step);

          if (!filePath && operation === 'edit') {
            console.warn(`⚠️  Could not extract file from step: ${step}`);
            console.warn(`   Skipping step...`);
            continue;
          }

          const fullPath = filePath ? path.resolve(cwd, filePath) : null;

          // Backup existing file
          if (fullPath && operation === 'edit') {
            await this.backupFile(fullPath);
          }

          // Execute operation
          if (operation === 'create') {
            if (!fullPath) {
              throw new Error(`Cannot create file: file path not found in step: ${step}`);
            }
            await this.executeCreate(fullPath, step);
            filesModified.push(fullPath);
          } else if (operation === 'edit') {
            if (!fullPath) {
              throw new Error(`Cannot edit file: file path not found in step: ${step}`);
            }
            await this.executeEdit(fullPath, step);
            filesModified.push(fullPath);
          } else if (operation === 'delete') {
            if (!fullPath) {
              throw new Error(`Cannot delete file: file path not found in step: ${step}`);
            }
            await this.executeDelete(fullPath);
            filesModified.push(fullPath);
          }

          stepsCompleted++;

          // Validate after each step
          console.log(`   ✓ Step completed, running tests...`);
          const testResult = await this.testRunner.runTests(cwd);

          if (!testResult.success) {
            throw new Error(
              `Tests failed after step ${i + 1}: "${step}"\n` +
              `Test output:\n${testResult.output}`
            );
          }

          console.log(`   ✓ Tests passed`);

        } catch (error: any) {
          console.error(`\n❌ Error in step ${i + 1}:`, error.message);
          throw error;
        }
      }

      console.log(`\n✅ Task completed successfully!`);
      console.log(`   Steps: ${stepsCompleted}/${steps.length}`);
      console.log(`   Files modified: ${filesModified.length}`);

      return {
        success: true,
        stepsCompleted,
        totalSteps: steps.length,
        filesModified,
        rollbackPerformed: false
      };

    } catch (error: any) {
      console.error(`\n❌ Task execution failed:`, error.message);
      
      // Rollback all changes
      const rollbackSuccess = await this.rollbackAll();

      return {
        success: false,
        stepsCompleted: 0,
        totalSteps: 0,
        filesModified: [],
        error: error.message,
        rollbackPerformed: rollbackSuccess
      };
    }
  }

  /**
   * Backup a file
   */
  private async backupFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const backupPath = `${filePath}.henry-backup-${Date.now()}`;
      
      await fs.writeFile(backupPath, content, 'utf-8');

      this.history.push({
        file: filePath,
        backupPath,
        originalContent: content
      });

      console.log(`   💾 Backed up: ${filePath}`);
    } catch (error: any) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, will be created
        this.history.push({
          file: filePath,
          backupPath: '',
          originalContent: ''
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Execute edit operation
   */
  private async executeEdit(filePath: string, instruction: string): Promise<void> {
    // Stage edit in sandbox
    const diff = await this.agent.edit(filePath, instruction, {
      showDiff: false,
      autoTest: false, // We'll test manually after all steps
      requireApproval: false,
      rollbackOnTestFailure: false
    });

    // Apply edit
    await this.sandbox.applyEdit(filePath, false); // Don't create backup, we already did

    console.log(`   ✏️  Edited: ${filePath}`);
    console.log(`      Changes: +${diff.lineChanges.added} -${diff.lineChanges.removed} ~${diff.lineChanges.modified}`);
  }

  /**
   * Execute create operation
   */
  private async executeCreate(filePath: string, instruction: string): Promise<void> {
    // Create file with content from AI
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Use edit with empty file (will create it)
    try {
      await fs.writeFile(filePath, '', 'utf-8');
    } catch {
      // File might already exist
    }

    const diff = await this.agent.edit(filePath, instruction, {
      showDiff: false,
      autoTest: false,
      requireApproval: false,
      rollbackOnTestFailure: false
    });

    await this.sandbox.applyEdit(filePath, false);

    console.log(`   ✨ Created: ${filePath}`);
  }

  /**
   * Execute delete operation
   */
  private async executeDelete(filePath: string): Promise<void> {
    // Backup before delete
    await this.backupFile(filePath);
    
    // Delete file
    await fs.unlink(filePath);

    console.log(`   🗑️  Deleted: ${filePath}`);
  }

  /**
   * Rollback all changes
   */
  private async rollbackAll(): Promise<boolean> {
    if (this.history.length === 0) {
      return true;
    }

    console.log(`\n🔄 Rolling back ${this.history.length} file(s)...`);

    let success = true;
    
    // Rollback in reverse order
    for (const entry of [...this.history].reverse()) {
      try {
        if (entry.backupPath && await this.fileExists(entry.backupPath)) {
          // Restore from backup
          const backupContent = await fs.readFile(entry.backupPath, 'utf-8');
          await fs.writeFile(entry.file, backupContent, 'utf-8');
          await fs.unlink(entry.backupPath);
          console.log(`   ✓ Restored: ${entry.file}`);
        } else if (entry.originalContent === '' && await this.fileExists(entry.file)) {
          // File was created, delete it
          await fs.unlink(entry.file);
          console.log(`   ✓ Removed: ${entry.file}`);
        } else if (entry.originalContent !== '') {
          // Restore original content
          await fs.writeFile(entry.file, entry.originalContent, 'utf-8');
          console.log(`   ✓ Restored: ${entry.file}`);
        }
      } catch (error: any) {
        console.error(`   ✗ Failed to rollback ${entry.file}:`, error.message);
        success = false;
      }
    }

    this.history = [];
    return success;
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get execution history
   */
  getHistory(): ExecutionHistory[] {
    return [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }
}

