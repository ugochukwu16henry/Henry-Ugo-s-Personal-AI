import { pipeline } from '@xenova/transformers';
/**
 * Code embedding generator using local transformers
 * Default: All-MiniLM-L6-v2 (384 dimensions, fast)
 */
export class CodeEmbedder {
    model = null; // Pipeline type from @xenova/transformers
    modelName = 'Xenova/all-MiniLM-L6-v2';
    async initialize(_options) {
        if (this.model)
            return;
        try {
            this.model = await pipeline('feature-extraction', this.modelName, {
                quantized: true // Use quantized model for faster loading
            } // Type assertion to bypass device option type issue
            );
        }
        catch (error) {
            throw new Error(`Failed to load embedding model: ${error}`);
        }
    }
    async embed(code) {
        if (!this.model) {
            await this.initialize();
        }
        if (!this.model) {
            throw new Error('Embedding model not initialized');
        }
        try {
            const output = await this.model(code, {
                pooling: 'mean',
                normalize: true
            });
            // Extract embedding vector from output
            return Array.from(output.data);
        }
        catch (error) {
            throw new Error(`Failed to generate embedding: ${error}`);
        }
    }
    async embedBatch(codeSnippets) {
        if (!this.model) {
            await this.initialize();
        }
        // Process in parallel for better performance
        const embeddings = await Promise.all(codeSnippets.map(code => this.embed(code)));
        return embeddings;
    }
    getDimension() {
        // All-MiniLM-L6-v2 has 384 dimensions
        return 384;
    }
}
//# sourceMappingURL=embedder.js.map