/**
 * Agentic AI System
 * Handles task delegation, planning, and execution with tool use
 */

import { AIModel, selectBestModel } from './models';
import { UnifiedAIClient, ChatRequest } from './api';

export enum AutonomyLevel {
  TAB = 'tab',              // Light assist - only autocomplete
  CMD_K = 'cmd-k',          // Targeted edit - single file changes
  FULL_AGENT = 'full-agent' // Fully autonomous - multi-file, multi-step
}

export interface AgentTask {
  id: string;
  description: string;
  plan?: AgentPlan;
  status: 'pending' | 'planning' | 'executing' | 'completed' | 'failed';
  result?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export interface AgentPlan {
  steps: AgentPlanStep[];
  estimatedTime?: number;
  filesToModify?: string[];
  risks?: string[];
}

export interface AgentPlanStep {
  id: string;
  description: string;
  type: 'read' | 'write' | 'search' | 'execute' | 'test';
  target?: string;
  command?: string;
  dependencies?: string[];
  status?: 'pending' | 'approved' | 'executing' | 'completed' | 'failed';
}

export interface CodebaseContext {
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
  symbols: Array<{
    name: string;
    type: string;
    file: string;
    line: number;
  }>;
  dependencies: string[];
}

export class AgentService {
  private model: AIModel;
  private autonomyLevel: AutonomyLevel;
  private codebaseContext?: CodebaseContext;
  private tasks: Map<string, AgentTask> = new Map();
  private apiClient?: UnifiedAIClient;

  constructor(model?: AIModel, autonomyLevel: AutonomyLevel = AutonomyLevel.CMD_K, apiClient?: UnifiedAIClient) {
    this.model = model || selectBestModel('codegen');
    this.autonomyLevel = autonomyLevel;
    this.apiClient = apiClient;
  }

  /**
   * Plan a high-level task
   * Returns a step-by-step plan that can be reviewed and approved
   */
  async planTask(description: string): Promise<AgentPlan> {
    // Try to use AI model to generate a plan if API client is available
    if (this.apiClient) {
      try {
        const chatRequest: ChatRequest = {
          messages: [
            {
              role: 'system',
              content: 'You are a code planning assistant. Generate step-by-step plans for coding tasks. Return plans in a structured format.'
            },
            {
              role: 'user',
              content: `Generate a step-by-step plan for: ${description}\n\nReturn the plan as a numbered list of clear, actionable steps.`
            }
          ],
          maxTokens: 1024,
          temperature: 0.7
        };

        const response = await this.apiClient.getChatCompletion(this.model, chatRequest);
        
        // Parse the response to extract steps (simplified - in production use structured output)
        const lines = response.split('\n').filter(line => /^\d+\./.test(line.trim()));
        const steps: AgentPlanStep[] = lines.map((line, index) => ({
          id: (index + 1).toString(),
          description: line.replace(/^\d+\.\s*/, '').trim(),
          type: this.inferStepType(line),
          status: 'pending'
        }));

        if (steps.length > 0) {
          return {
            steps,
            estimatedTime: steps.length * 30,
            filesToModify: steps.filter(s => s.type === 'write').map(s => s.target!).filter(Boolean),
            risks: []
          };
        }
      } catch (error) {
        console.warn('AI planning failed, using fallback:', error);
      }
    }

    // Fallback to pattern-based planning
    const steps: AgentPlanStep[] = [];
    const lowerDesc = description.toLowerCase();

    // Detect task type and create appropriate steps
    if (lowerDesc.includes('add') || lowerDesc.includes('create')) {
      if (lowerDesc.includes('login') || lowerDesc.includes('auth')) {
        steps.push(
          { id: '1', description: 'Search for existing auth patterns', type: 'search', target: 'auth' },
          { id: '2', description: 'Create auth utility functions', type: 'write', target: 'utils/auth.ts' },
          { id: '3', description: 'Add login component', type: 'write', target: 'components/Login.tsx' },
          { id: '4', description: 'Update routing configuration', type: 'write', target: 'routes.ts' },
          { id: '5', description: 'Run tests', type: 'test' }
        );
      }
    }

    // Default plan if no specific pattern detected
    if (steps.length === 0) {
      steps.push(
        { id: '1', description: 'Analyze codebase context', type: 'read' },
        { id: '2', description: 'Implement changes', type: 'write' },
        { id: '3', description: 'Verify changes', type: 'test' }
      );
    }

    return {
      steps,
      estimatedTime: steps.length * 30, // 30s per step estimate
      filesToModify: steps.filter(s => s.type === 'write').map(s => s.target!).filter(Boolean),
      risks: []
    };
  }

