/**
 * FileTree Component - Cursor-style file explorer
 */

import { useState } from 'react';
import { 
  FiFolder, 
  FiFile, 
  FiChevronRight, 
  FiChevronDown,
  FiCode,
  FiImage,
  FiFileText
} from 'react-icons/fi';
import './FileTree.css';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  expanded?: boolean;
}

interface FileTreeProps {
  onFileSelect?: (path: string) => void;
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
  onFileSelect 
}: { 
  node: FileNode; 
  level?: number; 
  onFileSelect?: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(node.expanded ?? false);
  const isFolder = node.type === 'folder';

  const handleClick = () => {
    if (isFolder) {
      setExpanded(!expanded);
    } else {
      onFileSelect?.(node.path);
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
      {isFolder && expanded && node.children && (
        <div className="file-tree-children">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ onFileSelect }: FileTreeProps) {
  // Mock file tree data - in real app, this would come from file system
  const [fileTree] = useState<FileNode[]>([
    {
      name: 'src',
      type: 'folder',
      path: '/src',
      expanded: true,
      children: [
        {
          name: 'components',
          type: 'folder',
          path: '/src/components',
          expanded: true,
          children: [
            { name: 'App.tsx', type: 'file', path: '/src/components/App.tsx' },
            { name: 'MenuBar.tsx', type: 'file', path: '/src/components/MenuBar.tsx' },
            { name: 'FileTree.tsx', type: 'file', path: '/src/components/FileTree.tsx' }
          ]
        },
        { name: 'App.tsx', type: 'file', path: '/src/App.tsx' },
        { name: 'main.tsx', type: 'file', path: '/src/main.tsx' }
      ]
    },
    {
      name: 'package.json',
      type: 'file',
      path: '/package.json'
    },
    {
      name: 'tsconfig.json',
      type: 'file',
      path: '/tsconfig.json'
    }
  ]);

  return (
    <div className="file-tree">
      <div className="file-tree-header">
        <span>EXPLORER</span>
      </div>
      <div className="file-tree-content">
        {fileTree.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
}

