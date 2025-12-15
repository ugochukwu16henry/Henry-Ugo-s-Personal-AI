/**
 * Example: Multi-Step Task Execution
 */

import { HenryAgent } from '@henry-ai/core';

async function example1() {
  console.log('Example 1: Add Login Endpoint\n');
  
  const agent = new HenryAgent();
  await agent.initializeMemory();

  const result = await agent.executeTask({
    goal: 'Add login endpoint with JWT authentication'
  });

  if (result.success) {
    console.log(`\n✅ Task completed!`);
    console.log(`   Steps: ${result.stepsCompleted}/${result.totalSteps}`);
    console.log(`   Files modified: ${result.filesModified.length}`);
    result.filesModified.forEach(file => {
      console.log(`   - ${file}`);
    });
  } else {
    console.error(`\n❌ Task failed: ${result.error}`);
    if (result.rollbackPerformed) {
      console.log('✅ Changes were rolled back');
    }
  }
}

async function example2() {
  console.log('\n\nExample 2: Create Feature with Custom Directory\n');
  
  const agent = new HenryAgent();
  await agent.initializeMemory();

  const result = await agent.executeTask({
    goal: 'Create user profile management API',
    cwd: './my-project'
  });

  console.log('Execution result:', result);
}

async function example3() {
  console.log('\n\nExample 3: Error Handling\n');
  
  const agent = new HenryAgent();
  await agent.initializeMemory();

  try {
    const result = await agent.executeTask({
      goal: 'Add feature that will cause test failure'
    });

    if (!result.success) {
      console.log('Task failed as expected');
      console.log('Error:', result.error);
      console.log('Rollback performed:', result.rollbackPerformed);
    }
  } catch (error: any) {
    console.error('Unexpected error:', error.message);
  }
}

async function example4() {
  console.log('\n\nExample 4: Step-by-Step Monitoring\n');
  
  const agent = new HenryAgent();
  await agent.initializeMemory();

  // The executor logs progress automatically
  const result = await agent.executeTask({
    goal: 'Add OAuth2 endpoint with Swagger documentation'
  });

  // Check execution details
  console.log('\nExecution Summary:');
  console.log('==================');
  console.log('Success:', result.success);
  console.log('Steps completed:', result.stepsCompleted);
  console.log('Total steps:', result.totalSteps);
  console.log('Files modified:', result.filesModified);
  console.log('Rollback performed:', result.rollbackPerformed);
}

// Run examples
async function main() {
  console.log('Multi-Step Task Execution Examples\n');
  console.log('='.repeat(50));
  
  // Uncomment to run examples:
  // await example1();
  // await example2();
  // await example3();
  // await example4();
  
  console.log('\n⚠️  Examples are commented out to prevent execution.');
  console.log('Uncomment in the code to run examples.');
}

if (require.main === module) {
  main().catch(console.error);
}

