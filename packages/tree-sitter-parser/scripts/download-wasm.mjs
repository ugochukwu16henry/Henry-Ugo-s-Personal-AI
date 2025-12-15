// Script to setup Tree-sitter WASM grammar files
// Uses npm packages that include prebuilt WASM files

import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WASM_DIR = join(__dirname, '../wasm');

// Language packages that include WASM files
const LANGUAGE_PACKAGES = {
  javascript: 'tree-sitter-javascript',
  typescript: 'tree-sitter-typescript',
  python: 'tree-sitter-python',
  rust: 'tree-sitter-rust',
  go: 'tree-sitter-go',
  java: 'tree-sitter-java',
  cpp: 'tree-sitter-cpp'
};

async function setupWASMFiles() {
  console.log('📦 Setting up Tree-sitter WASM grammar files...\n');
  
  // Create wasm directory
  await mkdir(WASM_DIR, { recursive: true });
  
  console.log('Option 1: Install language packages (recommended)');
  console.log('Run: npm install tree-sitter-javascript tree-sitter-typescript tree-sitter-python');
  console.log('\nOption 2: Use prebuilt WASM from CDN or build from source');
  console.log('\nFor now, the parser will use regex fallback until WASM files are available.');
  console.log('\nTo manually setup:');
  console.log('1. Install language packages: npm install tree-sitter-javascript');
  console.log('2. Copy WASM files from node_modules/*/tree-sitter-*.wasm to wasm/ directory');
  console.log('3. Or download from: https://github.com/Menci/tree-sitter-wasm-prebuilt');
  
  // Try to find WASM files in node_modules if packages are installed
  let foundCount = 0;
  for (const [lang, pkg] of Object.entries(LANGUAGE_PACKAGES)) {
    try {
      const wasmPath = require.resolve(`${pkg}/tree-sitter-${lang}.wasm`);
      const targetPath = join(WASM_DIR, `tree-sitter-${lang}.wasm`);
      
      // Copy if found
      const wasmContent = await readFile(wasmPath);
      await writeFile(targetPath, wasmContent);
      console.log(`✅ Found and copied ${lang} WASM file`);
      foundCount++;
    } catch {
      // Package not installed, skip
    }
  }
  
  if (foundCount > 0) {
    console.log(`\n✨ Copied ${foundCount} WASM files to ${WASM_DIR}`);
  } else {
    console.log('\n💡 Tip: Install tree-sitter language packages to get WASM files automatically');
  }
}

setupWASMFiles().catch(console.error);
