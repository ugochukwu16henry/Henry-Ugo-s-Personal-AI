/**
 * AI Model Configuration and Management
 * Supports multiple providers: OpenAI, Anthropic, Google, xAI, and Cursor's Composer
 */

export enum AIModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  XAI = 'xai',
  CURSOR = 'cursor',
  LOCAL = 'local',
  CUSTOM = 'custom'
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIModelProvider;
  maxTokens: number;
  contextWindow: number;
  supportsStreaming: boolean;
  supportsCodeCompletion: boolean;
  supportsChat: boolean;
  costPer1kTokens?: {
    prompt: number;
    completion: number;
  };
}

export const AVAILABLE_MODELS: Record<string, AIModel> = {
  // OpenAI
  'gpt-5': {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: AIModelProvider.OPENAI,
    maxTokens: 128000,
    contextWindow: 128000,
    supportsStreaming: true,
    supportsCodeCompletion: true,
    supportsChat: true,
    costPer1kTokens: { prompt: 0.01, completion: 0.03 }
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: AIModelProvider.OPENAI,
    maxTokens: 128000,
    contextWindow: 128000,
    supportsStreaming: true,
    supportsCodeCompletion: true,
    supportsChat: true,
    costPer1kTokens: { prompt: 0.01, completion: 0.03 }
  },

  // Anthropic
  'claude-sonnet-4.5': {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: AIModelProvider.ANTHROPIC,
    maxTokens: 4096,
    contextWindow: 200000,
    supportsStreaming: true,
    supportsCodeCompletion: true,
    supportsChat: true,
    costPer1kTokens: { prompt: 0.003, completion: 0.015 }
  },
  'claude-opus-4.5': {
    id: 'claude-opus-4.5',
    name: 'Claude Opus 4.5',
    provider: AIModelProvider.ANTHROPIC,
    maxTokens: 4096,
    contextWindow: 200000,
    supportsStreaming: true,
    supportsCodeCompletion: true,
    supportsChat: true,
    costPer1kTokens: { prompt: 0.015, completion: 0.075 }
  },

  // Google
  'gemini-3-pro': {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: AIModelProvider.GOOGLE,
    maxTokens: 8192,
    contextWindow: 1000000,
    supportsStreaming: true,
    supportsCodeCompletion: true,
    supportsChat: true,
    costPer1kTokens: { prompt: 0.00025, completion: 0.001 }
  },

  // xAI
  'grok-code': {
    id: 'grok-code',
    name: 'Grok Code',
    provider: AIModelProvider.XAI,
    maxTokens: 8192,
    contextWindow: 128000,
    supportsStreaming: true,
    supportsCodeCompletion: true,
    supportsChat: true
  },

  // Cursor
  'composer-1': {
    id: 'composer-1',
    name: 'Composer 1 (Cursor)',
    provider: AIModelProvider.CURSOR,
    maxTokens: 4096,
    contextWindow: 128000,
    supportsStreaming: true,
    supportsCodeCompletion: true,
    supportsChat: true
  }
};

export interface ModelSettings {
  selectedModel: string;
  autoSelect: boolean;
  temperature: number;
  maxTokens: number;
  apiKeys: Record<AIModelProvider, string | null>;
}

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  selectedModel: 'composer-1',
  autoSelect: false,
  temperature: 0.2,
  maxTokens: 4096,
  apiKeys: {
    [AIModelProvider.OPENAI]: null,
    [AIModelProvider.ANTHROPIC]: null,
    [AIModelProvider.GOOGLE]: null,
    [AIModelProvider.XAI]: null,
    [AIModelProvider.CURSOR]: null,
    [AIModelProvider.LOCAL]: null,
    [AIModelProvider.CUSTOM]: null
  }
};

/**
 * Auto-selects the best model for a given task
 */
export function selectBestModel(task: 'completion' | 'chat' | 'codegen' | 'analysis'): AIModel {
  // For now, return a sensible default
  // In the future, this could use heuristics or ML to pick the best model
  if (task === 'completion') {
    return AVAILABLE_MODELS['composer-1'];
  }
  if (task === 'codegen') {
    return AVAILABLE_MODELS['gpt-5'];
  }
  if (task === 'analysis') {
    return AVAILABLE_MODELS['claude-opus-4.5'];
  }
  return AVAILABLE_MODELS['composer-1'];
}

