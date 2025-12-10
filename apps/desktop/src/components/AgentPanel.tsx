/**
 * AgentPanel Component - Cursor-style right side panel for AI agent
 */

import { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiSend, FiX, FiMinimize2, FiZap } from 'react-icons/fi';
import { ModelSelector } from './ModelSelector';
import { AutonomySlider, AutonomyLevel } from './AutonomySlider';
import { SlashCommandService, DEFAULT_SLASH_COMMANDS } from '../services/ai/slashCommands';
import { AgentService } from '../services/ai/agent';
import { AVAILABLE_MODELS, DEFAULT_MODEL_SETTINGS, type ModelSettings } from '../services/ai/models';
import './AgentPanel.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isPlan?: boolean;
  planSteps?: Array<{ id: string; description: string; status?: string }>;
}

interface AgentPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  onCommand?: (command: string) => Promise<string | void> | void;
  selectedCode?: string;
  currentFile?: string;
}

export function AgentPanel({ 
  isOpen, 
  onClose, 
  onCommand,
  selectedCode,
  currentFile 
}: AgentPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Henry AI. How can I help you today?\n\nTry:\n• Type a task: "Add user login"\n• Use slash commands: /fix, /test, /doc\n• Select code and ask questions',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [modelSettings, setModelSettings] = useState<ModelSettings>(DEFAULT_MODEL_SETTINGS);
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(AutonomyLevel.CMD_K);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const slashCommandService = useRef(new SlashCommandService()).current;
  const [apiClient] = useState(() => new UnifiedAIClient());
  
  // Create agent service with proper dependencies
  const agentService = useRef<AgentService>(
    new AgentService(
      AVAILABLE_MODELS[modelSettings.selectedModel],
      autonomyLevel,
      apiClient
    )
  ).current;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userInput = input.trim();
    setInput('');
    setIsSending(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Check for slash command
    const slashCmd = slashCommandService.detectCommand(userInput);
    if (slashCmd) {
      try {
        const prompt = await slashCommandService.executeCommand(slashCmd.command, {
          selectedCode,
          currentFile
        });
        
        // Use the prompt with agent or command handler
        if (onCommand) {
          const response = await onCommand(prompt);
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response?.toString() || 'Command executed',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
      } catch (error: any) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${error.message}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Check if this looks like a high-level task (full agent mode)
    if (autonomyLevel === AutonomyLevel.FULL_AGENT) {
      try {
        // Create task and plan
        const plan = await agentService.planTask(userInput);
        
        const planMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `**Plan Mode**\n\nI've created a ${plan.steps.length}-step plan:\n\n${plan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}\n\nWould you like me to execute this plan?`,
          timestamp: new Date(),
          isPlan: true,
          planSteps: plan.steps
        };
        setMessages(prev => [...prev, planMessage]);
      } catch (error: any) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error creating plan: ${error.message}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Standard command handling
    try {
      if (onCommand) {
        const response = await onCommand(userInput);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response?.toString() || 'Command executed',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Update agent service when model or autonomy changes
  useEffect(() => {
    agentService.setAutonomyLevel(autonomyLevel);
  }, [autonomyLevel, agentService]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="agent-panel-minimized">
        <div className="agent-panel-header" onClick={() => setIsMinimized(false)}>
          <FiMessageSquare size={14} />
          <span>Agent</span>
          <button
            className="agent-panel-button"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
          >
            <FiX size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-panel">
      <div className="agent-panel-header">
        <div className="agent-panel-header-left">
          <FiMessageSquare size={14} />
          <span>Agent</span>
        </div>
        <div className="agent-panel-header-right">
          <button
            className="agent-panel-button"
            onClick={() => setIsMinimized(true)}
            title="Minimize"
          >
            <FiMinimize2 size={14} />
          </button>
          <button
            className="agent-panel-button"
            onClick={onClose}
            title="Close"
          >
            <FiX size={14} />
          </button>
        </div>
      </div>

      {/* AI Controls */}
      <div className="agent-panel-controls">
        <ModelSelector
          selectedModel={modelSettings.selectedModel}
          onModelChange={(modelId) => {
            setModelSettings({ ...modelSettings, selectedModel: modelId });
          }}
          settings={modelSettings}
          onSettingsChange={setModelSettings}
        />
        <AutonomySlider
          level={autonomyLevel}
          onLevelChange={setAutonomyLevel}
        />
      </div>

      <div className="agent-panel-content">
        <div className="agent-panel-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`agent-panel-message agent-panel-message-${message.role}`}
            >
              <div className="agent-panel-message-content">
                {message.isPlan && message.planSteps ? (
                  <div>
                    <div style={{ marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </div>
                    <div className="agent-panel-plan-steps">
                      {message.planSteps.map((step) => (
                        <div key={step.id} className="agent-panel-plan-step">
                          <span className="agent-panel-plan-step-number">
                            {message.planSteps!.indexOf(step) + 1}
                          </span>
                          <span>{step.description}</span>
                          {step.status && (
                            <span className={`agent-panel-plan-step-status ${step.status}`}>
                              {step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : '⋯'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                )}
              </div>
              <div className="agent-panel-message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="agent-panel-message agent-panel-message-assistant">
              <div className="agent-panel-message-content">
                <div className="agent-panel-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Slash Command Hints */}
        {input.startsWith('/') && (
          <div className="agent-panel-command-hints">
            {DEFAULT_SLASH_COMMANDS
              .filter(cmd => cmd.name.toLowerCase().startsWith(input.toLowerCase()))
              .slice(0, 5)
              .map(cmd => (
                <div
                  key={cmd.id}
                  className="agent-panel-command-hint"
                  onClick={() => setInput(cmd.name + ' ')}
                >
                  <strong>{cmd.name}</strong> - {cmd.description}
                </div>
              ))}
          </div>
        )}

        <div className="agent-panel-input-container">
          <textarea
            className="agent-panel-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Try /fix, /test, /doc) (Enter to send, Shift+Enter for new line)"
            rows={3}
            disabled={isSending}
          />
          <button
            className="agent-panel-send"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </div>
  );
    setInput('');

    // Show loading message
    const loadingMessageId = (Date.now() + 1).toString();
    const loadingMessage: Message = {
      id: loadingMessageId,
      role: 'assistant',
      content: 'Thinking...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Call the agent command handler
      const response = await onCommand?.(userInput);
      
      // Remove loading message and add actual response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingMessageId);
        if (response && typeof response === 'string') {
          filtered.push({
            id: Date.now().toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date()
          });
        } else if (!response) {
          // No response from agent, show default message
          filtered.push({
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Command executed. Check the console or editor for results.',
            timestamp: new Date()
          });
        }
        return filtered;
      });
    } catch (error: any) {
      // Remove loading message and show error
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingMessageId);
        filtered.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error: ${error?.message || 'Something went wrong'}`,
          timestamp: new Date()
        });
        return filtered;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="agent-panel-minimized">
        <div className="agent-panel-header" onClick={() => setIsMinimized(false)}>
          <FiMessageSquare size={14} />
          <span>Agent</span>
          <button
            className="agent-panel-button"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
          >
            <FiX size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-panel">
      <div className="agent-panel-header">
        <div className="agent-panel-header-left">
          <FiMessageSquare size={14} />
          <span>Agent</span>
        </div>
        <div className="agent-panel-header-right">
          <button
            className="agent-panel-button"
            onClick={() => setIsMinimized(true)}
            title="Minimize"
          >
            <FiMinimize2 size={14} />
          </button>
          <button
            className="agent-panel-button"
            onClick={onClose}
            title="Close"
          >
            <FiX size={14} />
          </button>
        </div>
      </div>
      <div className="agent-panel-content">
        <div className="agent-panel-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`agent-panel-message agent-panel-message-${message.role}`}
            >
              <div className="agent-panel-message-content">
                {message.content}
              </div>
              <div className="agent-panel-message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="agent-panel-input-container">
          <textarea
            className="agent-panel-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
            rows={3}
          />
          <button
            className="agent-panel-send"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

