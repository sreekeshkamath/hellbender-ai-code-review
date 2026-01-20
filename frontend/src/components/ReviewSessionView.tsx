/**
 * ReviewSessionView Component
 * 
 * This component displays the complete review session including:
 * - Session header with branches and status
 * - File list sidebar
 * - Diff view for selected file
 * - Inline comments
 */

import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  ArrowRight,
  FileText,
  Bug,
  CheckCircle,
  AlertCircle,
  Play,
  RefreshCw,
  Trash2,
  ChevronRight,
  GitBranch,
  Loader2,
} from 'lucide-react';
import { DiffView } from './DiffView';
import { InlineComment } from './InlineComment';
import { ReviewSessionService } from '../services/ReviewSessionService';
import {
  ReviewSession,
  ReviewFile,
  ReviewComment,
  ReviewSessionStatus,
} from '../types/reviewSession.types';

interface ReviewSessionViewProps {
  sessionId: string;
  onDelete?: () => void;
}

export function ReviewSessionView({ sessionId, onDelete }: ReviewSessionViewProps) {
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [selectedFile, setSelectedFile] = useState<ReviewFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch the review session
   */
  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sessionData = await ReviewSessionService.getById(sessionId);
      setSession(sessionData);
      
      // Auto-select first file if none selected
      if (!selectedFile && sessionData.files && sessionData.files.length > 0) {
        setSelectedFile(sessionData.files[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, selectedFile]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  /**
   * Handle running analysis
   */
  const handleRunAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      await ReviewSessionService.runAnalysis(sessionId);
      await fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Get status icon and color
   */
  const getStatusDisplay = (status: ReviewSessionStatus) => {
    switch (status) {
      case 'pending':
        return { icon: <ClockIcon />, color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
      case 'in_progress':
        return { icon: <Loader2 size={14} className="animate-spin" />, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'completed':
        return { icon: <CheckCircle size={14} />, color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'failed':
        return { icon: <AlertCircle size={14} />, color: 'text-red-500', bg: 'bg-red-500/10' };
      default:
        return { icon: null, color: '', bg: '' };
    }
  };

  /**
   * Get score color
   */
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-zinc-500';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-zinc-600" />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[10px]">
        {error}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 text-zinc-500 text-[10px]">
        Session not found
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(session.status);
  const fileComments = selectedFile?.comments || [];

  return (
    <div className="flex h-full">
      {/* Sidebar - File List */}
      <div className="w-64 border-r border-zinc-800 flex flex-col">
        {/* Session Header */}
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">
            Review Session
          </h2>
          <h3 className="text-sm font-bold text-white truncate">{session.name}</h3>
          
          {/* Branches */}
          <div className="flex items-center gap-2 mt-2 text-[10px]">
            <span className="flex items-center gap-1 text-zinc-400">
              <GitBranch size={10} />
              {session.sourceBranch}
            </span>
            <ArrowRight size={10} className="text-zinc-600" />
            <span className="flex items-center gap-1 text-zinc-400">
              <GitBranch size={10} />
              {session.targetBranch}
            </span>
          </div>
          
          {/* Status and Score */}
          <div className="flex items-center gap-3 mt-3">
            <span className={clsx('px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1', statusDisplay.bg, statusDisplay.color)}>
              {statusDisplay.icon}
              {session.status.replace('_', ' ')}
            </span>
            
            {session.overallScore !== null && (
              <span className={clsx('text-lg font-black', getScoreColor(session.overallScore))}>
                {session.overallScore}
              </span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {session.status === 'pending' && (
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-black text-[9px] font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play size={12} />
                    Start Analysis
                  </>
                )}
              </button>
            )}
            
            {session.status === 'completed' && (
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-zinc-700 text-zinc-400 text-[9px] font-black uppercase tracking-wider hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} />
                Re-run
              </button>
            )}
            
            <button
              onClick={onDelete}
              className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
              title="Delete session"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        
        {/* Files List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2 px-2">
            Changed Files ({session.files?.length || 0})
          </div>
          
          {session.files && session.files.length > 0 ? (
            <div className="space-y-1">
              {session.files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={clsx(
                    'w-full flex items-center gap-2 p-2 rounded text-left transition-colors',
                    selectedFile?.id === file.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                  )}
                >
                  <FileText size={12} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] truncate">{file.filePath.split('/').pop()}</div>
                    <div className="text-[8px] text-zinc-600 truncate">{file.filePath}</div>
                  </div>
                  {file.comments && file.comments.length > 0 && (
                    <span className="flex items-center gap-1 text-[9px] text-zinc-500">
                      <Bug size={10} />
                      {file.comments.length}
                    </span>
                  )}
                  {file.score !== null && (
                    <span className={clsx('text-[10px] font-bold', getScoreColor(file.score))}>
                      {file.score}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-[9px] text-zinc-600">
              {session.status === 'completed' ? 'No files analyzed' : 'Run analysis to see files'}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content - Diff View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedFile ? (
          <>
            {/* File Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-zinc-500" />
                <span className="text-[10px] font-black text-white">{selectedFile.filePath}</span>
              </div>
              
              {selectedFile.summary && (
                <p className="text-[9px] text-zinc-500 max-w-md truncate">
                  {selectedFile.summary}
                </p>
              )}
            </div>
            
            {/* Diff View */}
            <div className="flex-1 overflow-auto p-4">
              <DiffView
                diffHunks={selectedFile.diffHunks}
                comments={fileComments}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-[10px] uppercase tracking-wider">Select a file to view changes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Clock icon component
 */
function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default ReviewSessionView;
