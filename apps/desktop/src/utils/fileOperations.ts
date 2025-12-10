/**
 * File operations using Tauri APIs
 */
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { save, open } from '@tauri-apps/plugin-dialog';

// Check if we're in Tauri environment
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Save code to a file using native file dialog
 */
export async function saveFileToDisk(content: string, defaultName: string = 'untitled.html'): Promise<string | null> {
  if (!isTauri()) {
    throw new Error('File operations are only available in Tauri environment');
  }
  
  try {
    const filePath = await save({
      defaultPath: defaultName,
      filters: [
        {
          name: 'Web Files',
          extensions: ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json']
        },
        {
          name: 'All Files',
          extensions: ['*']
        }
      ]
    });

    if (filePath) {
      await writeTextFile(filePath, content);
      return filePath;
    }
    return null;
  } catch (error: any) {
    console.error('Error saving file:', error);
    throw new Error(`Failed to save file: ${error.message}`);
  }
}

/**
 * Open a file from disk using native file dialog
 */
export async function openFileFromDisk(): Promise<{ path: string; content: string } | null> {
  if (!isTauri()) {
    throw new Error('File operations are only available in Tauri environment');
  }
  
  try {
    const filePath = await open({
      filters: [
        {
          name: 'Code Files',
          extensions: ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'md', 'txt']
        },
        {
          name: 'All Files',
          extensions: ['*']
        }
      ],
      multiple: false
    });

    if (filePath && typeof filePath === 'string') {
      const content = await readTextFile(filePath);
      return { path: filePath, content };
    }
    return null;
  } catch (error: any) {
    console.error('Error opening file:', error);
    throw new Error(`Failed to open file: ${error.message}`);
  }
}

/**
 * Generate multiple files for a project
 */
export interface ProjectFile {
  path: string;
  content: string;
}

export async function saveProjectFiles(files: ProjectFile[]): Promise<string[]> {
  if (!isTauri()) {
    throw new Error('File operations are only available in Tauri environment');
  }
  
  const savedPaths: string[] = [];
  
  try {
    // Ask user to select a directory by selecting the first file location
    const firstFilePath = await save({
      defaultPath: 'project/index.html',
      filters: [
        {
          name: 'HTML Files',
          extensions: ['html']
        },
        {
          name: 'All Files',
          extensions: ['*']
        }
      ]
    });

    if (!firstFilePath) {
      return [];
    }

    // Extract directory path (works for both Windows and Unix)
    const lastSlash = Math.max(firstFilePath.lastIndexOf('/'), firstFilePath.lastIndexOf('\\'));
    const baseDir = lastSlash >= 0 ? firstFilePath.substring(0, lastSlash) : '';

    for (const file of files) {
      // Handle both forward and backward slashes
      const separator = baseDir.includes('\\') ? '\\' : '/';
      const fullPath = `${baseDir}${separator}${file.path}`;
      await writeTextFile(fullPath, file.content);
      savedPaths.push(fullPath);
    }

    return savedPaths;
  } catch (error: any) {
    console.error('Error saving project files:', error);
    throw new Error(`Failed to save project: ${error.message}`);
  }
}

