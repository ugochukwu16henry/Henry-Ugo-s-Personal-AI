# Cloud AI Fallback System

## Overview

Automatic fallback system that prioritizes local AI (Ollama) and falls back to cloud AI (OpenAI) when local AI is unavailable.

## Architecture

```
Request → Check Ollama → Running? → Yes → Use Ollama
                      ↓ No
                  Check OpenAI API Key → Set? → Yes → Use OpenAI
                                      ↓ No
                                  Error: No AI available
```

## Usage

### Simple Streaming API

```typescript
import { streamGenerate } from '@henry-ai/core';

// Automatically uses Ollama if available, otherwise OpenAI
for await (const token of streamGenerate('Write a hello world function')) {
  process.stdout.write(token);
}
```

### With Options

```typescript
for await (const token of streamGenerate('Write a function', {
  model: 'phi3:mini',  // Ollama model or 'gpt-4' for OpenAI
  temperature: 0.7,
  maxTokens: 2000
})) {
  process.stdout.write(token);
}
```

### Complete Response (Non-Streaming)

```typescript
import { generateComplete } from '@henry-ai/core';

const response = await generateComplete('Write a hello world function');
console.log(response);
```

### Using AIRouter Directly

```typescript
import { AIRouter } from '@henry-ai/core';

const router = new AIRouter({
  openAIApiKey: process.env.OPENAI_API_KEY
});

// Streaming
for await (const token of router.generate('Hello')) {
  console.log(token);
}

// Complete
const fullResponse = await router.generateComplete('Hello');
```

## Features

✅ **Automatic Detection** - Checks if Ollama is running  
✅ **Seamless Fallback** - Falls back to OpenAI automatically  
✅ **Streaming Support** - Real-time token streaming  
✅ **Error Handling** - Clear error messages  
✅ **Configuration** - Environment variable based  

## Configuration

### Environment Variables

```bash
# Local AI (Ollama)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini  # or codellama, mistral, etc.

# Cloud AI (OpenAI)
OPENAI_API_KEY=sk-...

# Optional: Claude
ANTHROPIC_API_KEY=sk-ant-...
```

### Priority Order

1. **Ollama (Local)** - If `isOllamaRunning()` returns true
2. **OpenAI** - If `OPENAI_API_KEY` is set
3. **Error** - If neither is available

## Implementation Details

### Ollama Check

```typescript
// packages/local-ai/src/ollama-check.ts
export async function isOllamaRunning(): Promise<boolean> {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, {
      timeout: 2000
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
```

### OpenAI Streaming

```typescript
// packages/local-ai/src/openai.ts
export async function* streamOpenAI(
  prompt: string,
  options: OpenAIStreamOptions
): AsyncGenerator<string, void, unknown> {
  // Streaming implementation using OpenAI Chat Completions API
  // with Server-Sent Events (SSE)
}
```

### Router Implementation

```typescript
// packages/core/src/ai-router.ts
export class AIRouter {
  async *generate(prompt: string, options?: {...}): AsyncGenerator<string> {
    // Try Ollama first
    if (await isOllamaRunning()) {
      try {
        yield* generateStream({ model, prompt, ... });
        return; // Success
      } catch (error) {
        // Fall through to cloud
      }
    }

    // Fallback to OpenAI
    if (this.openAIApiKey) {
      try {
        yield* streamOpenAI(prompt, { apiKey: this.openAIApiKey, ... });
        return; // Success
      } catch (error) {
        // Fall through to error
      }
    }

    throw new Error('No AI backend available');
  }
}
```

## Error Handling

### No AI Available

```typescript
try {
  for await (const token of streamGenerate('Hello')) {
    console.log(token);
  }
} catch (error) {
  if (error.message.includes('No AI backend available')) {
    console.error('Please ensure Ollama is running or set OPENAI_API_KEY');
  }
}
```

### Ollama Not Running

When Ollama is not running, the system automatically falls back to OpenAI (if API key is set). No error is thrown unless both are unavailable.

### OpenAI API Error

If OpenAI API call fails, the error is logged and re-thrown:

```typescript
⚠️  OpenAI failed: API error 401: Invalid API key
```

## Examples

### Example 1: Basic Usage

```typescript
import { streamGenerate } from '@henry-ai/core';

async function main() {
  console.log('Generating response...\n');
  
  for await (const token of streamGenerate(
    'Write a Python function to calculate factorial'
  )) {
    process.stdout.write(token);
  }
  
  console.log('\n\nDone!');
}

main();
```

### Example 2: With Model Selection

```typescript
import { streamGenerate } from '@henry-ai/core';

// Prefer local, but allow OpenAI fallback
for await (const token of streamGenerate('Hello', {
  model: 'phi3:mini',  // Tries Ollama first with this model
  temperature: 0.5,
  maxTokens: 1000
})) {
  console.log(token);
}
```

### Example 3: Error Handling

```typescript
import { streamGenerate } from '@henry-ai/core';

try {
  for await (const token of streamGenerate('Hello')) {
    process.stdout.write(token);
  }
} catch (error: any) {
  if (error.message.includes('No AI backend available')) {
    console.error('❌ No AI available');
    console.error('   Please ensure:');
    console.error('   1. Ollama is running, OR');
    console.error('   2. OPENAI_API_KEY is set');
    process.exit(1);
  } else {
    throw error;
  }
}
```

### Example 4: Check Which AI is Being Used

```typescript
import { AIRouter, isOllamaRunning } from '@henry-ai/core';

const usingLocal = await isOllamaRunning();
console.log(`Using: ${usingLocal ? 'Local (Ollama)' : 'Cloud (OpenAI)'}`);

const router = new AIRouter();
for await (const token of router.generate('Hello')) {
  // Console logs will show which AI is being used
  process.stdout.write(token);
}
```

## Integration with Agent

The agent automatically uses the fallback system:

```typescript
// packages/core/src/agent.ts
import { streamGenerate } from './ai-stream';

// In plan() and edit() methods
for await (const token of streamGenerate(prompt, { model: this.model })) {
  fullResponse += token;
}
```

No code changes needed in agent - it automatically benefits from fallback!

## Performance Considerations

### Local AI (Ollama)
- ✅ **Pros**: Free, private, no API limits
- ⚠️ **Cons**: Requires local model, slower on CPU

### Cloud AI (OpenAI)
- ✅ **Pros**: Fast, powerful models, no local setup
- ⚠️ **Cons**: Costs money, requires internet, API limits

### Fallback Strategy
- Checks Ollama availability first (fast check, ~2s timeout)
- Falls back immediately if Ollama unavailable
- No retry delays - seamless transition

## Troubleshooting

### Ollama Not Detected

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if not running
ollama serve

# Or in background
ollama serve &
```

### OpenAI API Key Issues

```bash
# Set API key
export OPENAI_API_KEY=sk-your-key-here

# Or in .env file
echo "OPENAI_API_KEY=sk-your-key-here" >> .env
```

### Both AI Backends Unavailable

```
Error: No AI backend available. 
Please ensure Ollama is running (for local AI) 
or set OPENAI_API_KEY environment variable (for cloud AI).
```

**Solution:**
1. Start Ollama: `ollama serve`
2. OR set OpenAI API key: `export OPENAI_API_KEY=sk-...`

## Future Enhancements

- [ ] Claude/Anthropic support (already in types, needs implementation)
- [ ] Model preference configuration
- [ ] Fallback retry logic
- [ ] Cost tracking for cloud AI
- [ ] Local AI model auto-download
- [ ] Hybrid mode (local for simple tasks, cloud for complex)

