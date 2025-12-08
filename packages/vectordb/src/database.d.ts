import type { CodeEmbedding, SearchResult, EmbeddingOptions } from './types';
/**
 * LanceDB wrapper for code embeddings storage and semantic search
 */
export declare class VectorDatabase {
    private db;
    private table;
    private embedder;
    private dbPath;
    constructor(dbPath?: string);
    initialize(options?: EmbeddingOptions): Promise<void>;
    addEmbedding(embedding: CodeEmbedding): Promise<void>;
    addEmbeddings(embeddings: CodeEmbedding[]): Promise<void>;
    search(query: string, options?: {
        limit?: number;
        threshold?: number;
    }): Promise<SearchResult[]>;
    deleteByFilePath(filePath: string): Promise<void>;
    clear(): Promise<void>;
}
//# sourceMappingURL=database.d.ts.map