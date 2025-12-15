# Multi-Step Task Execution

Complete implementation of automated multi-step task execution with validation and rollback.

## Overview

The multi-step task executor:
1. **Plans** the task into steps
2. **Executes** each step sequentially
3. **Validates** after each step (runs tests)
4. **Rolls back** all changes if any step fails
5. **Reports** execution results

## Architecture

### Components

- **`TaskExecutor`** - Orchestrates multi-step execution
- **`HenryAgent`** - Provides planning and editing capabilities
- **`Sandbox`** - Manages file backups
- **`TestRunner`** - Validates code changes

### Execution Flow

```
Task Goal
   ↓
Plan (break into steps)
   ↓
For each step:
   ├─ Extract file & operation
   ├─ Backup file
   ├─ Execute operation (edit/create/delete)
   ├─ Run tests
   └─ Continue if passed, rollback if failed
   ↓
Success or Rollback All
```

## Usage

### Basic Usage

```typescript
import { HenryAgent } from '@henry-ai/core';

const agent = new HenryAgent();
await agent.initializeMemory();

const result = await agent.executeTask({
  goal: 'Add login endpoint with JWT authentication'
});

console.log('Success:', result.success);
console.log('Steps completed:', result.stepsCompleted);
console.log('Files modified:', result.filesModified);
```

### With Custom Working Directory

```typescript
const result = await agent.executeTask({
  goal: 'Add OAuth2 endpoint',
  cwd: '/path/to/project'
});
```

### Handling Results

```typescript
const result = await agent.executeTask({
  goal: 'Create user authentication system'
});

if (result.success) {
  console.log(`✅ Completed ${result.stepsCompleted}/${result.totalSteps} steps`);
  console.log('Modified files:', result.filesModified);
} else {
  console.error('❌ Failed:', result.error);
  if (result.rollbackPerformed) {
    console.log('✅ Changes were rolled back');
  }
}
```

## Step Parsing

The executor intelligently extracts files and operations from step descriptions:

### Supported Patterns

1. **Edit operations:**
   - `"Edit src/routes/auth.js to add /login"`
   - `"Update src/controllers/user.ts: add validateUser function"`
   - `"In src/utils/logger.ts, add error logging"`

2. **Create operations:**
   - `"Create src/config/database.ts"`
   - `"Add new file src/models/User.ts"`

3. **Delete operations:**
   - `"Delete src/old/utils.ts"`
   - `"Remove file src/temp/cache.js"`

### File Extraction

The `extractFileFromStep()` function handles:
- Common file extensions: `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.rs`, `.go`, `.java`, `.cpp`, `.c`, `.h`
- Path resolution (relative to `cwd`)
- Multiple patterns and formats

## Execution Details

### Backup System

- Each file is backed up before modification
- Backups stored as: `{filePath}.henry-backup-{timestamp}`
- Original content preserved in memory for rollback
- Created files tracked for deletion on rollback

### Validation

- Tests run after **each step** (not just at the end)
- Prevents accumulation of errors
- Faster failure detection
- Configurable test command (via `TEST_COMMAND` env var)

### Rollback

On any failure:
1. All changes are rolled back in **reverse order**
2. Files restored from backups
3. Created files are deleted
4. Backup files are cleaned up
5. Original state fully restored

## Advanced Usage

### Direct TaskExecutor Usage

```typescript
import { TaskExecutor, HenryAgent, Sandbox, TestRunner } from '@henry-ai/core';

const agent = new HenryAgent();
const sandbox = new Sandbox();
const testRunner = new TestRunner(sandbox);

const executor = new TaskExecutor(agent, sandbox, testRunner);

const result = await executor.executeTask({
  goal: 'Add feature X',
  cwd: process.cwd()
});
```

### Custom Operation Handling

You can extend the executor for custom operations:

```typescript
// Extend TaskExecutor
class CustomExecutor extends TaskExecutor {
  private async executeCustomOperation(filePath: string, step: string) {
    // Custom logic here
  }
}
```

## Configuration

### Environment Variables

```env
# Test command (default: npm test)
TEST_COMMAND=vitest run

# Test timeout (default: 60000ms)
TEST_TIMEOUT=60000
```

### Test Runner Options

The executor uses the agent's `TestRunner` with these defaults:
- Timeout: 60 seconds
- Auto-rollback: Enabled
- Command: Detected from package.json

## Error Handling

### Types of Errors

1. **Planning Error** - Task cannot be broken into steps
2. **File Extraction Error** - Cannot determine file from step
3. **Execution Error** - File operation fails
4. **Test Failure** - Tests fail after step
5. **Rollback Error** - Cannot restore original state

### Error Recovery

- All errors trigger automatic rollback
- Partial execution state is never left behind
- Detailed error messages for debugging
- Execution history available for inspection

## Examples

### Example 1: Add API Endpoint

```typescript
const result = await agent.executeTask({
  goal: 'Add POST /api/users endpoint with validation'
});

// Steps might be:
// 1. Edit src/routes/users.js to add POST route
// 2. Edit src/controllers/users.js to add createUser function
// 3. Create src/validators/userValidator.js
// 4. Edit src/models/User.js to add validation rules
```

### Example 2: Refactor Code

```typescript
const result = await agent.executeTask({
  goal: 'Refactor authentication to use JWT instead of sessions'
});

// Multiple files will be edited:
// - Update auth middleware
// - Update login controller
// - Update user model
// - Update configuration
```

### Example 3: Create New Feature

```typescript
const result = await agent.executeTask({
  goal: 'Create user profile management feature with avatar upload'
});

// Steps might create and edit multiple files:
// - Create profile controller
// - Create profile routes
// - Create profile model
// - Create upload utility
// - Update user model
```

## Best Practices

1. **Keep tasks focused** - One logical feature per task
2. **Test incrementally** - Tests run after each step
3. **Review plan first** - Check the plan before executing
4. **Use version control** - Commit before running tasks
5. **Monitor execution** - Watch console output for progress

## Limitations

- Step parsing may not work for all step formats
- Complex multi-file refactors may need manual intervention
- Test failures cause full rollback (no partial success)
- File extraction relies on pattern matching

## Future Enhancements

- [ ] Interactive approval for each step
- [ ] Partial rollback (only failed step)
- [ ] Better step parsing with AI
- [ ] Execution preview mode
- [ ] Parallel step execution (where safe)
- [ ] Custom validators (beyond tests)

## Troubleshooting

### Steps Not Executing

- Check if files are being extracted correctly
- Review step descriptions for clarity
- Enable debug logging

### Tests Failing

- Check test command is correct
- Verify tests pass before running executor
- Review test output in console

### Rollback Not Working

- Check file permissions
- Verify backup files exist
- Check disk space

