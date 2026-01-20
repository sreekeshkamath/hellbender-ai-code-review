/**
 * App Layout Component
 * 
 * Main application layout with navigation between different views:
 * - Quick Review (existing functionality)
 * - Persistent Repositories
 * - Review Sessions
 */

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  Settings,
  Play,
  RefreshCw,
  Code,
  Bug,
  GitBranch,
  Folder,
  History,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { ActivityLog } from './components/ActivityLog';
import { RepositoryView } from './components/RepositoryView';
import { AnalysisResults } from './components/AnalysisResults';
import { LoadingOverlay } from './components/LoadingOverlay';
import { PersistentRepoManager } from './components/PersistentRepoManager';
import { ReviewSessionView } from './components/ReviewSessionView';
import { ReviewSessionList } from './components/ReviewSessionList';
import { BranchSelector } from './components/BranchSelector';
import { useActivityLog } from './hooks/useActivityLog';
import { useModels } from './hooks/useModels';
import { useRepository } from './hooks/useRepository';
import { useAnalysis } from './hooks/useAnalysis';
import { useReviewSession } from './hooks/useReviewSession';
import { PersistentRepository, ReviewSession, CreateReviewSessionRequest } from './types/reviewSession.types';

type ViewType = 'quick-review' | 'persistent-repos' | 'review-sessions' | 'create-review';

