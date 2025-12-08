import * as fs from 'fs/promises'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { z } from 'zod'
import type { HenryConfig } from './types'
import { HenryConfigSchema } from './types'

/**
 * Parser for .henryrc configuration files
 * Supports JSON and YAML formats
 */
export class HenryConfigParser {
  async loadFromFile(filePath: string = '.henryrc'): Promise<HenryConfig> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return this.parse(content, path.extname(filePath))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Return default config if file doesn't exist
        return HenryConfigSchema.parse({})
      }
      throw error
    }
  }

  async loadFromDirectory(dirPath: string): Promise<HenryConfig | null> {
    const possiblePaths = [
      path.join(dirPath, '.henryrc'),
      path.join(dirPath, '.henryrc.json'),
      path.join(dirPath, '.henryrc.yaml'),
      path.join(dirPath, '.henryrc.yml')
    ]

    for (const filePath of possiblePaths) {
      try {
        return await this.loadFromFile(filePath)
      } catch {
        continue
      }
    }

    return null
  }

  parse(content: string, extension?: string): HenryConfig {
    let parsed: any

    if (extension === '.yaml' || extension === '.yml' || content.trim().startsWith('---')) {
      parsed = yaml.load(content)
    } else {
      parsed = JSON.parse(content)
    }

    return HenryConfigSchema.parse(parsed)
  }

  async saveToFile(config: HenryConfig, filePath: string = '.henryrc.json'): Promise<void> {
    const content = JSON.stringify(config, null, 2)
    await fs.writeFile(filePath, content, 'utf-8')
  }
}

