import React, { useState, useCallback } from 'react';
import {
  Settings,
  Play,
  RefreshCw,
  Bug,
  GitPullRequest
} from 'lucide-react';
import { ActivityLog } from './components/ActivityLog';
import { RepositoryView } from './components/RepositoryView';
import { AnalysisResults } from './components/AnalysisResults';
import { MergeRequestsView } from './components/MergeRequestsView';
import { CreateMRView } from './components/CreateMRView';
import { LoadingOverlay } from './components/LoadingOverlay';
import { useActivityLog } from './hooks/useActivityLog';
import { useModels } from './hooks/useModels';
import { useRepository } from './hooks/useRepository';
import { useAnalysis } from './hooks/useAnalysis';

function App() {
  const [currentView, setCurrentView] = useState<'audit' | 'merge-requests' | 'create-merge-request'>('audit');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [consoleHeight, setConsoleHeight] = useState(192); // Default h-48 is 192px
  const [isResizing, setIsResizing] = useState(false);

  const { addLog } = useActivityLog();
  const { selectedModel, setSelectedModel } = useModels();
  const { repoId, files } = useRepository();
  const { analyze, isAnalyzing } = useAnalysis();

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
        setConsoleHeight(newHeight);
      }
    }
  }, [isResizing]);

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
  }, [isResizing, resize, stopResizing]);

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

  return (
    <div className="flex h-screen w-full bg-black text-white selection:bg-white selection:text-black font-sans">

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/20 h-screen overflow-hidden">
        <div className="p-6 border-b border-zinc-900 bg-black/40">
           <div className="flex items-center space-x-4 mb-8">
             <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-black italic text-lg select-none">H</div>
             <h1 className="font-black text-xl tracking-tighter uppercase italic select-none">Hellbender</h1>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setCurrentView('audit')}
              className={`w-full flex items-center space-x-3 p-3 transition-all border ${
                currentView === 'audit'
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                  : 'text-zinc-500 border-zinc-900 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              <Bug size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Audit System</span>
            </button>
            <button
              onClick={() => setCurrentView('merge-requests')}
              className={`w-full flex items-center space-x-3 p-3 transition-all border ${
                currentView === 'merge-requests'
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                  : 'text-zinc-500 border-zinc-900 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              <GitPullRequest size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Merge Requests</span>
            </button>
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {currentView === 'audit' && (
            <div className="p-6 animate-in slide-in-from-left-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                  Audit Config
                </h2>
                <button className="text-zinc-600 hover:text-white transition-colors"><Settings size={14} /></button>
              </div>
              <div className="space-y-4">
                <RepositoryView
                  selectedFiles={selectedFiles}
                  onSelectionChange={setSelectedFiles}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />
              </div>
            </div>
          )}

          {currentView === 'merge-requests' && (
            <div className="p-6 animate-in slide-in-from-left-4 duration-300">
              <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">
                MR Filter
              </h2>
              <div className="p-4 border border-zinc-900 bg-zinc-900/30 rounded text-[11px] font-mono text-zinc-500 italic">
                Filtering tools coming soon.
              </div>
            </div>
          )}
        </div>

        {currentView === 'audit' && (
          <div className="p-6 border-t border-zinc-900 bg-zinc-950/20 shrink-0">
             <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">System Status</h2>
             <div className="space-y-2">
               <div className="border border-zinc-900 bg-zinc-900/30 p-3 flex items-center space-x-3 group cursor-pointer hover:border-zinc-700 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${repoId ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`}></div>
                  <div className="leading-none">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Repository</p>
                    <p className={`text-[9px] font-mono mt-1 ${repoId ? 'text-green-400' : 'text-zinc-700'}`}>{repoId ? 'CONNECTED' : 'DISCONNECTED'}</p>
                  </div>
               </div>

               <div className="border border-zinc-900 bg-zinc-900/30 p-3 flex items-center space-x-3 group cursor-pointer hover:border-zinc-700 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${selectedModel ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-zinc-800'}`}></div>
                  <div className="leading-none">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">AI Model</p>
                    <p className={`text-[9px] font-mono mt-1 ${selectedModel ? 'text-blue-400' : 'text-zinc-700'}`}>{selectedModel ? 'SELECTED' : 'PENDING'}</p>
                  </div>
               </div>
             </div>
          </div>
        )}
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TOP TOOLBAR */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-black">
          <div className="flex items-center space-x-4">
             <span className="text-[10px] font-mono text-zinc-600 uppercase truncate max-w-xs">
               {currentView === 'audit' ? (repoId ? `Session: ${repoId.split('-')[0]}...` : 'Ready for Audit') : 'Merge Requests Pipeline'}
             </span>
          </div>
          {currentView === 'audit' && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !repoId || !selectedModel || selectedFiles.length === 0}
              className="bg-white text-black px-8 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-colors disabled:opacity-20 flex items-center space-x-3"
            >
              {isAnalyzing ? <RefreshCw className="animate-spin" size={12} /> : <Play size={12} fill="currentColor" />}
              <span>{isAnalyzing ? 'Analyzing' : 'Analyze'}</span>
            </button>
          )}
        </header>

        <div className="flex-1 flex min-h-0">
          {currentView === 'audit' ? (
            <div className="flex-1 flex flex-col border-r border-zinc-800">
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
            </div>
          ) : currentView === 'merge-requests' ? (
            <div className="flex-1 bg-black">
              <MergeRequestsView onCreateNew={() => setCurrentView('create-merge-request')} />
            </div>
          ) : (
            <div className="flex-1 bg-black">
              <CreateMRView
                onBack={() => setCurrentView('merge-requests')}
                onCreated={() => setCurrentView('merge-requests')}
                initialRepoId={repoId}
              />
            </div>
          )}
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
