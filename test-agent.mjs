// Test script for HenryAgent (ES Module version)
import { HenryAgent } from './packages/core/src/agent.js';
import * as fs from 'fs/promises';

async function testAgent() {
  console.log('🤖 Initializing HenryAgent...\n');
  const agent = new HenryAgent();

  // Test 1: Plan a task
  console.log('📋 Testing plan() method...');
  console.log('Task: Add OAuth2-protected journal endpoint with Swagger docs\n');
  
  try {
    const steps = await agent.plan('Add OAuth2-protected journal endpoint with Swagger docs');
    console.log('✅ Plan generated:');
    if (Array.isArray(steps)) {
      steps.forEach((step, i) => console.log(`${i + 1}. ${step}`));
    } else {
      console.log(steps);
    }
  } catch (error) {
    console.error('❌ Error in plan():', error.message);
    console.error(error.stack);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Edit a file (create a sample file first)
  console.log('✏️  Testing edit() method...');
  
  // Create a test file
  const testFile = './test-file.js';
  const sampleCode = `function hello() {
  return "Hello World";
}`;
  
  try {
    await fs.writeFile(testFile, sampleCode);
    console.log(`Created test file: ${testFile}`);
    console.log('Instruction: Add JWT validation and error handling\n');

    const newCode = await agent.edit(testFile, 'Add JWT validation and error handling');
    console.log('✅ Code generated:');
    console.log(newCode);
    
    // Clean up
    await fs.unlink(testFile);
    console.log(`\n🗑️  Cleaned up ${testFile}`);
  } catch (error) {
    console.error('❌ Error in edit():', error.message);
    console.error(error.stack);
    // Clean up on error
    try {
      await fs.unlink(testFile);
    } catch {}
  }
}

testAgent().catch(console.error);

