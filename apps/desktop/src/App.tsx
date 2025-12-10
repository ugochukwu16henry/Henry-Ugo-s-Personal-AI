import { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { HenryAgent } from '@henry-ai/core';
import { DiffViewer } from './components/DiffViewer';
import { useDiffViewer } from './hooks/useDiffViewer';
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

  const diffViewer = useDiffViewer();

  const runAgent = async () => {
    try {
      const agent = new HenryAgent();
      await agent.initializeMemory();
      
      // Plan the task
      const steps = await agent.plan(task);
      setOutput(steps.join('\n'));
      
      // For demonstration: show diff preview for editing current file
      // Note: In a real implementation, you'd specify the actual file path
      if (code && task.toLowerCase().includes('edit')) {
        const filePath = './example.ts';
        // Preview edit
        const preview = await agent.previewEdit(filePath, task);
        
        // Show diff viewer
        diffViewer.showDiff(
          preview,
          filePath,
          async () => {
            // Apply the edit
            await agent.applyStagedEdit(filePath, true);
            // Update editor content with new code
            setCode(preview.newContent);
          },
          () => {
            // Reject - do nothing, just discard
            agent.discardEdit(filePath);
          }
        );
      }
    } catch (error: any) {
      console.error('Agent error:', error);
      setOutput(`Error: ${error.message}`);
    }
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
