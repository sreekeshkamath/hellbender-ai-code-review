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
    <Card>
      <CardHeader>
        <CardTitle>Repository Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Repository URL
          </label>
          <Input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Branch
          </label>
          <Input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleClone}
            disabled={!repoUrl.trim() || !isValidUrl(repoUrl) || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Cloning...' : 'Clone Repository'}
          </Button>

          <Button
            onClick={handleSync}
            disabled={!repoId || !repoUrl.trim() || !isValidUrl(repoUrl) || isLoading}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? 'Syncing...' : 'Sync Repository'}
          </Button>
        </div>

        {repoId && (
          <p className="text-sm text-green-600">
            Repository loaded (ID: {repoId})
          </p>
        )}
      </CardContent>
    </Card>
  );
}