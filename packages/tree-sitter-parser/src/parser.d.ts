import Parser from 'web-tree-sitter';
import type { ParseResult, SupportedLanguage } from './types';
/**
 * Tree-sitter parser for multi-language AST parsing
 * Supports TypeScript, JavaScript, Python, Rust, Go, Java, C++
 */
export declare class TreeSitterParser {
    private parser;
    private languages;
    initialize(): Promise<void>;
    parse(code: string, language: SupportedLanguage, filePath: string): Promise<ParseResult>;
    private extractSymbols;
    private getSymbolPatterns;
    private buildAST;
    loadLanguage(language: SupportedLanguage): Promise<Parser.Language>;
}
//# sourceMappingURL=parser.d.ts.map