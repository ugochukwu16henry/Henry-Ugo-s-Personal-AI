/**
 * Example: Cloud AI Fallback System
 */

import { streamGenerate, generateComplete, AIRouter, isOllamaRunning } from '@henry-ai/core';

/**
 * Example 1: Simple streaming with automatic fallback
 */
async function example1() {
  console.log('Example 1: Simple Streaming\n');
  
  console.log('Generating response with automatic fallback...\n');
  
  for await (const token of streamGenerate(
    'Write a hello world function in TypeScript'
  )) {
    process.stdout.write(token);
  }
  
  console.log('\n\n✅ Done!\n');
}

/**
 * Example 2: Check which AI is being used
 */
async function example2() {
  console.log('Example 2: Check AI Availability\n');
  
  const usingLocal = await isOllamaRunning();
  
  console.log(`Ollama running: ${usingLocal ? '✅ Yes' : '❌ No'}`);
  console.log(`Will use: ${usingLocal ? 'Local (Ollama)' : 'Cloud (OpenAI)'}\n`);
  
  if (!usingLocal && !process.env.OPENAI_API_KEY) {
    console.log('⚠️  Warning: No AI backend available!');
    console.log('   Please start Ollama or set OPENAI_API_KEY\n');
    return;
  }
}

/**
 * Example 3: Generate complete response (non-streaming)
 */
async function example3() {
  console.log('Example 3: Complete Response\n');
  
  try {
    const response = await generateComplete(
      'What is TypeScript? Answer in one sentence.'
    );
    
    console.log('Response:', response);
    console.log('\n✅ Done!\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Example 4: Using AIRouter directly with options
 */
async function example4() {
  console.log('Example 4: AIRouter with Options\n');
  
  const router = new AIRouter({
    openAIApiKey: process.env.OPENAI_API_KEY
  });
  
  console.log('Streaming with custom options...\n');
  
  for await (const token of router.generate(
    'Write a factorial function',
    {
      model: 'phi3:mini',  // Tries Ollama first with this model
      temperature: 0.5,
      maxTokens: 500
    }
  )) {
    process.stdout.write(token);
  }
  
  console.log('\n\n✅ Done!\n');
}

/**
 * Example 5: Error handling
 */
async function example5() {
  console.log('Example 5: Error Handling\n');
  
  try {
    // Temporarily clear API key to test error
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    
    const router = new AIRouter();
    
    for await (const token of router.generate('Hello')) {
      process.stdout.write(token);
    }
    
    // Restore API key
    if (originalKey) {
      process.env.OPENAI_API_KEY = originalKey;
    }
  } catch (error: any) {
    console.error('❌ Caught error:', error.message);
    
    if (error.message.includes('No AI backend available')) {
      console.log('\n📝 To fix this:');
      console.log('   1. Start Ollama: ollama serve');
      console.log('   2. OR set OpenAI API key: export OPENAI_API_KEY=sk-...');
    }
  }
  
  console.log('\n');
}

/**
 * Run examples
 */
async function main() {
  console.log('🚀 Cloud AI Fallback Examples\n');
  console.log('=' .repeat(50) + '\n');
  
  await example2(); // Check availability first
  await example1(); // Simple streaming
  // await example3(); // Uncomment to test complete response
  // await example4(); // Uncomment to test with options
  // await example5(); // Uncomment to test error handling
}

if (require.main === module) {
  main().catch(console.error);
}

