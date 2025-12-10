/**
 * Terminal Component - Cursor-style integrated terminal
 */

import { useState, useRef, useEffect } from 'react';
import { FiTerminal, FiX, FiChevronDown } from 'react-icons/fi';
import './Terminal.css';

interface TerminalProps {
  height?: number;
  onClose?: () => void;
}

export function Terminal({ height = 300, onClose }: TerminalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [output, setOutput] = useState<string[]>([
    'Welcome to Henry Ugo\'s Personal AI Terminal',
    'Type commands below or use the agent commands...',
    ''
  ]);
  const [command, setCommand] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    // Add command to output
    setOutput(prev => [...prev, `$ ${command}`, '']);

    // TODO: Execute actual command via Tauri
    // For now, just echo
    setTimeout(() => {
      setOutput(prev => [...prev, `Command: ${command}`, '']);
    }, 100);

    setCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose?.();
    }
  };

  if (isMinimized) {
    return (
      <div className="terminal-minimized">
        <div className="terminal-header" onClick={() => setIsMinimized(false)}>
          <FiTerminal size={14} />
          <span>Terminal</span>
          <button
            className="terminal-button"
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
    <div className="terminal" style={{ height: `${height}px` }} onKeyDown={handleKeyDown}>
      <div className="terminal-header">
        <div className="terminal-header-left">
          <FiTerminal size={14} />
          <span>Terminal</span>
        </div>
        <div className="terminal-header-right">
          <button
            className="terminal-button"
            onClick={() => setIsMinimized(true)}
            title="Minimize"
          >
            <FiChevronDown size={14} />
          </button>
          <button
            className="terminal-button"
            onClick={onClose}
            title="Close"
          >
            <FiX size={14} />
          </button>
        </div>
      </div>
      <div className="terminal-content" ref={outputRef}>
        {output.map((line, index) => (
          <div key={index} className="terminal-line">
            {line}
          </div>
        ))}
      </div>
      <form className="terminal-input-container" onSubmit={handleCommand}>
        <span className="terminal-prompt">$</span>
        <input
          ref={inputRef}
          className="terminal-input"
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Type a command..."
          autoFocus
        />
      </form>
    </div>
  );
}

