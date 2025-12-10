/**
 * FileTree Component - Cursor-style file explorer
 */

import { useState, useEffect } from 'react';
import { 
  FiFolder, 
  FiFile, 
  FiChevronRight, 
  FiChevronDown,
  FiCode,
  FiImage,
  FiFileText,
  FiFolderPlus
} from 'react-icons/fi';
import { readDirectory, selectFolder, type FileSystemEntry } from '../utils/fileSystem';
import './FileTree.css';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  expanded?: boolean;
  loaded?: boolean; // Track if folder contents have been loaded
}

interface FileTreeProps {
  onFileSelect?: (path: string) => void;
  onFileOpen?: (path: string) => void;
  rootPath?: string;
}

const fileIcons: Record<string, React.ReactNode> = {
  'ts': <FiCode />,
  'tsx': <FiCode />,
  'js': <FiCode />,
  'jsx': <FiCode />,
  'json': <FiCode />,
  'png': <FiImage />,
  'jpg': <FiImage />,
  'jpeg': <FiImage />,
  'gif': <FiImage />,
  'svg': <FiImage />,
  'md': <FiFileText />,
  'txt': <FiFileText />
};

function getFileIcon(name: string): React.ReactNode {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return fileIcons[ext] || <FiFile />;
}

function FileTreeNode({ 
  node, 
  level = 0, 
  onFileSelect,
  onFileOpen,
  onLoadChildren
}: { 
  node: FileNode; 
  level?: number; 
  onFileSelect?: (path: string) => void;
  onFileOpen?: (path: string) => void;
  onLoadChildren?: (path: string) => Promise<FileNode[]>;
}) {
  const [expanded, setExpanded] = useState(node.expanded ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [children, setChildren] = useState<FileNode[]>(node.children || []);
  const isFolder = node.type === 'folder';

  const handleClick = async () => {
    if (isFolder) {
      const newExpanded = !expanded;
      setExpanded(newExpanded);

      // Load children if folder is expanded and not yet loaded
      if (newExpanded && !node.loaded && onLoadChildren) {
        setIsLoading(true);
        try {
          const loadedChildren = await onLoadChildren(node.path);
          setChildren(loadedChildren);
          node.loaded = true;
          node.children = loadedChildren;
        } catch (error) {
          console.error('Failed to load folder contents:', error);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      onFileSelect?.(node.path);
      onFileOpen?.(node.path);
    }
  };

  return (
    <div className="file-tree-node">
      <div
        className={`file-tree-item ${isFolder ? 'folder' : 'file'}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder && (
          <span className="file-tree-icon">
            {expanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </span>
        )}
        {!isFolder && <span className="file-tree-spacer" />}
        <span className="file-tree-icon">
          {isFolder 
            ? <FiFolder size={16} />
            : getFileIcon(node.name)
          }
        </span>
        <span className="file-tree-name">{node.name}</span>
      </div>
      {isFolder && expanded && (
        <div className="file-tree-children">
          {isLoading ? (
            <div className="file-tree-loading" style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}>
              Loading...
            </div>
          ) : (
            children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                level={level + 1}
                onFileSelect={onFileSelect}
                onFileOpen={onFileOpen}
                onLoadChildren={onLoadChildren}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function FileTree({ onFileSelect, rootPath, onFileOpen }: FileTreeProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [currentRoot, setCurrentRoot] = useState<string | null>(rootPath || null);
  const [isLoading, setIsLoading] = useState(false);

  // Convert FileSystemEntry to FileNode
  const convertToFileNode = (entry: FileSystemEntry): FileNode => ({
    name: entry.name,
    type: entry.type === 'directory' ? 'folder' : 'file',
    path: entry.path,
    loaded: false
  });

  // Load directory contents
  const loadDirectory = async (dirPath: string): Promise<FileNode[]> => {
    try {
      const entries = await readDirectory(dirPath);
      return entries
        .filter(entry => !entry.name.startsWith('.') && entry.name !== 'node_modules')
        .map(convertToFileNode);
    } catch (error) {
      console.error('Error loading directory:', error);
      return [];
    }
  };

  // Load root directory on mount or when rootPath changes
  useEffect(() => {
    const loadRoot = async () => {
      if (!currentRoot) return;
      
      setIsLoading(true);
      try {
        const entries = await loadDirectory(currentRoot);
        setFileTree(entries);
      } catch (error) {
        console.error('Failed to load root directory:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoot();
  }, [currentRoot]);

  // Handle opening folder dialog
  const handleOpenFolder = async () => {
    const selected = await selectFolder();
    if (selected) {
      setCurrentRoot(selected);
    }
  };

  // Handle loading children for a folder
  const handleLoadChildren = async (path: string): Promise<FileNode[]> => {
    return await loadDirectory(path);
  };

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <span>EXPLORER</span>
        <button
          className="file-tree-open-folder"
          onClick={handleOpenFolder}
          title="Open Folder"
        >
          <FiFolderPlus size={14} />
        </button>
      </div>
      <div className="file-tree-content">
        {isLoading ? (
          <div className="file-tree-loading">Loading...</div>
        ) : currentRoot ? (
          fileTree.length > 0 ? (
            fileTree.map((node) => (
              <FileTreeNode
                key={node.path}
                node={node}
                onFileSelect={onFileSelect}
                onFileOpen={onFileOpen}
                onLoadChildren={handleLoadChildren}
              />
            ))
          ) : (
            <div className="file-tree-empty">No files found</div>
          )
        ) : (
          <div className="file-tree-empty">
            <p>No folder open</p>
            <button onClick={handleOpenFolder} className="file-tree-open-button">
              Open Folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

