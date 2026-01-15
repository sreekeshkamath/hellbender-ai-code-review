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
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Repository URL</label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            disabled={isLoading}
            className="w-full bg-zinc-900/50 border border-zinc-800 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all text-zinc-200 placeholder:text-zinc-700"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Branch</label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            disabled={isLoading}
            className="w-full bg-zinc-900/50 border border-zinc-800 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all text-zinc-200 placeholder:text-zinc-700"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleClone}
          disabled={!repoUrl.trim() || !isValidUrl(repoUrl) || isLoading}
          className="flex-1 bg-white text-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-colors disabled:opacity-20 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border-2 border-black border-t-transparent animate-spin" />
              <span>Cloning...</span>
            </>
          ) : (
            <span>Clone Repo</span>
          )}
        </button>

        <button
          onClick={handleSync}
          disabled={!repoId || !repoUrl.trim() || !isValidUrl(repoUrl) || isLoading}
          className="flex-1 border border-zinc-800 bg-transparent px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:border-white transition-colors disabled:opacity-50 text-zinc-500"
        >
          {isLoading ? 'Syncing...' : 'Sync Repo'}
        </button>
      </div>

      {repoId && (
        <div className="flex items-center gap-2 px-3 py-2 rounded border border-green-800 bg-green-900/20 text-green-400">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-mono truncate">
            Connected: {repoId.split('-')[0]}...
          </span>
        </div>
      )}
    </div>
  );
}
