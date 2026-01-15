import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRepository } from '../hooks/useRepository';
import { useActivityLog } from '../hooks/useActivityLog';

export function RepositoryConfig() {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const { clone, sync, isLoading, repoId } = useRepository();
  const { addLog } = useActivityLog();

  const handleClone = async () => {
    if (!repoUrl.trim()) return;

    try {
      addLog('info', `Cloning repository: ${repoUrl}`);
      await clone(repoUrl, branch);
      addLog('success', 'Repository cloned successfully');
    } catch (error) {
      addLog('error', `Failed to clone repository: ${(error as Error).message}`);
    }
  };

  const handleSync = async () => {
    if (!repoId) return;

    try {
      addLog('info', `Syncing repository: ${repoUrl}`);
      await sync(repoUrl, branch);
      addLog('success', 'Repository synced successfully');
    } catch (error) {
      addLog('error', `Failed to sync repository: ${(error as Error).message}`);
    }
  };

  const isValidUrl = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/).+/;
    return gitUrlPattern.test(url.trim());
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Repository Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground ml-1">
            Repository URL
          </label>
          <Input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            disabled={isLoading}
            className="bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground ml-1">
            Branch
          </label>
          <Input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            disabled={isLoading}
            className="bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleClone}
            disabled={!repoUrl.trim() || !isValidUrl(repoUrl) || isLoading}
            className="flex-1 shadow-sm"
            size="sm"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Cloning...
              </span>
            ) : 'Clone Repo'}
          </Button>

          <Button
            onClick={handleSync}
            disabled={!repoId || !repoUrl.trim() || !isValidUrl(repoUrl) || isLoading}
            variant="outline"
            className="flex-1 bg-background/50"
            size="sm"
          >
            {isLoading ? 'Syncing...' : 'Sync Repo'}
          </Button>
        </div>

        {repoId && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-500/10 border border-green-500/20 text-green-500 animate-in">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-medium truncate">
              Connected: {repoId.split('-')[0]}...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
