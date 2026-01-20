/**
 * InlineComment Component
 * 
 * This component displays an inline AI comment below a code line,
 * following the GitLab-style design pattern with severity indicators.
 */

import React from 'react';
import { clsx } from 'clsx';
import { ReviewComment } from '../types/reviewSession.types';
import { AlertCircle, AlertTriangle, Info, CheckCircle, HelpCircle, Lightbulb } from 'lucide-react';

interface InlineCommentProps {
  comment: ReviewComment;
  isExpanded?: boolean;
  onToggle?: () => void;
}

/**
 * Get severity color class
 */
function getSeverityColor(severity: ReviewComment['severity']): string {
  switch (severity) {
    case 'critical':
      return 'border-l-red-500 bg-red-500/5';
    case 'error':
      return 'border-l-orange-500 bg-orange-500/5';
    case 'warning':
      return 'border-l-yellow-500 bg-yellow-500/5';
    case 'info':
    default:
      return 'border-l-blue-500 bg-blue-500/5';
  }
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: ReviewComment['severity']) {
  switch (severity) {
    case 'critical':
      return <AlertCircle size={14} className="text-red-500" />;
    case 'error':
      return <AlertCircle size={14} className="text-orange-500" />;
    case 'warning':
      return <AlertTriangle size={14} className="text-yellow-500" />;
    case 'info':
    default:
      return <Info size={14} className="text-blue-500" />;
  }
}

/**
 * Get comment type icon
 */
function getCommentTypeIcon(type: ReviewComment['commentType']) {
  switch (type) {
    case 'issue':
      return <AlertCircle size={12} />;
    case 'suggestion':
      return <Lightbulb size={12} />;
    case 'praise':
      return <CheckCircle size={12} />;
    case 'question':
      return <HelpCircle size={12} />;
    case 'todo':
      return <CheckCircle size={12} />;
    default:
      return <Info size={12} />;
  }
}

/**
 * Get comment type badge color
 */
function getTypeBadgeColor(type: ReviewComment['commentType']): string {
  switch (type) {
    case 'issue':
      return 'bg-red-500/20 text-red-400';
    case 'suggestion':
      return 'bg-purple-500/20 text-purple-400';
    case 'praise':
      return 'bg-green-500/20 text-green-400';
    case 'question':
      return 'bg-blue-500/20 text-blue-400';
    case 'todo':
      return 'bg-yellow-500/20 text-yellow-400';
    default:
      return 'bg-zinc-500/20 text-zinc-400';
  }
}

export function InlineComment({
  comment,
  isExpanded = true,
  onToggle,
}: InlineCommentProps) {
  const severityColor = getSeverityColor(comment.severity);
  const severityIcon = getSeverityIcon(comment.severity);
  const typeBadgeColor = getTypeBadgeColor(comment.commentType);

  return (
    <div
      className={clsx(
        'rounded-md border-l-2 pl-3 py-2 transition-all',
        severityColor
      )}
    >
      {/* Header with severity and type */}
      <div className="flex items-center gap-2 mb-2">
        {severityIcon}
        <span
          className={clsx(
            'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
            typeBadgeColor
          )}
        >
          {comment.commentType}
        </span>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
          Line {comment.lineNumber}
        </span>
      </div>

      {/* Message */}
      <div className="text-zinc-300 text-[10px] leading-relaxed mb-2">
        {comment.message}
      </div>

      {/* Code snippet (if available) */}
      {comment.codeSnippet && (
        <div className="mb-2">
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">
            Code
          </div>
          <pre className="bg-zinc-900/50 rounded p-2 text-[10px] text-zinc-400 overflow-x-auto">
            {comment.codeSnippet}
          </pre>
        </div>
      )}

      {/* Suggestion (if available) */}
      {comment.suggestion && (
        <div>
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">
            Suggestion
          </div>
          <pre className="bg-green-900/10 border border-green-500/20 rounded p-2 text-[10px] text-green-400 overflow-x-auto">
            {comment.suggestion}
          </pre>
        </div>
      )}
    </div>
  );
}

export default InlineComment;
