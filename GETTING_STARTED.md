# Getting Started with Henry Ugo's Personal AI

## Prerequisites

1. **Node.js 18+** and npm 9+
   ```bash
   node --version  # Should be >= 18.0.0
   npm --version   # Should be >= 9.0.0
   ```

2. **Rust** (for desktop app)
   - Install from [rustup.rs](https://rustup.rs/)
   ```bash
   rustc --version
   ```

3. **Ollama** (for local AI)
   - Install from [ollama.ai](https://ollama.ai/)
   ```bash
   ollama --version
   
   # Pull recommended models
   ollama pull codellama:7b
   ollama pull phi3:mini
   ```

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd henry-ugo-ai

# Install all dependencies
npm install
```

## Development

### Run All Apps
```bash
npm run dev
```

### Run Individual Apps
```bash
npm run dev:desktop  # Desktop app (Tauri)
npm run dev:web      # Web PWA
npm run dev:cli      # CLI tool
```

### Build
```bash
npm run build        # Build all packages
npm run build:desktop
npm run build:web
npm run build:cli
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:ui

# Type checking
npm run typecheck
```

## Configuration

### Local AI Setup

1. Install Ollama: https://ollama.ai/
2. Pull models:
   ```bash
   ollama pull codellama:7b    # Best for code
   ollama pull phi3:mini       # Fastest option
   ```

### `.henryrc` Configuration

Create a `.henryrc.json` in your project root:

```json
{
  "version": "1.0.0",
  "team": {
    "members": ["Henry Ugo", "Kolawole"],
    "sharedRules": [
      "Always use TypeScript",
      "Follow MVC pattern",
      "Include Swagger documentation"
    ]
  },
  "ai": {
    "preferredModel": "local",
    "fallbackModel": "openai"
  },
  "code": {
    "namingConvention": "camelCase",
    "indentSize": 2
  }
}
```

### Environment Variables

Create `.env.local` in the project root:

```bash
# OpenAI (optional, for cloud fallback)
OPENAI_API_KEY=your-key-here

# Anthropic Claude (optional)
ANTHROPIC_API_KEY=your-key-here

# Ollama (defaults to localhost:11434)
OLLAMA_BASE_URL=http://localhost:11434
```

## Project Structure

```
henry-ugo-ai/
├── apps/
│   ├── desktop/          # Tauri desktop app
│   ├── web/              # PWA web app
│   └── cli/              # CLI tool
├── packages/
│   ├── core/             # Core agent, indexer, router
│   ├── local-ai/         # Ollama integration
│   ├── rules-engine/     # .henryrc parser
│   ├── tree-sitter-parser/ # AST parsing
│   └── vectordb/         # Vector embeddings
├── tests/
│   └── e2e/              # Playwright tests
└── docs/                 # Documentation
```

## Usage Examples

### CLI

```bash
# Index a codebase
henry index -p /path/to/project

# Ask the AI
henry ask "How does authentication work?"

# Deploy a task
henry task "Add OAuth2-protected journal endpoint with Swagger docs"
```

### Desktop/Web App

1. Open the app
2. Load a project folder
3. Start typing - autocomplete should appear (<80ms)
4. Use AI chat for questions
5. Use commands like `/doc`, `/test`, `/pr`

## Troubleshooting

### Ollama not connecting
- Ensure Ollama is running: `ollama serve`
- Check `OLLAMA_BASE_URL` in `.env.local`

### Build errors
- Clear Turbo cache: `npm run clean`
- Reinstall: `rm -rf node_modules && npm install`

### Monaco Editor not loading
- Check browser console for errors
- Ensure Vite dev server is running

## Next Steps

- See `PHASE1.md` for Phase 1 details
- See `PHASE2.md` for Phase 2 tech stack
- Check `CONTRIBUTING.md` for development guidelines

