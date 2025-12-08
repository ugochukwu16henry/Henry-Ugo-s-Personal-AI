# Contributing to Henry Ugo's Personal AI

Thank you for your interest in contributing!

## Development Setup

1. **Prerequisites**
   - Node.js 18+ and npm 9+
   - Rust (for desktop app): Install from [rustup.rs](https://rustup.rs/)
   - Ollama (for local AI): Install from [ollama.ai](https://ollama.ai/)

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build All Packages**
   ```bash
   npm run build
   ```

4. **Development**
   ```bash
   # Desktop app
   npm run dev:desktop

   # Web app
   npm run dev:web

   # CLI tool
   npm run dev:cli
   ```

## Project Structure

- `apps/` - Applications (desktop, web, CLI)
- `packages/` - Shared packages (core, local-ai, rules-engine)
- `docs/` - Documentation
- `examples/` - Example projects

## Coding Standards

- TypeScript strict mode enabled
- Follow the `.henryrc` configuration rules
- Include JSDoc comments for public APIs
- Write tests for new features

## Commit Messages

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `perf:` Performance improvement

## License

MIT © Henry Ugo

