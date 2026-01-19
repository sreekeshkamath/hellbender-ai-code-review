import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User, Clock } from 'lucide-react';
import { Comment } from '../types/api.types';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface InlineCommentProps {
  comment: Comment;
  lineNumber: number;
}

function getSeverityColor(severity?: Comment['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500 text-white';
    case 'high':
      return 'bg-orange-500 text-white';
    case 'medium':
      return 'bg-yellow-500 text-black';
    case 'low':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-zinc-700 text-zinc-200';
  }
}

function getSeverityLabel(severity?: Comment['severity']): string {
  switch (severity) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Info';
  }
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

export function InlineComment({ comment, lineNumber }: InlineCommentProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const isAIComment = comment.type === 'ai';
  const severityColor = getSeverityColor(comment.severity);
  const severityLabel = getSeverityLabel(comment.severity);

  return (
    <div
      className={cn(
        'mt-2 border rounded-lg overflow-hidden',
        'bg-zinc-950/40 border-zinc-800',
        'transition-all'
      )}
    >
      {/* Comment Header */}
      <div
        className={cn(
          'px-4 py-2 flex items-center justify-between cursor-pointer',
          'hover:bg-zinc-900/50 transition-colors',
          'border-b border-zinc-800'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Severity Badge */}
          {comment.severity && (
            <Badge
              className={cn(
                'font-black uppercase tracking-widest text-[9px] rounded-sm py-0.5 px-2',
                severityColor
              )}
            >
              {severityLabel}
            </Badge>
          )}

          {/* Type Badge */}
          {isAIComment && (
            <Badge className="bg-primary/20 text-primary border border-primary/30 font-black uppercase tracking-widest text-[9px] rounded-sm py-0.5 px-2">
              AI
            </Badge>
          )}

          {/* Author and Time */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
            <User size={10} className="text-zinc-600" />
            <span className="text-zinc-400">{comment.author}</span>
            <Clock size={10} className="text-zinc-600 ml-2" />
            <span>{formatTimeAgo(comment.createdAt)}</span>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0 ml-2"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </button>
      </div>

      {/* Comment Content */}
      {isExpanded && (
        <div className="px-4 py-3">
          <p className="text-[11px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>
      )}
    </div>
  );
}
