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
  onCommand?: (command: string) => void;
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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    onCommand?.(input);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I received your message. This is a placeholder response.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 500);
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

