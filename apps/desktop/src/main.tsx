import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { ErrorBoundary } from "./ErrorBoundary";

// Initialize codebase indexer with file watching
async function initializeIndexer() {
  try {
    // In Tauri, file system operations need to go through Tauri APIs
    // For now, skip indexer initialization in Tauri environment
    // This can be enabled later when Tauri file system integration is added
    console.log("⚠️  Codebase indexer initialization skipped in Tauri environment");
    console.log("   Indexer will be enabled when Tauri file system APIs are integrated");
    return;
    
    // Future implementation:
    // const { invoke } = await import('@tauri-apps/api/core');
    // const projectPath = await invoke('get_project_path');
    // const indexer = new CodeIndexer();
    // await indexer.initialize();
    // await indexer.indexDirectory(projectPath);
    // indexer.startWatching(projectPath, { ... });
    // (window as any).__henryIndexer = indexer;
  } catch (error) {
    console.error("❌ Failed to initialize indexer:", error);
    // Don't crash the app if indexer fails
  }
}

// Initialize indexer when app starts (non-blocking)
initializeIndexer().catch(console.error);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
