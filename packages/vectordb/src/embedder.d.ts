import type { EmbeddingOptions } from './types';
/**
 * Code embedding generator using local transformers
 * Default: All-MiniLM-L6-v2 (384 dimensions, fast)
 */
export declare class CodeEmbedder {
    private model;
    private modelName;
    initialize(_options?: EmbeddingOptions): Promise<void>;
    embed(code: string): Promise<number[]>;
    embedBatch(codeSnippets: string[]): Promise<number[][]>;
    getDimension(): number;
}
//# sourceMappingURL=embedder.d.ts.map