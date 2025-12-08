# Henry Ugo's Personal AI

> A next-generation, local-first, ultra-fast, privacy-respecting, agentic code editor

## Vision

Henry Ugo's Personal AI is a secure, offline-capable AI coding companion that:

- Understands your codebase deeply (even your mental health API structure)
- Runs 90% of AI tasks locally (fast, private)
- Lets you delegate full tasks ("Add OAuth2-protected journal endpoint with Swagger docs")
- Syncs with your team (Kolawole) via shared rules & memory
- Is faster than Cursor (<80ms autocomplete, instant indexing)

## Performance Goals

- <80ms local autocomplete
- Full repo index in <15s (10k LOC)
- <5MB binary size (Tauri)
- 5-10x faster startup than Electron

## Architecture

This is a monorepo built with:

- **Desktop App**: Tauri (Rust) + React + TypeScript
- **Web App**: PWA (React + Vite + TypeScript)
- **CLI**: Node.js + TypeScript
- **Core Packages**: Shared logic for agent, indexer, AI routing
- **Local AI**: Ollama/llama.cpp integration
- **Rules Engine**: `.henryrc` parser, team collaboration

## Project Structure

```
henry-ugo-ai/
├── apps/
│   ├── desktop/          # Tauri frontend (Rust + React)
│   ├── web/              # PWA version (React + Vite)
│   └── cli/              # CLI agent (Node.js)
├── packages/
│   ├── core/             # Shared logic: agent, indexer, AI router
│   ├── local-ai/         # Ollama/llama.cpp integration
│   └── rules-engine/     # .henryrc parser, team rules
├── docs/                 # Auto-generated API + agent docs
└── examples/             # Sample projects (e.g., mental-health-api)
```

## Quick Start

```bash
# Install dependencies
npm install

# Run development servers
npm run dev:desktop  # Desktop app
npm run dev:web      # Web app
npm run dev:cli      # CLI tool

# Build all packages
npm run build
```

## Tech Stack

- **Frontend**: React 18+, TypeScript, Vite
- **Desktop**: Tauri 2.0+
- **Backend**: Node.js 18+, Express
- **AI**: Ollama (local), OpenAI/Claude (cloud)
- **Database**: MongoDB (optional, for team sync)
- **Documentation**: Swagger/OpenAPI

## Features

### Phase 0 (Current)
- ✅ Monorepo structure
- ✅ Core package architecture
- ⏳ Local AI integration
- ⏳ Code indexing engine
- ⏳ Agent orchestration

### Phase 1 (Next)
- Autocomplete engine
- File watcher & indexer
- `.henryrc` configuration
- Team sync protocol

## License

MIT © Henry Ugo

