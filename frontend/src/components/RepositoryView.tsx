import { useState, useEffect, useCallback } from 'react';
import { useRepository } from '../hooks/useRepository';
import { useActivityLog } from '../hooks/useActivityLog';
import { useModels } from '../hooks/useModels';
import { SavedRepository } from '../types/api.types';
import { SavedReposService } from '../services/SavedReposService';
import { FileInfo } from '../types/api.types';

interface RepositoryViewProps {
  selectedFiles: string[];
  onSelectionChange: (files: string[]) => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function RepositoryView({ 
  selectedFiles, 
  onSelectionChange,
  selectedModel,
  onModelChange
}: RepositoryViewProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [targetBranch, setTargetBranch] = useState('');
  const [useChangedFiles, setUseChangedFiles] = useState(false);
  const [savedRepos, setSavedRepos] = useState<SavedRepository[]>([]);
  const [showSavedRepos, setShowSavedRepos] = useState(false);
  const [loadingChangedFiles, setLoadingChangedFiles] = useState(false);

  const { clone, sync, isLoading, repoId, files, getFiles, getChangedFiles } = useRepository();
  const { addLog } = useActivityLog();
  const { models, allModels, loading: modelsLoading, searchTerm, setSearchTerm, freeModelId } = useModels();

  const handleLoadChangedFiles = useCallback(async () => {
    if (!repoId || !targetBranch) return;

    setLoadingChangedFiles(true);
    try {
      addLog('info', `Loading changed files between ${targetBranch} and ${branch}...`);
      await getChangedFiles(targetBranch, branch);
      addLog('success', `Loaded changed files`);
    } catch (error) {
      const errorMessage = (error as Error).message;
      addLog('error', `Failed to load changed files: ${errorMessage}`);
    } finally {
      setLoadingChangedFiles(false);
    }
  }, [repoId, targetBranch, branch, getChangedFiles, addLog]);

  // Fetch saved repos on mount
  useEffect(() => {
    const fetchSavedRepos = async () => {
      try {
        const savedReposService = new SavedReposService();
        const fetchedRepos = await savedReposService.getAll();
        setSavedRepos(fetchedRepos);
      } catch (error) {
        console.error('Failed to fetch saved repos:', error);
      }
    };
    fetchSavedRepos();
  }, []);

  // Load changed files when target branch changes (but not on initial mount)
  useEffect(() => {
    if (useChangedFiles && targetBranch && repoId && branch && !loadingChangedFiles) {
      const timer = setTimeout(() => {
        handleLoadChangedFiles();
      }, 500); // Debounce to avoid too many calls
      return () => clearTimeout(timer);
    }
  }, [useChangedFiles, targetBranch, repoId, branch, loadingChangedFiles, handleLoadChangedFiles]);

  const isValidUrl = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/).+/;
    return gitUrlPattern.test(url.trim());
  };

  const handleClone = async () => {
    if (!repoUrl.trim()) {
      addLog('error', 'Please enter a repository URL');
      return;
    }

    if (!isValidUrl(repoUrl)) {
      addLog('error', 'Please enter a valid Git repository URL');
      return;
    }

    try {
      addLog('info', `Cloning repository: ${repoUrl} (branch: ${branch})`);
      const result = await clone(repoUrl, branch);
      addLog('success', result.cached ? 'Repository loaded from cache' : 'Repository cloned successfully');
      addLog('info', `Found ${result.files.length} files`);
      
      // If using changed files mode, load changed files
      if (useChangedFiles && targetBranch) {
        await handleLoadChangedFiles();
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      addLog('error', `═══════════════════════════════════════════════════════`);
      addLog('error', `CLONE ERROR`);
      addLog('error', `───────────────────────────────────────────────────────`);
      addLog('error', errorMessage);
      addLog('error', `═══════════════════════════════════════════════════════`);
    }
  };

  const handleSync = async () => {
    if (!repoId) return;

    try {
      addLog('info', `Syncing repository: ${repoUrl} (branch: ${branch})`);
      await sync(repoUrl, branch);
      addLog('success', 'Repository synced successfully');
      
      // If using changed files mode, reload changed files
      if (useChangedFiles && targetBranch) {
        await handleLoadChangedFiles();
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      addLog('error', `Failed to sync repository: ${errorMessage}`);
    }
  };

  const handleLoadSavedRepo = async (repo: SavedRepository) => {
    setRepoUrl(repo.url);
    setBranch(repo.branch);
    setShowSavedRepos(false);
    addLog('info', `Loading repository: ${repo.name}`);
    
    try {
      const result = await clone(repo.url, repo.branch);
      addLog('success', 'Repository loaded successfully');
      
      // If using changed files mode, load changed files
      if (useChangedFiles && targetBranch) {
        await handleLoadChangedFiles();
      }
    } catch (error) {
      addLog('error', `Failed to load repository: ${(error as Error).message}`);
    }
  };

  const handleDeleteSavedRepo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this repository?')) return;

    try {
      const savedReposService = new SavedReposService();
      await savedReposService.deleteRepo(id);
      setSavedRepos(prev => prev.filter(repo => repo.id !== id));
    } catch (error) {
      console.error('Failed to delete repo:', error);
    }
  };

  const handleFileToggle = (filePath: string) => {
    const newSelection = selectedFiles.includes(filePath)
      ? selectedFiles.filter(f => f !== filePath)
      : [...selectedFiles, filePath];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(files.map(f => f.path));
  };

  const handleSelectNone = () => {
    onSelectionChange([]);
  };

  const displayFiles = files;
  const customModels = models.filter(model => model.provider.toLowerCase() === 'custom');
  const withPinnedFree = freeModelId && !models.some(model => model.id === freeModelId)
    ? [
        ...allModels.filter(model => model.id === freeModelId),
        ...models
      ]
    : models;

  return (
    <div className="space-y-6">
      {/* Repository Configuration Section */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Repository</h3>
        
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
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Current Branch</label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            disabled={isLoading}
            className="w-full bg-zinc-900/50 border border-zinc-800 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all text-zinc-200 placeholder:text-zinc-700"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
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

        {/* Branch Comparison Toggle */}
        <div className="pt-2 border-t border-zinc-900">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="useChangedFiles"
              checked={useChangedFiles}
              onChange={(e) => {
                setUseChangedFiles(e.target.checked);
                if (!e.target.checked) {
                  // Reload all files when disabling changed files mode
                  if (repoId) {
                    getFiles().catch(console.error);
                  }
                }
              }}
              className="w-4 h-4 accent-white"
            />
            <label htmlFor="useChangedFiles" className="text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer">
              Compare with target branch
            </label>
          </div>

          {useChangedFiles && (
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Target Branch</label>
              <input
                type="text"
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                placeholder="main"
                disabled={isLoading || loadingChangedFiles || !repoId}
                className="w-full bg-zinc-900/50 border border-zinc-800 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all text-zinc-200 placeholder:text-zinc-700"
              />
              {loadingChangedFiles && (
                <p className="text-[9px] text-zinc-600 mt-1">Loading changed files...</p>
              )}
            </div>
          )}
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

      {/* Model Selection Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-900">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI Model</h3>
        
        {modelsLoading ? (
          <div className="text-center py-4 opacity-50">
            <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin mx-auto mb-2" />
            <p className="text-[9px] font-mono text-zinc-600">Loading models...</p>
          </div>
        ) : (
          <>
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Search Models</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // If user pastes a full model ID, try to select it automatically
                  if (e.target.value.includes('/') && e.target.value.length > 5) {
                    onModelChange(e.target.value.trim());
                  }
                }}
                placeholder="Search by name or provider..."
                className="w-full bg-zinc-900/50 border border-zinc-800 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all text-zinc-200 placeholder:text-zinc-700"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Select Model</label>
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-zinc-500 transition-all text-zinc-200"
              >
                <option value="" className="bg-zinc-950">Choose a model...</option>
                {withPinnedFree.map((model) => (
                  <option key={model.id} value={model.id} className="bg-zinc-950">
                    {model.name} ({model.provider}){model.id === freeModelId ? ' • Free' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedModel && (
              <div className="flex items-center gap-2 px-3 py-2 rounded border border-white bg-white text-black">
                <div className="w-1.5 h-1.5 rounded-full bg-black" />
                <span className="text-[10px] font-mono truncate">
                  Active: {allModels.find(m => m.id === selectedModel)?.name || selectedModel}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* File Selection Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-900">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            Files ({displayFiles.length})
            {useChangedFiles && targetBranch && (
              <span className="text-zinc-600 ml-2">(Changed vs {targetBranch})</span>
            )}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={handleSelectAll}
              disabled={displayFiles.length === 0}
              className="px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-zinc-800 text-zinc-600 hover:border-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-30"
            >
              All
            </button>
            <button
              onClick={handleSelectNone}
              disabled={selectedFiles.length === 0}
              className="px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-zinc-800 text-zinc-600 hover:border-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-30"
            >
              None
            </button>
          </div>
        </div>

        {!repoId ? (
          <div className="text-center py-12 opacity-50">
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
              <span className="text-lg">📂</span>
            </div>
            <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-tight">No Repository Loaded</p>
            <p className="text-[9px] text-zinc-800 font-mono mt-1">Connect a repo to select files</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto no-scrollbar border border-zinc-900 bg-zinc-950/50 rounded p-1">
            {isLoading || loadingChangedFiles ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin" />
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-tight animate-pulse">
                  {loadingChangedFiles ? 'Loading changed files...' : 'Scanning files...'}
                </p>
              </div>
            ) : displayFiles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[9px] font-mono text-zinc-800 italic uppercase tracking-tight">
                  {useChangedFiles ? 'No changed files found' : 'No files found in repository'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {displayFiles.map((file) => (
                  <div
                    key={file.path}
                    onClick={() => handleFileToggle(file.path)}
                    className={`
                      flex items-center space-x-3 p-2 cursor-pointer transition-all duration-200 group border-l-2
                      ${selectedFiles.includes(file.path)
                        ? 'bg-white text-black border-white'
                        : 'hover:bg-zinc-900 text-zinc-500 border-transparent'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.path)}
                      onChange={() => handleFileToggle(file.path)}
                      className="w-3 h-3 accent-white"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-mono truncate ${selectedFiles.includes(file.path) ? 'text-black' : 'text-zinc-400'}`}>
                        {file.path}
                      </p>
                      <p className={`text-[9px] font-mono tabular-nums ${selectedFiles.includes(file.path) ? 'text-zinc-800' : 'text-zinc-700'}`}>
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 rounded border border-white bg-white text-black">
            <span className="text-[9px] font-black uppercase tracking-widest">Selected</span>
            <span className="text-[10px] font-mono font-bold">{selectedFiles.length}</span>
          </div>
        )}
      </div>

      {/* Saved Repositories Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-900">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Saved Repositories</h3>
          <button
            onClick={() => setShowSavedRepos(!showSavedRepos)}
            className="px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-zinc-800 text-zinc-600 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showSavedRepos ? 'Hide' : 'Show'}
          </button>
        </div>

        {showSavedRepos && (
          <div className="max-h-[200px] overflow-y-auto no-scrollbar border border-zinc-900 bg-zinc-950/50 rounded p-2 space-y-2">
            {savedRepos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-tight">No saved repositories</p>
              </div>
            ) : (
              savedRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="group relative p-3 rounded border border-zinc-900 bg-zinc-950 hover:border-zinc-700 transition-all duration-300"
                >
                  <div className="flex flex-col gap-2">
                    <div className="min-w-0">
                      <h4 className="text-[10px] font-mono truncate text-zinc-300 group-hover:text-white transition-colors">{repo.name}</h4>
                      <p className="text-[9px] text-zinc-700 font-mono truncate uppercase tracking-tighter mt-0.5">{repo.url}</p>
                    </div>

                    <div className="flex items-center justify-between">
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
                          onClick={() => handleLoadSavedRepo(repo)}
                          className="px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-zinc-800 text-zinc-500 hover:border-white hover:text-white transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteSavedRepo(repo.id)}
                          className="px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-zinc-800 text-zinc-500 hover:border-red-600 hover:text-red-400 transition-colors"
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
