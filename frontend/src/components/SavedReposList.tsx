import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { SavedRepository } from '../types/api.types';
import { SavedReposService } from '../services/SavedReposService';

interface SavedReposListProps {
  onLoad: (repo: SavedRepository) => void;
}

export function SavedReposList({ onLoad }: SavedReposListProps) {
  const [repos, setRepos] = useState<SavedRepository[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const savedReposService = new SavedReposService();
      const fetchedRepos = await savedReposService.getAll();
      setRepos(fetchedRepos);
    } catch (error) {
      console.error('Failed to fetch saved repos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this repository?')) return;

    try {
      const savedReposService = new SavedReposService();
      await savedReposService.deleteRepo(id);
      setRepos(prev => prev.filter(repo => repo.id !== id));
    } catch (error) {
      console.error('Failed to delete repo:', error);
    }
  };

  const handleLoad = (repo: SavedRepository) => {
    onLoad(repo);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3 opacity-50">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Accessing Archive</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {repos.length === 0 ? (
        <div className="text-center py-8 rounded border border-zinc-900 bg-zinc-950">
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-tight">No saved archives</p>
        </div>
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="group relative p-3 rounded border border-zinc-900 bg-zinc-950 hover:border-zinc-700 transition-all duration-300 overflow-hidden"
            >
              <div className="flex flex-col gap-2 relative z-10">
                <div className="min-w-0">
                  <h4 className="text-[10px] font-mono truncate text-zinc-300 group-hover:text-white transition-colors">{repo.name}</h4>
                  <p className="text-[9px] text-zinc-700 font-mono truncate uppercase tracking-tighter mt-0.5">{repo.url}</p>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-mono px-1 py-0.5 bg-zinc-800 text-zinc-400 uppercase tracking-tighter">
                      {repo.branch}
                    </span>
                    {repo.cloned && (
                      <span className="text-[8px] font-mono px-1 py-0.5 bg-green-900 text-green-400 uppercase tracking-tighter">
                        Local
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleLoad(repo)}
                      className="px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-zinc-800 text-zinc-500 hover:border-white hover:text-white transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(repo.id)}
                      className="px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-zinc-800 text-zinc-500 hover:border-red-600 hover:text-red-400 transition-colors"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
