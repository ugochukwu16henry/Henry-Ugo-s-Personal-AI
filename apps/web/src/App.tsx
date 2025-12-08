import { useState } from 'react'
import { CodeEditor } from './components/CodeEditor'

function App() {
  const [code, setCode] = useState(`// Henry Ugo's Personal AI - Web PWA
// Ultra-fast, local-first code editing

function welcome() {
  return "Hello from the web!"
}
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

