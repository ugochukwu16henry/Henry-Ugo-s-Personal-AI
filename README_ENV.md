# Environment Variables Guide

This document explains all environment variables used by Henry Ugo's Personal AI.

## Quick Start

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values (especially API keys)

3. Never commit `.env` to git (it's already in `.gitignore`)

## Required Variables

**For Local AI (Ollama):**

- `OLLAMA_MODEL` - Model name (e.g., `codellama`, `phi3:mini`, `tinyllama`)
  - Default: `codellama`
  - Make sure Ollama is installed and the model is downloaded

**For Cloud AI Fallback (Optional):**

- `OPENAI_API_KEY` - Your OpenAI API key (starts with `sk-`)
- `ANTHROPIC_API_KEY` - Your Anthropic API key (starts with `sk-ant-`)

## Variable Categories

### Local AI Configuration

- `OLLAMA_URL` - Ollama server URL (default: `http://localhost:11434/api/generate`)
- `OLLAMA_MODEL` - Default model (default: `codellama`)
- `LOCAL_AI_ENABLED` - Enable/disable local AI (default: `true`)

### Cloud AI Configuration

- `OPENAI_API_KEY` - OpenAI API key for GPT models
- `OPENAI_MODEL` - OpenAI model name (default: `gpt-4-turbo-preview`)
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude
- `ANTHROPIC_MODEL` - Anthropic model name (default: `claude-3-opus-20240229`)
- `CLOUD_AI_PROVIDER` - Preferred provider: `openai`, `anthropic`, or `auto`

### Application Settings

- `NODE_ENV` - Environment: `development`, `production`, `test`
- `LOG_LEVEL` - Logging level: `debug`, `info`, `warn`, `error`
- `DEBUG` - Enable debug mode (default: `false`)

### Performance & Limits

- `LOCAL_AI_TIMEOUT` - Max wait time for local AI in ms (default: `30000`)
- `CLOUD_AI_TIMEOUT` - Max wait time for cloud AI in ms (default: `60000`)
- `AI_MAX_RETRIES` - Maximum retries for AI requests (default: `3`)
- `AI_CACHE_ENABLED` - Enable request caching (default: `true`)

### Vector Database

- `LANCEDB_PATH` - Path to LanceDB storage (default: `./.henry-db`)
- `EMBEDDING_DIMENSION` - Vector dimension (default: `1536`)
- `VECTOR_SEARCH_ENABLED` - Enable vector search (default: `true`)

### Indexing

- `MAX_FILE_SIZE` - Max file size to index in bytes (default: `1048576` = 1MB)
- `IGNORE_PATTERNS` - Comma-separated glob patterns to ignore

### Desktop App (Tauri)

- `TAURI_DEV_MODE` - Enable Tauri dev tools (default: `true`)
- `VITE_PORT` - Vite dev server port (default: `1420`)

### Security & Privacy

- `ALLOW_CLOUD_AI` - Allow data to be sent to cloud AI (default: `false`)
- `TELEMETRY_ENABLED` - Enable telemetry (default: `false`)

## Examples

### Local-Only Setup (Privacy-First)

```env
LOCAL_AI_ENABLED=true
ALLOW_CLOUD_AI=false
OLLAMA_MODEL=phi3:mini
```

### Cloud-Only Setup (Fast, Requires API Keys)

```env
LOCAL_AI_ENABLED=false
ALLOW_CLOUD_AI=true
OPENAI_API_KEY=sk-your-key-here
CLOUD_AI_PROVIDER=openai
```

### Hybrid Setup (Local with Cloud Fallback)

```env
LOCAL_AI_ENABLED=true
ALLOW_CLOUD_AI=true
OLLAMA_MODEL=codellama
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
CLOUD_AI_PROVIDER=auto
```

### Development Setup

```env
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=true
TAURI_DEV_MODE=true
```

## Getting API Keys

### OpenAI

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-`)

### Anthropic

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy the key (starts with `sk-ant-`)

## Model Recommendations

### For Limited RAM (< 8GB)

- `tinyllama` (637MB) - Fastest, good for simple tasks
- `phi3:mini` (3.8GB) - Best balance of speed and quality

### For 8GB+ RAM

- `codellama` (7B, ~5.5GB RAM) - Good for code generation
- `llama3:8b` (if available) - Latest and best quality

### For Cloud Fallback

- OpenAI: `gpt-4-turbo-preview` or `gpt-3.5-turbo`
- Anthropic: `claude-3-opus-20240229` or `claude-3-sonnet-20240229`
