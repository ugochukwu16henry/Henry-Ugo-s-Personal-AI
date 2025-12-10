/**
 * Terminal Component - Cursor-style integrated terminal
 */

import { useState, useRef, useEffect } from 'react';
import { FiTerminal, FiX, FiChevronDown } from 'react-icons/fi';
import { TerminalExecutor } from '../services/terminal/executor';
import './Terminal.css';

interface TerminalProps {
  height?: number;
  onClose?: () => void;
  onCommandExecute?: (command: string, result: string) => void;
}

export function Terminal({ height = 300, onClose, onCommandExecute }: TerminalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [output, setOutput] = useState<string[]>([
    'Welcome to Henry Ugo\'s Personal AI Terminal',
    'Type commands below or use the agent commands...',
    ''
  ]);
  const [command, setCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentDir, setCurrentDir] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const executorRef = useRef(new TerminalExecutor());

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    // Get current directory on mount
    executorRef.current.getCwd().then(dir => {
      setCurrentDir(dir);
    });
  }, []);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isExecuting) return;

    const cmd = command.trim();
    setCommand('');
    setIsExecuting(true);

    // Add command to output
    setOutput(prev => [...prev, `${currentDir ? `[${currentDir}]` : ''}$ ${cmd}`, '']);

    try {
      // Execute command
      const result = await executorRef.current.execute(cmd);

      // Update output
      if (result.stdout) {
        const stdoutLines = result.stdout.split('\n').filter(line => line.trim());
        setOutput(prev => [...prev, ...stdoutLines]);
      }

      if (result.stderr) {
        const stderrLines = result.stderr.split('\n').filter(line => line.trim());
        setOutput(prev => [...prev, ...stderrLines.map(line => `[error] ${line}`)]);
      }

      if (!result.success) {
        setOutput(prev => [...prev, `[exit code: ${result.exitCode}]`]);
      }

      // Notify parent component
      if (onCommandExecute) {
        onCommandExecute(cmd, result.stdout + (result.stderr ? `\n${result.stderr}` : ''));
      }

      // Update current directory for 'cd' command
      if (cmd.startsWith('cd ')) {
        const newDir = await executorRef.current.getCwd();
        setCurrentDir(newDir);
      }
    } catch (error: any) {
      setOutput(prev => [...prev, `[error] ${error.message || 'Command execution failed'}`]);
    } finally {
      setIsExecuting(false);
      setOutput(prev => [...prev, '']); // Add blank line after command
    }
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
        <span className="terminal-prompt">
          {currentDir ? `[${currentDir}]` : ''}$
        </span>
        <input
          ref={inputRef}
          className="terminal-input"
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={isExecuting ? "Executing..." : "Type a command..."}
          autoFocus
          disabled={isExecuting}
        />
      </form>
    </div>
  );
}

