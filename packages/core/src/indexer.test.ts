import { describe, it, expect, beforeEach } from 'vitest'
import { CodeIndexer } from './indexer'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

describe('CodeIndexer', () => {
  let indexer: CodeIndexer
  let tempDir: string

  beforeEach(async () => {
    indexer = new CodeIndexer()
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'henry-ai-test-'))
  })

  it('should index a directory', async () => {
    // Create test files
    const testFile = path.join(tempDir, 'test.ts')
    await fs.writeFile(testFile, 'export function test() { return "hello" }', 'utf-8')

    const index = await indexer.indexDirectory(tempDir)

    expect(index).toBeDefined()
    expect(index.files.length).toBeGreaterThan(0)
    expect(index.metadata.totalFiles).toBe(1)
  })

  it('should detect TypeScript files', async () => {
    const tsFile = path.join(tempDir, 'test.ts')
    await fs.writeFile(tsFile, 'const x = 1', 'utf-8')

    const index = await indexer.indexDirectory(tempDir)
    const file = index.files.find(f => f.path === tsFile)

    expect(file).toBeDefined()
    expect(file?.language).toBe('typescript')
  })

  it('should skip node_modules', async () => {
    const nodeModules = path.join(tempDir, 'node_modules')
    await fs.mkdir(nodeModules, { recursive: true })
    await fs.writeFile(path.join(nodeModules, 'test.js'), 'test', 'utf-8')

    const index = await indexer.indexDirectory(tempDir)

    expect(index.files.find(f => f.path.includes('node_modules'))).toBeUndefined()
  })
})

