# Tree-sitter Parser

AST parsing using Tree-sitter for multiple languages.

## Setup

To use Tree-sitter with real grammars, download the WASM files:

```bash
# Download Tree-sitter WASM files (example for JavaScript)
# Place them in a public/static directory accessible at runtime

# Option 1: Download manually from:
# https://github.com/tree-sitter/tree-sitter-javascript/releases
# https://github.com/tree-sitter/tree-sitter-typescript/releases
# etc.

# Option 2: Use a bundler that handles WASM files
# The parser will fallback to regex-based extraction if WASM files aren't found
```

## Supported Languages

- JavaScript/TypeScript
- Python
- Rust
- Go
- Java
- C++

The parser will automatically fallback to regex-based symbol extraction if WASM grammars aren't available.

