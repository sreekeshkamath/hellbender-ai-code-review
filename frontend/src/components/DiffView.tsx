/**
 * DiffView Component
 * 
 * This component displays a unified diff view with inline comments,
 * following the GitLab-style design pattern.
 */

import React, { useMemo } from 'react';
import { clsx } from 'clsx';
import { DiffHunk, DiffLine as DiffLineType, ReviewComment } from '../types/reviewSession.types';
import { InlineComment } from './InlineComment';

interface DiffViewProps {
  diffHunks: DiffHunk[];
  comments?: ReviewComment[];
  onLineClick?: (lineNumber: number, lineType: DiffLineType['type']) => void;
  selectedLineNumber?: number;
}

/**
 * Format line number for display
 */
function formatLineNumber(line: DiffLineType, isOld: boolean): string {
  if (line.type === 'added') {
    return String(line.lineNumber).padStart(5, ' ');
  }
  return String(line.lineNumber).padStart(5, ' ');
}

/**
 * Get comments for a specific line number
 */
function getCommentsForLine(
  lineNumber: number,
  comments?: ReviewComment[]
): ReviewComment[] {
  if (!comments) return [];
  return comments.filter((c) => c.lineNumber === lineNumber);
}

export function DiffView({
  diffHunks,
  comments = [],
  onLineClick,
  selectedLineNumber,
}: DiffViewProps) {
  /**
   * Flatten diff hunks into display lines with comments
   */
  const displayLines = useMemo(() => {
    const lines: Array<{
      hunkIndex: number;
      line: DiffLineType;
      comments: ReviewComment[];
    }> = [];

    diffHunks.forEach((hunk, hunkIndex) => {
      hunk.lines.forEach((line) => {
        lines.push({
          hunkIndex,
          line,
          comments: getCommentsForLine(line.lineNumber, comments),
        });
      });
    });

    return lines;
  }, [diffHunks, comments]);

  if (diffHunks.length === 0) {
    return (
      <div className="p-4 text-zinc-500 text-sm font-mono">
        No changes to display
      </div>
    );
  }

  return (
    <div className="font-mono text-[11px] leading-relaxed bg-zinc-950/30 rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <tbody>
          {displayLines.map((displayLine, index) => {
            const isSelected = selectedLineNumber === displayLine.line.lineNumber;
            
            return (
              <React.Fragment key={index}>
                {/* Code line */}
                <tr
                  className={clsx(
                    'hover:bg-zinc-800/50 cursor-pointer transition-colors',
                    isSelected && 'bg-zinc-800/70'
                  )}
                  onClick={() =>
                    onLineClick?.(displayLine.line.lineNumber, displayLine.line.type)
                  }
                >
                  {/* Line numbers */}
                  <td className="text-zinc-600 select-none text-right pr-3 py-0 border-r border-zinc-800/50 bg-zinc-900/20">
                    {displayLine.line.type === 'added'
                      ? ''
                      : formatLineNumber(displayLine.line, true)}
                  </td>
                  <td className="text-zinc-600 select-none text-right pr-3 py-0 border-r border-zinc-800/50 bg-zinc-900/20">
                    {displayLine.line.type === 'removed'
                      ? ''
                      : formatLineNumber(displayLine.line, false)}
                  </td>
                  
                  {/* Line type indicator and content */}
                  <td
                    className={clsx(
                      'px-3 py-0 whitespace-pre-wrap break-all',
                      displayLine.line.type === 'added' &&
                        'bg-green-500/10 text-green-400',
                      displayLine.line.type === 'removed' &&
                        'bg-red-500/10 text-red-400',
                      displayLine.line.type === 'context' && 'text-zinc-400'
                    )}
                  >
                    {displayLine.line.type === 'added' ? '+' : displayLine.line.type === 'removed' ? '-' : ' '}
                    {displayLine.line.content}
                  </td>
                </tr>
                
                {/* Inline comments for this line */}
                {displayLine.comments.length > 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-2 bg-zinc-900/30">
                      <div className="space-y-2">
                        {displayLine.comments.map((comment) => (
                          <InlineComment key={comment.id} comment={comment} />
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DiffView;
