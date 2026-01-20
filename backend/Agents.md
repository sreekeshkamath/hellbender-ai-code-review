# Backend Agents Documentation

This document explains the structure and functionality of the Hellbender backend to help agents understand and modify the codebase.

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── constants.ts       # Environment variables and constants
│   │   └── environment.ts     # Environment validation
│   ├── controllers/
│   │   ├── PersistentRepositoryController.ts  # Persistent repo HTTP handlers
│   │   ├── ReviewController.ts               # Review (quick review) handlers
│   │   ├── ReviewSessionController.ts        # Review session handlers
│   │   └── SavedReposController.ts           # Saved repos handlers
│   ├── database/
│   │   ├── connection.ts      # PostgreSQL connection pool
│   │   ├── migrate.ts         # Database migration runner
│   │   └── migrations/
│   │       └── 001_initial_schema.sql  # Initial schema
│   ├── models/
│   │   ├── PersistentRepository.ts  # Repository model & types
│   │   └── ReviewSession.ts         # Review session models & types
│   ├── routes/
│   │   ├── persistentRepo.routes.ts   # Persistent repo routes
│   │   ├── repository.routes.ts       # Quick review routes
│   │   ├── review.routes.ts           # Review routes
│   │   ├── reviewSession.routes.ts    # Review session routes
│   │   └── savedRepos.routes.ts       # Saved repos routes
│   ├── services/
│   │   ├── AnalysisService.ts        # AI code analysis
│   │   ├── DiffService.ts            # Git diff operations
│   │   ├── EncryptionService.ts      # Encryption utilities
│   │   ├── FileService.ts            # File utilities
│   │   ├── PersistentRepositoryService.ts  # Persistent repo logic
│   │   ├── RepositoryMappingService.ts    # Repo ID mapping
│   │   ├── RepositoryService.ts           # Repository cloning/syncing
│   │   ├── ReviewSessionService.ts        # Review session logic
│   │   ├── SavedRepositoryService.ts      # Saved repo logic
│   │   └── VulnerabilityScanner.ts        # Security scanning
│   ├── utils/
│   │   ├── GitErrorParser.ts        # Git error messages
│   │   └── PathValidator.ts         # Path validation
│   ├── __tests__/                   # Backend tests
│   └── server.ts                    # Express app entry point
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Database Schema

The backend uses PostgreSQL with the following main tables:

### persistent_repositories
Stores permanently cloned repositories:
- `id` (UUID) - Primary key
- `name` - Repository display name
- `url` - Repository URL
- `default_branch` - Default branch name
- `storage_path` - Path in persistent storage
- `created_at` - Creation timestamp
- `last_synced_at` - Last sync timestamp
- `is_active` - Whether repo is active

### review_sessions
Stores branch comparison reviews:
- `id` (UUID) - Primary key
- `repository_id` (UUID) - FK to persistent_repositories
- `name` - Session name
- `source_branch` - Source branch for comparison
- `target_branch` - Target branch for comparison
- `model_id` - AI model used
- `status` - pending/in_progress/completed/failed
- `overall_score` - Overall quality score (0-100)
- `created_at` - Creation timestamp
- `completed_at` - Completion timestamp

### review_files
Stores analyzed files in a review session:
- `id` (UUID) - Primary key
- `review_session_id` (UUID) - FK to review_sessions
- `file_path` - Path to the file
- `score` - File quality score
- `summary` - AI summary of the file
- `diff_hunks` (JSONB) - Structured diff data
- `analyzed_at` - Analysis timestamp

### review_comments
Stores inline AI comments:
- `id` (UUID) - Primary key
- `review_file_id` (UUID) - FK to review_files
- `line_number` - Line number in the file
- `comment_type` - issue/suggestion/praise/question/todo
- `severity` - info/warning/error/critical
- `message` - Comment message
- `code_snippet` - Original code snippet
- `suggestion` - AI suggestion
- `created_at` - Creation timestamp

## API Endpoints

### Persistent Repositories
- `POST /api/persistent-repos` - Create new repository
- `GET /api/persistent-repos` - List all repositories
- `GET /api/persistent-repos/:id` - Get single repository
- `PATCH /api/persistent-repos/:id` - Update repository
- `POST /api/persistent-repos/:id/sync` - Sync repository
- `DELETE /api/persistent-repos/:id` - Delete repository
- `GET /api/persistent-repos/:id/branches` - Get branches
- `GET /api/persistent-repos/:id/files` - Get files

### Review Sessions
- `POST /api/review-sessions` - Create new session
- `GET /api/review-sessions` - List all sessions
- `GET /api/review-sessions/:id` - Get session with files/comments
- `POST /api/review-sessions/:id/analyze` - Run AI analysis
- `DELETE /api/review-sessions/:id` - Delete session

## Key Services

### PersistentRepositoryService
Handles cloning and managing persistent repositories:
- `create(url, name?, branch?)` - Clone a repo to persistent storage
- `getAll()` - List all persistent repos
- `getById(id)` - Get a single repo
- `sync(id)` - Pull latest changes
- `delete(id)` - Remove from storage and DB
- `getBranches(id)` - List available branches
- `getFiles(id)` - List repository files

### ReviewSessionService
Handles branch comparison reviews:
- `create(dto)` - Create a new review session
- `getAll(repositoryId?)` - List sessions
- `getById(id)` - Get session with files and comments
- `runAnalysis(id, modelId?)` - Execute AI review on changes
- `delete(id)` - Delete session and related data

### DiffService
Handles git diff operations:
- `getFileDiff(repoId, sourceBranch, targetBranch, filePath)` - Get unified diff
- `getChangedFilesList(repoId, sourceBranch, targetBranch)` - List changed files
- `formatDiffForDisplay(hunks)` - Format diff for UI

### AnalysisService
Handles AI code analysis:
- `analyzeCode(content, filePath, model)` - Full file analysis
- `analyzeCodeWithDiff(content, filePath, model, diffContext)` - Diff-focused analysis

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection URL |
| `POSTGRES_USER` | Database username |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DB` | Database name |
| `PERSISTENT_REPOS_PATH` | Path for persistent repo storage |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI |
| `GITHUB_ACCESS_TOKEN` | GitHub token for private repos |
| `ENCRYPTION_KEY` | Encryption key for saved repos |
| `NODE_ENV` | Environment (development/production) |
| `PORT` | Server port |
| `SITE_URL` | Site URL for OpenRouter |

## Running Commands

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Run tests
npm test

# Database migrations
npm run db:migrate
npm run db:migrate:down
npm run db:reset
npm run db:status
```

## Adding New Features

1. **Add a new endpoint:**
   - Create/update controller in `src/controllers/`
   - Add route in `src/routes/`
   - Register in `server.ts`

2. **Add a new service:**
   - Create in `src/services/`
   - Export and use in controllers

3. **Database changes:**
   - Create new migration in `src/database/migrations/`
   - Run with `npm run db:migrate`

4. **Testing:**
   - Add tests in `src/__tests__/`
   - Run with `npm test`
