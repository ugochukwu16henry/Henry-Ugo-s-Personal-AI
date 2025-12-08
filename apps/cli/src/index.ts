#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'

const program = new Command()

program
  .name('henry')
  .description("Henry Ugo's Personal AI - CLI Tool")
  .version('1.0.0')

program
  .command('index')
  .description('Index the current codebase')
  .option('-p, --path <path>', 'Path to index', process.cwd())
  .action(async (options) => {
    console.log(chalk.blue('Indexing codebase at:'), options.path)
    // TODO: Implement indexing
  })

program
  .command('ask')
  .description('Ask the AI a question')
  .argument('<question>', 'Question to ask')
  .option('-l, --local', 'Use local AI model')
  .action(async (question, options) => {
    console.log(chalk.blue('Question:'), question)
    console.log(chalk.gray('Using local AI:'), options.local ? 'Yes' : 'No')
    // TODO: Implement AI query
  })

program
  .command('task')
  .description('Deploy a task to the AI agent')
  .argument('<task>', 'Task description')
  .action(async (task) => {
    console.log(chalk.blue('Task:'), task)
    // TODO: Implement task delegation
  })

program.parse()