function App() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [consoleHeight, setConsoleHeight] = useState(192);
  const [isResizing, setIsResizing] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('quick-review');
  
  // Persistent repo state
  const [selectedRepository, setSelectedRepository] = useState<PersistentRepository | null>(null);
  
  // Review session state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [createSessionData, setCreateSessionData] = useState({
    repositoryId: '',
    sourceBranch: '',
    targetBranch: '',
    name: '',
  });

  const { addLog } = useActivityLog();
  const { selectedModel, setSelectedModel } = useModels();
  const { repoId, files } = useRepository();
  const { analyze, isAnalyzing } = useAnalysis();
  const {
    sessions,
    isLoading,
    error,
    createSession,
    runAnalysis,
    deleteSession,
    clearError,
  } = useReviewSession();

  // Resize handlers
  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResizing = () => setIsResizing(false);

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
        setConsoleHeight(newHeight);
      }
    }
  };

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  // Quick review handler
  const handleAnalyze = async () => {
    if (!repoId || !selectedModel || selectedFiles.length === 0) {
      addLog('error', 'Please select repository, model, and files');
      return;
    }

    try {
      const selectedFileInfos = files.filter(f => selectedFiles.includes(f.path));
      await analyze(repoId, selectedModel, selectedFileInfos, (message) => {
        let logType: 'info' | 'success' | 'error' | 'warning' = 'info';
        if (message.toUpperCase().includes('ERROR')) {
          logType = 'error';
        } else if (message.toUpperCase().includes('COMPLETE') || message.toUpperCase().includes('SUCCESSFUL')) {
          logType = 'success';
        } else if (message.toUpperCase().includes('WARNING')) {
          logType = 'warning';
        }
        addLog(logType, message);
      });
    } catch (error) {
      addLog('error', `Analysis failed: ${(error as Error).message}`);
    }
  };

  // Review session handlers
  const handleCreateSession = async () => {
    if (!createSessionData.repositoryId || !createSessionData.sourceBranch || !createSessionData.targetBranch) {
      addLog('error', 'Please select repository and branches');
      return;
    }

    try {
      const session = await createSession({
        repositoryId: createSessionData.repositoryId,
        name: createSessionData.name || `${createSessionData.sourceBranch} → ${createSessionData.targetBranch}`,
        sourceBranch: createSessionData.sourceBranch,
        targetBranch: createSessionData.targetBranch,
        modelId: selectedModel || undefined,
      });
      
      setCurrentSessionId(session.id);
      setCurrentView('review-sessions');
      addLog('success', `Review session created: ${session.name}`);
    } catch (error) {
      addLog('error', `Failed to create session: ${(error as Error).message}`);
    }
  };

  const handleRunSessionAnalysis = async (session: ReviewSession) => {
    try {
      await runAnalysis(session.id, selectedModel || undefined);
      addLog('success', `Analysis completed for ${session.name}`);
    } catch (error) {
      addLog('error', `Analysis failed: ${(error as Error).message}`);
    }
  };

  const handleDeleteSession = async (session: ReviewSession) => {
    if (!confirm(`Delete review session "${session.name}"?`)) return;
    
    try {
      await deleteSession(session.id);
      if (currentSessionId === session.id) {
        setCurrentSessionId(null);
      }
      addLog('success', `Deleted session: ${session.name}`);
    } catch (error) {
      addLog('error', `Failed to delete session: ${(error as Error).message}`);
    }
  };

  const handleSelectSession = (session: ReviewSession) => {
    setCurrentSessionId(session.id);
    setCurrentView('review-sessions');
  };

  // Navigation items
  const navItems = [
    { id: 'quick-review', label: 'Quick Review', icon: Play },
    { id: 'persistent-repos', label: 'Repositories', icon: Folder },
    { id: 'review-sessions', label: 'Review Sessions', icon: History },
  ] as const;

  return (
    <div className="flex h-screen w-full bg-black text-white selection:bg-white selection:text-black font-sans">

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-950/20">
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-black italic text-xl select-none">
              H
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter uppercase italic">Hellbender</h1>
              <p className="text-[8px] text-zinc-600 uppercase tracking-widest">AI Code Review</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || 
                (item.id === 'review-sessions' && currentView === 'create-review');
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setCurrentSessionId(null);
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all',
                    isActive
                      ? 'bg-white text-black'
                      : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                  )}
                >
                  <Icon size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Status Panel */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/20">
          <h2 className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-3">Status</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 border border-zinc-900 bg-zinc-900/20 rounded">
              <span className="text-[9px] text-zinc-500 uppercase">Model</span>
              <span className={clsx('text-[9px] font-mono', selectedModel ? 'text-blue-400' : 'text-zinc-700')}>
                {selectedModel ? 'SELECTED' : 'PENDING'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 border border-zinc-900 bg-zinc-900/20 rounded">
              <span className="text-[9px] text-zinc-500 uppercase">View</span>
              <span className="text-[9px] font-mono text-zinc-400 uppercase">
                {currentView.replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* TOP TOOLBAR */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-black">
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
              {currentView === 'quick-review' && 'Quick Code Review'}
              {currentView === 'persistent-repos' && 'Persistent Repositories'}
              {currentView === 'review-sessions' && 'Branch Comparison Reviews'}
              {currentView === 'create-review' && 'Create Review Session'}
            </span>
          </div>
        </header>

        {/* VIEW CONTENT */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          
          {/* LEFT PANEL - Based on view */}
          <div className="w-80 border-r border-zinc-800 flex flex-col overflow-y-auto no-scrollbar">
            
            {/* QUICK REVIEW VIEW */}
            {currentView === 'quick-review' && (
              <>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                      Repository
                    </h2>
                  </div>
                  <RepositoryView
                    selectedFiles={selectedFiles}
                    onSelectionChange={setSelectedFiles}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                  />
                </div>
                
                <div className="flex-1" />
                
                <div className="p-6 border-t border-zinc-900 bg-zinc-950/20">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !repoId || !selectedModel || selectedFiles.length === 0}
                    className="w-full bg-white text-black px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-colors disabled:opacity-20 flex items-center justify-center space-x-3"
                  >
                    {isAnalyzing ? <RefreshCw className="animate-spin" size={12} /> : <Play size={12} fill="currentColor" />}
                    <span>{isAnalyzing ? 'Analyzing' : 'Analyze'}</span>
                  </button>
                </div>
              </>
            )}
            
            {/* PERSISTENT REPOSITORIES VIEW */}
            {currentView === 'persistent-repos' && (
              <div className="p-6">
                <PersistentRepoManager
                  onSelectRepository={(repo) => {
                    setSelectedRepository(repo);
                    setCreateSessionData((prev) => ({ ...prev, repositoryId: repo.id }));
                    setCurrentView('create-review');
                  }}
                  selectedRepositoryId={selectedRepository?.id}
                />
              </div>
            )}
            
            {/* REVIEW SESSIONS LIST VIEW */}
            {currentView === 'review-sessions' && !currentSessionId && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                    Saved Reviews
                  </h2>
                  {selectedRepository && (
                    <button
                      onClick={() => setCurrentView('create-review')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-wider hover:bg-zinc-200"
                    >
                      <Plus size={12} />
                      New
                    </button>
                  )}
                </div>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[9px]">
                    {error}
                    <button onClick={clearError} className="ml-2 underline">Dismiss</button>
                  </div>
                )}
                
                <ReviewSessionList
                  sessions={sessions}
                  onSelect={handleSelectSession}
                  onDelete={handleDeleteSession}
                  onRunAnalysis={handleRunSessionAnalysis}
                />
              </div>
            )}
            
            {/* CREATE REVIEW SESSION VIEW */}
            {currentView === 'create-review' && (
              <div className="p-6">
                <button
                  onClick={() => setCurrentView('review-sessions')}
                  className="text-[9px] text-zinc-500 hover:text-white mb-4 flex items-center gap-1"
                >
                  ← Back to sessions
                </button>
                
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">
                  Create Review Session
                </h2>
                
                {selectedRepository ? (
                  <div className="space-y-4">
                    {/* Selected repo */}
                    <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded">
                      <div className="text-[10px] font-black uppercase text-zinc-300">
                        {selectedRepository.name}
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-1">
                        {selectedRepository.url}
                      </div>
                    </div>
                    
                    {/* Branch selector */}
                    <BranchSelector
                      repositoryId={selectedRepository.id}
                      sourceBranch={createSessionData.sourceBranch}
                      targetBranch={createSessionData.targetBranch}
                      onChange={(source, target) => {
                        setCreateSessionData((prev) => ({ ...prev, sourceBranch: source, targetBranch: target }));
                      }}
                    />
                    
                    {/* Session name */}
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                        Session Name (optional)
                      </label>
                      <input
                        type="text"
                        value={createSessionData.name}
                        onChange={(e) => setCreateSessionData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder={`${createSessionData.sourceBranch} → ${createSessionData.targetBranch}`}
                        className="w-full px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded text-white text-[11px] focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                    
                    {/* Create button */}
                    <button
                      onClick={handleCreateSession}
                      disabled={!createSessionData.sourceBranch || !createSessionData.targetBranch}
                      className="w-full bg-white text-black px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-colors disabled:opacity-20 flex items-center justify-center space-x-2"
                    >
                      <Play size={12} />
                      <span>Create & Start</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <GitBranch size={32} className="mx-auto text-zinc-700 mb-2" />
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      Select a repository first
                    </p>
                    <button
                      onClick={() => setCurrentView('persistent-repos')}
                      className="mt-4 text-[9px] text-zinc-400 hover:text-white underline"
                    >
                      Go to Repositories
                    </button>
                  </div>
                )}
              </div>
            )}
            
          </div>

          {/* RIGHT PANEL - Content */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* REVIEW SESSION DETAIL VIEW */}
            {currentView === 'review-sessions' && currentSessionId && (
              <>
                <ReviewSessionView
                  sessionId={currentSessionId}
                  onDelete={() => {
                    setCurrentSessionId(null);
                    addLog('success', 'Session deleted');
                  }}
                />
              </>
            )}
            
            {/* QUICK REVIEW CONTENT */}
            {currentView === 'quick-review' && (
              <>
                <div className="h-10 border-b border-zinc-900 flex items-center px-4 bg-zinc-950/30">
                  <div className="flex items-center space-x-2 border-r border-zinc-800 pr-6 h-full text-[10px] font-black uppercase tracking-widest">
                    <Bug size={12} />
                    <span>Analysis Results</span>
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  <div className="w-full h-full bg-black p-8 overflow-y-auto no-scrollbar">
                    <AnalysisResults />
                  </div>
                </div>
                <div 
                  style={{ height: `${consoleHeight}px` }} 
                  className="border-t border-zinc-800 bg-black relative flex flex-col group/console"
                >
                  <div
                    onMouseDown={startResizing}
                    className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/10 transition-colors z-50 flex items-center justify-center"
                  >
                    <div className="w-8 h-0.5 bg-zinc-800 rounded-full group-hover/console:bg-zinc-600 transition-colors" />
                  </div>
                  <ActivityLog />
                </div>
              </>
            )}
            
            {/* OTHER VIEWS */}
            {(currentView === 'persistent-repos' || currentView === 'create-review') && (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <Code size={48} className="mx-auto opacity-20 mb-4" />
                  <p className="text-[10px] uppercase tracking-wider">
                    {currentView === 'persistent-repos' 
                      ? 'Select a repository to manage'
                      : 'Configure your review session'}
                  </p>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>

      <LoadingOverlay
        modelName={selectedModel}
        isVisible={isAnalyzing}
      />
    </div>
  );
}

export default App;
