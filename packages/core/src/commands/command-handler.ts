/**
 * Custom Command Handler
 * Handles shortcuts like /doc, /test, /pr
 */

import type { HenryAgent } from '../agent';
import type { ExecutionResult } from '../agent-executor';

export interface Command {
  name: string;
  description: string;
  aliases?: string[];
  handler: (agent: HenryAgent, args: string, options?: CommandOptions) => Promise<ExecutionResult | void>;
}

export interface CommandOptions {
  cwd?: string;
  [key: string]: any;
}

export interface CommandResult {
  success: boolean;
  output: string;
  command: string;
  args: string;
}

/**
 * Predefined Commands Registry
 */
export class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  constructor() {
    this.registerDefaultCommands();
  }

  /**
   * Register a command
   */
  register(command: Command): void {
    this.commands.set(command.name, command);
    
    // Register aliases
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.commands.set(alias, command);
      }
    }
  }

  /**
   * Get a command by name
   */
  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  /**
   * Get all registered commands
   */
  getAll(): Command[] {
    return Array.from(new Set(this.commands.values()));
  }

  /**
   * Check if input is a command
   */
  isCommand(input: string): boolean {
    const trimmed = input.trim();
    return trimmed.startsWith('/') && trimmed.length > 1;
  }

  /**
   * Parse command from input
   */
  parseCommand(input: string): { command: string; args: string } | null {
    if (!this.isCommand(input)) {
      return null;
    }

    const trimmed = input.trim();
    const parts = trimmed.split(/\s+/, 2);
    const commandName = parts[0].substring(1); // Remove leading '/'
    const args = parts[1] || '';

    return { command: commandName, args };
  }

  /**
   * Execute a command
   */
  async execute(
    input: string,
    agent: HenryAgent,
    options?: CommandOptions
  ): Promise<CommandResult> {
    const parsed = this.parseCommand(input);
    
    if (!parsed) {
      return {
        success: false,
        output: 'Not a valid command. Commands must start with /.',
        command: '',
        args: ''
      };
    }

    const { command: commandName, args } = parsed;
    const command = this.get(commandName);

    if (!command) {
      const availableCommands = this.getAll().map(c => `/${c.name}`).join(', ');
      return {
        success: false,
        output: `Unknown command: /${commandName}\n\nAvailable commands: ${availableCommands}`,
        command: commandName,
        args
      };
    }

    try {
      console.log(`🚀 Executing command: /${commandName} ${args}`);
      
      const result = await command.handler(agent, args, options);
      
      if (result && typeof result === 'object' && 'success' in result) {
        // ExecutionResult
        const execResult = result as ExecutionResult;
        return {
          success: execResult.success,
          output: execResult.success 
            ? `✅ Command completed successfully\nSteps: ${execResult.stepsCompleted}/${execResult.totalSteps}\nFiles: ${execResult.filesModified.length > 0 ? execResult.filesModified.join(', ') : 'none'}`
            : `❌ Command failed: ${execResult.error || 'Unknown error'}`,
          command: commandName,
          args
        };
      }

      return {
        success: true,
        output: `✅ Command /${commandName} completed`,
        command: commandName,
        args
      };
    } catch (error: any) {
      return {
        success: false,
        output: `❌ Error executing /${commandName}: ${error.message}`,
        command: commandName,
        args
      };
    }
  }

  /**
   * Register default commands
   */
  private registerDefaultCommands(): void {
    // /doc command - Generate documentation
    this.register({
      name: 'doc',
      description: 'Generate OpenAPI/Swagger documentation',
      handler: async (agent, args, options) => {
        if (!args.trim()) {
          throw new Error('Usage: /doc <description>\nExample: /doc Add Swagger to /wellness endpoint');
        }
        
        const goal = `Add Swagger/OpenAPI documentation for: ${args}`;
        return await agent.executeTask({ goal, ...options });
      }
    });

    // /test command - Generate tests
    this.register({
      name: 'test',
      description: 'Generate Vitest unit tests',
      handler: async (agent, args, options) => {
        if (!args.trim()) {
          throw new Error('Usage: /test <description>\nExample: /test Add tests for user authentication');
        }
        
        const goal = `Generate Vitest unit tests for: ${args}`;
        return await agent.executeTask({ goal, ...options });
      }
    });

    // /pr command - Generate PR description
    this.register({
      name: 'pr',
      description: 'Summarize changes for PR description',
      handler: async (agent, args, options) => {
        // Get git diff or use provided context
        const context = args.trim() || 'all changes in the repository';
        const goal = `Generate a pull request description summarizing: ${context}`;
        return await agent.executeTask({ goal, ...options });
      }
    });

    // /help command - Show help
    this.register({
      name: 'help',
      aliases: ['h', '?'],
      description: 'Show available commands',
      handler: async (agent, args) => {
        const commands = this.getAll();
        const helpText = [
          'Available Commands:',
          '',
          ...commands.map(c => {
            const aliases = c.aliases ? ` (aliases: ${c.aliases.map(a => `/${a}`).join(', ')})` : '';
            return `  /${c.name}${aliases}\n    ${c.description}`;
          }),
          '',
          'Usage: /<command> <arguments>',
          'Example: /doc Add Swagger to /wellness endpoint'
        ].join('\n');
        
        console.log(helpText);
        // Return void - help is just informational
        return;
      }
    });
  }
}

/**
 * Default command registry instance
 */
export const defaultCommandRegistry = new CommandRegistry();

/**
 * Execute a command from input string
 */
export async function executeCommand(
  input: string,
  agent: HenryAgent,
  options?: CommandOptions
): Promise<CommandResult> {
  return await defaultCommandRegistry.execute(input, agent, options);
}

