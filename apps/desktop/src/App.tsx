import { useState, useEffect, useCallback, useMemo } from 'react';
import { Editor } from '@monaco-editor/react';
import { HenryAgent } from '@henry-ai/core';
// Note: These imports should work once commands are properly exported from core
// For now, we'll handle commands differently
// import { executeCommand, defaultCommandRegistry } from '@henry-ai/core';
import { MenuBar } from './components/MenuBar';
import { FileTree } from './components/FileTree';
import { Terminal } from './components/Terminal';
import { CommandPalette } from './components/CommandPalette';
import { StatusBar } from './components/StatusBar';
import { AgentPanel } from './components/AgentPanel';
import { TabBar, type Tab } from './components/TabBar';
import { DiffViewer } from './components/DiffViewer';
import { useDiffViewer } from './hooks/useDiffViewer';
import { FiCode } from 'react-icons/fi';
import './App.css';

function App() {
  const [code, setCode] = useState(`// Welcome to Henry Ugo's Personal AI
// Start typing to experience ultra-fast autocomplete (<80ms)

function greet(name: string): string {
  return \`Hello, \${name}!\`
}

const message = greet('Henry')
console.log(message)
`);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', name: 'example.ts', path: '/example.ts', icon: <FiCode /> }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [showTerminal, setShowTerminal] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const diffViewer = useDiffViewer();

  // Agent execution handler - can be called from AgentPanel
  const handleAgentCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;
    
    try {
      const agent = new HenryAgent();
      await agent.initializeMemory();
      
      const steps = await agent.plan(command);
      console.log('Agent steps:', steps.join('\n'));
      
      if (code && command.toLowerCase().includes('edit')) {
        const filePath = './example.ts';
        const preview = await agent.previewEdit(filePath, command);
        
        diffViewer.showDiff(
          preview,
          filePath,
          async () => {
            await agent.applyStagedEdit(filePath, true);
            setCode(preview.newContent);
          },
          () => {
            agent.discardEdit(filePath);
          }
        );
      }
    } catch (error: any) {
      console.error('Agent error:', error);
    }
  }, [code, diffViewer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Toggle terminal: Ctrl+`
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setShowTerminal(!showTerminal);
      }
      // Escape to close command palette
      if (e.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTerminal, showCommandPalette]);

  const handleEditorMount = (editor: any) => {
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });
  };

  const commandPaletteCommands = useMemo(() => [
    {
      id: 'cmd:doc',
      label: '/doc - Generate Documentation',
      category: 'Commands',
      action: () => {
        handleAgentCommand('/doc ');
        setShowCommandPalette(false);
      }
    },
    {
      id: 'cmd:test',
      label: '/test - Generate Tests',
      category: 'Commands',
      action: () => {
        handleAgentCommand('/test ');
        setShowCommandPalette(false);
      }
    },
    {
      id: 'cmd:pr',
      label: '/pr - Generate PR Description',
      category: 'Commands',
      action: () => {
        handleAgentCommand('/pr ');
        setShowCommandPalette(false);
      }
    },
    {
      id: 'terminal:toggle',
      label: 'Toggle Terminal',
      category: 'View',
      shortcut: 'Ctrl+`',
      action: () => {
        setShowTerminal(!showTerminal);
        setShowCommandPalette(false);
      }
    },
    {
      id: 'panel:agent',
      label: 'Toggle Agent Panel',
      category: 'View',
      action: () => {
        setShowAgentPanel(!showAgentPanel);
        setShowCommandPalette(false);
      }
    }
  ], [handleAgentCommand, showTerminal, showAgentPanel, setShowTerminal, setShowAgentPanel, setShowCommandPalette]);

  return (
    <div className="cursor-app">
      <MenuBar />
      
      <div className="cursor-layout">
        {/* Left Sidebar */}
        <div className="cursor-sidebar">
          <FileTree 
            onFileSelect={(path) => {
              // Add file to tabs if not already open
              const existingTab = tabs.find(t => t.path === path);
              if (!existingTab) {
                const newTab: Tab = {
                  id: Date.now().toString(),
                  name: path.split('/').pop() || 'Untitled',
                  path,
                  icon: <FiCode />
                };
                setTabs([...tabs, newTab]);
                setActiveTabId(newTab.id);
              } else {
                setActiveTabId(existingTab.id);
              }
            }}
          />
        </div>

        {/* Main Editor Area */}
        <div className="cursor-editor-area">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={setActiveTabId}
            onTabClose={(tabId) => {
              const newTabs = tabs.filter(t => t.id !== tabId);
              setTabs(newTabs);
              if (activeTabId === tabId && newTabs.length > 0) {
                setActiveTabId(newTabs[0].id);
              }
            }}
          />
          
          <div className="cursor-editor-container">
            <Editor
              height="100%"
              language="typescript"
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              onMount={handleEditorMount}
              options={{
                fontSize: 14,
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                lineNumbers: 'on',
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true
              }}
            />
          </div>

          {/* Terminal */}
          {showTerminal && (
            <Terminal 
              height={300}
              onClose={() => setShowTerminal(false)}
            />
          )}
        </div>

        {/* Right Agent Panel */}
        {showAgentPanel && (
          <AgentPanel
            isOpen={showAgentPanel}
            onClose={() => setShowAgentPanel(false)}
            onCommand={handleAgentCommand}
          />
        )}
      </div>

      {/* Status Bar */}
      <StatusBar
        line={cursorPosition.line}
        column={cursorPosition.column}
        language="typescript"
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commandPaletteCommands}
      />

      {/* Diff Viewer Modal */}
      {diffViewer.isOpen && diffViewer.diff && (
        <DiffViewer
          isOpen={diffViewer.isOpen}
          oldCode={diffViewer.diff.oldContent}
          newCode={diffViewer.diff.newContent}
          oldPath={diffViewer.filePath || 'original'}
          newPath={diffViewer.filePath || 'modified'}
          language="typescript"
          title={`Diff Preview: ${diffViewer.filePath || 'file'}`}
          onClose={diffViewer.closeDiff}
          onApply={diffViewer.handleApply}
          onReject={diffViewer.handleReject}
        />
      )}
    </div>
  );
}

export default App;
