import { useState } from 'react'
import { CodeEditor } from './components/CodeEditor'

function App() {
  const [code, setCode] = useState(`// Welcome to Henry Ugo's Personal AI
// Start typing to experience ultra-fast autocomplete (<80ms)

function greet(name: string): string {
  return \`Hello, \${name}!\`
}

const message = greet('Henry')
console.log(message)
`)

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>Henry AI</h2>
        <nav>
          <button>Files</button>
          <button>Search</button>
          <button>AI Chat</button>
        </nav>
      </div>
      <div className="editor-container">
        <CodeEditor
          value={code}
          onChange={(value) => setCode(value || '')}
          language="typescript"
          theme="vs-dark"
        />
      </div>
    </div>
  )
}

export default App

