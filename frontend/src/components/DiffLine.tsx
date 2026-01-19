import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { DiffLine as DiffLineType, DiffHunk } from '../types/api.types';
import { cn } from '../lib/utils';

interface DiffLineProps {
  line: DiffLineType;
  hunk: DiffHunk;
  isSelected?: boolean;
  onClick?: () => void;
  onAddComment?: () => void;
}

export function DiffLine({
  line,
  hunk,
  isSelected = false,
  onClick,
  onAddComment,
}: DiffLineProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getLineBgColor = () => {
    if (isSelected) return 'bg-primary/20';
    if (line.type === 'addition') return 'bg-green-500/10';
    if (line.type === 'deletion') return 'bg-red-500/10';
    return '';
  };

  const getLineTextColor = () => {
    if (line.type === 'addition') return 'text-green-400';
    if (line.type === 'deletion') return 'text-red-400';
    return 'text-zinc-300';
  };

  const getLineBorderColor = () => {
    if (isSelected) return 'border-l-primary';
    if (line.type === 'addition') return 'border-l-green-500/30';
    if (line.type === 'deletion') return 'border-l-red-500/30';
    return 'border-l-transparent';
  };

  const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';

  return (
    <div
      className={cn(
        'flex items-start group border-l-2 transition-colors',
        getLineBgColor(),
        getLineBorderColor(),
        !isSelected && 'hover:bg-zinc-800/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Line Numbers */}
      <div className="flex items-stretch flex-shrink-0">
        <div
          className={cn(
            'px-3 py-0.5 text-[10px] font-mono text-right select-none',
            'border-r border-zinc-800/50',
            line.oldLineNumber ? 'text-zinc-500' : 'text-zinc-800',
            'w-16'
          )}
        >
          {line.oldLineNumber ?? ''}
        </div>
        <div
          className={cn(
            'px-3 py-0.5 text-[10px] font-mono text-right select-none',
            'border-r border-zinc-800/50',
            line.newLineNumber ? 'text-zinc-500' : 'text-zinc-800',
            'w-16'
          )}
        >
          {line.newLineNumber ?? ''}
        </div>
      </div>

      {/* Line Content */}
      <div className="flex-1 flex items-center min-w-0">
        <span
          className={cn(
            'px-4 py-0.5 font-mono text-[11px] leading-relaxed whitespace-pre',
            getLineTextColor(),
            'select-text'
          )}
        >
          <span className="text-zinc-600 mr-2">{prefix}</span>
          {line.content}
        </span>

        {/* Comment Button */}
        {isHovered && onAddComment && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddComment();
            }}
            className={cn(
              'ml-auto mr-4 p-1.5 rounded transition-colors',
              'bg-zinc-800/80 hover:bg-zinc-700',
              'border border-zinc-700 hover:border-zinc-600',
              'text-zinc-400 hover:text-white',
              'flex-shrink-0'
            )}
            title="Add comment"
          >
            <MessageSquare size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
