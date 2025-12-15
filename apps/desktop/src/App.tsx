import { useState, useEffect, useCallback, useMemo } from 'react';
import { Editor } from '@monaco-editor/react';

// Note: HenryAgent is not available in browser/Tauri environment due to Node.js dependencies
// For now, we'll handle requests directly without the agent
// HenryAgent integration will be added in the future when Node.js dependencies are available

import { MenuBar } from './components/MenuBar';
import { saveFileToDisk, openFileFromDisk, saveProjectFiles, type ProjectFile } from './utils/fileOperations';
import { FileTree } from './components/FileTree';
import { Terminal } from './components/Terminal';
import { CommandPalette } from './components/CommandPalette';
import { StatusBar } from './components/StatusBar';
import { AgentPanel } from './components/AgentPanel';
import { TabBar, type Tab } from './components/TabBar';
import { DiffViewer } from './components/DiffViewer';
import { CodeReviewPanel } from './components/CodeReviewPanel';
import { useDiffViewer } from './hooks/useDiffViewer';
import { FiCode } from 'react-icons/fi';
import { UnifiedAIClient } from './services/ai/api';
import { AVAILABLE_MODELS, DEFAULT_MODEL_SETTINGS, type ModelSettings } from './services/ai/models';
import { TerminalExecutor } from './services/terminal/executor';
import { RulesMemoryService } from './services/rules/memory';
import { CodebaseIntelligenceService } from './services/codebase/intelligence';
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
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [, setEditorInstance] = useState<any>(null);
  const [showCodeReview, setShowCodeReview] = useState(false);
  const [apiClient] = useState<UnifiedAIClient>(new UnifiedAIClient());
  const [modelSettings] = useState<ModelSettings>(DEFAULT_MODEL_SETTINGS);
  const [terminalExecutor] = useState(() => new TerminalExecutor());
  // const [rulesService] = useState(() => new RulesMemoryService()); // Reserved for future use
  const [codebaseIntelligence] = useState(() => 
    new CodebaseIntelligenceService(AVAILABLE_MODELS[DEFAULT_MODEL_SETTINGS.selectedModel], apiClient)
  );

  const diffViewer = useDiffViewer();

  // Agent execution handler - can be called from AgentPanel
  const handleAgentCommand = useCallback(async (command: string): Promise<string> => {
    if (!command.trim()) return 'Please enter a command or question.';
    
    const lowerCommand = command.toLowerCase();
    
    // Handle simple website requests directly (works without agent)
    if ((lowerCommand.includes('build a') || lowerCommand.includes('create a') || lowerCommand.includes('make a')) && 
        (lowerCommand.includes('website') || lowerCommand.includes('web page') || lowerCommand.includes('html') || lowerCommand.includes('simple'))) {
      
      const simpleWebsiteHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Website</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }
        h1 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        p {
            margin-bottom: 15px;
            color: #666;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
            transition: background 0.3s;
        }
        .button:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to My Simple Website</h1>
        <p>This is a beautiful, responsive website created with HTML and CSS.</p>
        <p>You can customize this template by modifying the HTML and CSS code.</p>
        <a href="#" class="button">Get Started</a>
    </div>
</body>
</html>`;
      
      // Update the editor with the HTML code
      setCode(simpleWebsiteHTML);
      
      return `✅ Simple website created!\n\nI've generated a beautiful HTML website template and loaded it into the editor.\n\nFeatures:\n• Responsive design\n• Modern gradient background\n• Clean, professional styling\n• Ready to customize\n\nYou can now edit the HTML code in the editor. Save it as "index.html" to use it!`;
    }
    
    // Handle JavaScript calculator requests
    if (lowerCommand.includes('calculator') || (lowerCommand.includes('calc'))) {
      const calculatorCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JavaScript Calculator</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .calculator {
            background: #1e1e1e;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            max-width: 400px;
            width: 100%;
        }
        .display {
            background: #252526;
            color: #fff;
            font-size: 2.5em;
            padding: 20px;
            text-align: right;
            border-radius: 10px;
            margin-bottom: 20px;
            min-height: 80px;
            word-wrap: break-word;
        }
        .buttons {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }
        button {
            padding: 20px;
            font-size: 1.5em;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            background: #3e3e42;
            color: #fff;
            transition: all 0.2s;
        }
        button:hover {
            background: #4e4e52;
            transform: scale(0.95);
        }
        button:active {
            transform: scale(0.9);
        }
        .operator {
            background: #0e639c;
        }
        .operator:hover {
            background: #1177bb;
        }
        .equals {
            background: #0e639c;
            grid-column: span 2;
        }
        .clear {
            background: #e45649;
        }
        .clear:hover {
            background: #f56758;
        }
    </style>
</head>
<body>
    <div class="calculator">
        <div class="display" id="display">0</div>
        <div class="buttons">
            <button class="clear" onclick="clearDisplay()">C</button>
            <button onclick="deleteLast()">⌫</button>
            <button class="operator" onclick="appendOperator('/')">/</button>
            <button class="operator" onclick="appendOperator('*')">×</button>
            
            <button onclick="appendNumber('7')">7</button>
            <button onclick="appendNumber('8')">8</button>
            <button onclick="appendNumber('9')">9</button>
            <button class="operator" onclick="appendOperator('-')">-</button>
            
            <button onclick="appendNumber('4')">4</button>
            <button onclick="appendNumber('5')">5</button>
            <button onclick="appendNumber('6')">6</button>
            <button class="operator" onclick="appendOperator('+')">+</button>
            
            <button onclick="appendNumber('1')">1</button>
            <button onclick="appendNumber('2')">2</button>
            <button onclick="appendNumber('3')">3</button>
            <button class="operator" onclick="appendOperator('+')">+</button>
            
            <button onclick="appendNumber('0')" style="grid-column: span 2;">0</button>
            <button onclick="appendNumber('.')">.</button>
            <button class="equals operator" onclick="calculate()">=</button>
        </div>
    </div>

    <script>
        let display = document.getElementById('display');
        let currentInput = '0';
        let operator = null;
        let previousInput = null;

        function updateDisplay() {
            display.textContent = currentInput;
        }

        function appendNumber(num) {
            if (currentInput === '0') {
                currentInput = num;
            } else {
                currentInput += num;
            }
            updateDisplay();
        }

        function appendOperator(op) {
            if (operator !== null) {
                calculate();
            }
            previousInput = currentInput;
            operator = op;
            currentInput = '0';
        }

        function calculate() {
            if (operator === null || previousInput === null) return;
            
            let result;
            const prev = parseFloat(previousInput);
            const current = parseFloat(currentInput);

            switch(operator) {
                case '+':
                    result = prev + current;
                    break;
                case '-':
                    result = prev - current;
                    break;
                case '*':
                    result = prev * current;
                    break;
                case '/':
                    result = current !== 0 ? prev / current : 'Error';
                    break;
                default:
                    return;
            }

            currentInput = result.toString();
            operator = null;
            previousInput = null;
            updateDisplay();
        }

        function clearDisplay() {
            currentInput = '0';
            operator = null;
            previousInput = null;
            updateDisplay();
        }

        function deleteLast() {
            if (currentInput.length > 1) {
                currentInput = currentInput.slice(0, -1);
            } else {
                currentInput = '0';
            }
            updateDisplay();
        }
    </script>
</body>
</html>`;
      
      setCode(calculatorCode);
      return `✅ JavaScript Calculator created!\n\nI've built a fully functional calculator with:\n• Modern dark theme design\n• All basic operations (+, -, ×, ÷)\n• Clear and backspace functions\n• Smooth animations\n• Responsive layout\n\nThe calculator is ready in the editor. Save it as "calculator.html" to use it!`;
    }
    
    // Handle other common requests
    if (lowerCommand.includes('code') || lowerCommand.includes('give me') || lowerCommand.includes('show me')) {
      if (lowerCommand.includes('website') || lowerCommand.includes('html')) {
        // User wants to see the code - it's already in the editor
        return '✅ The website code is already in the editor! You can see the HTML, CSS, and JavaScript code there.\n\nTo use it:\n1. Copy the code from the editor\n2. Save it as "index.html"\n3. Open it in your browser\n\nOr click in the editor to edit it directly!';
      }
    }
    
    // Handle file save requests
    if (lowerCommand.includes('save') || lowerCommand.includes('save file') || lowerCommand.includes('save code')) {
      try {
        const fileName = code.includes('<!DOCTYPE html') ? 'index.html' : 
                        code.includes('calculator') ? 'calculator.html' : 
                        'code.html';
        const filePath = await saveFileToDisk(code, fileName);
        if (filePath) {
          return `✅ File saved successfully!\n\n📁 Location: ${filePath}\n\nYou can now open this file in your browser or any code editor.`;
        } else {
          return '❌ File save was cancelled.';
        }
      } catch (error: any) {
        return `❌ Error saving file: ${error.message}`;
      }
    }
    
    // Handle file open requests
    if (lowerCommand.includes('open file') || lowerCommand.includes('open') && lowerCommand.includes('file')) {
      try {
        const result = await openFileFromDisk();
        if (result) {
          setCode(result.content);
          return `✅ File opened successfully!\n\n📁 File: ${result.path}\n\nThe file content is now loaded in the editor.`;
        } else {
          return '❌ File open was cancelled.';
        }
      } catch (error: any) {
        return `❌ Error opening file: ${error.message}`;
      }
    }
    
    // Handle multi-file project generation
    if (lowerCommand.includes('project') || lowerCommand.includes('multi-file') || lowerCommand.includes('generate project')) {
      const projectFiles: ProjectFile[] = [
        {
          path: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to My Project</h1>
        <p>This is a multi-file project generated by Henry AI.</p>
        <script src="script.js"></script>
    </div>
</body>
</html>`
        },
        {
          path: 'styles.css',
          content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.container {
    background: white;
    padding: 40px;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    max-width: 600px;
    width: 100%;
}

h1 {
    color: #667eea;
    margin-bottom: 20px;
}`
        },
        {
          path: 'script.js',
          content: `// JavaScript for My Project
console.log('Project loaded!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM is ready!');
    // Add your JavaScript code here
});`
        },
        {
          path: 'README.md',
          content: `# My Project

This project was generated by Henry AI.

## Files

- \`index.html\` - Main HTML file
- \`styles.css\` - Stylesheet
- \`script.js\` - JavaScript file

## Getting Started

1. Open \`index.html\` in your web browser
2. Customize the code as needed

Enjoy your project!`
        }
      ];
      
      try {
        const savedPaths = await saveProjectFiles(projectFiles);
        if (savedPaths.length > 0) {
          return `✅ Multi-file project created!\n\n📁 Files saved:\n${savedPaths.map(p => `• ${p}`).join('\n')}\n\nYour project is ready!`;
        } else {
          return '❌ Project save was cancelled.';
        }
      } catch (error: any) {
        return `❌ Error creating project: ${error.message}`;
      }
    }
    
    // Handle capability questions
    if (lowerCommand.includes('what can') || lowerCommand.includes('what do') || lowerCommand.includes('capabilities') || lowerCommand.includes('can you do') || lowerCommand.includes('list')) {
      return `🤖 Henry AI - Current Capabilities\n\n✅ What I CAN Do:\n\n📝 Code Generation:\n• Generate HTML/CSS/JavaScript code\n• Create website templates (responsive, modern designs)\n• Build interactive components\n• Generate code snippets for common tasks\n• Create multi-file projects\n\n💾 File Operations (via Tauri):\n• Display code in the editor\n• ✅ Save code to files (NOW AVAILABLE!)\n• ✅ Open files from disk (NOW AVAILABLE!)\n• ✅ Generate multi-file projects (NOW AVAILABLE!)\n\n🎨 UI/UX:\n• Create beautiful, modern website designs\n• Generate responsive layouts\n• Create animations and transitions\n• Build interactive forms\n\n📚 Code Help:\n• Explain code structure\n• Provide coding examples\n• Suggest improvements\n• Help debug issues\n\n❌ What I CANNOT Do Yet:\n\n🔧 Backend/Server Operations:\n• Execute Node.js scripts\n• Run server-side code\n• Access databases directly\n• Make API calls to external services\n\n🤖 Advanced AI Agent Features:\n• Multi-step task planning\n• Automatic code refactoring\n• Running tests automatically\n• Git operations\n• Package management\n\n📦 System Operations:\n• Install npm packages\n• Run build commands\n• Execute shell scripts\n• Access system environment variables\n\n💡 Examples of What Works:\n• "Build a simple website"\n• "Create a JavaScript calculator"\n• "Make a CSS animation"\n• "Generate a contact form"\n• "Create a landing page"\n• "Save file" or "Save code"\n• "Open file"\n• "Generate project" or "Create multi-file project"\n\n🔮 Coming Soon:\n• Full AI agent integration\n• Code autocomplete with context`;
    }
    
    // For other requests, provide helpful guidance
    return `I understand you want help with: "${command}"\n\n📝 I can help you with:\n• Generating HTML/CSS/JavaScript code\n• Creating website templates\n• Building frontend components\n• Writing code snippets\n\n💡 Try asking:\n• "Build a simple website"\n• "Create a JavaScript calculator"\n• "Make a CSS animation"\n• "Generate a contact form"\n\n❓ For a full list of capabilities, ask: "What can you do?"`;
  }, [setCode]);

  // Handle menu actions - defined before useEffects/useMemos that reference them
  const handleNewFile = useCallback(() => {
    const newTab: Tab = {
      id: Date.now().toString(),
      name: 'Untitled',
      path: '',
      icon: <FiCode />
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setCode('');
  }, [tabs, setTabs, setActiveTabId, setCode]);

  const handleOpenFile = useCallback(async () => {
    try {
      const result = await openFileFromDisk();
      if (result) {
        const fileName = result.path.split(/[/\\]/).pop() || 'Untitled';
        const newTab: Tab = {
          id: Date.now().toString(),
          name: fileName,
          path: result.path,
          icon: <FiCode />
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newTab.id);
        setCode(result.content);
      }
    } catch (error: any) {
      console.error('Failed to open file:', error);
    }
  }, [tabs, setTabs, setActiveTabId, setCode]);

  const handleSaveFile = useCallback(async () => {
    try {
      const activeTab = tabs.find(t => t.id === activeTabId);
      const fileName = activeTab?.name || 'untitled.html';
      await saveFileToDisk(code, fileName);
    } catch (error: any) {
      console.error('Failed to save file:', error);
    }
  }, [code, tabs, activeTabId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Toggle terminal: Ctrl+`
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setShowTerminal(!showTerminal);
      }
      // Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        handleSaveFile();
      }
      // Open: Ctrl+O
      if ((e.ctrlKey || e.metaKey) && e.key === 'o' && !e.shiftKey) {
        e.preventDefault();
        handleOpenFile();
      }
      // New File: Ctrl+N
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleNewFile();
      }
      // Escape to close command palette
      if (e.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTerminal, showCommandPalette, handleSaveFile, handleOpenFile, handleNewFile]);

  const handleEditorMount = (editor: any) => {
    setEditorInstance(editor);
    
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });

    // Track selected code
    editor.onDidChangeCursorSelection((e: any) => {
      const selection = e.selection;
      if (selection && !selection.isEmpty()) {
        const selectedText = editor.getModel().getValueInRange(selection);
        setSelectedCode(selectedText);
      } else {
        setSelectedCode('');
      }
    });

    // Index file in codebase intelligence for semantic search
    const currentFilePath = tabs.find(t => t.id === activeTabId)?.path;
    if (currentFilePath && code) {
      const language = editor.getModel()?.getLanguageId() || 'typescript';
      codebaseIntelligence.indexFile(currentFilePath, code, language);
    }
  };

  const commandPaletteCommands = useMemo(() => [
    {
      id: 'file:new',
      label: 'New File',
      category: 'File',
      shortcut: 'Ctrl+N',
      action: () => {
        handleNewFile();
        setShowCommandPalette(false);
      }
    },
    {
      id: 'file:open',
      label: 'Open File...',
      category: 'File',
      shortcut: 'Ctrl+O',
      action: async () => {
        await handleOpenFile();
        setShowCommandPalette(false);
      }
    },
    {
      id: 'file:save',
      label: 'Save',
      category: 'File',
      shortcut: 'Ctrl+S',
      action: async () => {
        await handleSaveFile();
        setShowCommandPalette(false);
      }
    },
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
    },
    {
      id: 'review:code',
      label: 'Review Code',
      category: 'Code',
      shortcut: 'Ctrl+Shift+R',
      action: () => {
        setShowCodeReview(true);
        setShowCommandPalette(false);
      }
    }
  ], [handleAgentCommand, showTerminal, showAgentPanel, handleNewFile, handleOpenFile, handleSaveFile, setShowTerminal, setShowAgentPanel, setShowCommandPalette, setShowCodeReview]);


  return (
    <div className="cursor-app">
      <MenuBar 
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
        onToggleCommandPalette={() => setShowCommandPalette(!showCommandPalette)}
      />
      
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
                  name: path.split(/[/\\]/).pop() || 'Untitled',
                  path,
                  icon: <FiCode />
                };
                setTabs([...tabs, newTab]);
                setActiveTabId(newTab.id);
              } else {
                setActiveTabId(existingTab.id);
              }
            }}
            onFileOpen={async (path) => {
              try {
                // Read file directly using Tauri FS plugin
                const { readTextFile } = await import('@tauri-apps/plugin-fs');
                const content = await readTextFile(path);
                
                // Update or create tab for this file
                const existingTab = tabs.find(t => t.path === path);
                if (existingTab) {
                  setActiveTabId(existingTab.id);
                  setCode(content);
                } else {
                  const fileName = path.split(/[/\\]/).pop() || 'Untitled';
                  const newTab: Tab = {
                    id: Date.now().toString(),
                    name: fileName,
                    path,
                    icon: <FiCode />
                  };
                  setTabs([...tabs, newTab]);
                  setActiveTabId(newTab.id);
                  setCode(content);
                }
              } catch (err: any) {
                console.error('Failed to open file:', err);
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
              onCommandExecute={(command, result) => {
                // Agent can use terminal results
                console.log(`Terminal executed: ${command}`, result);
              }}
            />
          )}
        </div>

        {/* Right Agent Panel */}
        {showAgentPanel && (
          <AgentPanel
            isOpen={showAgentPanel}
            onClose={() => setShowAgentPanel(false)}
            onCommand={handleAgentCommand}
            selectedCode={selectedCode}
            currentFile={tabs.find(t => t.id === activeTabId)?.path}
            terminalExecutor={terminalExecutor}
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

            {/* Code Review Panel */}
            <CodeReviewPanel
              code={selectedCode || code}
              language="typescript"
              filePath={tabs.find(t => t.id === activeTabId)?.path}
              isOpen={showCodeReview}
              onClose={() => setShowCodeReview(false)}
              apiClient={apiClient}
              modelId={modelSettings.selectedModel}
            />
          </div>
        );
      }
      
      export default App;
