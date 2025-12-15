# Tree-sitter Parser

AST parsing using Tree-sitter for multiple languages.

## Setup

### Option 1: Install Language Packages (Recommended)

Install the language packages which include prebuilt WASM files:

```bash
npm install tree-sitter-javascript tree-sitter-typescript tree-sitter-python tree-sitter-rust tree-sitter-go
```

Then run the setup script to copy WASM files:

```bash
npm run setup-wasm
```

### Option 2: Manual Setup

1. Download WASM files from [tree-sitter-wasm-prebuilt](https://github.com/Menci/tree-sitter-wasm-prebuilt) or build from source
2. Place them in the `wasm/` directory
3. Files should be named: `tree-sitter-{language}.wasm`

### Option 3: Use Fallback (Works Now)

The parser will automatically fallback to regex-based symbol extraction if WASM files aren't available. This works but is less accurate than AST parsing.

## Supported Languages

- JavaScript/TypeScript
- Python
- Rust
- Go
- Java
- C++

## Usage

```typescript
import { TreeSitterParser } from '@henry-ai/tree-sitter-parser';

const parser = new TreeSitterParser();
await parser.initialize();

const result = await parser.parse(code, 'javascript', 'file.js');
console.log(result.symbols); // Extracted symbols
console.log(result.ast);     // Full AST
```
