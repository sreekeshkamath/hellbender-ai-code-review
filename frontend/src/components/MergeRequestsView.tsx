import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  Clock,
  Users,
  Tag,
  Milestone,
  ChevronDown,
  Edit,
  MessageSquare,
  ExternalLink,
  Bot,
  Activity,
  Sparkles,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { usePullRequests } from '../hooks/usePullRequests';
import { useModels } from '../hooks/useModels';
import { PullRequest, Comment } from '../types/api.types';
import { PullRequestService } from '../services/PullRequestService';
import { CommitsTab } from './CommitsTab';
import { ChangesTab } from './ChangesTab';
import { cn } from '../lib/utils';

type Tab = 'Overview' | 'Commits' | 'Pipelines' | 'Changes';

interface MergeRequestsViewProps {
  prId?: string;
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

export function MergeRequestsView({ prId, repoId }: MergeRequestsViewProps = {} as MergeRequestsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isAIReviewing, setIsAIReviewing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { pullRequests, selectedPR, isLoading, error, fetchPRs, selectPR } = usePullRequests(repoId);
  const { selectedModel } = useModels();

  // Fetch PRs on mount
  useEffect(() => {
    fetchPRs();
  }, [fetchPRs]);

  // Select PR by ID if provided, otherwise select first PR
  useEffect(() => {
    if (prId && pullRequests.length > 0) {
      const pr = pullRequests.find(p => p.id === prId);
      if (pr) {
        selectPR(pr);
      }
    } else if (!prId && pullRequests.length > 0 && !selectedPR) {
      selectPR(pullRequests[0]);
    }
  }, [prId, pullRequests, selectedPR, selectPR]);

  // Fetch comments when PR is selected
  const fetchComments = async () => {
    if (selectedPR) {
      setIsLoadingComments(true);
      const service = new PullRequestService();
      try {
        const prComments = await service.getComments(selectedPR.id);
        setComments(prComments);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
        setComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  useEffect(() => {
    fetchComments();
  }, [selectedPR]);

  // Handle AI Review
  const handleAIReview = async () => {
    if (!selectedPR || !selectedModel) {
      return;
    }

    setIsAIReviewing(true);
    try {
      const service = new PullRequestService();
      const result = await service.requestAIReview(selectedPR.id, selectedModel);
      console.log(`AI Review completed: ${result.commentsCreated} comments created from ${result.filesAnalyzed} files`);

      // Refresh comments to show new AI comments
      await fetchComments();
    } catch (error) {
      console.error('AI Review failed:', error);
      alert(`AI Review failed: ${(error as Error).message}`);
    } finally {
      setIsAIReviewing(false);
    }
  };

  const currentPR = selectedPR;

  const Label = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
      {children}
    </h3>
  );

  const MetadataRow = ({ label, value, icon: Icon, onEdit }: { label: string, value: string | React.ReactNode, icon?: any, onEdit?: () => void }) => (
    <div className="py-4 border-b border-zinc-900 group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
        {onEdit && (
          <button className="text-[9px] font-black text-zinc-700 hover:text-white uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
            Edit
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={12} className="text-zinc-600" />}
        <span className="text-[11px] font-mono text-zinc-300">
          {value || 'None'}
        </span>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-[11px] font-mono text-zinc-500">Loading merge requests...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-[11px] font-mono text-red-500">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No PRs state
  if (!currentPR) {
    return (
      <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <GitPullRequest size={48} className="mx-auto text-zinc-700" />
            <p className="text-[11px] font-mono text-zinc-500">No merge requests found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="px-8 py-8 border-b border-zinc-800 bg-zinc-950/20">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white flex items-center gap-4">
              {currentPR.title}
              <span className="text-zinc-700 font-mono italic not-uppercase text-xl">{currentPR.id}</span>
            </h1>
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusBadgeVariant(currentPR.status)} font-black uppercase tracking-widest text-[10px] rounded-sm py-1`}>
                <GitPullRequest size={12} className="mr-1" />
                {getStatusLabel(currentPR.status)}
              </Badge>
              <div className="text-[11px] font-mono text-zinc-500">
                <span className="text-zinc-300">{currentPR.author}</span> requested to merge
                <span className="mx-2 px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded font-mono">
                  {currentPR.sourceBranch}
                </span>
                into
                <span className="mx-2 px-1.5 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded font-mono">
                  {currentPR.targetBranch}
                </span>
                • {formatTimeAgo(currentPR.createdAt)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900">
              <Edit size={14} className="mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="h-9 border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900">
              Code
              <ChevronDown size={14} className="ml-2" />
            </Button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-6 mt-8 flex-wrap">
          <div className="flex items-center gap-6 flex-1 min-w-0 overflow-x-auto">
            {(['Overview', 'Commits', 'Pipelines', 'Changes'] as Tab[]).map((tab) => {
            let count = 0;
            if (tab === 'Overview') count = comments.length;
            if (tab === 'Commits') count = 0; // Will be fetched later
            if (tab === 'Pipelines') count = 0;
            if (tab === 'Changes') count = currentPR.filesChanged?.length || 0;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative
                  ${activeTab === tab ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}
                `}
              >
                {tab}
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === tab ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-zinc-700'}`}>
                  {count}
                </span>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
              </button>
            );
          })}
          </div>
          <div className="flex-1" />
          <div className="flex gap-2 mb-4 flex-shrink-0">
            <Button
              onClick={handleAIReview}
              disabled={isAIReviewing || !selectedModel || currentPR.status !== 'open'}
              className="h-8 bg-primary text-black text-[9px] font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-20 flex items-center gap-2"
            >
              {isAIReviewing ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  <span className="hidden sm:inline">Reviewing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  <span className="hidden sm:inline">AI Review</span>
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className="h-8 border-zinc-800 text-[9px] font-black uppercase tracking-widest hover:bg-zinc-900 hidden sm:flex">
              Add a to-do item
            </Button>
            <Button className="h-8 bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200 hidden sm:flex">
              New Merge Request
            </Button>
            <Button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              variant="outline"
              size="sm"
              className="h-8 border-zinc-800 text-[9px] font-black uppercase tracking-widest hover:bg-zinc-900 lg:hidden"
            >
              <Menu size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'Changes' ? (
          <ChangesTab
            pr={{
              id: currentPR.id,
              repoId: currentPR.repoId,
              sourceBranch: currentPR.sourceBranch,
              targetBranch: currentPR.targetBranch
            }}
          />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              <div className="max-w-4xl space-y-12">
                {activeTab === 'Overview' && (
              <>
                <section>
                  <Label>Description</Label>
                  <div className="mt-4 p-6 border border-zinc-800 bg-zinc-900/30 rounded-lg">
                    <p className="text-sm text-zinc-400 leading-relaxed font-sans whitespace-pre-wrap">
                      {currentPR.description || 'No description provided.'}
                    </p>
                  </div>
                </section>

                <section>
                  <Label>
                    <Activity size={12} />
                    Activity Timeline
                  </Label>
                  <div className="mt-4 space-y-4">
                    {/* PR Created Event */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                        <div className="w-px h-full bg-zinc-800 mt-1" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-mono text-zinc-300 font-bold">{currentPR.author}</span>
                          <span className="text-[11px] font-mono text-zinc-600">created this merge request</span>
                          <span className="text-[10px] font-mono text-zinc-700 ml-auto">
                            {formatTimeAgo(currentPR.createdAt)}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-600">
                          Status: <span className="text-zinc-400">{getStatusLabel(currentPR.status)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Comments */}
                    {isLoadingComments ? (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-zinc-800 mt-1 animate-pulse" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-[11px] font-mono text-zinc-600">Loading comments...</p>
                        </div>
                      </div>
                    ) : comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full mt-1 ${
                              comment.type === 'ai' ? 'bg-primary' : 'bg-zinc-600'
                            }`} />
                            {comment !== comments[comments.length - 1] && (
                              <div className="w-px h-full bg-zinc-800 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-2">
                              {comment.type === 'ai' && <Bot size={12} className="text-primary" />}
                              <span className="text-[11px] font-mono text-zinc-300 font-bold">{comment.author}</span>
                              <span className="text-[11px] font-mono text-zinc-600">
                                {comment.filePath ? 'commented on' : 'commented'}
                              </span>
                              {comment.filePath && (
                                <span className="text-[11px] font-mono text-primary italic">
                                  {comment.filePath}
                                  {comment.line !== undefined && `:${comment.line}`}
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-zinc-700 ml-auto">
                                {formatTimeAgo(comment.createdAt)}
                              </span>
                            </div>
                            <div className="p-4 border border-zinc-800 bg-zinc-950/20 rounded-lg">
                              <p className="text-[11px] font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                {comment.content}
                              </p>
                              {comment.severity && (
                                <div className="mt-2">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                    comment.severity === 'critical' ? 'bg-red-500 text-black' :
                                    comment.severity === 'high' ? 'bg-orange-500 text-black' :
                                    comment.severity === 'medium' ? 'bg-yellow-500 text-black' :
                                    'bg-blue-500 text-black'
                                  }`}>
                                    {comment.severity}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-zinc-800 mt-1" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-[11px] font-mono text-zinc-600 italic">No comments yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {activeTab === 'Commits' && (
              <CommitsTab
                pr={{
                  id: currentPR.id,
                  repoId: currentPR.repoId,
                  sourceBranch: currentPR.sourceBranch,
                  targetBranch: currentPR.targetBranch
                }}
              />
            )}

            {activeTab === 'Pipelines' && (
              <section>
                <Label>Pipelines</Label>
                <div className="mt-4 p-4 border border-zinc-800 bg-zinc-900/30 rounded-lg text-center">
                  <p className="text-[11px] font-mono text-zinc-500 italic">Pipelines tab coming soon</p>
                </div>
              </section>
            )}
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <aside
              className={cn(
                'w-72 border-l border-zinc-800 bg-zinc-950/20 p-6 overflow-y-auto no-scrollbar',
                'transition-transform duration-300 ease-in-out',
                'lg:translate-x-0 lg:static lg:z-auto',
                'fixed top-0 right-0 h-full z-50',
                isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
              )}
            >
              {/* Mobile close button */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden absolute top-4 right-4 p-2 text-zinc-600 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
          <div className="space-y-2">
            <MetadataRow label="Assignee" value={currentPR.author} icon={Users} onEdit={() => {}} />
            <MetadataRow label="Reviewer" value="None" icon={Users} onEdit={() => {}} />
            <MetadataRow label="Labels" value="None" icon={Tag} onEdit={() => {}} />
            <MetadataRow label="Milestone" value="None" icon={Milestone} onEdit={() => {}} />
            <MetadataRow label="Time tracking" value="No estimate or time spent" icon={Clock} />

            <div className="py-6">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4">1 Participant</span>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 uppercase">
                  {currentPR.author.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </aside>
          </>
        )}
      </div>
    </div>
  );
}
