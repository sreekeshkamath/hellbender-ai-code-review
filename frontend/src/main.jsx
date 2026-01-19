import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RepositoryProvider } from './hooks/useRepository'
import { ModelsProvider } from './hooks/useModels'
import { AnalysisProvider } from './hooks/useAnalysis'
import { ActivityLogProvider } from './hooks/useActivityLog'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ActivityLogProvider>
      <ModelsProvider>
        <RepositoryProvider>
          <AnalysisProvider>
            <App />
          </AnalysisProvider>
        </RepositoryProvider>
      </ModelsProvider>
    </ActivityLogProvider>
  </StrictMode>,
)
