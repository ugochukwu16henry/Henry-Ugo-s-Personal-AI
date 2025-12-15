/**
 * Auto-test system with rollback on failure
 */
import * as fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import { Sandbox } from './sandbox'

const execAsync = promisify(exec)

export interface TestResult {
  success: boolean
  output: string
  error?: string
  exitCode: number
}

export interface TestConfig {
  testCommand?: string
  testTimeout?: number
  autoRollback?: boolean
}

export class TestRunner {
  private sandbox: Sandbox
  private defaultTestCommand: string

  constructor(sandbox: Sandbox, config: TestConfig = {}) {
    this.sandbox = sandbox
    this.defaultTestCommand = config.testCommand || this.detectTestCommand()
  }

  /**
   * Detect the test command based on project configuration
   */
  private detectTestCommand(): string {
    // Try to detect based on package.json scripts
    // For now, default to npm test
    const possibleCommands = [
      'npm test',
      'pnpm test',
      'yarn test',
      'vitest run',
      'jest'
    ]
    
    // Default to npm/pnpm test
    // In production, we'd check package.json
    return process.env.TEST_COMMAND || 'npm test'
  }

  /**
   * Run tests for the project
   */
  async runTests(cwd: string = process.cwd(), timeout: number = 60000): Promise<TestResult> {
    const testCommand = process.env.TEST_COMMAND || this.defaultTestCommand
    
    try {
      const { stdout, stderr } = await execAsync(testCommand, {
        cwd,
        timeout,
        env: {
          ...process.env,
          CI: 'true' // Run in CI mode for consistent output
        }
      })

      const output = stdout + stderr
      const success = !output.includes('FAIL') && !output.toLowerCase().includes('failing')

      return {
        success,
        output,
        exitCode: success ? 0 : 1
      }
    } catch (error: any) {
      const output = error.stdout || '' + error.stderr || ''
      
      return {
        success: false,
        output,
        error: error.message,
        exitCode: error.code || 1
      }
    }
  }

  /**
   * Apply edit and run tests, rollback on failure
   */
  async applyEditWithTest(
    filePath: string,
    autoRollback: boolean = true
  ): Promise<{ testResult: TestResult; applied: boolean }> {
    // Apply the edit
    await this.sandbox.applyEdit(filePath, true) // Always create backup

    // Run tests
    const testResult = await this.runTests()

    if (!testResult.success && autoRollback) {
      // Rollback on test failure
      console.warn(`❌ Tests failed. Rolling back changes to ${filePath}...`)
      try {
        await this.sandbox.rollback(filePath)
        console.log(`✅ Rolled back ${filePath}`)
      } catch (rollbackError: any) {
        console.error(`⚠️  Failed to rollback ${filePath}:`, rollbackError.message)
        throw new Error(`Tests failed and rollback failed: ${rollbackError.message}`)
      }
      return { testResult, applied: false }
    }

    return { testResult, applied: true }
  }

  /**
   * Validate file syntax (quick check before applying)
   */
  async validateSyntax(filePath: string, content: string): Promise<{ valid: boolean; error?: string }> {
    // For TypeScript/JavaScript, we could use ts-node or eslint
    // For now, just check basic syntax
    const ext = path.extname(filePath).toLowerCase()
    
    if (ext === '.ts' || ext === '.tsx') {
      // Basic TypeScript syntax check would go here
      // For now, return valid
      return { valid: true }
    }

    if (ext === '.js' || ext === '.jsx') {
      // Basic JavaScript syntax check
      try {
        // Try to parse as JSON if it looks like JSON
        if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
          JSON.parse(content)
        }
      } catch {
        // Not JSON, that's fine
      }
      return { valid: true }
    }

    return { valid: true }
  }
}

