/**
 * CommandPalette Component - Cursor-style command palette (Cmd+K / Ctrl+K)
 */

import { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import './CommandPalette.css';

interface Command {
  id: string;
  label: string;
  category?: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands?: Command[];
}

const defaultCommands: Command[] = [
  { id: 'file:new', label: 'New File', category: 'File', action: () => {} },
  { id: 'file:open', label: 'Open File...', category: 'File', action: () => {} },
  { id: 'file:save', label: 'Save', category: 'File', shortcut: 'Ctrl+S', action: () => {} },
  { id: 'edit:undo', label: 'Undo', category: 'Edit', shortcut: 'Ctrl+Z', action: () => {} },
  { id: 'edit:redo', label: 'Redo', category: 'Edit', shortcut: 'Ctrl+Y', action: () => {} },
  { id: 'view:terminal', label: 'Toggle Terminal', category: 'View', shortcut: 'Ctrl+`', action: () => {} },
  { id: 'view:explorer', label: 'Show Explorer', category: 'View', shortcut: 'Ctrl+Shift+E', action: () => {} },
  { id: 'go:symbol', label: 'Go to Symbol...', category: 'Go', shortcut: 'Ctrl+Shift+O', action: () => {} },
  { id: 'go:file', label: 'Go to File...', category: 'Go', shortcut: 'Ctrl+P', action: () => {} }
];

export function CommandPalette({ isOpen, onClose, commands = defaultCommands }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        // Open command palette with Ctrl+K or Cmd+K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          // Will be handled by parent component
        }
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="command-palette-overlay" onClick={onClose} />
      <div className="command-palette">
        <div className="command-palette-input-container">
          <FiSearch className="command-palette-icon" />
          <input
            ref={inputRef}
            className="command-palette-input"
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command..."
          />
        </div>
        <div className="command-palette-list">
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">No commands found</div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-palette-item-label">
                  <span>{cmd.label}</span>
                  {cmd.shortcut && (
                    <span className="command-palette-shortcut">{cmd.shortcut}</span>
                  )}
                </div>
                {cmd.category && (
                  <div className="command-palette-item-category">{cmd.category}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

