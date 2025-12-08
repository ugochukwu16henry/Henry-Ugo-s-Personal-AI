import { Editor } from '@monaco-editor/react'
import { useRef } from 'react'
import type { editor } from 'monaco-editor'

interface CodeEditorProps {
  value: string
  onChange?: (value: string | undefined) => void
  language?: string
  theme?: 'vs-dark' | 'light'
  readOnly?: boolean
}

export function CodeEditor({
  value,
  onChange,
  language = 'typescript',
  theme = 'vs-dark',
  readOnly = false
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor) {
    editorRef.current = editor
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 14,
      automaticLayout: true,
      wordWrap: 'on',
      tabSize: 2
    })
  }

  return (
    <Editor
      height="100%"
      language={language}
      theme={theme}
      value={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      options={{
        readOnly,
        automaticLayout: true
      }}
    />
  )
}

