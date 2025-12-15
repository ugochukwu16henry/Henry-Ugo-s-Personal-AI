/**
 * Visual Diff Preview Component
 * Shows side-by-side diff of code changes
 */

import { Diff, Hunk, parseDiff } from 'react-diff-view';
import { diffLines } from 'diff';
import 'react-diff-view/style/index.css';

export interface DiffPreviewProps {
  oldCode: string;
  newCode: string;
  oldPath?: string;
  newPath?: string;
  language?: string;
  onClose?: () => void;
  onApply?: () => void;
  onReject?: () => void;
}

/**
 * Diff Preview Component
 * Displays visual diff with side-by-side or unified view
 */
export function DiffPreview({
  oldCode,
  newCode,
  oldPath = 'original',
  newPath = 'modified',
  language = 'javascript',
  onClose,
  onApply,
  onReject
}: DiffPreviewProps) {
  // Generate diff
  const diffText = generateDiffText(oldCode, newCode, oldPath, newPath);
  
  // Parse diff
  const files = parseDiff(diffText);

  if (files.length === 0) {
    return (
      <div style={{ 
        padding: '1rem', 
        textAlign: 'center',
        color: '#888',
        background: '#1e1e1e',
        border: '1px solid #3e3e42',
        borderRadius: '4px'
      }}>
        No changes detected
      </div>
    );
  }

  const file = files[0];

  return (
    <div style={{
      background: '#1e1e1e',
      border: '1px solid #3e3e42',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        background: '#252526',
        borderBottom: '1px solid #3e3e42',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ color: '#cccccc', fontSize: '0.9rem' }}>
          <span style={{ color: '#f48771' }}>−</span> {oldPath} 
          {' → '}
          <span style={{ color: '#89d185' }}>+</span> {newPath}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onReject && (
            <button
              onClick={onReject}
              style={{
                padding: '0.25rem 0.75rem',
                background: '#5a5a5a',
                border: '1px solid #3e3e42',
                color: '#fff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Reject
            </button>
          )}
          {onApply && (
            <button
              onClick={onApply}
              style={{
                padding: '0.25rem 0.75rem',
                background: '#0e639c',
                border: 'none',
                color: '#fff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Apply
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '0.25rem 0.75rem',
                background: 'transparent',
                border: '1px solid #3e3e42',
                color: '#fff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Diff Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem'
      }}>
        <Diff
          viewType="split"
          diffType={file.type}
          hunks={file.hunks}
        >
          {(hunks: any[]) =>
            hunks.map((hunk: any) => (
              <Hunk key={hunk.content} hunk={hunk} />
            ))
          }
        </Diff>
      </div>

      {/* Footer with stats */}
      <div style={{
        padding: '0.5rem 1rem',
        background: '#252526',
        borderTop: '1px solid #3e3e42',
        fontSize: '0.8rem',
        color: '#888',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <div>
          Lines: <span style={{ color: '#89d185' }}>+{countAddedLines(oldCode, newCode)}</span>
          {' '}
          <span style={{ color: '#f48771' }}>-{countRemovedLines(oldCode, newCode)}</span>
        </div>
        <div>
          Language: {language}
        </div>
      </div>
    </div>
  );
}

/**
 * Generate unified diff text using diff library
 */
function generateDiffText(
  oldCode: string,
  newCode: string,
  oldPath: string,
  newPath: string
): string {
  // Use diff library for accurate diff computation
  const diff = diffLines(oldCode, newCode);
  
  let diffText = `diff --git a/${oldPath} b/${newPath}\n`;
  diffText += `index 0000000..1111111 100644\n`;
  diffText += `--- a/${oldPath}\n`;
  diffText += `+++ b/${newPath}\n`;
  
  // Convert diff chunks to unified diff format
  let oldLineNum = 1;
  let newLineNum = 1;
  let hunkStart = 1;
  let inHunk = false;
  let hunkOldCount = 0;
  let hunkNewCount = 0;
  
  for (const part of diff) {
    const lines = part.value.split('\n');
    // Remove empty line at end if present
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    if (part.added) {
      // Added lines
      if (!inHunk) {
        hunkStart = oldLineNum;
        diffText += `@@ -${hunkStart},${hunkOldCount || 1} +${newLineNum},${lines.length} @@\n`;
        inHunk = true;
        hunkOldCount = 0;
        hunkNewCount = lines.length;
      } else {
        hunkNewCount += lines.length;
      }
      for (const line of lines) {
        diffText += `+${line}\n`;
      }
      newLineNum += lines.length;
    } else if (part.removed) {
      // Removed lines
      if (!inHunk) {
        hunkStart = oldLineNum;
        diffText += `@@ -${oldLineNum},${lines.length} +${newLineNum},${hunkNewCount || 1} @@\n`;
        inHunk = true;
        hunkOldCount = lines.length;
        hunkNewCount = 0;
      } else {
        hunkOldCount += lines.length;
      }
      for (const line of lines) {
        diffText += `-${line}\n`;
      }
      oldLineNum += lines.length;
    } else {
      // Unchanged lines (context)
      if (inHunk) {
        // Add context lines within hunk
        for (const line of lines) {
          diffText += ` ${line}\n`;
          hunkOldCount++;
          hunkNewCount++;
        }
        oldLineNum += lines.length;
        newLineNum += lines.length;
        
        // Close hunk if we have enough context
        if (lines.length >= 3) {
          inHunk = false;
        }
      } else {
        // Skip context outside hunks
        oldLineNum += lines.length;
        newLineNum += lines.length;
      }
    }
  }
  
  // Close any remaining hunk
  if (inHunk && (hunkOldCount > 0 || hunkNewCount > 0)) {
    // Hunk already written
  }
  
  return diffText;
}

/**
 * Count added lines using diff library
 */
function countAddedLines(oldCode: string, newCode: string): number {
  const diff = diffLines(oldCode, newCode);
  let added = 0;
  for (const part of diff) {
    if (part.added) {
      added += part.value.split('\n').filter(l => l !== '').length;
    }
  }
  return added;
}

/**
 * Count removed lines using diff library
 */
function countRemovedLines(oldCode: string, newCode: string): number {
  const diff = diffLines(oldCode, newCode);
  let removed = 0;
  for (const part of diff) {
    if (part.removed) {
      removed += part.value.split('\n').filter(l => l !== '').length;
    }
  }
  return removed;
}

