#!/usr/bin/env node

import { HenryAgent } from '@henry-ai/core'

const task = process.argv[2]

if (!task) {
  console.error('Usage: henry "add login endpoint"')
  process.exit(1)
}

async function main() {
  const agent = new HenryAgent()
  
  try {
    await agent.executeTask({ goal: task })
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
