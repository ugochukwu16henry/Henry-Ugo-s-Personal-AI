import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { CodeIndexer } from "@henry-ai/core";

// Initialize codebase indexer with file watching
async function initializeIndexer() {
  try {
    // Check if running in Node.js environment (not browser-only)
    if (typeof process === 'undefined' || !process.cwd) {
      console.log("⚠️  File watcher not available in browser environment");
      return;
    }

    const indexer = new CodeIndexer();
    await indexer.initialize();

    // Index current directory (adjust path as needed)
    // In Tauri, you might want to use a user-selected directory
    const projectPath = process.cwd();
    console.log(`📚 Initializing codebase indexer for: ${projectPath}`);

    // Do initial index (optional, can be slow for large projects)
    // Uncomment to index on startup:
    // await indexer.indexDirectory(projectPath, { enableVectorSearch: true });

    // Start watching for file changes
    indexer.startWatching(projectPath, {
      ignored: /node_modules|\.git|dist|build|\.next|coverage|\.henry-db/,
      debounce: 500
    });

    // Make indexer available globally for debugging/access
    (window as any).__henryIndexer = indexer;

    console.log("✅ Codebase indexer initialized with file watching");
  } catch (error) {
    console.error("❌ Failed to initialize indexer:", error);
    // Don't crash the app if indexer fails
  }
}

// Initialize indexer when app starts (non-blocking)
initializeIndexer().catch(console.error);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
