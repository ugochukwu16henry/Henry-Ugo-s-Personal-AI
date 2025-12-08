import { z } from 'zod'

/**
 * Configuration schema for .henryrc files
 */
export const HenryConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  team: z.object({
    members: z.array(z.string()).default([]),
    sharedRules: z.array(z.string()).default([])
  }).optional(),
  ai: z.object({
    preferredModel: z.enum(['local', 'openai', 'claude']).default('local'),
    fallbackModel: z.enum(['openai', 'claude']).optional()
  }).optional(),
  code: z.object({
    style: z.string().optional(),
    namingConvention: z.enum(['camelCase', 'PascalCase', 'snake_case', 'kebab-case']).default('camelCase'),
    indentSize: z.number().default(2)
  }).optional(),
  commands: z.record(z.string(), z.string()).optional()
})

export type HenryConfig = z.infer<typeof HenryConfigSchema>

