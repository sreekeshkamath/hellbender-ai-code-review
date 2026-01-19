import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Check } from 'lucide-react';
import { FileDiff } from '../types/api.types';
import { cn } from '../lib/utils';

interface FileTreePanelProps {
  files: FileDiff[];
  selectedFile: string | null;
  onSelectFile: (filePath: string) => void;
  viewedFiles?: Set<string>;
  onToggleViewed?: (filePath: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: Map<string, TreeNode>;
  fileData?: FileDiff;
  isExpanded?: boolean;
}

function buildTree(files: FileDiff[]): Map<string, TreeNode> {
  const root = new Map<string, TreeNode>();

  for (const file of files) {
    const parts = file.filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join('/');

      if (!current.has(part)) {
        current.set(part, {
          name: part,
          path,
          type: isLast ? 'file' : 'folder',
          children: new Map(),
          fileData: isLast ? file : undefined,
          isExpanded: !isLast, // Folders expanded by default
        });
      }

      const node = current.get(part)!;
      if (isLast) {
        node.fileData = file;
      }

      current = node.children;
    }
  }

  return root;
}

function TreeNodeComponent({
  node,
  level,
  selectedFile,
  onSelectFile,
  viewedFiles,
  onToggleViewed,
}: {
  node: TreeNode;
  level: number;
  selectedFile: string | null;
  onSelectFile: (filePath: string) => void;
  viewedFiles?: Set<string>;
  onToggleViewed?: (filePath: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(node.isExpanded ?? false);
  const isSelected = selectedFile === node.path;
  const isViewed = viewedFiles?.has(node.path) ?? false;

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onSelectFile(node.path);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'file' && onToggleViewed) {
      onToggleViewed(node.path);
    }
  };

  const children = Array.from(node.children.values()).sort((a, b) => {
    // Folders first, then files, both alphabetically
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors group',
          'hover:bg-zinc-800/50',
          isSelected && 'bg-primary/10 border-l-2 border-primary',
          !isSelected && 'border-l-2 border-transparent'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' ? (
          <>
            {isExpanded ? (
              <ChevronDown size={14} className="text-zinc-600 flex-shrink-0" />
            ) : (
              <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
            )}
            <Folder size={14} className="text-zinc-600 flex-shrink-0" />
          </>
        ) : (
          <>
            <div className="w-[14px] flex-shrink-0" /> {/* Spacer for alignment */}
            <File size={14} className="text-zinc-500 flex-shrink-0" />
          </>
        )}

        <span
          className={cn(
            'text-[11px] font-mono flex-1 truncate',
            isSelected ? 'text-white' : 'text-zinc-300',
            node.type === 'folder' && 'font-semibold'
          )}
        >
          {node.name}
        </span>

        {node.type === 'file' && node.fileData && (
          <>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {node.fileData.additions > 0 && (
                <span className="text-[10px] font-mono text-green-400">
                  +{node.fileData.additions}
                </span>
              )}
              {node.fileData.deletions > 0 && (
                <span className="text-[10px] font-mono text-red-400">
                  -{node.fileData.deletions}
                </span>
              )}
            </div>

            {onToggleViewed && (
              <button
                onClick={handleCheckboxClick}
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                  'transition-colors',
                  isViewed
                    ? 'bg-primary border-primary'
                    : 'border-zinc-700 hover:border-zinc-600 bg-transparent'
                )}
              >
                {isViewed && <Check size={10} className="text-primary-foreground" />}
              </button>
            )}
          </>
        )}
      </div>

      {node.type === 'folder' && isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              viewedFiles={viewedFiles}
              onToggleViewed={onToggleViewed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTreePanel({
  files,
  selectedFile,
  onSelectFile,
  viewedFiles,
  onToggleViewed,
}: FileTreePanelProps) {
  const tree = useMemo(() => buildTree(files), [files]);
  const sortedRootNodes = useMemo(() => {
    return Array.from(tree.values()).sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [tree]);

  const totalAdditions = useMemo(
    () => files.reduce((sum, f) => sum + f.additions, 0),
    [files]
  );
  const totalDeletions = useMemo(
    () => files.reduce((sum, f) => sum + f.deletions, 0),
    [files]
  );

  if (files.length === 0) {
    return (
      <div className="h-full bg-zinc-950/20 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
            Changes
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-[11px] font-mono text-zinc-500 text-center">
            No files changed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-zinc-950/20 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
            Changes
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-zinc-400">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
          {totalAdditions > 0 && (
            <span className="text-green-400">+{totalAdditions}</span>
          )}
          {totalDeletions > 0 && (
            <span className="text-red-400">-{totalDeletions}</span>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="py-2">
          {sortedRootNodes.map((node) => (
            <TreeNodeComponent
              key={node.path}
              node={node}
              level={0}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              viewedFiles={viewedFiles}
              onToggleViewed={onToggleViewed}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
