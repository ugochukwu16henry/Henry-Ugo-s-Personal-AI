import type { AgentTask, AgentStep, CodeContext } from './types'
import { AIRouter } from './ai-router'
import { CodeIndexer } from './indexer'
import { ToolRegistry, createStandardTools, type Tool } from './tools'

/**
 * Agent - Orchestrates AI tasks across the codebase
 * Can handle complex multi-step tasks like "Add OAuth2-protected journal endpoint"
 */
export class Agent {
  private router: AIRouter
  private tasks: Map<string, AgentTask> = new Map()
  private toolRegistry: ToolRegistry

  constructor(router: AIRouter, _indexer: CodeIndexer) {
    this.router = router
    this.toolRegistry = new ToolRegistry()
    
    // Register standard tools
    const standardTools = createStandardTools()
    standardTools.forEach(tool => this.toolRegistry.register(tool))
  }

  async deployTask(description: string, context?: CodeContext): Promise<AgentTask> {
    const task: AgentTask = {
      id: this.generateTaskId(),
      description,
      status: 'pending',
      steps: [],
      createdAt: Date.now()
    }

    this.tasks.set(task.id, task)

    try {
      task.status = 'in_progress'
      
      // Break down task into steps
      const steps = await this.planTask(description, context)
      task.steps = steps

      // Execute steps
      for (const step of steps) {
        await this.executeStep(step, context)
        task.steps = [...task.steps] // Update reference
      }

      task.status = 'completed'
      task.completedAt = Date.now()
    } catch (error) {
      task.status = 'failed'
      console.error('Task failed:', error)
    }

    return task
  }

  private async planTask(description: string, context?: CodeContext): Promise<AgentStep[]> {
    const availableTools = this.toolRegistry.getToolDescriptions()
    
    const prompt = `You are an AI coding agent. Break down this task into steps using available tools: "${description}"

Available tools:
${availableTools}

Available context:
${context ? `Files: ${context.files.map(f => f.path).join(', ')}` : 'None'}

Return a JSON array of steps. Each step should specify:
- action: tool name to use
- target: file path or parameter
- parameters: object with tool parameters

Format: [{"action": "read_file", "target": "path/to/file", "parameters": {"path": "path/to/file"}}, ...]`

    const response = await this.router.route({
      prompt,
      options: { model: 'local' }
    })

    // TODO: Parse JSON response and create AgentStep objects
    // For now, return a simple step
    try {
      const steps = JSON.parse(response.content)
      return steps.map((s: any, i: number) => ({
        id: `step-${i + 1}`,
        action: s.action as AgentStep['action'],
        target: s.target
      }))
    } catch {
      return [{
        id: 'step-1',
        action: 'read',
        target: 'package.json'
      }]
    }
  }

  registerTool(tool: Tool): void {
    this.toolRegistry.register(tool)
  }

  private async executeStep(step: AgentStep, _context?: CodeContext): Promise<void> {
    try {
      switch (step.action) {
        case 'read':
          step.result = await this.readFile(step.target)
          break
        case 'write':
          step.result = await this.writeFile(step.target, '')
          break
        case 'edit':
          step.result = await this.editFile(step.target, '')
          break
        case 'test':
          step.result = await this.runTests(step.target)
          break
        case 'document':
          step.result = await this.generateDocs(step.target)
          break
      }
    } catch (error) {
      step.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  private async readFile(_path: string): Promise<string> {
    // TODO: Implement file reading
    return ''
  }

  private async writeFile(_path: string, _content: string): Promise<string> {
    // TODO: Implement file writing with sandboxing
    return 'File written'
  }

  private async editFile(_path: string, _changes: string): Promise<string> {
    // TODO: Implement file editing with undo stack
    return 'File edited'
  }

  private async runTests(_path: string): Promise<string> {
    // TODO: Implement test execution
    return 'Tests passed'
  }

  private async generateDocs(_path: string): Promise<string> {
    // TODO: Implement documentation generation
    return 'Docs generated'
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  getTask(id: string): AgentTask | undefined {
    return this.tasks.get(id)
  }

  getAllTasks(): AgentTask[] {
    return Array.from(this.tasks.values())
  }
}

