export interface CodeEmbedding {
    id: string;
    filePath: string;
    code: string;
    embedding: number[];
    metadata: {
        language: string;
        symbol?: string;
        line: number;
        column?: number;
        type?: 'function' | 'class' | 'interface' | 'variable' | 'comment';
    };
}
export interface SearchResult {
    id: string;
    filePath: string;
    code: string;
    score: number;
    metadata: CodeEmbedding['metadata'];
}
export interface EmbeddingOptions {
    model?: 'local' | 'openai';
    dimension?: number;
}
//# sourceMappingURL=types.d.ts.map