# Visual Diff Viewer

Visual diff viewer component for the desktop app using `react-diff-view`.

## Overview

The diff viewer provides a side-by-side visual comparison of code changes before applying them. It integrates with the agent's sandbox system to show what will change.

## Components

### DiffPreview
**File:** `apps/desktop/src/components/DiffPreview.tsx`

Core diff display component showing:
- Side-by-side diff view
- Line-by-line changes (added/removed/modified)
- Change statistics
- Apply/Reject buttons

### DiffViewer
**File:** `apps/desktop/src/components/DiffViewer.tsx`

Modal wrapper for the diff preview:
- Full-screen overlay
- Modal dialog
- Header with file path
- Close button

### useDiffViewer Hook
**File:** `apps/desktop/src/hooks/useDiffViewer.ts`

React hook for managing diff viewer state:
- Show/hide diff
- Manage apply/reject callbacks
- Track current diff and file

## Usage

### Basic Usage

```typescript
import { DiffViewer } from './components/DiffViewer';
import { useDiffViewer } from './hooks/useDiffViewer';

function MyComponent() {
  const diffViewer = useDiffViewer();

  const showDiff = async () => {
    diffViewer.showDiff(
      {
        filePath: './src/example.ts',
        oldContent: 'old code',
        newContent: 'new code',
        unifiedDiff: '...',
        lineChanges: { added: 5, removed: 2, modified: 1 }
      },
      './src/example.ts',
      async () => {
        // Apply callback
        console.log('Applying changes');
      },
      () => {
        // Reject callback
        console.log('Rejecting changes');
      }
    );
  };

  return (
    <>
      <button onClick={showDiff}>Show Diff</button>
      <DiffViewer
        isOpen={diffViewer.isOpen}
        oldCode={diffViewer.diff?.oldContent || ''}
        newCode={diffViewer.diff?.newContent || ''}
        oldPath={diffViewer.filePath || 'original'}
        newPath={diffViewer.filePath || 'modified'}
        onClose={diffViewer.closeDiff}
        onApply={diffViewer.handleApply}
        onReject={diffViewer.handleReject}
      />
    </>
  );
}
```

### Integration with Agent

```typescript
import { HenryAgent } from '@henry-ai/core';
import { useDiffViewer } from './hooks/useDiffViewer';

const agent = new HenryAgent();
const diffViewer = useDiffViewer();

// Preview an edit
const diff = await agent.previewEdit('./src/file.ts', 'Add error handling');

// Show diff
diffViewer.showDiff(
  diff,
  './src/file.ts',
  async () => {
    // Apply the edit
    await agent.applyStagedEdit('./src/file.ts', true);
  },
  () => {
    // Reject - discard edit
    agent.discardEdit('./src/file.ts');
  }
);
```

## Features

### Visual Features
- ✅ **Side-by-side view** - Old vs new code
- ✅ **Syntax highlighting** - Language-aware
- ✅ **Line numbers** - Easy reference
- ✅ **Color coding** - Green for additions, red for removals
- ✅ **Change statistics** - Shows added/removed line counts

### Interaction Features
- ✅ **Apply button** - Apply changes
- ✅ **Reject button** - Discard changes
- ✅ **Close button** - Close without applying
- ✅ **Modal overlay** - Focused viewing

## Styling

The component uses VS Code dark theme styling:
- Background: `#1e1e1e`
- Borders: `#3e3e42`
- Text: `#cccccc`
- Added lines: `#89d185` (green)
- Removed lines: `#f48771` (red)

## Dependencies

- `react-diff-view` - Diff rendering library
- `diff` - Diff computation library

Both installed via:
```bash
pnpm --filter @henry-ai/desktop add react-diff-view diff
```

## API

### DiffPreview Props

```typescript
interface DiffPreviewProps {
  oldCode: string;        // Original code
  newCode: string;        // Modified code
  oldPath?: string;       // Original file path (display)
  newPath?: string;       // Modified file path (display)
  language?: string;      // Language for syntax highlighting
  onClose?: () => void;   // Close callback
  onApply?: () => void;   // Apply callback
  onReject?: () => void;  // Reject callback
}
```

### DiffViewer Props

```typescript
interface DiffViewerProps extends DiffPreviewProps {
  isOpen: boolean;        // Show/hide modal
  title?: string;         // Modal title
}
```

### useDiffViewer Hook

```typescript
const {
  isOpen,           // Is diff viewer open
  diff,             // Current diff data
  filePath,         // Current file path
  showDiff,         // Show diff function
  closeDiff,        // Close diff function
  handleApply,      // Apply handler
  handleReject      // Reject handler
} = useDiffViewer();
```

## Examples

### Example 1: Simple Diff Display

```typescript
<DiffPreview
  oldCode="function hello() { return 'Hello'; }"
  newCode="function hello() { return 'Hello World!'; }"
  oldPath="example.ts"
  newPath="example.ts"
  language="typescript"
  onApply={() => console.log('Applied')}
  onReject={() => console.log('Rejected')}
/>
```

### Example 2: Full Integration

```typescript
function App() {
  const diffViewer = useDiffViewer();

  const handleEdit = async () => {
    const agent = new HenryAgent();
    const diff = await agent.previewEdit('./file.ts', 'Update function');
    
    diffViewer.showDiff(diff, './file.ts', 
      () => agent.applyStagedEdit('./file.ts'),
      () => agent.discardEdit('./file.ts')
    );
  };

  return (
    <>
      <button onClick={handleEdit}>Edit File</button>
      {diffViewer.isOpen && diffViewer.diff && (
        <DiffViewer
          isOpen={true}
          oldCode={diffViewer.diff.oldContent}
          newCode={diffViewer.diff.newContent}
          onClose={diffViewer.closeDiff}
          onApply={diffViewer.handleApply}
          onReject={diffViewer.handleReject}
        />
      )}
    </>
  );
}
```

## Future Enhancements

- [ ] Unified diff view option
- [ ] Word-level diff (not just line-level)
- [ ] Collapsible unchanged sections
- [ ] Search within diff
- [ ] Export diff as patch
- [ ] Compare multiple files
- [ ] Diff history

