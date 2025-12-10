/**
 * AgentPanel Component - Cursor-style right side panel for AI agent
 */

import { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiSend, FiX, FiMinimize2 } from 'react-icons/fi';
import './AgentPanel.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  onCommand?: (command: string) => Promise<string | void> | void;
}

export function AgentPanel({ isOpen, onClose, onCommand }: AgentPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Henry AI. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
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

