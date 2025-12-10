/**
 * Example: Using the Fast Autocomplete Engine
 */

import { 
  AutocompleteManager, 
  fastAutocomplete, 
  AutocompleteRequest,
  setupMonacoAutocomplete 
} from '@henry-ai/core';
import { CodeIndexer } from '@henry-ai/core';

// Example 1: Basic autocomplete
async function basicAutocomplete() {
  const request: AutocompleteRequest = {
    prefix: 'function greet(name: string): string {\n  return `Hello, ',
    suffix: '`;\n}',
    filePath: './src/example.ts',
    language: 'typescript',
    maxTokens: 20,
    temperature: 0.1
  };

  console.log('Generating autocomplete...');
  const startTime = Date.now();
  
  let completion = '';
  for await (const token of fastAutocomplete(request)) {
    completion += token;
    
    // Break if taking too long
    if (Date.now() - startTime > 80) {
      break;
    }
  }
  
  console.log(`Completion: "${completion}"`);
  console.log(`Latency: ${Date.now() - startTime}ms`);
}

// Example 2: Using AutocompleteManager
async function managerAutocomplete() {
  const manager = new AutocompleteManager({
    fastModel: 'phi3:mini',
    timeout: 80,
    useIndexer: true,
    maxContextSymbols: 5
  });

  // Optional: Set indexer for context-aware completions
  // const indexer = new CodeIndexer();
  // await indexer.initialize();
  // await indexer.indexDirectory('./src');
  // manager.setIndexer(indexer);

  const request: AutocompleteRequest = {
    prefix: 'const result = await fetch(',
    suffix: ');',
    filePath: './src/api.ts',
    language: 'typescript'
  };

  const result = await manager.getCompletions(request);
  
  console.log('Completions:', result.completions);
  console.log(`Latency: ${result.latency}ms`);
  console.log(`Context used: ${result.contextUsed}`);
}

// Example 3: Integrate with Monaco Editor (in desktop/web apps)
async function monacoIntegration() {
  // In your app:
  // import * as monaco from 'monaco-editor';
  // import { setupMonacoAutocomplete, AutocompleteManager } from '@henry-ai/core';
  
  const manager = new AutocompleteManager({
    fastModel: 'phi3:mini',
    timeout: 80
  });

  // Optional: Initialize indexer
  // const indexer = new CodeIndexer();
  // await indexer.initialize();
  // await indexer.indexDirectory('./src');

  // Setup autocomplete for all languages
  // const disposables = setupMonacoAutocomplete(
  //   manager,
  //   indexer, // optional
  //   {
  //     triggerCharacters: ['.', '('],
  //     fastModel: 'phi3:mini',
  //     timeout: 80
  //   },
  //   monaco // Pass monaco instance
  // );

  console.log('Monaco autocomplete setup complete!');
}

// Example 4: Performance monitoring
async function performanceTest() {
  const manager = new AutocompleteManager();
  
  const testCases = [
    {
      prefix: 'function calculate(',
      suffix: ') {',
      filePath: './test.ts'
    },
    {
      prefix: 'const user = {',
      suffix: '};',
      filePath: './test.ts'
    },
    {
      prefix: 'async function fetchData(',
      suffix: ') {',
      filePath: './test.ts'
    }
  ];

  const results = [];
  
  for (const testCase of testCases) {
    const startTime = Date.now();
    const result = await manager.getCompletions({
      ...testCase,
      language: 'typescript'
    });
    const latency = Date.now() - startTime;
    
    results.push({
      ...testCase,
      latency,
      hasCompletion: result.completions.length > 0
    });
  }

  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const under80ms = results.filter(r => r.latency < 80).length;
  
  console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`Under 80ms: ${under80ms}/${results.length}`);
  console.log('Results:', results);
}

// Run examples
if (require.main === module) {
  console.log('Example 1: Basic Autocomplete');
  basicAutocomplete().catch(console.error);
  
  setTimeout(() => {
    console.log('\nExample 2: Manager Autocomplete');
    managerAutocomplete().catch(console.error);
  }, 2000);
}

