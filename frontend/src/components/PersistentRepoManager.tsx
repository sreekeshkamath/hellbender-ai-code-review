/**
 * PersistentRepoManager Component
 * 
 * This component manages persistent repositories with a UI for:
 * - Adding new repositories
 * - Listing existing repositories
 * - Syncing and deleting repositories
 * 
 * Following DESIGN.md styling conventions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  Plus,
  Trash2,
  RefreshCw,
  GitBranch,
  Folder,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { PersistentRepoService } from '../services/PersistentRepoService';
import { PersistentRepository, BranchInfo } from '../types/reviewSession.types';

interface PersistentRepoManagerProps {
  onSelectRepository?: (repository: PersistentRepository) => void;
  selectedRepositoryId?: string;
}

export function PersistentRepoManager({
  onSelectRepository,
  selectedRepositoryId,
}: PersistentRepoManagerProps) {
  const [repositories, setRepositories] = useState<PersistentRepository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoBranch, setNewRepoBranch] = useState('main');
  const [isCloning, setIsCloning] = useState(false);
  
  // Sync state
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /**
   * Fetch all repositories
   */
  const fetchRepositories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const repos = await PersistentRepoService.getAll();
      setRepositories(repos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  /**
   * Handle adding a new repository
   */
  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRepoUrl.trim()) {
      setError('Repository URL is required');
      return;
    }

    try {
      setIsCloning(true);
      setError(null);
      
      await PersistentRepoService.create({
        url: newRepoUrl.trim(),
        name: newRepoName.trim() || undefined,
        branch: newRepoBranch.trim() || 'main',
      });
      
      // Reset form
      setNewRepoUrl('');
      setNewRepoName('');
      setNewRepoBranch('main');
      setShowAddForm(false);
      
      // Refresh list
      await fetchRepositories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add repository');
    } finally {
      setIsCloning(false);
    }
  };

  /**
   * Handle syncing a repository
   */
  const handleSync = async (id: string) => {
    try {
      setSyncingId(id);
      setError(null);
      await PersistentRepoService.sync(id);
      await fetchRepositories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync repository');
    } finally {
      setSyncingId(null);
    }
  };

  /**
   * Handle deleting a repository
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this repository? This will remove it from persistent storage.')) {
      return;
    }

    try {
      setDeletingId(id);
      setError(null);
      await PersistentRepoService.delete(id);
      await fetchRepositories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete repository');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Handle selecting a repository
   */
  const handleSelect = (repo: PersistentRepository) => {
    if (onSelectRepository) {
      onSelectRepository(repo);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
          Persistent Repositories
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors"
        >
          <Plus size={12} />
          Add Repo
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[10px]">
          {error}
        </div>
      )}

      {/* Add Repository Form */}
      {showAddForm && (
        <form onSubmit={handleAddRepo} className="p-4 bg-zinc-900/30 rounded border border-zinc-800">
          <div className="space-y-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                Repository URL
              </label>
              <input
                type="url"
                value={newRepoUrl}
                onChange={(e) => setNewRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded text-white text-[11px] font-mono focus:outline-none focus:border-zinc-600"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="My Repository"
                  className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded text-white text-[11px] focus:outline-none focus:border-zinc-600"
                />
              </div>
              
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  value={newRepoBranch}
                  onChange={(e) => setNewRepoBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded text-white text-[11px] focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCloning}
                className="flex items-center gap-2 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {isCloning ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Cloning...
                  </>
                ) : (
                  <>
                    <Plus size={12} />
                    Add Repository
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Repository List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-zinc-600" />
        </div>
      ) : repositories.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-zinc-800 rounded">
          <Folder size={24} className="mx-auto text-zinc-700 mb-2" />
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
            No persistent repositories
          </p>
          <p className="text-[9px] text-zinc-600 mt-1">
            Add a repository to store it permanently
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              onClick={() => handleSelect(repo)}
              className={clsx(
                'p-3 border rounded transition-all cursor-pointer group',
                selectedRepositoryId === repo.id
                  ? 'border-zinc-600 bg-zinc-800/30'
                  : 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-300 truncate">
                      {repo.name}
                    </h3>
                    {repo.isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1 text-[9px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <GitBranch size={10} />
                      {repo.defaultBranch}
                    </span>
                    <span className="truncate max-w-[150px]" title={repo.url}>
                      {repo.url}
                    </span>
                  </div>
                  
                  {repo.lastSyncedAt && (
                    <p className="text-[8px] text-zinc-600 mt-1">
                      Last synced: {new Date(repo.lastSyncedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSync(repo.id);
                    }}
                    disabled={syncingId === repo.id}
                    className="p-1.5 text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
                    title="Sync repository"
                  >
                    {syncingId === repo.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                  </button>
                  
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                    title="Open in browser"
                  >
                    <ExternalLink size={12} />
                  </a>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(repo.id);
                    }}
                    disabled={deletingId === repo.id}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Delete repository"
                  >
                    {deletingId === repo.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PersistentRepoManager;
