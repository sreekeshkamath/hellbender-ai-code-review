import React from 'react';
import { GitPullRequest, GitBranch, Clock, User } from 'lucide-react';
import { Badge } from './ui/badge';
import { PullRequest } from '../types/api.types';
import { cn } from '../lib/utils';

interface MergeRequestsListProps {
  pullRequests: PullRequest[];
  selectedPR: PullRequest | null;
  onSelectPR: (pr: PullRequest) => void;
  isLoading?: boolean;
  repoId?: string;
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

function getStatusBadgeVariant(status: PullRequest['status']) {
  switch (status) {
    case 'open':
      return 'bg-green-500 hover:bg-green-600 text-black';
    case 'merged':
      return 'bg-primary hover:bg-primary/90 text-primary-foreground';
    case 'closed':
      return 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200';
    default:
      return 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200';
  }
}

function getStatusLabel(status: PullRequest['status']): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'merged':
      return 'Merged';
    case 'closed':
      return 'Closed';
    default:
      return status;
  }
}

export function MergeRequestsList({
  pullRequests,
  selectedPR,
  onSelectPR,
  isLoading = false,
  repoId,
}: MergeRequestsListProps) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4">
          Merge Requests
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 border border-zinc-800 bg-zinc-950/20 rounded-lg animate-pulse"
            >
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (pullRequests.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4">
          Merge Requests
        </h2>
        <div className="p-8 border border-zinc-800 bg-zinc-950/20 rounded-lg text-center">
          <GitPullRequest size={24} className="mx-auto mb-3 text-zinc-700" />
          <p className="text-[11px] font-mono text-zinc-500">
            No merge requests found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4">
        Merge Requests
      </h2>
      <div className="space-y-2">
        {pullRequests.map((pr) => {
          const isSelected = selectedPR?.id === pr.id;
          return (
            <button
              key={pr.id}
              onClick={() => onSelectPR(pr)}
              className={cn(
                'w-full text-left p-4 border rounded-lg transition-all',
                'hover:border-zinc-700 hover:bg-zinc-950/30',
                isSelected
                  ? 'border-primary bg-primary/10 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                  : 'border-zinc-800 bg-zinc-950/20'
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold tracking-tight text-white mb-1 truncate">
                    {pr.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={cn(
                        'font-black uppercase tracking-widest text-[10px] rounded-sm py-1 px-2',
                        getStatusBadgeVariant(pr.status)
                      )}
                    >
                      <GitPullRequest size={10} className="mr-1" />
                      {getStatusLabel(pr.status)}
                    </Badge>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      {pr.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-zinc-600" />
                    <span className="text-zinc-300">{pr.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-zinc-600" />
                    <span className="text-zinc-500">
                      {formatTimeAgo(pr.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <GitBranch size={12} className="text-zinc-600" />
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
                      {pr.sourceBranch}
                    </span>
                  </div>
                  <span className="text-zinc-600">→</span>
                  <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
                    {pr.targetBranch}
                  </span>
                </div>

                {pr.filesChanged && pr.filesChanged.length > 0 && (
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 pt-1">
                    {pr.filesChanged.length} file{pr.filesChanged.length !== 1 ? 's' : ''} changed
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
