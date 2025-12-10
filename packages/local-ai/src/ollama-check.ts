/**
 * Ollama Availability Check
 */

import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

/**
 * Check if Ollama server is running and accessible
 */
export async function isOllamaRunning(): Promise<boolean> {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, {
      timeout: 2000 // 2 second timeout
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Get list of available Ollama models
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`);
    const data = response.data as { models?: Array<{ name: string }> };
    return data.models?.map(m => m.name) || [];
  } catch (error) {
    return [];
  }
}

