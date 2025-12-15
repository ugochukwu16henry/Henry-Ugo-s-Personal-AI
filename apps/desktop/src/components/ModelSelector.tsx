/**
 * Model Selector Component
 * Allows users to choose AI models and configure settings
 */

import { useState } from 'react';
import { FiSettings, FiChevronDown, FiCheck } from 'react-icons/fi';
import { AIModelProvider, AVAILABLE_MODELS, type AIModel, type ModelSettings } from '../services/ai/models';
import './ModelSelector.css';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  settings?: ModelSettings;
  onSettingsChange?: (settings: ModelSettings) => void;
}

export function ModelSelector({ 
  selectedModel, 
  onModelChange,
  settings,
  onSettingsChange 
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const currentModel = AVAILABLE_MODELS[selectedModel];
  const modelsByProvider = Object.entries(AVAILABLE_MODELS).reduce((acc, [id, model]) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push({ id, model });
    return acc;
  }, {} as Record<AIModelProvider, Array<{ id: string; model: AIModel }>>);

  return (
    <div className="model-selector">
      <button 
        className="model-selector-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="model-selector-label">Model:</span>
        <span className="model-selector-value">{currentModel?.name || selectedModel}</span>
        <FiChevronDown className={`model-selector-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="model-selector-overlay" onClick={() => setIsOpen(false)} />
          <div className="model-selector-dropdown">
            <div className="model-selector-header">
              <span>Select AI Model</span>
              <button 
                className="model-selector-settings-btn"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                <FiSettings />
              </button>
            </div>

            {Object.entries(modelsByProvider).map(([provider, models]) => (
              <div key={provider} className="model-selector-group">
                <div className="model-selector-group-label">
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </div>
                {models.map(({ id, model }) => (
                  <div
                    key={id}
                    className={`model-selector-item ${selectedModel === id ? 'selected' : ''}`}
                    onClick={() => {
                      onModelChange(id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="model-selector-item-name">{model.name}</div>
                    <div className="model-selector-item-info">
                      {model.contextWindow.toLocaleString()} context
                      {model.costPer1kTokens && (
                        <span className="model-selector-cost">
                          ${model.costPer1kTokens.prompt.toFixed(3)}/1k
                        </span>
                      )}
                    </div>
                    {selectedModel === id && <FiCheck className="model-selector-check" />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

