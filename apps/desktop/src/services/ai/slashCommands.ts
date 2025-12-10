/**
 * Slash Commands System
 * Custom prompts like /pr, /commit, /fix, /test, etc.
 */

export interface SlashCommand {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: 'code' | 'git' | 'test' | 'review' | 'custom';
  requiresSelection?: boolean;
  requiresFiles?: boolean;
}

export const DEFAULT_SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'pr',
    name: '/pr',
    description: 'Generate PR description',
    prompt: 'Generate a pull request description for the current changes',
    category: 'git'
  },
  {
    id: 'commit',
    name: '/commit',
    description: 'Generate commit message',
    prompt: 'Generate a commit message for the current changes',
    category: 'git'
  },
  {
    id: 'fix',
    name: '/fix',
    description: 'Fix errors',
    prompt: 'Fix the errors in the selected code',
    category: 'code',
    requiresSelection: true
  },
  {
    id: 'test',
    name: '/test',
    description: 'Generate tests',
    prompt: 'Generate unit tests for the selected code',
    category: 'test',
    requiresSelection: true
  },
  {
    id: 'doc',
    name: '/doc',
    description: 'Generate documentation',
    prompt: 'Generate documentation for the selected code',
    category: 'code',
    requiresSelection: true
  },
  {
    id: 'refactor',
    name: '/refactor',
    description: 'Refactor code',
    prompt: 'Refactor the selected code to be cleaner and more maintainable',
    category: 'code',
    requiresSelection: true
  },
  {
    id: 'explain',
    name: '/explain',
    description: 'Explain code',
    prompt: 'Explain what the selected code does',
    category: 'code',
    requiresSelection: true
  },
  {
    id: 'review',
    name: '/review',
    description: 'Code review',
    prompt: 'Review the selected code for bugs, style issues, and security risks',
    category: 'review',
    requiresSelection: true
  },
  {
    id: 'optimize',
    name: '/optimize',
    description: 'Optimize code',
    prompt: 'Optimize the selected code for performance',
    category: 'code',
    requiresSelection: true
  }
];

export class SlashCommandService {
  private commands: Map<string, SlashCommand> = new Map();
  private customCommands: Map<string, SlashCommand> = new Map();

  constructor() {
    // Load default commands
    DEFAULT_SLASH_COMMANDS.forEach(cmd => {
      this.commands.set(cmd.id, cmd);
    });
  }

  /**
   * Get command by name or ID
   */
  getCommand(nameOrId: string): SlashCommand | undefined {
    return this.commands.get(nameOrId) || this.customCommands.get(nameOrId);
  }

  /**
   * Get all commands, optionally filtered by category
   */
  getAllCommands(category?: string): SlashCommand[] {
    const all = [...this.commands.values(), ...this.customCommands.values()];
    return category ? all.filter(cmd => cmd.category === category) : all;
  }

  /**
   * Execute a slash command
   */
  async executeCommand(
    command: SlashCommand,
    context: {
      selectedCode?: string;
      currentFile?: string;
      files?: string[];
      [key: string]: any;
    }
  ): Promise<string> {
    // Build prompt from command template
    let prompt = command.prompt;

    // Add context
    if (command.requiresSelection && context.selectedCode) {
      prompt += `\n\nSelected code:\n\`\`\`\n${context.selectedCode}\n\`\`\``;
    }

    if (command.requiresFiles && context.files) {
      prompt += `\n\nFiles: ${context.files.join(', ')}`;
    }

    if (context.currentFile) {
      prompt += `\n\nCurrent file: ${context.currentFile}`;
    }

    return prompt;
  }

  /**
   * Add custom command
   */
  addCustomCommand(command: SlashCommand): void {
    this.customCommands.set(command.id, command);
  }

  /**
   * Remove custom command
   */
  removeCustomCommand(id: string): boolean {
    return this.customCommands.delete(id);
  }

  /**
   * Detect if input starts with a slash command
   */
  detectCommand(input: string): { command: SlashCommand; args: string } | null {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) {
      return null;
    }

    const parts = trimmed.split(/\s+/, 2);
    const commandName = parts[0].substring(1); // Remove '/'
    const args = parts[1] || '';

    const command = this.getCommand(commandName);
    if (!command) {
      return null;
    }

    return { command, args };
  }
}

