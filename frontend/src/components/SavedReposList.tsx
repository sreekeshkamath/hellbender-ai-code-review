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
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Saved Repositories
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {repos.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed bg-muted/20">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No saved archives</p>
          </div>
        ) : (
          <div className="space-y-3">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="group relative p-3 rounded-xl border bg-card/50 hover:bg-muted/50 transition-all duration-300 overflow-hidden"
              >
                <div className="flex flex-col gap-2 relative z-10">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate group-hover:text-primary transition-colors">{repo.name}</h4>
                    <p className="text-[9px] text-muted-foreground font-mono truncate opacity-60 uppercase tracking-tighter mt-0.5">{repo.url}</p>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[8px] h-3 px-1 leading-none font-black uppercase tracking-tighter">
                        {repo.branch}
                      </Badge>
                      {repo.cloned && (
                        <Badge variant="secondary" className="text-[8px] h-3 px-1 leading-none font-black uppercase tracking-tighter bg-green-500/10 text-green-500 border-green-500/20">
                          Local
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => handleLoad(repo)}
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[9px] font-bold uppercase tracking-widest hover:bg-primary/20 hover:text-primary"
                      >
                        Load
                      </Button>
                      <Button
                        onClick={() => handleDelete(repo.id)}
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[9px] font-bold uppercase tracking-widest hover:bg-destructive/20 hover:text-destructive"
                      >
                        Del
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
