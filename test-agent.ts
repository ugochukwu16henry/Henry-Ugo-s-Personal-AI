// Test script for HenryAgent
import { HenryAgent } from './packages/core/src/agent';
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
    console.log(JSON.stringify(steps, null, 2));
  } catch (error: any) {
    console.error('❌ Error in plan():', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Edit a file (create a sample file first)
  console.log('✏️  Testing edit() method...');
  
  // Create a test file
  const testFile = './test-file.js';
  const sampleCode = `function hello() {
  return "Hello World";
}`;
  
  await fs.writeFile(testFile, sampleCode);
  console.log(`Created test file: ${testFile}`);
  console.log('Instruction: Add JWT validation and error handling\n');

  try {
    const newCode = await agent.edit(testFile, 'Add JWT validation and error handling');
    console.log('✅ Code generated:');
    console.log(newCode);
    
    // Clean up
    await fs.unlink(testFile);
    console.log(`\n🗑️  Cleaned up ${testFile}`);
  } catch (error: any) {
    console.error('❌ Error in edit():', error.message);
    // Clean up on error
    try {
      await fs.unlink(testFile);
    } catch {}
  }
}

testAgent().catch(console.error);

