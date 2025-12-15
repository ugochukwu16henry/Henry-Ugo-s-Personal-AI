#!/usr/bin/env node

import { HenryAgent, executeCommand, defaultCommandRegistry } from '@henry-ai/core'

const input = process.argv.slice(2).join(' ')

if (!input) {
  console.error('Usage: henry "add login endpoint" or henry "/doc Add Swagger to /wellness"')
  console.error('\nAvailable commands:')
  defaultCommandRegistry.getAll().forEach(cmd => {
    console.error(`  /${cmd.name} - ${cmd.description}`)
  })
  process.exit(1)
}

async function main() {
  const agent = new HenryAgent()
  await agent.initializeMemory()
  
  try {
    // Check if input is a command
    if (defaultCommandRegistry.isCommand(input)) {
      // Execute command
      const result = await executeCommand(input, agent, { cwd: process.cwd() })
      
      console.log(result.output)
      
      if (!result.success) {
        process.exit(1)
      }
    } else {
      // Execute as regular task
      const result = await agent.executeTask({ 
        goal: input,
        cwd: process.cwd()
      })
      
      if (!result.success) {
        console.error(`❌ Task failed: ${result.error}`)
        process.exit(1)
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
