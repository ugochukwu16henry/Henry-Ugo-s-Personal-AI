/**
 * MenuBar Component - Cursor-style top menu bar
 */

import { useState } from 'react';
import './MenuBar.css';

interface MenuItem {
  label: string;
  items: Array<{
    label?: string;
    shortcut?: string;
    action?: () => void;
    disabled?: boolean;
    separator?: boolean;
  }>;
}

interface MenuBarProps {
  onNewFile?: () => void;
  onOpenFile?: () => void;
  onSaveFile?: () => void;
  onToggleTerminal?: () => void;
  onToggleCommandPalette?: () => void;
}

export function MenuBar({ 
  onNewFile, 
  onOpenFile, 
  onSaveFile,
  onToggleTerminal,
  onToggleCommandPalette
}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menus: MenuItem[] = [
    {
      label: 'File',
      items: [
        { label: 'New File', shortcut: 'Ctrl+N', action: onNewFile || (() => {}) },
        { label: 'New Window', shortcut: 'Ctrl+Shift+N', action: () => {} },
        { label: 'Open File...', shortcut: 'Ctrl+O', action: onOpenFile || (() => {}) },
        { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', action: () => {} },
        { separator: true },
        { label: 'Save', shortcut: 'Ctrl+S', action: onSaveFile || (() => {}) },
        { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: onSaveFile || (() => {}) },
        { separator: true },
        { label: 'Exit', action: () => window.close() }
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: () => {} },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: () => {} },
        { separator: true },
        { label: 'Cut', shortcut: 'Ctrl+X', action: () => {} },
        { label: 'Copy', shortcut: 'Ctrl+C', action: () => {} },
        { label: 'Paste', shortcut: 'Ctrl+V', action: () => {} },
        { separator: true },
        { label: 'Find', shortcut: 'Ctrl+F', action: () => {} },
        { label: 'Replace', shortcut: 'Ctrl+H', action: () => {} }
      ]
    },
    {
      label: 'Selection',
      items: [
        { label: 'Select All', shortcut: 'Ctrl+A', action: () => {} },
        { label: 'Expand Selection', shortcut: 'Shift+Alt+Right', action: () => {} },
        { label: 'Shrink Selection', shortcut: 'Shift+Alt+Left', action: () => {} },
        { separator: true },
        { label: 'Copy Line Up', shortcut: 'Shift+Alt+Up', action: () => {} },
        { label: 'Copy Line Down', shortcut: 'Shift+Alt+Down', action: () => {} }
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Command Palette...', shortcut: 'Ctrl+K', action: onToggleCommandPalette || (() => {}) },
        { separator: true },
        { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: () => {} },
        { label: 'Search', shortcut: 'Ctrl+Shift+F', action: () => {} },
        { label: 'Source Control', shortcut: 'Ctrl+Shift+G', action: () => {} },
        { separator: true },
        { label: 'Terminal', shortcut: 'Ctrl+`', action: onToggleTerminal || (() => {}) },
        { label: 'Output', shortcut: 'Ctrl+Shift+U', action: () => {} }
      ]
    },
    {
      label: 'Go',
      items: [
        { label: 'Back', shortcut: 'Ctrl+Alt+-', action: () => {} },
        { label: 'Forward', shortcut: 'Ctrl+Shift+-', action: () => {} },
        { separator: true },
        { label: 'Go to File...', shortcut: 'Ctrl+P', action: () => {} },
        { label: 'Go to Symbol...', shortcut: 'Ctrl+Shift+O', action: () => {} },
        { label: 'Go to Line/Column...', shortcut: 'Ctrl+G', action: () => {} }
      ]
    },
    {
      label: 'Run',
      items: [
        { label: 'Start Debugging', shortcut: 'F5', action: () => {} },
        { label: 'Run Without Debugging', shortcut: 'Ctrl+F5', action: () => {} },
        { separator: true },
        { label: 'Stop', shortcut: 'Shift+F5', action: () => {} },
        { separator: true },
        { label: 'Run Task...', shortcut: 'Ctrl+Shift+P', action: () => {} }
      ]
    },
    {
      label: 'Terminal',
      items: [
        { label: 'New Terminal', shortcut: 'Ctrl+Shift+`', action: () => {} },
        { label: 'Split Terminal', action: () => {} },
        { separator: true },
        { label: 'Kill Terminal', action: () => {} }
      ]
    },
    {
      label: 'Help',
      items: [
        { label: 'Welcome', action: () => {} },
        { label: 'Documentation', action: () => {} },
        { separator: true },
        { label: 'Keyboard Shortcuts', action: () => {} },
        { label: 'About', action: () => {} }
      ]
    }
  ];

  const handleMenuClick = (menuLabel: string) => {
    setActiveMenu(activeMenu === menuLabel ? null : menuLabel);
  };

  const handleMenuItemClick = (item: MenuItem['items'][0]) => {
    if (!item.disabled && !item.separator && item.action) {
      item.action();
      setActiveMenu(null);
    }
  };

  return (
    <div className="menu-bar">
      {menus.map((menu) => (
        <div key={menu.label} className="menu-item-container">
          <button
            className={`menu-button ${activeMenu === menu.label ? 'active' : ''}`}
            onClick={() => handleMenuClick(menu.label)}
            onMouseEnter={() => {
              if (activeMenu !== null) {
                setActiveMenu(menu.label);
              }
            }}
          >
            {menu.label}
          </button>
          {activeMenu === menu.label && (
            <div className="menu-dropdown">
              {menu.items.map((item, index) => (
                item.separator ? (
                  <div key={index} className="menu-separator" />
                ) : (
                  <button
                    key={index}
                    className={`menu-dropdown-item ${item.disabled ? 'disabled' : ''}`}
                    onClick={() => handleMenuItemClick(item)}
                    disabled={item.disabled}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
                  </button>
                )
              ))}
            </div>
          )}
        </div>
      ))}
      {activeMenu && (
        <div
          className="menu-overlay"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}

