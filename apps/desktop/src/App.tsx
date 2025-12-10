import { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { HenryAgent } from '@henry-ai/core';
import './App.css';

function App() {
  const [task, setTask] = useState('');
  const [output, setOutput] = useState('');
  const [code, setCode] = useState(`// Welcome to Henry Ugo's Personal AI
// Start typing to experience ultra-fast autocomplete (<80ms)

function greet(name: string): string {
  return \`Hello, \${name}!\`
}

const message = greet('Henry')
console.log(message)
`);

  const runAgent = async () => {
    const agent = new HenryAgent();
    const steps = await agent.plan(task);
    setOutput(steps.join('\n'));
    // TODO: Apply edits to editor
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>Henry AI</h2>
        <nav>
          <button>Files</button>
          <button>Search</button>
          <button>AI Chat</button>
        </nav>
        <div style={{ marginTop: '2rem', padding: '1rem' }}>
          <input 
            value={task} 
            onChange={e => setTask(e.target.value)}
            placeholder="Enter a task..."
            style={{ 
              width: '100%', 
              padding: '0.5rem',
              marginBottom: '0.5rem',
              background: '#1e1e1e',
              border: '1px solid #3e3e42',
              color: '#fff',
              borderRadius: '4px'
            }}
          />
          <button 
            onClick={runAgent}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#0e639c',
              border: 'none',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Run Henry's AI
          </button>
        </div>
      </div>
      <div className="editor-container">
        <Editor 
          height="100%" 
          language="javascript"
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
        />
        {output && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#252526',
            borderTop: '1px solid #3e3e42',
            padding: '1rem',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            <pre style={{ color: '#fff', margin: 0 }}>{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
