# Frontend Agents Documentation

This document explains the structure and functionality of the Hellbender frontend to help agents understand and modify the codebase.

## Project Structure

```
frontend/
├── src/
│   ├── assets/                 # Static assets
│   ├── components/
│   │   ├── ActivityLog.tsx     # Console activity log
│   │   ├── AnalysisResults.tsx # Analysis output display
│   │   ├── BranchSelector.tsx  # Branch dropdown selector
│   │   ├── DiffView.tsx        # Unified diff viewer
│   │   ├── InlineComment.tsx   # Inline AI comment display
│   │   ├── LoadingOverlay.tsx  # Loading spinner overlay
│   │   ├── PersistentRepoManager.tsx  # Persistent repo management
│   │   ├── RepositoryView.tsx  # Repository selection UI
│   │   ├── ReviewSessionList.tsx      # List of review sessions
│   │   └── ReviewSessionView.tsx      # Review session detail view
│   ├── hooks/
│   │   ├── useActivityLog.ts   # Activity log state
│   │   ├── useAnalysis.ts      # Analysis state
│   │   ├── useModels.ts        # AI models state
│   │   ├── useRepository.ts    # Repository state
│   │   └── useReviewSession.ts # Review session state
│   ├── services/
│   │   ├── api.ts              # Base API client
│   │   ├── PersistentRepoService.ts  # Persistent repo API
│   │   └── ReviewSessionService.ts   # Review session API
│   ├── types/
│   │   └── reviewSession.types.ts    # TypeScript interfaces
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles (Tailwind)
├── Dockerfile
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Key Components

### DiffView
Displays unified diffs with inline comments (GitLab-style):
- Props: `diffHunks`, `comments`, `onLineClick`, `selectedLineNumber`
- Shows green backgrounds for additions (+)
- Shows red backgrounds for deletions (-)
- Displays inline comments below commented lines

### InlineComment
Displays an AI comment with:
- Severity indicator (color-coded bar)
- Comment type badge (issue/suggestion/praise/question/todo)
- Message text
- Original code snippet
- AI suggestion (if available)

### PersistentRepoManager
Manages persistent repositories:
- Add new repos (URL, name, branch)
- List all repos
- Sync repos
- Delete repos
- Select repo for review session

### ReviewSessionView
Main view for a review session:
- Session header (name, branches, status, score)
- File list sidebar
- Diff view for selected file
- Inline comments

### BranchSelector
Dropdowns for selecting:
- Source branch
- Target branch
- Fetches branches from API

## State Management

### Custom Hooks

#### useReviewSession
Manages review session state:
```typescript
const {
  sessions,           // ReviewSession[]
  currentSession,     // ReviewSession | null
  isLoading,          // boolean
  isAnalyzing,        // boolean
  error,              // string | null
  createSession,      // (data) => Promise<ReviewSession>
  loadSession,        // (id) => Promise<ReviewSession | null>
  runAnalysis,        // (id, modelId?) => Promise<void>
  deleteSession,      // (id) => Promise<void>
} = useReviewSession();
```

#### useActivityLog
Manages activity log:
```typescript
const {
  logs,      // ActivityLogEntry[]
  addLog,    // (type, message) => void
  clearLogs, // () => void
} = useActivityLog();
```

## Types

### ReviewSession
```typescript
interface ReviewSession {
  id: string;
  repositoryId: string;
  name: string;
  sourceBranch: string;
  targetBranch: string;
  modelId: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  overallScore: number | null;
  createdAt: string;
  completedAt: string | null;
  files?: ReviewFile[];
}
```

### ReviewFile
```typescript
interface ReviewFile {
  id: string;
  reviewSessionId: string;
  filePath: string;
  score: number | null;
  summary: string | null;
  diffHunks: DiffHunk[];
  analyzedAt: string;
  comments?: ReviewComment[];
}
```

### ReviewComment
```typescript
interface ReviewComment {
  id: string;
  reviewFileId: string;
  lineNumber: number;
  commentType: 'issue' | 'suggestion' | 'praise' | 'question' | 'todo';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  codeSnippet: string | null;
  suggestion: string | null;
  createdAt: string;
}
```

## Services

### PersistentRepoService
```typescript
// Create repository
create(data: CreatePersistentRepositoryRequest): Promise<PersistentRepository>

// List repositories
getAll(includeInactive?: boolean): Promise<PersistentRepository[]>

// Get single repository
getById(id: string): Promise<PersistentRepository>

// Sync repository
sync(id: string): Promise<PersistentRepository>

// Delete repository
delete(id: string): Promise<void>

// Get branches
getBranches(id: string): Promise<BranchInfo[]>
```

### ReviewSessionService
```typescript
// Create session
create(data: CreateReviewSessionRequest): Promise<ReviewSession>

// List sessions
getAll(repositoryId?: string): Promise<ReviewSession[]>

// Get session with files/comments
getById(id: string): Promise<ReviewSession>

// Run analysis
runAnalysis(id: string, modelId?: string): Promise<ReviewSession>

// Delete session
delete(id: string): Promise<void>

// Poll for analysis completion
waitForAnalysis(id: string, onProgress?, maxAttempts?, interval?): Promise<ReviewSession>
```

## API Configuration

The frontend expects the backend API at:
```
VITE_API_URL=http://localhost:3001
```

## Styling

The frontend uses Tailwind CSS with custom design tokens (see DESIGN.md in project root):
- Font: Sans-serif (Inter)
- Code: Monospace (JetBrains Mono)
- Colors: Zinc palette (zinc-950 to zinc-50)
- Glassmorphism: `bg-zinc-950/20`, `backdrop-blur-sm`

## Running Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Adding New Components

1. Create component in `src/components/`
2. Add TypeScript interfaces in `src/types/`
3. Add service methods in `src/services/` if API calls needed
4. Add state hook in `src/hooks/` if state management needed
5. Import and use in App.tsx

## Adding New Features

1. **New API endpoint:**
   - Add service method in `src/services/`
   - Add types in `src/types/`
   - Use in components

2. **New UI component:**
   - Create in `src/components/`
   - Follow existing patterns (Design.md)
   - Add tests if needed

3. **New state management:**
   - Create custom hook in `src/hooks/`
   - Use React useState/useEffect
   - Export typed interface
