# Custom Commands

Shortcut commands for common tasks: `/doc`, `/test`, `/pr`.

## Overview

Custom commands provide quick shortcuts for frequently used operations:

- **`/doc`** - Generate OpenAPI/Swagger documentation
- **`/test`** - Generate Vitest unit tests
- **`/pr`** - Generate PR description
- **`/help`** - Show available commands

## Usage

### CLI

```bash
# Generate documentation
henry "/doc Add Swagger to /wellness endpoint"

# Generate tests
henry "/test Add tests for user authentication"

# Generate PR description
henry "/pr summarize changes for user auth feature"
```

### Desktop App

Type in the task input field:

```
/doc Add Swagger to /wellness endpoint
```

Or:

```
/test Add tests for user authentication
```

## Command Reference

### `/doc` - Generate Documentation

Generates OpenAPI/Swagger documentation for endpoints.

**Usage:**
```
/doc <description>
```

**Examples:**
```
/doc Add Swagger to /wellness endpoint
/doc Document all API endpoints
/doc Add OpenAPI spec for user routes
```

**What it does:**
- Finds relevant endpoint files
- Adds Swagger/OpenAPI annotations
- Creates or updates documentation files
- Follows your project's documentation standards

### `/test` - Generate Tests

Generates Vitest unit tests for code.

**Usage:**
```
/test <description>
```

**Examples:**
```
/test Add tests for user authentication
/test Generate tests for login endpoint
/test Add unit tests for User model
```

**What it does:**
- Analyzes the code to test
- Generates comprehensive test cases
- Uses Vitest framework
- Includes edge cases and error handling
- Follows your project's testing patterns

### `/pr` - Generate PR Description

Summarizes changes for a pull request description.

**Usage:**
```
/pr [description]
```

**Examples:**
```
/pr
/pr summarize user authentication changes
/pr all changes since last commit
```

**What it does:**
- Analyzes code changes
- Generates structured PR description
- Includes:
  - Summary of changes
  - Files modified
  - Breaking changes (if any)
  - Testing instructions
  - Related issues

### `/help` - Show Help

Displays available commands and usage.

**Usage:**
```
/help
/h
/?
```

## How Commands Work

### Command Flow

```
User Input: "/doc Add Swagger to /wellness"
   ↓
Parse: { command: "doc", args: "Add Swagger to /wellness" }
   ↓
Find Handler: doc.handler
   ↓
Transform: goal = "Add Swagger/OpenAPI documentation for: Add Swagger to /wellness"
   ↓
Execute: agent.executeTask({ goal })
   ↓
Return: ExecutionResult
```

### Command Registry

Commands are registered in `CommandRegistry`:

```typescript
const registry = new CommandRegistry();

// Commands are auto-registered on creation
registry.execute('/doc Add Swagger', agent);
```

## Creating Custom Commands

### Register a Custom Command

```typescript
import { defaultCommandRegistry } from '@henry-ai/core';

defaultCommandRegistry.register({
  name: 'refactor',
  description: 'Refactor code according to best practices',
  aliases: ['ref'],
  handler: async (agent, args, options) => {
    const goal = `Refactor: ${args}`;
    return await agent.executeTask({ goal, ...options });
  }
});
```

### Command Interface

```typescript
interface Command {
  name: string;                    // Command name (without /)
  description: string;             // Help text
  aliases?: string[];             // Alternative names
  handler: (                       // Command handler
    agent: HenryAgent,
    args: string,                  // Arguments after command
    options?: CommandOptions       // Additional options
  ) => Promise<ExecutionResult | void>;
}
```

### Example: Custom Command

```typescript
// Custom command for linting
defaultCommandRegistry.register({
  name: 'lint',
  description: 'Fix linting errors',
  handler: async (agent, args) => {
    const file = args.trim() || 'all files';
    const goal = `Fix ESLint errors in ${file}`;
    return await agent.executeTask({ goal });
  }
});
```

## Integration

### CLI Integration

Commands are automatically detected in CLI:

```typescript
// apps/cli/src/index.ts
if (defaultCommandRegistry.isCommand(input)) {
  const result = await executeCommand(input, agent);
  console.log(result.output);
} else {
  // Regular task
  await agent.executeTask({ goal: input });
}
```

### Desktop App Integration

Commands work in the desktop app's task input:

```typescript
// apps/desktop/src/App.tsx
if (defaultCommandRegistry.isCommand(task)) {
  const result = await executeCommand(task, agent);
  setOutput(result.output);
}
```

## Command Parsing

Commands are detected by:
- Starting with `/`
- Followed by command name
- Optional arguments after space

**Examples:**
- `/doc` → command: "doc", args: ""
- `/doc Add Swagger` → command: "doc", args: "Add Swagger"
- `/test user auth` → command: "test", args: "user auth"

## Error Handling

Commands handle errors gracefully:

```typescript
// Missing arguments
/doc
// Error: Usage: /doc <description>

// Unknown command
/unknown
// Error: Unknown command: /unknown
// Available commands: /doc, /test, /pr, /help

// Execution error
// Shows detailed error message from agent
```

## Best Practices

1. **Be specific** - Provide clear descriptions
   ```
   ✅ /doc Add Swagger to /wellness endpoint
   ❌ /doc wellness
   ```

2. **One command at a time** - Don't chain commands
   ```
   ✅ /doc endpoint
   ❌ /doc /test endpoint
   ```

3. **Use help** - Check available commands
   ```
   /help
   ```

## Advanced Usage

### Command with Options

```typescript
// Commands can accept options
await executeCommand('/doc endpoint', agent, {
  cwd: '/path/to/project',
  autoExecute: true
});
```

### Programmatic Command Execution

```typescript
import { defaultCommandRegistry } from '@henry-ai/core';

const result = await defaultCommandRegistry.execute(
  '/test user auth',
  agent,
  { cwd: process.cwd() }
);

console.log(result.success);  // true/false
console.log(result.output);   // Command output
```

## Future Enhancements

- [ ] Command chaining: `/doc && /test`
- [ ] Command history: Navigate previous commands
- [ ] Interactive prompts: For missing arguments
- [ ] Command aliases: User-defined shortcuts
- [ ] Command completion: Tab completion in CLI
- [ ] Command templates: Save common command patterns

