// Frontend-specific model types

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export interface RepositoryState {
  repoId: string | null;
  repoPath: string | null;
  files: { path: string; size: number }[];
  isLoading: boolean;
  error: string | null;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  results: any[]; // Will be typed later
  selectedModel: string;
  error: string | null;
}

export interface AppState {
  repository: RepositoryState;
  analysis: AnalysisState;
  activityLog: ActivityLogEntry[];
  sidebarWidth: number;
  viewMode: 'scroll' | 'slide';
  selectedFiles: string[];
}