// Note: LanceDB Node.js client - adjust import based on actual package
// import { connect } from 'lancedb' or similar
// Placeholder for now - will use actual LanceDB client when available
const connect = async (_path) => {
    // Placeholder implementation
    return {
        createTable: async () => ({}),
        openTable: async () => ({
            add: async () => { },
            search: () => ({
                limit: () => ({
                    execute: async () => []
                })
            }),
            delete: async () => { }
        }),
        dropTable: async () => { }
    };
};
import { CodeEmbedder } from './embedder';
/**
 * LanceDB wrapper for code embeddings storage and semantic search
 */
export class VectorDatabase {
    db = null;
    table = null;
    embedder;
    dbPath;
    constructor(dbPath = '.henry/vectordb') {
        this.dbPath = dbPath;
        this.embedder = new CodeEmbedder();
    }
    async initialize(options) {
        await this.embedder.initialize(options);
        try {
            this.db = await connect(this.dbPath);
            // Create or open code_embeddings table
            const schema = {
                id: 'string',
                filePath: 'string',
                code: 'string',
                embedding: this.embedder.getDimension(),
                language: 'string',
                symbol: 'string?',
                line: 'int32',
                column: 'int32?',
                type: 'string?'
            };
            try {
                this.table = await this.db.openTable('code_embeddings');
            }
            catch {
                // Table doesn't exist, create it
                this.table = await this.db.createTable('code_embeddings', schema);
            }
        }
        catch (error) {
            throw new Error(`Failed to initialize vector database: ${error}`);
        }
    }
    async addEmbedding(embedding) {
        if (!this.table) {
            await this.initialize();
        }
        if (!embedding.embedding || embedding.embedding.length === 0) {
            // Generate embedding if not provided
            embedding.embedding = await this.embedder.embed(embedding.code);
        }
        try {
            await this.table.add([{
                    id: embedding.id,
                    filePath: embedding.filePath,
                    code: embedding.code,
                    embedding: embedding.embedding,
                    language: embedding.metadata.language,
                    symbol: embedding.metadata.symbol || null,
                    line: embedding.metadata.line,
                    column: embedding.metadata.column || null,
                    type: embedding.metadata.type || null
                }]);
        }
        catch (error) {
            throw new Error(`Failed to add embedding: ${error}`);
        }
    }
    async addEmbeddings(embeddings) {
        if (!this.table) {
            await this.initialize();
        }
        // Generate embeddings in batch
        const codes = embeddings.map(e => e.code);
        const embeddingVectors = await this.embedder.embedBatch(codes);
        const rows = embeddings.map((embedding, index) => ({
            id: embedding.id,
            filePath: embedding.filePath,
            code: embedding.code,
            embedding: embedding.embedding.length > 0
                ? embedding.embedding
                : embeddingVectors[index],
            language: embedding.metadata.language,
            symbol: embedding.metadata.symbol || null,
            line: embedding.metadata.line,
            column: embedding.metadata.column || null,
            type: embedding.metadata.type || null
        }));
        try {
            await this.table.add(rows);
        }
        catch (error) {
            throw new Error(`Failed to add embeddings: ${error}`);
        }
    }
    async search(query, options) {
        if (!this.table) {
            await this.initialize();
        }
        const limit = options?.limit || 10;
        const threshold = options?.threshold || 0.5;
        // Generate query embedding
        const queryEmbedding = await this.embedder.embed(query);
        try {
            // Perform vector similarity search
            const results = await this.table
                .search(queryEmbedding)
                .limit(limit)
                .execute();
            return results
                .filter((r) => r._distance >= threshold)
                .map((r) => ({
                id: r.id,
                filePath: r.filePath,
                code: r.code,
                score: 1 - r._distance, // Convert distance to similarity score
                metadata: {
                    language: r.language,
                    symbol: r.symbol,
                    line: r.line,
                    column: r.column,
                    type: r.type
                }
            }));
        }
        catch (error) {
            throw new Error(`Search failed: ${error}`);
        }
    }
    async deleteByFilePath(filePath) {
        if (!this.table) {
            await this.initialize();
        }
        try {
            // LanceDB delete operation
            await this.table.delete(`filePath = '${filePath}'`);
        }
        catch (error) {
            throw new Error(`Failed to delete embeddings: ${error}`);
        }
    }
    async clear() {
        if (!this.db) {
            await this.initialize();
        }
        try {
            await this.db.dropTable('code_embeddings');
            this.table = await this.db.createTable('code_embeddings', {
                id: 'string',
                filePath: 'string',
                code: 'string',
                embedding: this.embedder.getDimension(),
                language: 'string',
                symbol: 'string?',
                line: 'int32',
                column: 'int32?',
                type: 'string?'
            });
        }
        catch (error) {
            throw new Error(`Failed to clear database: ${error}`);
        }
    }
}
//# sourceMappingURL=database.js.map