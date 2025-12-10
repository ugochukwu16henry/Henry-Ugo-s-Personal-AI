import { generateStream } from '@henry-ai/local-ai';
import * as fs from 'fs/promises';
import * as path from 'path';

export class HenryAgent {
  private model: string = 'codellama'; // default local

  async plan(task: string): Promise<string[]> {
    const prompt = `You are Henry's AI coding assistant. Break this into steps:

Task: ${task}

Rules: Use MVC, validate input, secure with JWT, document with Swagger.

Output JSON array of strings.`;

    let fullResponse = '';

    for await (const token of generateStream({ model: this.model, prompt })) {
      fullResponse += token;
    }

    try {
      return JSON.parse(fullResponse);
    } catch {
      // Fallback: split by newline
      return fullResponse.split('\n').filter(l => l.trim());
    }
  }

  async edit(filePath: string, instruction: string): Promise<string> {
    const currentCode = await fs.readFile(filePath, 'utf-8');
    
    const prompt = `FILE: ${filePath}

CURRENT:

\`\`\`js
${currentCode}
\`\`\`

INSTRUCTION: ${instruction}

RULES: Follow Henry's MVC style. Use async, validate input, return JSON.

RETURN ONLY FULL UPDATED FILE.`;

    let code = '';

    for await (const token of generateStream({ model: this.model, prompt })) {
      code += token;
    }

    // Extract code block
    const match = code.match(/```(?:js|javascript)?\n([\s\S]*)/);
    return match ? match[1].trim() : code;
  }
}
