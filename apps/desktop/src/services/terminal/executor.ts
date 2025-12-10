/**
 * Terminal Command Executor
 * Executes shell commands via Tauri shell plugin
 */

import { Command } from '@tauri-apps/plugin-shell';

// Helper function to get platform
async function getPlatform(): Promise<string> {
  try {
    const { platform } = await import('@tauri-apps/plugin-os');
    const platformName = await platform.platform();
    return platformName === 'windows' ? 'win32' : 'unix';
  } catch {
    return 'win32'; // Default fallback
  }
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export class TerminalExecutor {
  private processes: Map<string, Command> = new Map();

  /**
   * Execute a shell command
   */
  async execute(command: string, args: string[] = [], cwd?: string): Promise<CommandResult> {
    try {
      // Parse command and args if command is a string
      let cmdName = command;
      let cmdArgs = args;

      // Handle commands like "npm install" by splitting
      if (command.includes(' ') && args.length === 0) {
        const parts = command.split(/\s+/);
        cmdName = parts[0];
        cmdArgs = parts.slice(1);
      }

      // Use Tauri shell plugin to execute command
      const shellProcess = Command.create(cmdName, cmdArgs);
      
      // Set working directory if provided
      if (cwd) {
        // Note: Tauri shell Command API doesn't directly support cwd
        // This may need to be handled differently
      }

      const result = await shellProcess.execute();

      // Tauri shell Command returns stdout/stderr as strings
      const stdout = result.stdout || '';
      const stderr = result.stderr || '';
      const exitCode = result.code || 0;

      return {
        stdout,
        stderr,
        exitCode,
        success: exitCode === 0
      };
    } catch (error: any) {
      return {
        stdout: '',
        stderr: error.message || 'Command execution failed',
        exitCode: 1,
        success: false
      };
    }
  }

  /**
   * Execute command and stream output
   */
  async *streamExecute(
    command: string,
    args: string[] = [],
    cwd?: string
  ): AsyncGenerator<string, void, unknown> {
    try {
      let cmdName = command;
      let cmdArgs = args;

      if (command.includes(' ') && args.length === 0) {
        const parts = command.split(/\s+/);
        cmdName = parts[0];
        cmdArgs = parts.slice(1);
      }

      const shellProcess = Command.create(cmdName, cmdArgs);

      // Note: Tauri shell plugin doesn't support streaming in the same way
      // For now, we'll execute and yield the full output
      const output = await shellProcess.execute();
      
      if (output.stdout) {
        const lines = output.stdout.split('\n');
        for (const line of lines) {
          yield line;
        }
      }

      if (output.stderr) {
        const lines = output.stderr.split('\n');
        for (const line of lines) {
          yield `[stderr] ${line}`;
        }
      }
    } catch (error: any) {
      yield `[error] ${error.message}`;
    }
  }

  /**
   * Kill a running process
   */
  async kill(processId: string): Promise<void> {
    const proc = this.processes.get(processId);
    if (proc) {
      // Note: Tauri shell plugin Command doesn't expose kill method directly
      // This would need platform-specific implementation
      try {
        // On Windows, try taskkill
        // On Unix, try kill
        const platform = await this.detectPlatform();
        if (platform === 'win32') {
          await this.execute('taskkill', ['/F', '/PID', processId]);
        } else {
          await this.execute('kill', ['-9', processId]);
        }
      } catch {
        // Ignore errors
      }
      this.processes.delete(processId);
    }
  }

  /**
   * Check if command exists
   */
  async commandExists(command: string): Promise<boolean> {
    try {
      // Detect platform from Tauri or use default
      const platform = await this.detectPlatform();
      const checkCmd = platform === 'win32' ? 'where' : 'which';
      const result = await this.execute(checkCmd, [command]);
      return result.success && result.stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get current working directory
   */
  async getCwd(): Promise<string> {
    try {
      const platform = await this.detectPlatform();
      if (platform === 'win32') {
        // On Windows, 'cd' without args prints current directory
        const result = await this.execute('cd', []);
        return result.stdout.trim() || '';
      } else {
        const result = await this.execute('pwd', []);
        return result.stdout.trim() || '';
      }
    } catch {
      return '';
    }
  }

  /**
   * Detect platform
   */
  private async detectPlatform(): Promise<string> {
    return await getPlatform();
  }
}

