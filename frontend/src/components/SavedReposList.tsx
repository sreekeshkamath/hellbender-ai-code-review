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
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Saved Repositories</h3>
      {repos.length === 0 ? (
        <p className="text-muted-foreground">No saved repositories</p>
      ) : (
        <div className="grid gap-4">
          {repos.map((repo) => (
            <Card key={repo.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{repo.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{repo.url}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{repo.branch}</Badge>
                    {repo.cloned && <Badge variant="secondary">Cloned</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleLoad(repo)}
                      size="sm"
                      variant="default"
                    >
                      Load
                    </Button>
                    <Button
                      onClick={() => handleDelete(repo.id)}
                      size="sm"
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {repo.lastUsed && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last used: {new Date(repo.lastUsed).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}