/**
 * File system utilities using Tauri FS plugin
 */
import { readDir, stat } from '@tauri-apps/plugin-fs';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

// Check if we're in Tauri environment
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export interface FileSystemEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: number;
}

/**
 * Read directory contents
 */
export async function readDirectory(dirPath: string): Promise<FileSystemEntry[]> {
  if (!isTauri()) {
    return [];
  }

  try {
    const entries = await readDir(dirPath, { recursive: false });
    const result: FileSystemEntry[] = [];

    for (const entry of entries) {
      const fullPath = `${dirPath}/${entry.name}`.replace(/\/+/g, '/');
      const entryStat = await stat(fullPath);
      
      result.push({
        name: entry.name,
        path: fullPath,
        type: entryStat.isDirectory ? 'directory' : 'file',
        size: entryStat.size,
        modified: entryStat.mtime ? new Date(entryStat.mtime).getTime() : undefined
      });
    }

    // Sort: directories first, then files, both alphabetically
    result.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  } catch (error: any) {
    console.error('Error reading directory:', error);
    throw new Error(`Failed to read directory: ${error.message}`);
  }
}

/**
 * Open folder dialog and return selected path
 */
export async function selectFolder(): Promise<string | null> {
  if (!isTauri()) {
    return null;
  }

  try {
    const selected = await openDialog({
      directory: true,
      multiple: false
    });

    return selected && typeof selected === 'string' ? selected : null;
  } catch (error: any) {
    console.error('Error selecting folder:', error);
    return null;
  }
}

/**
 * Check if path exists
 */
export async function pathExists(path: string): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

