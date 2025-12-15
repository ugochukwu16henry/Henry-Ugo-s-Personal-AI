// Standalone test - imports directly from source files
import axios from 'axios';

const OLLAMA_URL = 'http://localhost:11434/api/generate';

async function* generateStream(request) {
  const response = await axios.post(OLLAMA_URL, {
    ...request,
    stream: true
  }, {
    responseType: 'stream'
  });

  for await (const chunk of response.data) {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        try {
          const json = JSON.parse(line);
          if (json.response) yield json.response;
          if (json.done) break;
        } catch (e) {
          // Skip parse errors
        }
      }
    }
  }
}

// Test 1: Plan a task
console.log('🤖 Testing HenryAgent plan() functionality...\n');
console.log('Task: Add OAuth2-protected journal endpoint with Swagger docs\n');
console.log('Streaming response from codellama:\n');

const prompt = `You are Henry's AI coding assistant. Break this into steps:

Task: Add OAuth2-protected journal endpoint with Swagger docs

Rules: Use MVC, validate input, secure with JWT, document with Swagger.

Output JSON array of strings.`;

let fullResponse = '';

try {
  for await (const token of generateStream({ model: 'codellama', prompt })) {
    process.stdout.write(token);
    fullResponse += token;
  }
  
  console.log('\n\n✅ Stream complete!\n');
  console.log('Parsing response...\n');
  
  try {
    const steps = JSON.parse(fullResponse);
    console.log('✅ Plan generated (as JSON array):');
    steps.forEach((step, i) => console.log(`${i + 1}. ${step}`));
  } catch {
    console.log('⚠️  Could not parse as JSON, showing raw response:');
    console.log(fullResponse.split('\n').filter(l => l.trim()).join('\n'));
  }
} catch (error) {
  console.error('\n❌ Error:', error.message);
  if (error.response) {
    console.error('Response status:', error.response.status);
  }
}

