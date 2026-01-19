import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRepository } from '../hooks/useRepository';
import { useActivityLog } from '../hooks/useActivityLog';

/**
 * Sanitizes a repository URL by removing any embedded credentials.
 * Returns a redacted URL safe for logging.
 */
function sanitizeRepoUrl(repoUrl: string): string {
  try {
    const url = new URL(repoUrl.replace(/^git@/, 'https://').replace(/:/, '/'));
    // Remove username and password from URL
    url.username = '';
    url.password = '';
    return url.toString().replace(/^https:\/\//, repoUrl.includes('git@') ? 'git@' : 'https://');
  } catch {
    // If URL parsing fails, use regex to remove userinfo
    return repoUrl.replace(/:\/\/[^@]+@/, '://***@');
  }
}

export function RepositoryConfig() {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const { clone, sync, isLoading, repoId } = useRepository();
  const { addLog } = useActivityLog();

  const handleClone = async () => {
    console.log('handleClone called', { repoUrl, branch, isValid: isValidUrl(repoUrl) });
    if (!repoUrl.trim()) {
      console.warn('Clone aborted: empty repoUrl');
      const errorMsg = 'Please enter a repository URL';
      addLog('error', errorMsg);
      return;
    }

    if (!isValidUrl(repoUrl)) {
      console.warn('Clone aborted: invalid URL', repoUrl);
      const errorMsg = 'Please enter a valid Git repository URL';
      addLog('error', errorMsg);
      return;
    }

    try {
      const sanitizedUrl = sanitizeRepoUrl(repoUrl);
      addLog('info', `Cloning repository: ${sanitizedUrl} (branch: ${branch})`);
      console.log('Starting clone...', { repoUrl: sanitizedUrl, branch });
      const result = await clone(repoUrl, branch);
      console.log('Clone successful:', result);
      addLog('success', result.cached ? 'Repository loaded from cache' : 'Repository cloned successfully');
      addLog('info', `Found ${result.files.length} files`);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('Clone failed:', error);
      
      // Check if it's a branch error and display it prominently
      const isBranchError = errorMessage.toLowerCase().includes('branch') && 
                           (errorMessage.toLowerCase().includes('not found') || 
                            errorMessage.toLowerCase().includes('does not exist') ||
                            errorMessage.toLowerCase().includes('could not find'));
      
      if (isBranchError) {
        addLog('error', `═══════════════════════════════════════════════════════`);
        addLog('error', `CLONE ERROR: Branch Not Found`);
        addLog('error', `───────────────────────────────────────────────────────`);
        addLog('error', errorMessage);
        addLog('error', `═══════════════════════════════════════════════════════`);
      } else {
        addLog('error', `═══════════════════════════════════════════════════════`);
        addLog('error', `CLONE ERROR`);
        addLog('error', `───────────────────────────────────────────────────────`);
        addLog('error', errorMessage);
        addLog('error', `═══════════════════════════════════════════════════════`);
      }
    }
  };

  const handleSync = async () => {
    if (!repoId) return;

    try {
      const sanitizedUrl = sanitizeRepoUrl(repoUrl);
      addLog('info', `Syncing repository: ${sanitizedUrl} (branch: ${branch})`);
      await sync(repoUrl, branch);
      addLog('success', 'Repository synced successfully');
    } catch (error) {
      const errorMessage = (error as Error).message;
      const isBranchError = errorMessage.toLowerCase().includes('branch') && 
                           (errorMessage.toLowerCase().includes('not found') || 
                            errorMessage.toLowerCase().includes('does not exist'));
      
      if (isBranchError) {
        addLog('error', `Branch Error: ${errorMessage}`);
      } else {
        addLog('error', `Failed to sync repository: ${errorMessage}`);
      }
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
            onChange={(e) => {
              setRepoUrl(e.target.value);
            }}
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
            onChange={(e) => {
              setBranch(e.target.value);
            }}
            placeholder="main"
            disabled={isLoading}
            className="w-full bg-zinc-900/50 border border-zinc-800 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all text-zinc-200 placeholder:text-zinc-700"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            console.log('Clone button clicked');
            handleClone();
          }}
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
