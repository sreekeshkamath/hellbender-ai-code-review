import React, { useState, useEffect, useMemo } from 'react';
import { GitBranch, FileCode } from 'lucide-react';
import { FileDiff, Comment } from '../types/api.types';
import { FileTreePanel } from './FileTreePanel';
import { DiffViewer } from './DiffViewer';
import { Skeleton } from './ui/skeleton';
import { useDiff } from '../hooks/useDiff';
import { PullRequestService } from '../services/PullRequestService';

interface ChangesTabProps {
  pr: {
    id: string;
    repoId: string;
    sourceBranch: string;
    targetBranch: string;
  };
}

export const ChangesTab: React.FC<ChangesTabProps> = ({ pr }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [viewedFiles, setViewedFiles] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Comment[]>([]);
  const { diff, isLoading, error, fetchDiff } = useDiff();

  // Fetch diff data when PR changes
  useEffect(() => {
    if (pr.repoId && pr.sourceBranch && pr.targetBranch) {
      fetchDiff(pr.repoId, pr.sourceBranch, pr.targetBranch);
    }
  }, [pr.repoId, pr.sourceBranch, pr.targetBranch, fetchDiff]);

  // Fetch comments for the PR
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const service = new PullRequestService();
        const prComments = await service.getComments(pr.id);
        setComments(prComments);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    };
    fetchComments();
  }, [pr.id]);

  // Get the selected file diff
  const selectedFileDiff = useMemo(() => {
    if (!selectedFile || !diff) return null;
    return diff.find((f) => f.filePath === selectedFile) || null;
  }, [selectedFile, diff]);

  // Auto-select first file when diff loads
  useEffect(() => {
    if (diff && diff.length > 0 && !selectedFile) {
      setSelectedFile(diff[0].filePath);
    }
  }, [diff, selectedFile]);

  const toggleViewed = (filePath: string) => {
    setViewedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  // Calculate totals
  const totalAdditions = useMemo(
    () => (diff || []).reduce((sum, f) => sum + f.additions, 0),
    [diff]
  );
  const totalDeletions = useMemo(
    () => (diff || []).reduce((sum, f) => sum + f.deletions, 0),
    [diff]
  );

  // Filter comments for selected file
  const fileComments = useMemo(() => {
    if (!selectedFile) return [];
    return comments.filter((c) => c.filePath === selectedFile);
  }, [comments, selectedFile]);

  // Get all comment lines for keyboard navigation
  const commentLines = useMemo(() => {
    return fileComments
      .map((c) => c.line)
      .filter((line): line is number => line !== undefined)
      .sort((a, b) => a - b);
  }, [fileComments]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Arrow keys for file navigation
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && diff && diff.length > 0) {
        e.preventDefault();
        const currentIndex = selectedFile
          ? diff.findIndex((f) => f.filePath === selectedFile)
          : -1;

        if (e.key === 'ArrowDown') {
          const nextIndex = Math.min(currentIndex + 1, diff.length - 1);
          if (nextIndex >= 0 && nextIndex < diff.length) {
            setSelectedFile(diff[nextIndex].filePath);
            setSelectedLine(null);
          }
        } else if (e.key === 'ArrowUp') {
          const prevIndex = Math.max(currentIndex - 1, 0);
          if (prevIndex >= 0 && prevIndex < diff.length) {
            setSelectedFile(diff[prevIndex].filePath);
            setSelectedLine(null);
          }
        }
        return;
      }

      // n/p for next/previous comment
      if ((e.key === 'n' || e.key === 'p') && commentLines.length > 0) {
        e.preventDefault();
        const currentLine = selectedLine ?? commentLines[0];
        const currentIndex = commentLines.indexOf(currentLine);

        if (e.key === 'n') {
          // Next comment
          const nextIndex = (currentIndex + 1) % commentLines.length;
          setSelectedLine(commentLines[nextIndex]);
        } else if (e.key === 'p') {
          // Previous comment
          const prevIndex =
            currentIndex <= 0 ? commentLines.length - 1 : currentIndex - 1;
          setSelectedLine(commentLines[prevIndex]);
        }
        return;
      }

      // Escape to deselect line
      if (e.key === 'Escape') {
        setSelectedLine(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [diff, selectedFile, selectedLine, commentLines]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header skeleton */}
        <div className="px-8 py-4 border-b border-zinc-800 bg-zinc-950/20">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-px" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        {/* Two-panel skeleton */}
        <div className="flex-1 flex overflow-hidden">
          {/* File tree skeleton */}
          <div className="w-80 flex-shrink-0 bg-zinc-950/20 border-r border-zinc-800">
            <div className="p-4 border-b border-zinc-800">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="p-2 space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full rounded" />
              ))}
            </div>
          </div>
          {/* Diff viewer skeleton */}
          <div className="flex-1 flex-shrink-0 bg-zinc-900/50">
            <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/30">
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="p-6 space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="flex gap-0">
                  <div className="flex gap-0">
                    <Skeleton className="h-5 w-16 border-r border-zinc-800" />
                    <Skeleton className="h-5 w-16 border-r border-zinc-800" />
                  </div>
                  <Skeleton className="flex-1 h-5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[11px] font-mono text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!diff || diff.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <FileCode size={48} className="mx-auto text-zinc-700" />
          <p className="text-[11px] font-mono text-zinc-500">No changes found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with summary */}
      <div className="px-8 py-4 border-b border-zinc-800 bg-zinc-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <GitBranch size={14} className="text-zinc-600" />
              <span className="text-[11px] font-mono text-zinc-400">
                {pr.sourceBranch}
              </span>
              <span className="text-[11px] font-mono text-zinc-600">→</span>
              <span className="text-[11px] font-mono text-zinc-400">
                {pr.targetBranch}
              </span>
            </div>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-zinc-400">
                {diff.length} file{diff.length !== 1 ? 's' : ''} changed
              </span>
              {totalAdditions > 0 && (
                <span className="text-green-400">+{totalAdditions}</span>
              )}
              {totalDeletions > 0 && (
                <span className="text-red-400">-{totalDeletions}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Tree */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <FileTreePanel
            files={diff}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            viewedFiles={viewedFiles}
            onToggleViewed={toggleViewed}
          />
        </div>

        {/* Right: Diff Viewer */}
        <div className="flex-1 flex-shrink-0 min-w-0">
          <DiffViewer
            fileDiff={selectedFileDiff}
            comments={fileComments}
            selectedLine={selectedLine}
            onSelectLine={setSelectedLine}
            onAddComment={(line, filePath) => {
              // TODO: Implement add comment functionality
              console.log('Add comment at line', line, 'in', filePath);
            }}
          />
        </div>
      </div>
    </div>
  );
};
