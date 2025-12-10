// Load .henryrc from project root
import * as fs from 'fs/promises'
import * as path from 'path'

export interface HenryRules {
  style: 'MVC' | 'functional'
  auth: 'JWT' | 'OAuth2'
  docs: 'Swagger' | 'OpenAPI'
  testFramework: 'jest' | 'vitest'
}

export async function loadRules(cwd: string): Promise<HenryRules> {
  try {
    // Try to find .henryrc file
    const possiblePaths = [
      path.join(cwd, '.henryrc'),
      path.join(cwd, '.henryrc.json'),
      path.join(cwd, '.henryrc.yaml'),
      path.join(cwd, '.henryrc.yml')
    ]

    for (const filePath of possiblePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const config = JSON.parse(content)
        
        // Map config to simplified rules
        return {
          style: config.style === 'functional' ? 'functional' : 'MVC',
          auth: config.auth === 'OAuth2' ? 'OAuth2' : 'JWT',
          docs: config.docs === 'OpenAPI' ? 'OpenAPI' : 'Swagger',
          testFramework: config.testFramework === 'jest' ? 'jest' : 'vitest'
        }
      } catch {
        continue
      }
    }
  } catch {
    // Fallback to defaults
  }

  return {
    style: 'MVC',
    auth: 'JWT',
    docs: 'Swagger',
    testFramework: 'vitest'
  }
}

// Also export the advanced parser for complex configs
export * from './parser'
export * from './types'
