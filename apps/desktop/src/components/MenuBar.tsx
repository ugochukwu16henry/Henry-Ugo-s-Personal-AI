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

export function MenuBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menus: MenuItem[] = [
    {
      label: 'File',
      items: [
        { label: 'New File', shortcut: 'Ctrl+N', action: () => console.log('New File') },
        { label: 'New Window', shortcut: 'Ctrl+Shift+N', action: () => console.log('New Window') },
        { label: 'Open File...', shortcut: 'Ctrl+O', action: () => console.log('Open File') },
        { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', action: () => console.log('Open Folder') },
        { separator: true },
        { label: 'Save', shortcut: 'Ctrl+S', action: () => console.log('Save') },
        { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => console.log('Save As') },
        { separator: true },
        { label: 'Exit', action: () => console.log('Exit') }
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: () => console.log('Undo') },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: () => console.log('Redo') },
        { separator: true },
        { label: 'Cut', shortcut: 'Ctrl+X', action: () => console.log('Cut') },
        { label: 'Copy', shortcut: 'Ctrl+C', action: () => console.log('Copy') },
        { label: 'Paste', shortcut: 'Ctrl+V', action: () => console.log('Paste') },
        { separator: true },
        { label: 'Find', shortcut: 'Ctrl+F', action: () => console.log('Find') },
        { label: 'Replace', shortcut: 'Ctrl+H', action: () => console.log('Replace') }
      ]
    },
    {
      label: 'Selection',
      items: [
        { label: 'Select All', shortcut: 'Ctrl+A', action: () => console.log('Select All') },
        { label: 'Expand Selection', shortcut: 'Shift+Alt+Right', action: () => console.log('Expand Selection') },
        { label: 'Shrink Selection', shortcut: 'Shift+Alt+Left', action: () => console.log('Shrink Selection') },
        { separator: true },
        { label: 'Copy Line Up', shortcut: 'Shift+Alt+Up', action: () => console.log('Copy Line Up') },
        { label: 'Copy Line Down', shortcut: 'Shift+Alt+Down', action: () => console.log('Copy Line Down') }
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Command Palette...', shortcut: 'Ctrl+K', action: () => console.log('Command Palette') },
        { separator: true },
        { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: () => console.log('Explorer') },
        { label: 'Search', shortcut: 'Ctrl+Shift+F', action: () => console.log('Search') },
        { label: 'Source Control', shortcut: 'Ctrl+Shift+G', action: () => console.log('Source Control') },
        { separator: true },
        { label: 'Terminal', shortcut: 'Ctrl+`', action: () => console.log('Terminal') },
        { label: 'Output', shortcut: 'Ctrl+Shift+U', action: () => console.log('Output') }
      ]
    },
    {
      label: 'Go',
      items: [
        { label: 'Back', shortcut: 'Ctrl+Alt+-', action: () => console.log('Back') },
        { label: 'Forward', shortcut: 'Ctrl+Shift+-', action: () => console.log('Forward') },
        { separator: true },
        { label: 'Go to File...', shortcut: 'Ctrl+P', action: () => console.log('Go to File') },
        { label: 'Go to Symbol...', shortcut: 'Ctrl+Shift+O', action: () => console.log('Go to Symbol') },
        { label: 'Go to Line/Column...', shortcut: 'Ctrl+G', action: () => console.log('Go to Line') }
      ]
    },
    {
      label: 'Run',
      items: [
        { label: 'Start Debugging', shortcut: 'F5', action: () => console.log('Start Debugging') },
        { label: 'Run Without Debugging', shortcut: 'Ctrl+F5', action: () => console.log('Run Without Debugging') },
        { separator: true },
        { label: 'Stop', shortcut: 'Shift+F5', action: () => console.log('Stop') },
        { separator: true },
        { label: 'Run Task...', shortcut: 'Ctrl+Shift+P', action: () => console.log('Run Task') }
      ]
    },
    {
      label: 'Terminal',
      items: [
        { label: 'New Terminal', shortcut: 'Ctrl+Shift+`', action: () => console.log('New Terminal') },
        { label: 'Split Terminal', action: () => console.log('Split Terminal') },
        { separator: true },
        { label: 'Kill Terminal', action: () => console.log('Kill Terminal') }
      ]
    },
    {
      label: 'Help',
      items: [
        { label: 'Welcome', action: () => console.log('Welcome') },
        { label: 'Documentation', action: () => console.log('Documentation') },
        { separator: true },
        { label: 'Keyboard Shortcuts', action: () => console.log('Keyboard Shortcuts') },
        { label: 'About', action: () => console.log('About') }
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

