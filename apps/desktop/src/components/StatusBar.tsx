/**
 * StatusBar Component - Cursor-style status bar at bottom
 */

import { FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';
import './StatusBar.css';

interface StatusBarProps {
  line?: number;
  column?: number;
  language?: string;
  errors?: number;
  warnings?: number;
}

export function StatusBar({ 
  line = 1, 
  column = 1, 
  language = 'typescript',
  errors = 0,
  warnings = 0
}: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <div className="status-bar-item">
          <FiCheck size={14} />
          <span>Henry AI</span>
        </div>
        {errors > 0 && (
          <div className="status-bar-item error">
            <FiAlertCircle size={14} />
            <span>{errors} Error{errors !== 1 ? 's' : ''}</span>
          </div>
        )}
        {warnings > 0 && (
          <div className="status-bar-item warning">
            <FiAlertCircle size={14} />
            <span>{warnings} Warning{warnings !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
      <div className="status-bar-right">
        <div className="status-bar-item">
          <span>{language}</span>
        </div>
        <div className="status-bar-item">
          <span>Ln {line}, Col {column}</span>
        </div>
        <div className="status-bar-item">
          <span>Spaces: 2</span>
        </div>
        <div className="status-bar-item">
          <span>UTF-8</span>
        </div>
        <div className="status-bar-item">
          <span>LF</span>
        </div>
      </div>
    </div>
  );
}

