/**
 * Example: Using Custom Commands
 */

import { 
  HenryAgent, 
  executeCommand, 
  defaultCommandRegistry 
} from '@henry-ai/core';

async function example1() {
  console.log('Example 1: /doc command\n');
  
  const agent = new HenryAgent();
  await agent.initializeMemory();

  // Generate Swagger documentation
  const result = await executeCommand(
    '/doc Add Swagger to /wellness endpoint',
    agent
  );

  console.log('Result:', result.output);
}

async function example2() {
  console.log('\n\nExample 2: /test command\n');
  
  const agent = new HenryAgent();
  await agent.initializeMemory();

  // Generate tests
  const result = await executeCommand(
    '/test Add tests for user authentication',
    agent
  );

  console.log('Result:', result.output);
}

async function example3() {
  console.log('\n\nExample 3: /pr command\n');
  
  const agent = new HenryAgent();
  await agent.initializeMemory();

  // Generate PR description
  const result = await executeCommand(
    '/pr summarize changes for user auth feature',
    agent
  );

  console.log('Result:', result.output);
}

async function example4() {
  console.log('\n\nExample 4: /help command\n');
  
  // Show available commands
  const result = await executeCommand('/help', new HenryAgent());
  console.log(result.output);
}

async function example5() {
  console.log('\n\nExample 5: Register custom command\n');
  
  // Register a custom command
  defaultCommandRegistry.register({
    name: 'refactor',
    description: 'Refactor code according to best practices',
    aliases: ['ref'],
    handler: async (agent, args) => {
      const goal = `Refactor code: ${args}`;
      return await agent.executeTask({ goal });
    }
  });

  // Use the custom command
  const agent = new HenryAgent();
  await agent.initializeMemory();
  
  const result = await executeCommand(
    '/refactor Extract authentication logic to separate module',
    agent
  );

  console.log('Result:', result.output);
}

async function example6() {
  console.log('\n\nExample 6: Check if input is a command\n');
  
  const inputs = [
    '/doc Add Swagger',
    'Regular task description',
    '/test user auth',
    'Another regular task'
  ];

  for (const input of inputs) {
    const isCmd = defaultCommandRegistry.isCommand(input);
    console.log(`"${input}" → ${isCmd ? 'Command' : 'Regular task'}`);
  }
}

// Run examples
if (require.main === module) {
  (async () => {
    await example4(); // Show help first
    await example6(); // Show command detection
    // Uncomment to run other examples:
    // await example1();
    // await example2();
    // await example3();
    // await example5();
  })().catch(console.error);
}

