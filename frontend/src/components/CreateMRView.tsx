import React, { useState, useEffect } from 'react';
import { GitBranch, GitPullRequest, FileCode, Loader2, Database, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { RepositoryService } from '../services/RepositoryService';
import { PullRequestService } from '../services/PullRequestService';
import { SavedReposService } from '../services/SavedReposService';
import { SavedRepository, FileDiff } from '../types/api.types';
import { cn } from '../lib/utils';

interface ClonedRepo {
  repoId: string;
  repoUrl: string;
  branch: string;
}

interface CreateMRViewProps {
  onBack: () => void;
  onCreated: () => void;
  initialRepoId?: string | null;
}

export function CreateMRView({ onBack, onCreated, initialRepoId }: CreateMRViewProps) {
  const [repoId, setRepoId] = useState(initialRepoId || '');
  const [sourceBranch, setSourceBranch] = useState('');
  const [targetBranch, setTargetBranch] = useState('main');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [savedRepos, setSavedRepos] = useState<SavedRepository[]>([]);
  const [clonedRepos, setClonedRepos] = useState<ClonedRepo[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [diffPreview, setDiffPreview] = useState<FileDiff[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repoService = new RepositoryService();
  const prService = new PullRequestService();
  const savedReposService = new SavedReposService();

  // Load repositories on mount
  useEffect(() => {
    setIsLoadingRepos(true);
    Promise.all([
      savedReposService.getAll(),
      repoService.getAllCloned()
    ])
      .then(([saved, cloned]) => {
        setSavedRepos(saved);
        setClonedRepos(cloned.repos);

        // If initialRepoId was provided, set it
        if (initialRepoId) {
          setRepoId(initialRepoId);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingRepos(false));
  }, [initialRepoId]);

  // Load branches when repoId changes
  useEffect(() => {
    if (repoId) {
      setIsLoadingBranches(true);
      setError(null);
      repoService
        .getBranches(repoId)
        .then((response) => {
          setBranches(response.branches);
          if (response.branches.length > 0) {
            // Set source branch to something other than main if possible, otherwise first branch
            const defaultSource = response.branches.find(b => b !== 'main' && b !== 'master') || response.branches[0];
            setSourceBranch(prev => prev || defaultSource);

            // Set target branch to main/master if available
            const defaultTarget = response.branches.find(b => b === 'main' || b === 'master') || response.branches[0];
            setTargetBranch(prev => prev || defaultTarget);
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to load branches');
          setBranches([]);
        })
        .finally(() => setIsLoadingBranches(false));
    } else {
      setBranches([]);
    }
  }, [repoId]);

  // Load diff preview when branches are selected
  useEffect(() => {
    if (repoId && sourceBranch && targetBranch && sourceBranch !== targetBranch) {
      setIsLoadingDiff(true);
      setError(null);
      prService
        .getDiff(repoId, sourceBranch, targetBranch)
        .then((diffs) => {
          setDiffPreview(diffs);
        })
        .catch((err) => {
          console.error('Failed to load diff:', err);
          setDiffPreview([]);
        })
        .finally(() => setIsLoadingDiff(false));
    } else {
      setDiffPreview([]);
    }
  }, [repoId, sourceBranch, targetBranch]);

  const handleCreate = async () => {
    if (!repoId || !sourceBranch || !targetBranch || !title.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (sourceBranch === targetBranch) {
      setError('Source and target branches must be different');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await prService.create({
        repoId,
        title: title.trim(),
        description: description.trim(),
        sourceBranch,
        targetBranch,
        status: 'open',
        author: 'current-user', // TODO: Get from auth context
        filesChanged: diffPreview.map((d) => d.filePath),
        isCloned: false,
        clonedPrIds: []
      });

      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create merge request');
    } finally {
      setIsCreating(false);
    }
  };

  const selectedRepo = savedRepos.find((r) => r.repoId === repoId);
  const clonedInfo = clonedRepos.find(r => r.repoId === repoId);

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="px-8 py-6 border-b border-zinc-800 bg-zinc-950/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-zinc-400 hover:text-white">
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-zinc-800 mx-2" />
          <h1 className="text-xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
            <GitPullRequest size={20} className="text-primary" />
            New Merge Request
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest border-zinc-800 hover:bg-zinc-900">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !repoId || !sourceBranch || !targetBranch || !title.trim() || sourceBranch === targetBranch}
            className="bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200"
          >
            {isCreating ? (
              <>
                <Loader2 size={12} className="animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 size={12} className="mr-2" />
                Create Merge Request
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Details</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. FIX: Implement secure entropy for session validation"
                    className="w-full bg-zinc-900/50 border-zinc-800 focus:border-zinc-600 text-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this merge request does..."
                    className="w-full min-h-[200px] p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm font-mono text-zinc-300 focus:border-zinc-600 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Changes Preview Section */}
            {repoId && sourceBranch && targetBranch && sourceBranch !== targetBranch && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Changes Preview</h2>
                  <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 text-zinc-500">
                    {diffPreview.length} files changed
                  </Badge>
                </div>
                <div className="border border-zinc-800 rounded-lg bg-zinc-950/20 overflow-hidden">
                  {isLoadingDiff ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-4">
                      <Loader2 size={24} className="animate-spin text-primary" />
                      <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Calculating comparison...</p>
                    </div>
                  ) : diffPreview.length > 0 ? (
                    <div className="divide-y divide-zinc-900">
                      {diffPreview.map((diff) => (
                        <div key={diff.filePath} className="p-4 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileCode size={14} className="text-zinc-600 flex-shrink-0" />
                            <span className="text-[11px] font-mono text-zinc-300 truncate">{diff.filePath}</span>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-mono text-green-500">+{diff.additions}</span>
                              <span className="text-[10px] font-mono text-red-500">-{diff.deletions}</span>
                            </div>
                            <div className="w-24 h-1.5 bg-zinc-900 rounded-full overflow-hidden flex">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${(diff.additions / (diff.additions + diff.deletions || 1)) * 100}%` }}
                              />
                              <div
                                className="h-full bg-red-500"
                                style={{ width: `${(diff.deletions / (diff.additions + diff.deletions || 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 flex flex-col items-center justify-center gap-4">
                      <FileCode size={32} className="text-zinc-800" />
                      <p className="text-[11px] font-mono text-zinc-600">No changes detected between selected branches.</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar / Configuration */}
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Configuration</h2>
              <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-950/20 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Repository</label>
                  {isLoadingRepos ? (
                    <div className="h-10 w-full animate-pulse bg-zinc-900 rounded border border-zinc-800" />
                  ) : (
                    <select
                      value={repoId}
                      onChange={(e) => setRepoId(e.target.value)}
                      className="w-full h-10 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-[11px] font-mono text-zinc-300 focus:border-zinc-600 focus:outline-none"
                    >
                      <option value="">Select a repository</option>
                      {clonedRepos.length > 0 && (
                        <optgroup label="Cloned Repositories">
                          {clonedRepos.map((repo) => (
                            <option key={`cloned-${repo.repoId}`} value={repo.repoId}>
                              {repo.repoUrl.split('/').pop()?.replace('.git', '')} ({repo.branch})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {savedRepos.filter(r => r.repoId && !clonedRepos.some(cr => cr.repoId === r.repoId)).length > 0 && (
                        <optgroup label="Saved Repositories">
                          {savedRepos.filter(r => r.repoId && !clonedRepos.some(cr => cr.repoId === r.repoId)).map((repo) => (
                            <option key={`saved-${repo.id}`} value={repo.repoId || ''}>
                              {repo.name || repo.url.split('/').pop()?.replace('.git', '')} ({repo.branch})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  )}
                  {(selectedRepo || clonedInfo) && (
                    <div className="mt-2 p-3 bg-zinc-900/30 border border-zinc-800 rounded text-[10px] font-mono text-zinc-500 truncate">
                      ID: {repoId}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Source Branch</label>
                  {isLoadingBranches ? (
                    <div className="h-10 w-full animate-pulse bg-zinc-900 rounded border border-zinc-800" />
                  ) : (
                    <select
                      value={sourceBranch}
                      onChange={(e) => setSourceBranch(e.target.value)}
                      className="w-full h-10 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-[11px] font-mono text-zinc-300 focus:border-zinc-600 focus:outline-none"
                    >
                      <option value="">Select source</option>
                      {branches.map((branch) => (
                        <option key={`source-${branch}`} value={branch} disabled={branch === targetBranch}>
                          {branch} {branch === targetBranch ? '(Already Target)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Target Branch</label>
                  {isLoadingBranches ? (
                    <div className="h-10 w-full animate-pulse bg-zinc-900 rounded border border-zinc-800" />
                  ) : (
                    <select
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      className="w-full h-10 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded text-[11px] font-mono text-zinc-300 focus:border-zinc-600 focus:outline-none"
                    >
                      <option value="">Select target</option>
                      {branches.map((branch) => (
                        <option key={`target-${branch}`} value={branch} disabled={branch === sourceBranch}>
                          {branch} {branch === sourceBranch ? '(Already Source)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-[11px] font-mono text-red-400">
                    {error}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Summary</h2>
              <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-950/20 space-y-4">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">Files to review</span>
                  <span className="text-zinc-300">{diffPreview.length}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">Total Additions</span>
                  <span className="text-green-500">+{diffPreview.reduce((acc, d) => acc + d.additions, 0)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">Total Deletions</span>
                  <span className="text-red-500">-{diffPreview.reduce((acc, d) => acc + d.deletions, 0)}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
