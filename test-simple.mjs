// Simple test using ES modules
import { generateStream } from './packages/local-ai/src/ollama.js';

console.log('🧪 Testing generateStream with codellama...\n');
console.log('Prompt: "List 3 steps to add OAuth2 authentication"\n');

try {
  let fullResponse = '';
  let tokenCount = 0;
  
  console.log('Streaming response:\n');
  
  for await (const token of generateStream({ 
    model: 'codellama', 
    prompt: 'List 3 steps to add OAuth2 authentication. Be brief.' 
  })) {
    process.stdout.write(token);
    fullResponse += token;
    tokenCount++;
  }
  
  console.log('\n\n✅ Stream complete!');
  console.log(`Total tokens received: ${tokenCount}`);
  console.log(`Full response length: ${fullResponse.length} characters`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
  }
}

