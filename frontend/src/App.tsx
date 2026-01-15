import { useState } from 'react';
import { Button } from './components/ui/button';
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

function App() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const { addLog } = useActivityLog();
  const { selectedModel, setSelectedModel } = useModels();
  const { repoId, files } = useRepository();
  const { analyze, isAnalyzing } = useAnalysis();

  const handleLoadRepo = (repo: SavedRepository) => {
    // Load repo logic - this would integrate with repository hooks
    addLog('info', `Loading repository: ${repo.name}`);
  };

  const handleAnalyze = async () => {
    if (!repoId || !selectedModel || selectedFiles.length === 0) {
      addLog('error', 'Please select repository, model, and files');
      return;
    }

    try {
      addLog('info', `Starting analysis with ${selectedModel} on ${selectedFiles.length} files`);
      const selectedFileInfos = files.filter(f => selectedFiles.includes(f.path));
      await analyze(repoId, selectedModel, selectedFileInfos);
      addLog('success', 'Analysis completed');
    } catch (error) {
      addLog('error', `Analysis failed: ${(error as Error).message}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Code Review</h1>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleAnalyze}
              disabled={!repoId || !selectedModel || selectedFiles.length === 0 || isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r bg-muted/10 p-4 overflow-y-auto">
          <div className="space-y-6">
            <RepositoryConfig />
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
            <FileSelector
              selectedFiles={selectedFiles}
              onSelectionChange={setSelectedFiles}
            />
            <SavedReposList onLoad={handleLoadRepo} />
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4 overflow-y-auto">
            <AnalysisResults />
          </div>
          <div className="h-64 border-t">
            <ActivityLog />
          </div>
        </div>
      </div>

      <LoadingOverlay
        modelName={selectedModel}
        isVisible={isAnalyzing}
      />
    </div>
  );
}

export default App;