# Security & Testing Layer

This document explains the security and testing features implemented in Henry Ugo's Personal AI.

## Overview

The Security & Testing Layer provides:
1. **Sandbox edits** - Always show diff before applying
2. **Auto-test** - Run tests after every edit, rollback on failure
3. **Permissions** - Ask before file write (Tauri prompt)

## Components

### 1. Sandbox (`packages/core/src/security/sandbox.ts`)

The `Sandbox` class manages safe file editing:

```typescript
import { Sandbox } from '@henry-ai/core';

const sandbox = new Sandbox();

// Stage an edit (doesn't apply yet)
await sandbox.stageEdit({
  filePath: './src/example.ts',
  newContent: '...',
  reason: 'Add JWT validation'
});

// Preview the diff
const diff = await sandbox.previewEdit('./src/example.ts', newContent);
console.log(sandbox.formatDiffForDisplay(diff));

// Apply the edit (creates backup automatically)
await sandbox.applyEdit('./src/example.ts', true);

// Rollback if needed
await sandbox.rollback('./src/example.ts');
```

**Features:**
- Generates unified diffs (like `git diff`)
- Tracks line changes (added/removed/modified)
- Creates automatic backups before applying
- Supports rollback to previous state

### 2. Test Runner (`packages/core/src/security/test-runner.ts`)

The `TestRunner` class automatically runs tests and handles rollback:

```typescript
import { TestRunner, Sandbox } from '@henry-ai/core';

const sandbox = new Sandbox();
const testRunner = new TestRunner(sandbox);

// Apply edit and run tests, rollback on failure
const { testResult, applied } = await testRunner.applyEditWithTest(
  './src/example.ts',
  true // autoRollback
);

if (!applied) {
  console.error('Tests failed, changes rolled back');
}
```

**Features:**
- Detects test command from package.json (`npm test`, `pnpm test`, `vitest`, etc.)
- Configurable timeout (default: 60 seconds)
- Automatic rollback on test failure
- Syntax validation before applying

**Environment Variables:**
- `TEST_COMMAND` - Override default test command (e.g., `vitest run`)

### 3. Updated Agent (`packages/core/src/agent.ts`)

The `HenryAgent` now uses the security layer:

```typescript
import { HenryAgent } from '@henry-ai/core';

const agent = new HenryAgent();

// Edit with security features enabled
const diff = await agent.edit('./src/example.ts', 'Add error handling', {
  showDiff: true,           // Show diff before applying
  autoTest: true,           // Run tests after edit
  requireApproval: true,    // Wait for user approval (in desktop app)
  rollbackOnTestFailure: true // Rollback if tests fail
});

// Preview edit without applying
const preview = await agent.previewEdit('./src/example.ts', 'Add feature');

// Apply a previously staged edit
await agent.applyStagedEdit('./src/example.ts', true);

// Discard staged edit
agent.discardEdit('./src/example.ts');

// Rollback to previous version
await agent.rollback('./src/example.ts');
```

## Usage Examples

### Basic Edit with Auto-Test

```typescript
const agent = new HenryAgent();

try {
  const diff = await agent.edit('./src/auth.ts', 'Add JWT validation', {
    showDiff: true,
    autoTest: true,
    rollbackOnTestFailure: true
  });
  
  console.log('✅ Edit applied successfully');
} catch (error) {
  console.error('❌ Edit failed:', error.message);
  // Changes were automatically rolled back
}
```

### Preview Before Applying

```typescript
const agent = new HenryAgent();

// Generate edit and show diff
const diff = await agent.previewEdit('./src/api.ts', 'Add new endpoint');

console.log('Changes:');
console.log(diff.unifiedDiff);
console.log(`Lines: +${diff.lineChanges.added} -${diff.lineChanges.removed}`);

// User reviews diff, then applies
const confirmed = confirm('Apply these changes?');
if (confirmed) {
  await agent.applyStagedEdit('./src/api.ts', true); // autoTest enabled
}
```

### Manual Test Execution

```typescript
import { TestRunner, Sandbox } from '@henry-ai/core';

const sandbox = new Sandbox();
const testRunner = new TestRunner(sandbox);

// Apply edit
await sandbox.applyEdit('./src/example.ts', true);

// Run tests manually
const result = await testRunner.runTests();
if (!result.success) {
  // Rollback
  await sandbox.rollback('./src/example.ts');
}
```

## Desktop App Integration (Tauri)

The desktop app includes permission prompts for file writes:

```typescript
// apps/desktop/src/utils/permissions.ts
import { requestFileWritePermission } from './utils/permissions';

// Before applying edit
const allowed = await requestFileWritePermission(
  './src/example.ts',
  diff.unifiedDiff
);

if (allowed) {
  await agent.applyStagedEdit('./src/example.ts', true);
}
```

**Tauri Configuration:**
- File write permissions are controlled by `src-tauri/capabilities/default.json`
- The `fs` plugin handles file operations with scope restrictions
- Users can be prompted via native dialogs before file writes

## Security Features

### 1. Diff Preview
- All edits show a diff before applying
- Users can review changes before committing
- Unified diff format (similar to `git diff`)

### 2. Automatic Backups
- Every edit creates a `.henry-backup` file
- Backups are created before applying changes
- Can be restored via `sandbox.rollback()`

### 3. Test Validation
- Tests run automatically after edits
- Edits are rolled back if tests fail
- Configurable test timeout and command

### 4. Permission System
- Desktop app prompts for file write permission
- Tauri capabilities restrict file system access
- Scope-based security (only allowed directories)

## Configuration

### Environment Variables

```env
# Test command override
TEST_COMMAND=vitest run

# Test timeout (ms)
TEST_TIMEOUT=60000
```

### Code Configuration

```typescript
// Custom test runner config
const testRunner = new TestRunner(sandbox, {
  testCommand: 'npm test',
  testTimeout: 30000,
  autoRollback: true
});
```

## Workflow

1. **Edit Request** → Agent generates code changes
2. **Sandbox Stage** → Changes are staged (not applied)
3. **Diff Preview** → User sees what will change
4. **Permission Check** → Desktop app asks for permission
5. **Apply Edit** → File is written (backup created)
6. **Run Tests** → Tests execute automatically
7. **Rollback on Failure** → Changes reverted if tests fail

## Best Practices

1. **Always enable `showDiff`** - Review changes before applying
2. **Enable `autoTest`** - Catch errors early
3. **Enable `rollbackOnTestFailure`** - Maintain code quality
4. **Use preview mode** - In critical files, preview first
5. **Check test results** - Monitor test output for warnings

## Troubleshooting

### Tests Fail After Edit
- Check test output for specific failures
- Review the diff to see what changed
- Use `agent.rollback()` to revert

### Permission Denied
- Check Tauri capabilities configuration
- Verify file path is in allowed scope
- Check file system permissions

### Backup Not Found
- Backups are only created when `applyEdit` is called with `requireBackup: true`
- Check that the file was actually modified
- Restore from git if backup is missing

## Future Enhancements

- [ ] Git integration for rollback
- [ ] Test result caching
- [ ] Partial test runs (only affected files)
- [ ] Visual diff viewer in desktop app
- [ ] Edit history tracking
- [ ] Undo/redo stack

