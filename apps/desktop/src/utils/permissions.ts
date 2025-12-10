/**
 * Tauri permission utilities for file operations
 */
import { invoke } from '@tauri-apps/api/core';

/**
 * Request permission to write a file (shows confirmation dialog)
 */
export async function requestFileWritePermission(
  filePath: string,
  diffPreview: string
): Promise<boolean> {
  // Show native confirmation dialog
  const confirmed = confirm(
    `Apply changes to ${filePath}?\n\nPreview:\n${diffPreview.substring(0, 500)}...`
  );

  if (!confirmed) {
    return false;
  }

  // Call Tauri command (permission is enforced by capabilities)
  try {
    const result = await invoke<boolean>('request_file_write_permission', {
      filePath,
      diffPreview
    });
    return result;
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
}

/**
 * Apply file edit through Tauri (respects permissions)
 */
export async function applyFileEdit(_filePath: string, _content: string): Promise<void> {
  // Note: In Tauri v2, file operations should use the fs plugin
  // This is a placeholder - the actual implementation would use
  // @tauri-apps/plugin-fs
  
  // For now, we'll use a different approach:
  // The core agent will handle file writes, and Tauri's capabilities
  // will control access
}

