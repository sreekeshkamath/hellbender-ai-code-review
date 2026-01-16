import React, { useState, useCallback } from 'react';
import {
  Search,
  Settings,
  Play,
  History,
  FileCode,
  Terminal,
  Eraser,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Code,
  Bug,
  ChevronRight,
  GitBranch,
  Cpu
} from 'lucide-react';
import { ActivityLog } from './components/ActivityLog';
import { SavedReposList } from './components/SavedReposList';
import { RepositoryConfig } from './components/RepositoryConfig';
import { ModelSelector } from './components/ModelSelector';
import { FileSelector } from './components/FileSelector';
import { AnalysisResults } from './components/AnalysisResults';
import { LoadingOverlay } from './components/LoadingOverlay';
import { useActivityLog } from './hooks/useActivityLog';
import { useModels } from './hooks/useModels';
import { useRepository } from './hooks/useRepository';
import { useAnalysis } from './hooks/useAnalysis';
import { SavedRepository } from './types/api.types';

// --- UI COMPONENTS ---

const NavigationItem: React.FC<{ icon: any; label: string; isActive?: boolean; onSelect: () => void }> = ({
  icon: Icon, label, isActive, onSelect
}) => (
  <button
    onClick={onSelect}
    className={`w-full flex flex-col items-center justify-center py-4 space-y-1 transition-all duration-200 border-l-2 ${
      isActive
        ? 'bg-zinc-900 border-white text-white'
        : 'border-transparent text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/50'
    }`}
  >
    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
    <span className="text-[8px] font-black uppercase tracking-[0.1em]">{label}</span>
  </button>
);

function App() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<'repo' | 'model' | 'files' | 'saved'>('repo');
  const [consoleHeight, setConsoleHeight] = useState(192); // Default h-48 is 192px
  const [isResizing, setIsResizing] = useState(false);

  const { addLog } = useActivityLog();
  const { selectedModel, setSelectedModel } = useModels();
  const { repoId, files } = useRepository();
  const { analyze, isAnalyzing } = useAnalysis();

  const handleLoadRepo = (repo: SavedRepository) => {
    // Load repo logic - this would integrate with repository hooks
    addLog('info', `Loading repository: ${repo.name}`);
  };

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
      
      // Use onProgress callback to log detailed status
      await analyze(repoId, selectedModel, selectedFileInfos, (message) => {
        // Determine log type based on message content
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

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'repo':
        return <RepositoryConfig />;
      case 'model':
        return (
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        );
      case 'files':
        return (
          <FileSelector
            selectedFiles={selectedFiles}
            onSelectionChange={setSelectedFiles}
          />
        );
      case 'saved':
        return <SavedReposList onLoad={handleLoadRepo} />;
      default:
        return <RepositoryConfig />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-black text-white selection:bg-white selection:text-black font-sans">

      {/* GLOBAL NAVIGATION (SLIM) */}
      <nav className="w-16 border-r border-zinc-800 flex flex-col items-center py-6 space-y-8">
        <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-black italic text-lg select-none">H</div>
        <div className="flex-1 flex flex-col items-center space-y-6">
          <NavigationItem icon={GitBranch} label="REPO" isActive={activeSection === 'repo'} onSelect={() => setActiveSection('repo')} />
          <NavigationItem icon={Cpu} label="MODEL" isActive={activeSection === 'model'} onSelect={() => setActiveSection('model')} />
          <NavigationItem icon={FileCode} label="FILES" isActive={activeSection === 'files'} onSelect={() => setActiveSection('files')} />
          <NavigationItem icon={History} label="SAVED" isActive={activeSection === 'saved'} onSelect={() => setActiveSection('saved')} />
        </div>
        <button className="text-zinc-600 hover:text-white transition-colors"><Settings size={18} /></button>
      </nav>

      {/* EXPLORER & CONFIG PANEL */}
      <aside className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/20">
        <div className="p-6">
          <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6">
            {activeSection === 'repo' && 'Repository Configuration'}
            {activeSection === 'model' && 'AI Model Selection'}
            {activeSection === 'files' && 'File Selection'}
            {activeSection === 'saved' && 'Saved Repositories'}
          </h2>
          <div className="space-y-4">
            {renderActiveSection()}
          </div>
        </div>

        <div className="flex-1"></div>

        <div className="p-6 border-t border-zinc-900 bg-zinc-950/20">
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

             <div className="border border-zinc-900 bg-zinc-900/30 p-3 flex items-center space-x-3 group cursor-pointer hover:border-zinc-700 transition-colors">
                <div className={`w-2 h-2 rounded-full ${selectedFiles.length > 0 ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-zinc-800'}`}></div>
                <div className="leading-none">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Files</p>
                  <p className={`text-[9px] font-mono mt-1 ${selectedFiles.length > 0 ? 'text-purple-400' : 'text-zinc-700'}`}>{selectedFiles.length} SELECTED</p>
                </div>
             </div>
           </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* TOP TOOLBAR */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-black">
          <div className="flex items-center space-x-4">
             <h1 className="font-black text-xl tracking-tighter uppercase italic select-none">Hellbender</h1>
             <div className="h-4 w-px bg-zinc-800"></div>
             <span className="text-[10px] font-mono text-zinc-600 uppercase truncate max-w-xs">
               {repoId ? `Repo: ${repoId.split('-')[0]}...` : 'No repository loaded'}
             </span>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !repoId || !selectedModel || selectedFiles.length === 0}
            className="bg-white text-black px-8 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-colors disabled:opacity-20 flex items-center space-x-3"
          >
            {isAnalyzing ? <RefreshCw className="animate-spin" size={12} /> : <Play size={12} fill="currentColor" />}
            <span>{isAnalyzing ? 'Analyzing' : 'Analyze'}</span>
          </button>
        </header>

        <div className="flex-1 flex min-h-0">

          {/* ANALYSIS RESULTS SECTION */}
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
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                   <div className="w-10 h-10 border-2 border-white border-t-transparent animate-spin mb-4"></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em]">Running Neural Audit</p>
                </div>
              )}
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
