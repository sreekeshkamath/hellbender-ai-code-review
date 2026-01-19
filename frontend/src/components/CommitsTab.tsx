import React, { useState, useEffect } from 'react';
import { GitCommit, User, Clock } from 'lucide-react';
import { Commit } from '../types/api.types';
import { PullRequestService } from '../services/PullRequestService';

interface CommitsTabProps {
  pr: {
    id: string;
    repoId: string;
    sourceBranch: string;
    targetBranch: string;
  };
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
}

export const CommitsTab: React.FC<CommitsTabProps> = ({ pr }) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommits = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const service = new PullRequestService();
        const data = await service.getCommits(pr.repoId, pr.sourceBranch, pr.targetBranch);
        setCommits(data);
      } catch (err) {
        console.error('Failed to fetch commits:', err);
        setError(err instanceof Error ? err.message : 'Failed to load commits');
      } finally {
        setIsLoading(false);
      }
    };

    if (pr.repoId && pr.sourceBranch && pr.targetBranch) {
      fetchCommits();
    }
  }, [pr.repoId, pr.sourceBranch, pr.targetBranch]);

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <GitCommit size={12} className="text-zinc-600" />
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
            Commits
          </h3>
        </div>
        <div className="mt-4 p-4 border border-zinc-800 bg-zinc-900/30 rounded-lg text-center">
          <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-[11px] font-mono text-zinc-500">Loading commits...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <GitCommit size={12} className="text-zinc-600" />
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
            Commits
          </h3>
        </div>
        <div className="mt-4 p-4 border border-zinc-800 bg-zinc-900/30 rounded-lg">
          <p className="text-[11px] font-mono text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  if (commits.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <GitCommit size={12} className="text-zinc-600" />
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
            Commits
          </h3>
        </div>
        <div className="mt-4 p-4 border border-zinc-800 bg-zinc-900/30 rounded-lg text-center">
          <p className="text-[11px] font-mono text-zinc-500 italic">No commits found</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <GitCommit size={12} className="text-zinc-600" />
        <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
          Commits ({commits.length})
        </h3>
      </div>
      <div className="mt-4 space-y-3">
        {commits.map((commit, index) => (
          <div
            key={commit.hash}
            className="flex gap-4 p-4 border border-zinc-800 bg-zinc-900/30 rounded-lg hover:bg-zinc-900/50 transition-colors"
          >
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-primary mt-1" />
              {index !== commits.length - 1 && (
                <div className="w-px h-full bg-zinc-800 mt-1" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-mono text-primary font-bold">
                  {commit.shortHash}
                </span>
                <span className="text-[11px] font-mono text-zinc-300 truncate">
                  {commit.message.split('\n')[0]}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600">
                <div className="flex items-center gap-1">
                  <User size={10} className="text-zinc-700" />
                  <span className="text-zinc-400">{commit.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={10} className="text-zinc-700" />
                  <span className="text-zinc-600">{formatTimeAgo(commit.date)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
