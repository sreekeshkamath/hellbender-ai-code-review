/**
 * ReviewSessionList Component
 * 
 * This component displays a list of review sessions with their status,
 * branches, and scores.
 */

import React from 'react';
import { clsx } from 'clsx';
import {
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Trash2,
  GitBranch,
  Bug,
  Loader2,
} from 'lucide-react';
import { ReviewSession, ReviewSessionStatus } from '../types/reviewSession.types';

interface ReviewSessionListProps {
  sessions: ReviewSession[];
  onSelect: (session: ReviewSession) => void;
  onDelete: (session: ReviewSession) => void;
  onRunAnalysis: (session: ReviewSession) => void;
}

export function ReviewSessionList({
  sessions,
  onSelect,
  onDelete,
  onRunAnalysis,
}: ReviewSessionListProps) {
  /**
   * Get status icon and color
   */
  const getStatusDisplay = (status: ReviewSessionStatus) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock size={12} />, color: 'text-zinc-500', label: 'Pending' };
      case 'in_progress':
        return { icon: <Loader2 size={12} className="animate-spin" />, color: 'text-blue-500', label: 'Analyzing' };
      case 'completed':
        return { icon: <CheckCircle size={12} />, color: 'text-green-500', label: 'Completed' };
      case 'failed':
        return { icon: <AlertCircle size={12} />, color: 'text-red-500', label: 'Failed' };
      default:
        return { icon: null, color: '', label: status };
    }
  };

  /**
   * Get score color
   */
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-zinc-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  /**
   * Get comment count for a session
   */
  const getCommentCount = (session: ReviewSession): number => {
    return session.files?.reduce((sum, f) => sum + (f.comments?.length || 0), 0) || 0;
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-zinc-800 rounded">
        <Play size={24} className="mx-auto text-zinc-700 mb-2" />
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
          No review sessions
        </p>
        <p className="text-[9px] text-zinc-600 mt-1">
          Create a review session to compare branches
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const statusDisplay = getStatusDisplay(session.status);
        const commentCount = getCommentCount(session);
        const fileCount = session.files?.length || 0;

        return (
          <div
            key={session.id}
            className="p-4 border border-zinc-800 bg-zinc-900/20 rounded hover:border-zinc-700 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
                    {session.name}
                  </h3>
                  <span className={clsx('flex items-center gap-1 text-[9px]', statusDisplay.color)}>
                    {statusDisplay.icon}
                    {statusDisplay.label}
                  </span>
                </div>
                
                {/* Branches */}
                <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <GitBranch size={10} />
                    {session.sourceBranch}
                  </span>
                  <ArrowRight size={10} className="text-zinc-600" />
                  <span className="flex items-center gap-1">
                    <GitBranch size={10} />
                    {session.targetBranch}
                  </span>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-4 mt-2 text-[9px] text-zinc-600">
                  <span>{fileCount} files</span>
                  {commentCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Bug size={10} />
                      {commentCount} comments
                    </span>
                  )}
                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Score and Actions */}
              <div className="flex items-center gap-3">
                {session.overallScore !== null && (
                  <div className="text-center">
                    <div className={clsx('text-2xl font-black', getScoreColor(session.overallScore))}>
                      {session.overallScore}
                    </div>
                    <div className="text-[8px] text-zinc-600 uppercase tracking-wider">Score</div>
                  </div>
                )}
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {session.status === 'pending' && (
                    <button
                      onClick={() => onRunAnalysis(session)}
                      className="p-2 text-zinc-500 hover:text-white transition-colors"
                      title="Start analysis"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  
                  {session.status === 'completed' && (
                    <button
                      onClick={() => onRunAnalysis(session)}
                      className="p-2 text-zinc-500 hover:text-white transition-colors"
                      title="Re-run analysis"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => onDelete(session)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Delete session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Click to view */}
            <button
              onClick={() => onSelect(session)}
              className="w-full mt-3 py-2 text-[9px] font-black uppercase tracking-wider text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50 rounded transition-colors"
            >
              View Review →
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ReviewSessionList;
