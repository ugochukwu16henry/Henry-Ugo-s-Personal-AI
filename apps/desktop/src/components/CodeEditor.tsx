import { Editor, loader } from '@monaco-editor/react'
import { useRef, useEffect } from 'react'
import type { editor } from 'monaco-editor'
import { setupAutocompleteForAllLanguages, initializeAutocomplete } from '../editor/monaco'

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
  const autocompleteDisposablesRef = useRef<Array<{ dispose: () => void }>>([])

  // Initialize autocomplete when component mounts
  useEffect(() => {
    let isCancelled = false

    async function setupMonacoAutocomplete() {
      try {
        // Wait for Monaco to be available
        await loader.init()
        
        if (isCancelled) return

        // Initialize autocomplete manager
        const manager = initializeAutocomplete()
        
        // Setup autocomplete for all languages
        const disposables = setupAutocompleteForAllLanguages()
        autocompleteDisposablesRef.current = disposables

        console.log('✅ Autocomplete initialized for Monaco Editor')
      } catch (error) {
        console.error('Failed to setup autocomplete:', error)
      }
    }

    setupMonacoAutocomplete()

    // Cleanup on unmount
    return () => {
      isCancelled = true
      autocompleteDisposablesRef.current.forEach(d => d.dispose())
      autocompleteDisposablesRef.current = []
    }
  }, [])

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor) {
    editorRef.current = editor
    
    // Configure editor options for performance
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      tabSize: 2,
      renderWhitespace: 'selection',
      // Performance optimizations
      renderLineHighlight: 'gutter',
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      snippetSuggestions: 'top',
      // Enable AI autocomplete
      wordBasedSuggestions: 'matchingDocuments',
      inlayHints: {
        enabled: 'on'
      }
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
        automaticLayout: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false
      }}
    />
  )
}

