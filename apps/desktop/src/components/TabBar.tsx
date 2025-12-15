/**
 * TabBar Component - Cursor-style editor tabs
 */

import { FiX } from 'react-icons/fi';
import './TabBar.css';

export interface Tab {
  id: string;
  name: string;
  path: string;
  modified?: boolean;
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId?: string;
  onTabClick?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
}

export function TabBar({ tabs, activeTabId, onTabClick, onTabClose }: TabBarProps) {
  const handleTabClick = (tabId: string, e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.tab-close')) {
      return; // Don't switch tab when clicking close button
    }
    onTabClick?.(tabId);
  };

  const handleTabClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTabClose?.(tabId);
  };

  if (tabs.length === 0) return null;

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
          onClick={(e) => handleTabClick(tab.id, e)}
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          <span className="tab-name">{tab.name}</span>
          {tab.modified && <span className="tab-modified">●</span>}
          {onTabClose && (
            <button
              className="tab-close"
              onClick={(e) => handleTabClose(tab.id, e)}
              title="Close"
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

