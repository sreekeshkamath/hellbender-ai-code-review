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
    <div className="h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <header className="shrink-0 border-b bg-card/50 backdrop-blur-md sticky top-0 z-10 p-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">H</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Hellbender AI Code Review
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-[1px] bg-border mx-2" />
            <Button
              onClick={handleAnalyze}
              disabled={!repoId || !selectedModel || selectedFiles.length === 0 || isAnalyzing}
              className="relative overflow-hidden group shadow-lg shadow-primary/20"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span>Analyze Code</span>
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full">
        <aside className="w-80 border-r bg-muted/5 p-4 overflow-y-auto space-y-6 scrollbar-thin">
          <div className="space-y-6 pb-20">
            <section>
              <RepositoryConfig />
            </section>

            <section>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            </section>

            <section>
              <FileSelector
                selectedFiles={selectedFiles}
                onSelectionChange={setSelectedFiles}
              />
            </section>

            <section>
              <SavedReposList onLoad={handleLoadRepo} />
            </section>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 bg-muted/5">
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
            <div className="max-w-4xl mx-auto">
              <AnalysisResults />
            </div>
          </div>

          <div className="h-72 border-t bg-card/50 backdrop-blur-sm">
            <ActivityLog />
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
