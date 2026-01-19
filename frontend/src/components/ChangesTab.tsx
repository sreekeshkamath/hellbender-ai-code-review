import React, { useState, useEffect, useMemo } from 'react';
import { GitBranch, FileCode } from 'lucide-react';
import { FileDiff, Comment } from '../types/api.types';
import { FileTreePanel } from './FileTreePanel';
import { DiffViewer } from './DiffViewer';
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-[11px] font-mono text-zinc-500">Loading changes...</p>
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
        <div className="w-80 flex-shrink-0">
          <FileTreePanel
            files={diff}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            viewedFiles={viewedFiles}
            onToggleViewed={toggleViewed}
          />
        </div>

        {/* Right: Diff Viewer */}
        <div className="flex-1 flex-shrink-0">
          <DiffViewer
            fileDiff={selectedFileDiff}
            comments={fileComments}
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
