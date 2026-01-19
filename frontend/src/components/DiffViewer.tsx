import React, { useState, useMemo } from 'react';
import { FileDiff, DiffHunk, DiffLine, Comment } from '../types/api.types';
import { DiffLine as DiffLineComponent } from './DiffLine';
import { InlineComment } from './InlineComment';
import { cn } from '../lib/utils';

interface DiffViewerProps {
  fileDiff: FileDiff | null;
  comments?: Comment[];
  onAddComment?: (line: number, filePath: string) => void;
  selectedLine?: number | null;
  onSelectLine?: (line: number | null) => void;
}

interface LineWithComments {
  line: DiffLine;
  hunkIndex: number;
  comments: Comment[];
}

export function DiffViewer({
  fileDiff,
  comments = [],
  onAddComment,
  selectedLine,
  onSelectLine,
}: DiffViewerProps) {
  const [expandedHunks, setExpandedHunks] = useState<Set<number>>(new Set());
  const [contextLines, setContextLines] = useState(3);

  // Group comments by line number
  const commentsByLine = useMemo(() => {
    const map = new Map<number, Comment[]>();
    for (const comment of comments) {
      if (comment.line !== undefined) {
        const existing = map.get(comment.line) || [];
        map.set(comment.line, [...existing, comment]);
      }
    }
    return map;
  }, [comments]);

  // Flatten hunks into lines with their metadata
  const linesWithMetadata = useMemo((): LineWithComments[] => {
    if (!fileDiff) return [];

    const result: LineWithComments[] = [];
    fileDiff.hunks.forEach((hunk, hunkIndex) => {
      hunk.lines.forEach((line) => {
        const lineNumber = line.newLineNumber ?? line.oldLineNumber;
        const lineComments = lineNumber ? commentsByLine.get(lineNumber) || [] : [];
        result.push({
          line,
          hunkIndex,
          comments: lineComments,
        });
      });
    });
    return result;
  }, [fileDiff, commentsByLine]);

  const toggleHunk = (index: number) => {
    setExpandedHunks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (!fileDiff) {
    return (
      <div className="flex-1 bg-zinc-900/50 flex items-center justify-center">
        <p className="text-[11px] font-mono text-zinc-500">
          Select a file to view diff
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-900/50 flex flex-col overflow-hidden">
      {/* File Header */}
      <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-[11px] font-mono text-white">{fileDiff.filePath}</h3>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              {fileDiff.additions > 0 && (
                <span className="text-green-400">+{fileDiff.additions}</span>
              )}
              {fileDiff.deletions > 0 && (
                <span className="text-red-400">-{fileDiff.deletions}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="font-mono text-[11px] leading-relaxed">
          {fileDiff.hunks.map((hunk, hunkIndex) => {
            const isExpanded = expandedHunks.has(hunkIndex);
            const hasContext = hunk.lines.some((l) => l.type === 'context');

            return (
              <div key={hunkIndex} className="border-b border-zinc-800/50">
                {/* Hunk Header */}
                <div
                  className={cn(
                    'px-6 py-2 bg-zinc-950/40 border-b border-zinc-800/30',
                    'flex items-center justify-between cursor-pointer',
                    'hover:bg-zinc-950/60 transition-colors'
                  )}
                  onClick={() => toggleHunk(hunkIndex)}
                >
                  <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500">
                    <span>
                      @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                    </span>
                  </div>
                  {hasContext && (
                    <button className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400">
                      {isExpanded ? 'Hide' : 'Show'} context
                    </button>
                  )}
                </div>

                {/* Hunk Lines */}
                <div className={cn(!isExpanded && hasContext && 'hidden')}>
                  {hunk.lines.map((line, lineIndex) => {
                    const lineNumber = line.newLineNumber ?? line.oldLineNumber;
                    const lineComments = lineNumber ? commentsByLine.get(lineNumber) || [] : [];
                    const isSelected = selectedLine === lineNumber;

                    return (
                      <div key={lineIndex}>
                        <DiffLineComponent
                          line={line}
                          hunk={hunk}
                          isSelected={isSelected}
                          onClick={() => {
                            if (onSelectLine) {
                              onSelectLine(lineNumber);
                            }
                          }}
                          onAddComment={() => {
                            if (onAddComment && lineNumber && fileDiff.filePath) {
                              onAddComment(lineNumber, fileDiff.filePath);
                            }
                          }}
                        />
                        {/* Render comments below the line */}
                        {lineComments.length > 0 && lineNumber && (
                          <div className="pl-6 pr-6 pb-2">
                            {lineComments.map((comment) => (
                              <InlineComment
                                key={comment.id}
                                comment={comment}
                                lineNumber={lineNumber}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
