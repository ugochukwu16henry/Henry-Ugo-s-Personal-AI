/**
 * AI Code Review Service
 * Analyzes code for bugs, style issues, and security risks
 */

import { AIModel } from './models';
import { UnifiedAIClient, ChatRequest } from './api';

export interface CodeReviewIssue {
  type: 'bug' | 'style' | 'security' | 'performance' | 'suggestion';
  severity: 'critical' | 'high' | 'medium' | 'low';
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
  code?: string;
}

export interface CodeReviewResult {
  issues: CodeReviewIssue[];
  summary: string;
  score: number; // 0-100
  suggestions: string[];
}

export class CodeReviewService {
  private model: AIModel;
  private apiClient?: UnifiedAIClient;

  constructor(model: AIModel, apiClient?: UnifiedAIClient) {
    this.model = model;
    this.apiClient = apiClient;
  }

  /**
   * Review code for issues
   */
  async reviewCode(code: string, language?: string, filePath?: string): Promise<CodeReviewResult> {
    if (!this.apiClient) {
      // Fallback to basic pattern matching
      return this.basicReview(code, language);
    }

    try {
      const chatRequest: ChatRequest = {
        messages: [
          {
            role: 'system',
            content: `You are an expert code reviewer. Analyze code for:
1. Bugs and errors
2. Style issues
3. Security vulnerabilities
4. Performance problems
5. Best practices

Return a structured review with specific issues, their severity, and suggestions.`
          },
          {
            role: 'user',
            content: `Review this ${language || 'code'}:\n\n\`\`\`${language || ''}\n${code}\n\`\`\`\n\nProvide:\n1. List of issues with type, severity, line number, and message\n2. A summary\n3. Overall score (0-100)\n4. General suggestions`
          }
        ],
        maxTokens: 2048,
        temperature: 0.3
      };

      const response = await this.apiClient.getChatCompletion(this.model, chatRequest);
      
      // Parse AI response (simplified - in production use structured output)
      return this.parseReviewResponse(response, code);
    } catch (error) {
      console.error('Code review error:', error);
      return this.basicReview(code, language);
    }
  }

  /**
   * Parse AI response into structured review
   */
  private parseReviewResponse(response: string, code: string): CodeReviewResult {
    const issues: CodeReviewIssue[] = [];
    const lines = code.split('\n');

    // Extract issues from response (simplified parsing)
    const issueMatches = response.matchAll(/(?:bug|error|issue|problem|vulnerability|security|style|performance)[^.]*\./gi);
    for (const match of issueMatches) {
      const text = match[0];
      const lineMatch = text.match(/line\s+(\d+)/i);
      const line = lineMatch ? parseInt(lineMatch[1]) : undefined;

      let type: CodeReviewIssue['type'] = 'suggestion';
      if (text.toLowerCase().includes('bug') || text.toLowerCase().includes('error')) {
        type = 'bug';
      } else if (text.toLowerCase().includes('security') || text.toLowerCase().includes('vulnerability')) {
        type = 'security';
      } else if (text.toLowerCase().includes('performance')) {
        type = 'performance';
      } else if (text.toLowerCase().includes('style')) {
        type = 'style';
      }

      let severity: CodeReviewIssue['severity'] = 'medium';
      if (text.toLowerCase().includes('critical')) {
        severity = 'critical';
      } else if (text.toLowerCase().includes('high')) {
        severity = 'high';
      } else if (text.toLowerCase().includes('low')) {
        severity = 'low';
      }

      issues.push({
        type,
        severity,
        line,
        message: text.trim(),
        code: line ? lines[line - 1] : undefined
      });
    }

    // Extract score
    const scoreMatch = response.match(/score[:\s]+(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;

    // Extract summary (first paragraph)
    const summaryMatch = response.match(/summary[:\s]+([^\n]+)/i) || 
                         response.match(/^([^\n]+)/);
    const summary = summaryMatch ? summaryMatch[1] : 'Code review completed';

    // Extract suggestions
    const suggestions: string[] = [];
    const suggestionMatches = response.matchAll(/(?:suggestion|recommendation|consider)[^.]*\./gi);
    for (const match of suggestionMatches) {
      suggestions.push(match[0].trim());
    }

    return {
      issues: issues.slice(0, 20), // Limit to 20 issues
      summary,
      score: Math.max(0, Math.min(100, score)),
      suggestions: suggestions.slice(0, 10) // Limit to 10 suggestions
    };
  }

  /**
   * Basic pattern-based review (fallback)
   */
  private basicReview(code: string, language?: string): CodeReviewResult {
    const issues: CodeReviewIssue[] = [];
    const lines = code.split('\n');

    // Check for common issues
    lines.forEach((line, index) => {
      // Check for console.log (style issue)
      if (line.includes('console.log') && !line.includes('//')) {
        issues.push({
          type: 'style',
          severity: 'low',
          line: index + 1,
          message: 'Consider removing console.log statements in production code',
          code: line.trim(),
          suggestion: 'Use a proper logging library or remove debug statements'
        });
      }

      // Check for TODO/FIXME
      if (line.match(/TODO|FIXME|HACK|XXX/i)) {
        issues.push({
          type: 'suggestion',
          severity: 'low',
          line: index + 1,
          message: 'Code contains TODO/FIXME comment',
          code: line.trim()
        });
      }

      // Check for potential security issues
      if (line.match(/eval\(|innerHTML\s*=|document\.write\(/i)) {
        issues.push({
          type: 'security',
          severity: 'high',
          line: index + 1,
          message: 'Potential security vulnerability detected',
          code: line.trim(),
          suggestion: 'Avoid using eval(), innerHTML, or document.write() with user input'
        });
      }
    });

    const score = issues.length === 0 ? 90 : Math.max(50, 90 - issues.length * 5);

    return {
      issues,
      summary: `Found ${issues.length} potential issue${issues.length !== 1 ? 's' : ''}`,
      score,
      suggestions: [
        'Review code for best practices',
        'Add error handling where needed',
        'Consider adding unit tests'
      ]
    };
  }

  /**
   * Review diff/changes
   */
  async reviewDiff(oldCode: string, newCode: string, language?: string): Promise<CodeReviewResult> {
    const diff = this.generateDiff(oldCode, newCode);
    return this.reviewCode(diff, language);
  }

  /**
   * Generate simple diff text
   */
  private generateDiff(oldCode: string, newCode: string): string {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    const diff: string[] = [];

    diff.push('=== Code Changes ===');
    diff.push('');
    diff.push('--- Old Code ---');
    oldLines.forEach((line, i) => {
      diff.push(`-${i + 1}: ${line}`);
    });
    diff.push('');
    diff.push('+++ New Code +++');
    newLines.forEach((line, i) => {
      diff.push(`+${i + 1}: ${line}`);
    });

    return diff.join('\n');
  }
}

