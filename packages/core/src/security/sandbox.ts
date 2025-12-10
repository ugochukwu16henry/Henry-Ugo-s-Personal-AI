/**
 * Sandbox system for safe code editing
 * Always shows diff before applying changes
 */
import * as fs from 'fs/promises'
import * as path from 'path'

export interface FileDiff {
  filePath: string
  oldContent: string
  newContent: string
  unifiedDiff: string
  lineChanges: {
    added: number
    removed: number
    modified: number
  }
}

export interface EditRequest {
  filePath: string
  newContent: string
  reason?: string
}

export class Sandbox {
  private pendingEdits: Map<string, EditRequest> = new Map()

  /**
   * Generate a unified diff between old and new content
   */
  generateDiff(oldContent: string, newContent: string, filePath: string): FileDiff {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')

    let added = 0
    let removed = 0
    let modified = 0

    const diff: string[] = []
    diff.push(`--- ${filePath} (original)`)
    diff.push(`+++ ${filePath} (modified)`)

    // Simple line-by-line diff
    const maxLen = Math.max(oldLines.length, newLines.length)
    let oldIdx = 0
    let newIdx = 0

    while (oldIdx < oldLines.length || newIdx < newLines.length) {
      if (oldIdx >= oldLines.length) {
        // Only new lines remaining
        diff.push(`+${newLines[newIdx]}`)
        added++
        newIdx++
      } else if (newIdx >= newLines.length) {
        // Only old lines remaining
        diff.push(`-${oldLines[oldIdx]}`)
        removed++
        oldIdx++
      } else if (oldLines[oldIdx] === newLines[newIdx]) {
        // Lines match
        diff.push(` ${oldLines[oldIdx]}`)
        oldIdx++
        newIdx++
      } else {
        // Lines differ
        // Check if it's a modification or addition/removal
        if (oldIdx + 1 < oldLines.length && oldLines[oldIdx + 1] === newLines[newIdx]) {
          diff.push(`-${oldLines[oldIdx]}`)
          removed++
          oldIdx++
        } else if (newIdx + 1 < newLines.length && oldLines[oldIdx] === newLines[newIdx + 1]) {
          diff.push(`+${newLines[newIdx]}`)
          added++
          newIdx++
        } else {
          diff.push(`-${oldLines[oldIdx]}`)
          diff.push(`+${newLines[newIdx]}`)
          modified++
          oldIdx++
          newIdx++
        }
      }
    }

    return {
      filePath,
      oldContent,
      newContent,
      unifiedDiff: diff.join('\n'),
      lineChanges: {
        added,
        removed,
        modified
      }
    }
  }

  /**
   * Preview an edit without applying it
   */
  async previewEdit(filePath: string, newContent: string): Promise<FileDiff> {
    let oldContent = ''
    
    try {
      oldContent = await fs.readFile(filePath, 'utf-8')
    } catch (error: any) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
      // File doesn't exist, treating as new file
      oldContent = ''
    }

    return this.generateDiff(oldContent, newContent, filePath)
  }

  /**
   * Stage an edit for approval (sandbox mode)
   */
  async stageEdit(request: EditRequest): Promise<FileDiff> {
    const diff = await this.previewEdit(request.filePath, request.newContent)
    this.pendingEdits.set(request.filePath, request)
    return diff
  }

  /**
   * Apply a staged edit
   */
  async applyEdit(filePath: string, requireBackup: boolean = true): Promise<void> {
    const edit = this.pendingEdits.get(filePath)
    if (!edit) {
      throw new Error(`No staged edit for ${filePath}`)
    }

    // Create backup if requested
    if (requireBackup) {
      try {
        const backupPath = `${filePath}.henry-backup`
        const currentContent = await fs.readFile(filePath, 'utf-8')
        await fs.writeFile(backupPath, currentContent, 'utf-8')
      } catch (error: any) {
        // File might not exist, that's okay
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error
        }
      }
    }

    // Ensure directory exists
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })

    // Apply the edit
    await fs.writeFile(filePath, edit.newContent, 'utf-8')
    this.pendingEdits.delete(filePath)
  }

  /**
   * Discard a staged edit
   */
  discardEdit(filePath: string): void {
    this.pendingEdits.delete(filePath)
  }

  /**
   * Rollback a file to its backup
   */
  async rollback(filePath: string): Promise<void> {
    const backupPath = `${filePath}.henry-backup`
    
    try {
      const backupContent = await fs.readFile(backupPath, 'utf-8')
      await fs.writeFile(filePath, backupContent, 'utf-8')
      await fs.unlink(backupPath)
      this.pendingEdits.delete(filePath)
    } catch (error: any) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`No backup found for ${filePath}`)
      }
      throw error
    }
  }

  /**
   * Get all staged edits
   */
  getStagedEdits(): EditRequest[] {
    return Array.from(this.pendingEdits.values())
  }

  /**
   * Clear all staged edits
   */
  clearStagedEdits(): void {
    this.pendingEdits.clear()
  }

  /**
   * Format diff for display
   */
  formatDiffForDisplay(diff: FileDiff): string {
    const { lineChanges, unifiedDiff } = diff
    const summary = `\n📝 Changes in ${diff.filePath}:\n` +
      `  +${lineChanges.added} lines added\n` +
      `  -${lineChanges.removed} lines removed\n` +
      `  ~${lineChanges.modified} lines modified\n`

    return summary + '\n' + unifiedDiff
  }
}

