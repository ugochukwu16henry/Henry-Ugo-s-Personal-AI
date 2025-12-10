// Script to download Tree-sitter WASM grammar files
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WASM_DIR = join(__dirname, '../wasm');
const GRAMMARS = {
  javascript: 'https://github.com/tree-sitter/tree-sitter-javascript/releases/download/v0.20.0/tree-sitter-javascript.wasm',
  typescript: 'https://github.com/tree-sitter/tree-sitter-typescript/releases/download/v0.20.5/tree-sitter-typescript.wasm',
  python: 'https://github.com/tree-sitter/tree-sitter-python/releases/download/v0.20.4/tree-sitter-python.wasm',
  rust: 'https://github.com/tree-sitter/tree-sitter-rust/releases/download/v0.20.4/tree-sitter-rust.wasm',
  go: 'https://github.com/tree-sitter/tree-sitter-go/releases/download/v0.19.1/tree-sitter-go.wasm',
  java: 'https://github.com/tree-sitter/tree-sitter-java/releases/download/v0.20.2/tree-sitter-java.wasm',
  cpp: 'https://github.com/tree-sitter/tree-sitter-cpp/releases/download/v0.20.0/tree-sitter-cpp.wasm'
};

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        return downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
      
      const fileStream = require('fs').createWriteStream(filepath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadGrammars() {
  console.log('📦 Downloading Tree-sitter WASM grammar files...\n');
  
  // Create wasm directory
  await mkdir(WASM_DIR, { recursive: true });
  
  for (const [lang, url] of Object.entries(GRAMMARS)) {
    const filename = `tree-sitter-${lang}.wasm`;
    const filepath = join(WASM_DIR, filename);
    
    try {
      console.log(`⬇️  Downloading ${filename}...`);
      await downloadFile(url, filepath);
      console.log(`✅ Downloaded ${filename}\n`);
    } catch (error) {
      console.warn(`⚠️  Failed to download ${filename}: ${error.message}`);
      console.log(`   You can manually download from: ${url}\n`);
    }
  }
  
  console.log('✨ Done! WASM files are in packages/tree-sitter-parser/wasm/');
}

downloadGrammars().catch(console.error);