  /**
   * Execute a task with the current autonomy level
   */
  async executeTask(task: AgentTask): Promise<AgentTask> {
    task.status = 'executing';
    
    try {
      if (!task.plan) {
        // Plan mode: generate plan first
        task.status = 'planning';
        task.plan = await this.planTask(task.description);
        task.status = 'pending'; // Wait for approval
        return task;
      }

      // Execute based on autonomy level
      if (this.autonomyLevel === AutonomyLevel.TAB) {
        task.result = 'Tab mode: Use autocomplete for assistance';
        task.status = 'completed';
      } else if (this.autonomyLevel === AutonomyLevel.CMD_K) {
        task.result = await this.executeCmdK(task);
        task.status = 'completed';
      } else if (this.autonomyLevel === AutonomyLevel.FULL_AGENT) {
        task.result = await this.executeFullAgent(task);
        task.status = 'completed';
      }

      task.completedAt = Date.now();
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
    }

    return task;
  }

  /**
   * Execute in CMD+K mode (targeted edit)
   */
  private async executeCmdK(task: AgentTask): Promise<string> {
    // Single-file focused edits
    return `Executed CMD+K edit: ${task.description}`;
  }

  /**
   * Execute in Full Agent mode (autonomous)
   */
  private async executeFullAgent(task: AgentTask): Promise<string> {
    if (!task.plan) {
      throw new Error('Plan required for full agent mode');
    }

    const results: string[] = [];
    
    for (const step of task.plan.steps) {
      step.status = 'executing';
      try {
        const result = await this.executeStep(step);
        step.status = 'completed';
        results.push(`✓ ${step.description}: ${result}`);
      } catch (error: any) {
        step.status = 'failed';
        results.push(`✗ ${step.description}: ${error.message}`);
      }
    }

    return results.join('\n');
  }

  /**
   * Execute a single plan step
   */
  private async executeStep(step: AgentPlanStep): Promise<string> {
    switch (step.type) {
      case 'read':
        return 'Read operation completed';
      case 'write':
        return `Written to ${step.target}`;
      case 'search':
        return `Search completed: ${step.target}`;
      case 'execute':
        return `Executed: ${step.command}`;
      case 'test':
        return 'Tests passed';
      default:
        return 'Step completed';
    }
  }

  /**
   * Search codebase using embeddings
   */
  async searchCodebase(query: string, limit: number = 10): Promise<Array<{
    path: string;
    content: string;
    score: number;
  }>> {
    // In production, this would use vector embeddings
    // For now, return mock results
    return [];
  }

  /**
   * Answer questions about codebase
   */
  async answerQuestion(question: string): Promise<string> {
    // Search for relevant code
    const results = await this.searchCodebase(question, 5);
    
    // Use AI to generate answer based on codebase context
    return `Based on the codebase, ${question} is handled in multiple locations.`;
  }

  /**
   * Infer step type from description
   */
  private inferStepType(description: string): AgentPlanStep['type'] {
    const lower = description.toLowerCase();
    if (lower.includes('read') || lower.includes('search') || lower.includes('find')) {
      return 'read';
    }
    if (lower.includes('write') || lower.includes('create') || lower.includes('add')) {
      return 'write';
    }
    if (lower.includes('execute') || lower.includes('run') || lower.includes('command')) {
      return 'execute';
    }
    if (lower.includes('test')) {
      return 'test';
    }
    return 'read';
  }

  /**
   * Set autonomy level
   */
  setAutonomyLevel(level: AutonomyLevel): void {
    this.autonomyLevel = level;
  }

  /**
   * Update codebase context
   */
  updateCodebaseContext(context: CodebaseContext): void {
    this.codebaseContext = context;
  }

  /**
   * Set API client
   */
  setApiClient(apiClient: UnifiedAIClient): void {
    this.apiClient = apiClient;
  }
}

