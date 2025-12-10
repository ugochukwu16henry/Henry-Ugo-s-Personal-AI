import { generateStream } from '@henry-ai/local-ai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Sandbox, FileDiff } from './security/sandbox';
import { TestRunner, TestResult } from './security/test-runner';
import { AgentMemoryManager } from './memory/agent-memory';
import { EncryptedStorage } from './storage/encrypted-storage';
import { createStorageAdapter } from './storage/adapter';

export interface EditOptions {
  showDiff?: boolean;
  autoTest?: boolean;
  requireApproval?: boolean;
  rollbackOnTestFailure?: boolean;
}

export class HenryAgent {
  private model: string = process.env.OLLAMA_MODEL || 'codellama'; // default local
  private sandbox: Sandbox;
  private testRunner: TestRunner;
  private memory: AgentMemoryManager | null = null;
  private memoryInitialized: boolean = false;

  constructor() {
    this.sandbox = new Sandbox();
    this.testRunner = new TestRunner(this.sandbox);
  }

  /**
   * Initialize memory system (call this before using agent)
   */
  async initializeMemory(encryptionPassphrase?: string): Promise<void> {
    if (this.memoryInitialized) {
      return;
    }

    const storage = new EncryptedStorage(createStorageAdapter());
    await storage.initialize(encryptionPassphrase);
    
    this.memory = new AgentMemoryManager(storage);
    await this.memory.initialize();
    this.memoryInitialized = true;
  }

  async plan(task: string): Promise<string[]> {
    // Get context from memory if available
    let memoryContext = '';
    if (this.memory) {
      memoryContext = this.memory.getContextForTask(task);
    }

    const prompt = `You are Henry's AI coding assistant. Break this into steps:

Task: ${task}

${memoryContext ? `Context from past interactions:\n${memoryContext}\n\n` : ''}Rules: Use MVC, validate input, secure with JWT, document with Swagger.

Output JSON array of strings.`;

    let fullResponse = '';

    for await (const token of generateStream({ model: this.model, prompt })) {
      fullResponse += token;
    }

    try {
      return JSON.parse(fullResponse);
    } catch {
      // Fallback: split by newline
      return fullResponse.split('\n').filter(l => l.trim());
    }
  }

  async edit(filePath: string, instruction: string, options: EditOptions = {}): Promise<FileDiff> {
    const {
      showDiff = true,
      autoTest = true,
      requireApproval = true,
      rollbackOnTestFailure = true
    } = options;

    // Read current file
    let currentCode = '';
    try {
      currentCode = await fs.readFile(filePath, 'utf-8');
    } catch (error: any) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, will be created
    }
    
    const prompt = `FILE: ${filePath}

CURRENT:

\`\`\`js
${currentCode}
\`\`\`

INSTRUCTION: ${instruction}

RULES: Follow Henry's MVC style. Use async, validate input, return JSON.

RETURN ONLY FULL UPDATED FILE.`;

    let code = '';

    for await (const token of generateStream({ model: this.model, prompt })) {
      code += token;
    }

    // Extract code block
    const match = code.match(/```(?:js|javascript|typescript)?\n([\s\S]*?)(?:```|$)/);
    const newCode = match ? match[1].trim() : code.trim();

    // Stage the edit in sandbox
    await this.sandbox.stageEdit({
      filePath,
      newContent: newCode,
      reason: instruction
    });

    // Generate and show diff
    const diff = await this.sandbox.previewEdit(filePath, newCode);

    if (showDiff) {
      console.log(this.sandbox.formatDiffForDisplay(diff));
    }

    // If requireApproval is false or not set, apply automatically
    // In production, this would wait for user approval
    if (!requireApproval || options.requireApproval === false) {
      if (autoTest) {
        const { testResult, applied } = await this.testRunner.applyEditWithTest(
          filePath,
          rollbackOnTestFailure
        );

        if (!applied) {
          throw new Error(`Edit rejected: Tests failed after applying changes.\n${testResult.output}`);
        }

        if (!testResult.success) {
          console.warn('⚠️  Tests passed but with warnings');
        } else {
          console.log('✅ Tests passed! Changes applied.');
        }
      } else {
        await this.sandbox.applyEdit(filePath, true);
      }
    }

    return diff;
  }

  /**
   * Get the generated edit without applying it
   */
  async previewEdit(filePath: string, instruction: string): Promise<FileDiff> {
    return this.edit(filePath, instruction, { 
      showDiff: true, 
      requireApproval: true, 
      autoTest: false 
    });
  }

  /**
   * Apply a previously staged edit
   */
  async applyStagedEdit(filePath: string, autoTest: boolean = true): Promise<TestResult | null> {
    if (autoTest) {
      const { testResult, applied } = await this.testRunner.applyEditWithTest(filePath, true);
      if (!applied) {
        throw new Error(`Edit rejected: Tests failed.\n${testResult.output}`);
      }
      return testResult;
    } else {
      await this.sandbox.applyEdit(filePath, true);
      return null;
    }
  }

  /**
   * Discard a staged edit
   */
  discardEdit(filePath: string): void {
    this.sandbox.discardEdit(filePath);
  }

  /**
   * Rollback a file to its previous state
   */
  async rollback(filePath: string): Promise<void> {
    await this.sandbox.rollback(filePath);
  }

  async executeTask(options: { goal: string }): Promise<void> {
    const steps = await this.plan(options.goal);
    
    console.log('📋 Execution Plan:');
    steps.forEach((step, i) => {
      console.log(`${i + 1}. ${step}`);
    });
    
    // TODO: Execute each step automatically
    // For now, this is a placeholder
    console.log('\n✨ Task planning complete. Full execution coming soon!');

    // Save to memory
    if (this.memory) {
      await this.memory.addConversation({
        task: options.goal,
        steps,
        result: 'partial', // Will be updated when execution is complete
        filesModified: [] // Will be populated during execution
      });
    }
  }

  /**
   * Get memory manager (for advanced usage)
   */
  getMemory(): AgentMemoryManager | null {
    return this.memory;
  }
}
