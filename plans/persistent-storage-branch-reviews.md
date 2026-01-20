---
name: Persistent Storage & Branch Reviews
overview: Add PostgreSQL database for persistent repository storage, implement Review Sessions for branch comparisons with inline AI comments (GitLab-style), and containerize the application with Docker Compose.
todos:
  - id: docker-setup
    content: Create Docker Compose, Dockerfiles, and .env.example
    status: pending
    dependencies: []
  - id: database-layer
    content: Add PostgreSQL connection, migrations, and schema
    status: pending
    dependencies:
      - docker-setup
  - id: persistent-repos-backend
    content: Create PersistentRepository model, service, controller, and routes
    status: pending
    dependencies:
      - database-layer
  - id: review-session-backend
    content: Create ReviewSession models, DiffService, and ReviewSessionService
    status: pending
    dependencies:
      - persistent-repos-backend
  - id: review-session-controller
    content: Create ReviewSessionController and routes
    status: pending
    dependencies:
      - review-session-backend
  - id: frontend-persistent-repos
    content: Create PersistentRepoService and PersistentRepoManager component
    status: pending
    dependencies:
      - persistent-repos-backend
  - id: frontend-review-session
    content: Create DiffView, InlineComment, and ReviewSessionView components
    status: pending
    dependencies:
      - review-session-controller
      - frontend-persistent-repos
  - id: app-integration
    content: Update App.tsx with navigation and integrate new features
    status: pending
    dependencies:
      - frontend-review-session
  - id: agents-documentation
    content: Create Agents.md files in all folders and CODING_GUIDELINES.md
    status: pending
    dependencies:
      - app-integration
  - id: testing-verification
    content: Run all tests and verify Docker setup works
    status: pending
    dependencies:
      - agents-documentation
---

# Persistent Storage, Branch Comparison Reviews & Docker Containerization Plan

## Original User Request

> Just like the @plans/typescript-refactor-monorepo-split.md which is detailed and helped the agent a lot, I want another plan that has the following features:
> 1) I want the ability to store the repo in my filesystem forever in a seperate storage. Use postgres(setup will be mentioned below) to store the relavant details that you need to store in a database.
> 2) Once stored, i want to create a branch comparison, effectively, if I have a source branch and a destination branch, I can keep it and save it for the future. What essentially this does is, I may be working on a feature branch, I will save something like feature branch to dev branch, so my functionality should scan only those changes present between these files. I should then be able to select the model to review that particular (I dont know what do you call this, its not a PR, its just a review tool so use a good name for it).
> 2.1) Make sure the model results are shown within the files itself like the gitlab Changes section, as shown in the screenshot attached. Notice in the other screenshot, you can see users are given the ability to comment on the code. I want it to be done essentially like that. My AI as my code reviewer, just like how code-rabbit reviews my code in github. My appication is just basically a dumped down, minimal self hostable version of the same.
> 3) Make sure you use DESIGN.md file to create the UI for it. Make sure its user friendly, easily legible. I love how the appication looks like right now, the loader and all. So keep that.
> 4) Add a postgress database in a docker-compose file. Move my project inside that docker-compose file so that I can easily execute the frontend and backend. Make sure you provide an easy to follow documentation to run the docker containers. Make sure the .env.example is used for your docker container setup.
> 5) Create an Agents.md file in each folder explaining what it does and how the code within the folder works so that Agents can easily pick it up if context is needed.
> 6) Have a coding guidelines based on the code you implement -
> 6.1) Make sure the code you write is as easy and as robust and easy to maintain. Use appropriate comments so that the agent can understand.
> 6.2) Make sure the steps are as detailed as possible for an agent to execute. Write tests for the features to ensure the agent does not hallucinate or build the wrong feature. Ask questions wherever necessary.

### User Choices from Clarifying Questions:
- **Permanent storage location**: Configurable via environment variable (recommended for flexibility)
- **Review naming**: Review Session (a saved comparison between two branches)
- **Inline comments scope**: Persistent - Store all AI comments in PostgreSQL for historical review
- **Diff view style**: Unified diff (single column, +/- lines highlighted)
- **Docker approach**: Use profiles (docker compose --profile dev up for dev, --profile prod for production)

---

## Overview

This plan adds three major capabilities to Hellbender:

1. **Persistent Repository Storage** - Store repositories permanently with PostgreSQL metadata tracking
2. **Review Sessions** - Branch comparison reviews with inline AI comments (GitLab-style unified diff view)
3. **Docker Containerization** - Full Docker Compose setup with profiles for dev/prod

---

## Architecture Overview

```mermaid
flowchart TB
    subgraph docker [Docker Compose]
        subgraph frontend_container [Frontend Container]
            ReactApp[React App<br/>Vite + TypeScript]
        end
        
        subgraph backend_container [Backend Container]
            ExpressAPI[Express API<br/>TypeScript]
        end
        
        subgraph postgres_container [PostgreSQL Container]
            PostgresDB[(PostgreSQL 16)]
        end
    end
    
    subgraph volumes [Docker Volumes]
        RepoStorage[repos_data<br/>Persistent Repos]
        PgData[pg_data<br/>Database]
    end
    
    ReactApp -->|HTTP API| ExpressAPI
    ExpressAPI -->|SQL| PostgresDB
    ExpressAPI -->|Read/Write| RepoStorage
    PostgresDB -->|Persist| PgData
```

---

## Database Schema

```mermaid
erDiagram
    PersistentRepository {
        uuid id PK
        varchar name
        varchar url
        varchar default_branch
        varchar storage_path
        timestamp created_at
        timestamp last_synced_at
    }
    
    ReviewSession {
        uuid id PK
        uuid repository_id FK
        varchar name
        varchar source_branch
        varchar target_branch
        varchar model_id
        varchar status
        integer overall_score
        timestamp created_at
        timestamp completed_at
    }
    
    ReviewFile {
        uuid id PK
        uuid review_session_id FK
        varchar file_path
        integer score
        text summary
        jsonb diff_hunks
        timestamp analyzed_at
    }
    
    ReviewComment {
        uuid id PK
        uuid review_file_id FK
        integer line_number
        varchar comment_type
        varchar severity
        text message
        text code_snippet
        text suggestion
        timestamp created_at
    }
    
    PersistentRepository ||--o{ ReviewSession : "has many"
    ReviewSession ||--o{ ReviewFile : "contains"
    ReviewFile ||--o{ ReviewComment : "has many"
```

---

## Key Files to Create/Modify

### Backend New Files
- `backend/src/database/connection.ts` - PostgreSQL connection pool
- `backend/src/database/migrations/` - Database migration scripts
- `backend/src/models/PersistentRepository.ts` - Persistent repo model
- `backend/src/models/ReviewSession.ts` - Review session model
- `backend/src/models/ReviewFile.ts` - Review file model
- `backend/src/models/ReviewComment.ts` - Inline comment model
- `backend/src/services/PersistentRepositoryService.ts` - Persistent storage logic
- `backend/src/services/ReviewSessionService.ts` - Review session logic
- `backend/src/services/DiffService.ts` - Git diff generation
- `backend/src/controllers/PersistentRepositoryController.ts` - API endpoints
- `backend/src/controllers/ReviewSessionController.ts` - Review session endpoints
- `backend/src/routes/persistentRepo.routes.ts` - Route definitions
- `backend/src/routes/reviewSession.routes.ts` - Route definitions
- `backend/Dockerfile` - Backend container definition
- `backend/Agents.md` - Backend documentation for agents

### Frontend New Files
- `frontend/src/components/DiffView.tsx` - Unified diff viewer
- `frontend/src/components/InlineComment.tsx` - Inline AI comment
- `frontend/src/components/ReviewSessionView.tsx` - Review session page
- `frontend/src/components/ReviewSessionList.tsx` - List of review sessions
- `frontend/src/components/BranchSelector.tsx` - Branch selection UI
- `frontend/src/components/PersistentRepoManager.tsx` - Persistent repo management
- `frontend/src/services/ReviewSessionService.ts` - Review session API client
- `frontend/src/services/PersistentRepoService.ts` - Persistent repo API client
- `frontend/src/hooks/useReviewSession.ts` - Review session state
- `frontend/src/types/reviewSession.types.ts` - TypeScript types
- `frontend/Dockerfile` - Frontend container definition
- `frontend/Agents.md` - Frontend documentation for agents

### Root Files
- `docker-compose.yml` - Docker Compose configuration with profiles
- `.env.example` - Environment variable template
- `DOCKER.md` - Docker setup documentation
- `CODING_GUIDELINES.md` - Coding standards for agents

---

## Detailed Step-by-Step Execution Plan

**IMPORTANT**: After completing each step, commit the changes with an appropriate message before proceeding. Then, the agent will ask for your confirmation to proceed to the next step.

---

### Phase 1: Docker & PostgreSQL Setup

#### Step 1: Create Environment Configuration
**Deliverable**: `.env.example` file with all required variables
- Create `.env.example` with:
  - `DATABASE_URL=postgresql://hellbender:password@postgres:5432/hellbender`
  - `POSTGRES_USER=hellbender`
  - `POSTGRES_PASSWORD=password`
  - `POSTGRES_DB=hellbender`
  - `PERSISTENT_REPOS_PATH=/data/repos`
  - `OPENROUTER_API_KEY=your-key-here`
  - `ENCRYPTION_KEY=generate-a-32-byte-hex-key`
  - `GITHUB_ACCESS_TOKEN=optional-for-private-repos`
  - `NODE_ENV=development`
- **Checkpoint**: File exists with all variables documented
- **Ask user**: "Step 1 complete. Environment template created. Proceed to Step 2?"

#### Step 2: Create Docker Compose Configuration
**Deliverable**: `docker-compose.yml` with dev and prod profiles
- Create `docker-compose.yml` with services:
  - `postgres`: PostgreSQL 16 with health checks and volume
  - `backend`: Node.js container (dev: with hot reload, prod: compiled)
  - `frontend`: Vite container (dev: dev server, prod: nginx serving static)
- Define profiles: `dev` and `prod`
- Define volumes: `pg_data`, `repos_data`
- Add network configuration for service communication
- **Checkpoint**: `docker compose config` validates successfully
- **Ask user**: "Step 2 complete. Docker Compose created. Proceed to Step 3?"

#### Step 3: Create Backend Dockerfile
**Deliverable**: Multi-stage `backend/Dockerfile`
- Create `backend/Dockerfile` with:
  - Base stage: Node.js 20 Alpine
  - Dev stage: Install dev dependencies, use nodemon
  - Build stage: Compile TypeScript
  - Prod stage: Only production dependencies + compiled JS
- Add `.dockerignore` for node_modules, dist, etc.
- **Checkpoint**: `docker build -t hellbender-backend ./backend` succeeds
- **Ask user**: "Step 3 complete. Backend Dockerfile created. Proceed to Step 4?"

#### Step 4: Create Frontend Dockerfile
**Deliverable**: Multi-stage `frontend/Dockerfile`
- Create `frontend/Dockerfile` with:
  - Dev stage: Vite dev server
  - Build stage: Vite production build
  - Prod stage: Nginx serving static files
- Create `frontend/nginx.conf` for SPA routing
- Add `.dockerignore`
- **Checkpoint**: `docker build -t hellbender-frontend ./frontend` succeeds
- **Ask user**: "Step 4 complete. Frontend Dockerfile created. Proceed to Step 5?"

#### Step 5: Create Docker Documentation
**Deliverable**: `DOCKER.md` with complete setup instructions
- Document prerequisites (Docker, Docker Compose)
- Document environment setup (copy .env.example)
- Document dev mode: `docker compose --profile dev up`
- Document prod mode: `docker compose --profile prod up`
- Document common commands (logs, rebuild, database access)
- Document troubleshooting tips
- **Checkpoint**: Documentation is clear and complete
- **Ask user**: "Step 5 complete. Docker documentation created. Proceed to Step 6?"

---

### Phase 2: Database Layer

#### Step 6: Add PostgreSQL Dependencies
**Deliverable**: PostgreSQL client added to backend
- Add `pg` and `@types/pg` to `backend/package.json`
- **Checkpoint**: `npm install` succeeds
- **Ask user**: "Step 6 complete. PostgreSQL dependencies added. Proceed to Step 7?"

#### Step 7: Create Database Connection Module
**Deliverable**: `backend/src/database/connection.ts`
- Create connection pool using `pg.Pool`
- Add connection retry logic for Docker startup
- Add health check query function
- Export typed query helpers
- Add JSDoc comments explaining connection pooling
- **Checkpoint**: Connection module compiles
- **Ask user**: "Step 7 complete. Database connection module created. Proceed to Step 8?"

#### Step 8: Create Database Migration System
**Deliverable**: Migration runner and initial migration
- Create `backend/src/database/migrations/` directory
- Create `backend/src/database/migrate.ts` - Migration runner
- Create migration `001_initial_schema.sql`:
  - `persistent_repositories` table
  - `review_sessions` table
  - `review_files` table
  - `review_comments` table
  - Indexes for foreign keys
- Add `db:migrate` script to package.json
- **Checkpoint**: Migration runs without errors on fresh database
- **Ask user**: "Step 8 complete. Migration system created. Proceed to Step 9?"

#### Step 9: Write Migration System Tests
**Deliverable**: Tests for migration system
- Create `backend/src/__tests__/database/migrate.test.ts`
- Test migration runner creates tables
- Test migration is idempotent (can run multiple times)
- Test rollback functionality (if implemented)
- **Checkpoint**: All tests pass
- **Ask user**: "Step 9 complete. Migration tests written. Proceed to Step 10?"

---

### Phase 3: Persistent Repository Feature

#### Step 10: Create PersistentRepository Model
**Deliverable**: `backend/src/models/PersistentRepository.ts`
- Define `PersistentRepository` interface:
  - `id: string` (UUID)
  - `name: string`
  - `url: string`
  - `defaultBranch: string`
  - `storagePath: string`
  - `createdAt: Date`
  - `lastSyncedAt: Date | null`
- Add factory function for creating from DB row
- Add JSDoc comments
- **Checkpoint**: Model compiles
- **Ask user**: "Step 10 complete. PersistentRepository model created. Proceed to Step 11?"

#### Step 11: Create PersistentRepositoryService
**Deliverable**: `backend/src/services/PersistentRepositoryService.ts`
- Implement methods:
  - `create(url, name?, branch?)` - Clone repo to persistent storage, save to DB
  - `getAll()` - List all persistent repos
  - `getById(id)` - Get single repo
  - `sync(id)` - Pull latest changes
  - `delete(id)` - Remove from storage and DB
  - `getBranches(id)` - List available branches
- Use `PERSISTENT_REPOS_PATH` from environment
- **MUST preserve**: Existing clone/sync logic from RepositoryService
- Add detailed comments explaining each method
- **Checkpoint**: Service compiles
- **Ask user**: "Step 11 complete. PersistentRepositoryService created. Proceed to Step 12?"

#### Step 12: Write PersistentRepositoryService Tests
**Deliverable**: Comprehensive unit tests
- Create `backend/src/__tests__/services/PersistentRepositoryService.test.ts`
- Test `create()` clones repo and saves to DB
- Test `getAll()` returns all repos
- Test `sync()` updates repo
- Test `delete()` removes from both storage and DB
- Test `getBranches()` returns branch list
- Mock git operations and database
- **Checkpoint**: All tests pass
- **Ask user**: "Step 12 complete. PersistentRepositoryService tests written. Proceed to Step 13?"

#### Step 13: Create PersistentRepositoryController
**Deliverable**: `backend/src/controllers/PersistentRepositoryController.ts`
- Implement endpoints:
  - `POST /` - Create new persistent repo
  - `GET /` - List all repos
  - `GET /:id` - Get single repo
  - `POST /:id/sync` - Sync repo
  - `DELETE /:id` - Delete repo
  - `GET /:id/branches` - Get branches
- Add request validation
- Add error handling with proper HTTP codes
- **Checkpoint**: Controller compiles
- **Ask user**: "Step 13 complete. PersistentRepositoryController created. Proceed to Step 14?"

#### Step 14: Create Persistent Repository Routes
**Deliverable**: `backend/src/routes/persistentRepo.routes.ts`
- Mount controller methods to routes
- Register routes in server.ts at `/api/persistent-repos`
- **Checkpoint**: Routes compile and register
- **Ask user**: "Step 14 complete. Persistent repo routes created. Proceed to Step 15?"

#### Step 15: Write Controller Integration Tests
**Deliverable**: API integration tests
- Create `backend/src/__tests__/integration/persistentRepo.integration.test.ts`
- Test all endpoints with supertest
- Verify HTTP status codes and response shapes
- **Checkpoint**: All integration tests pass
- **Ask user**: "Step 15 complete. Controller integration tests written. Proceed to Step 16?"

---

### Phase 4: Review Session Feature (Backend)

#### Step 16: Create Review Session Models
**Deliverable**: TypeScript models for review sessions
- Create `backend/src/models/ReviewSession.ts`:
  - `id`, `repositoryId`, `name`, `sourceBranch`, `targetBranch`
  - `modelId`, `status` (pending/in_progress/completed/failed)
  - `overallScore`, `createdAt`, `completedAt`
- Create `backend/src/models/ReviewFile.ts`:
  - `id`, `reviewSessionId`, `filePath`, `score`, `summary`
  - `diffHunks` (JSON array of diff chunks)
- Create `backend/src/models/ReviewComment.ts`:
  - `id`, `reviewFileId`, `lineNumber`, `commentType`, `severity`
  - `message`, `codeSnippet`, `suggestion`
- **Checkpoint**: All models compile
- **Ask user**: "Step 16 complete. Review session models created. Proceed to Step 17?"

#### Step 17: Create DiffService
**Deliverable**: `backend/src/services/DiffService.ts`
- Implement methods:
  - `getFileDiff(repoPath, sourceBranch, targetBranch, filePath)` - Get unified diff
  - `parseUnifiedDiff(diffString)` - Parse into structured hunks
  - `getChangedFilesList(repoPath, sourceBranch, targetBranch)` - List changed files
- Output format for unified diff view:
  - Array of hunks with line numbers, change type (+/-/context), content
- Add comments explaining diff format
- **Checkpoint**: Service compiles
- **Ask user**: "Step 17 complete. DiffService created. Proceed to Step 18?"

#### Step 18: Write DiffService Tests
**Deliverable**: DiffService unit tests
- Create `backend/src/__tests__/services/DiffService.test.ts`
- Test diff parsing with various scenarios
- Test added/removed/modified lines
- Test multi-hunk diffs
- **Checkpoint**: All tests pass
- **Ask user**: "Step 18 complete. DiffService tests written. Proceed to Step 19?"

#### Step 19: Create ReviewSessionService
**Deliverable**: `backend/src/services/ReviewSessionService.ts`
- Implement methods:
  - `create(repoId, name, sourceBranch, targetBranch, modelId)` - Create session
  - `getAll(repoId?)` - List sessions, optionally filter by repo
  - `getById(id)` - Get session with files and comments
  - `runAnalysis(id)` - Execute AI review on changed files
  - `delete(id)` - Delete session and all related data
- Analysis flow:
  1. Get changed files from DiffService
  2. For each file, get diff and content
  3. Call AnalysisService with context about changes
  4. Convert AI issues to ReviewComments with line numbers
  5. Save to database
- **Checkpoint**: Service compiles
- **Ask user**: "Step 19 complete. ReviewSessionService created. Proceed to Step 20?"

#### Step 20: Modify AnalysisService for Diff Context
**Deliverable**: Enhanced AnalysisService
- Add new method: `analyzeCodeWithDiff(content, filePath, model, diffContext)`
- Modify prompt to focus on changes:
  - Include diff context in prompt
  - Ask AI to focus on changed lines
  - Request line numbers relative to new file
- Keep existing `analyzeCode()` method for backward compatibility
- **Checkpoint**: Service compiles, existing tests still pass
- **Ask user**: "Step 20 complete. AnalysisService enhanced. Proceed to Step 21?"

#### Step 21: Write ReviewSessionService Tests
**Deliverable**: Comprehensive unit tests
- Create `backend/src/__tests__/services/ReviewSessionService.test.ts`
- Test session creation
- Test analysis flow with mocked AI responses
- Test comment creation with correct line numbers
- Test error handling for failed analyses
- **Checkpoint**: All tests pass
- **Ask user**: "Step 21 complete. ReviewSessionService tests written. Proceed to Step 22?"

#### Step 22: Create ReviewSessionController
**Deliverable**: `backend/src/controllers/ReviewSessionController.ts`
- Implement endpoints:
  - `POST /` - Create new review session
  - `GET /` - List sessions (with optional repo filter)
  - `GET /:id` - Get session with files and comments
  - `POST /:id/analyze` - Run AI analysis
  - `DELETE /:id` - Delete session
- Add validation and error handling
- **Checkpoint**: Controller compiles
- **Ask user**: "Step 22 complete. ReviewSessionController created. Proceed to Step 23?"

#### Step 23: Create Review Session Routes
**Deliverable**: `backend/src/routes/reviewSession.routes.ts`
- Mount controller methods
- Register at `/api/review-sessions` in server.ts
- **Checkpoint**: Routes compile and register
- **Ask user**: "Step 23 complete. Review session routes created. Proceed to Step 24?"

#### Step 24: Write Review Session Integration Tests
**Deliverable**: End-to-end API tests
- Create `backend/src/__tests__/integration/reviewSession.integration.test.ts`
- Test full flow: create repo -> create session -> run analysis -> get results
- Verify response shapes match expected types
- **Checkpoint**: All integration tests pass
- **Ask user**: "Step 24 complete. Review session integration tests written. Proceed to Step 25?"

---

### Phase 5: Frontend - Persistent Repositories

#### Step 25: Create Frontend Types
**Deliverable**: `frontend/src/types/reviewSession.types.ts`
- Define all TypeScript interfaces matching backend models:
  - `PersistentRepository`
  - `ReviewSession`
  - `ReviewFile`
  - `ReviewComment`
  - `DiffHunk`, `DiffLine`
- Export request/response types
- **Checkpoint**: Types compile
- **Ask user**: "Step 25 complete. Frontend types created. Proceed to Step 26?"

#### Step 26: Create PersistentRepoService
**Deliverable**: `frontend/src/services/PersistentRepoService.ts`
- Extend ApiClient
- Implement methods matching backend endpoints
- Add TypeScript types for all methods
- **Checkpoint**: Service compiles
- **Ask user**: "Step 26 complete. PersistentRepoService created. Proceed to Step 27?"

#### Step 27: Create PersistentRepoManager Component
**Deliverable**: `frontend/src/components/PersistentRepoManager.tsx`
- UI for:
  - Adding new persistent repos (URL input, branch, name)
  - Listing all persistent repos
  - Syncing repos
  - Deleting repos
- Follow DESIGN.md:
  - Use `text-[10px] font-black uppercase tracking-[0.3em]` for headers
  - Use `bg-zinc-950/20` for glassmorphism
  - Use `border-zinc-800` for borders
- **Checkpoint**: Component compiles
- **Ask user**: "Step 27 complete. PersistentRepoManager created. Proceed to Step 28?"

#### Step 28: Write PersistentRepoManager Tests
**Deliverable**: Component tests
- Create `frontend/src/__tests__/components/PersistentRepoManager.test.tsx`
- Test rendering with empty state
- Test adding a repo
- Test delete confirmation
- **Checkpoint**: All tests pass
- **Ask user**: "Step 28 complete. PersistentRepoManager tests written. Proceed to Step 29?"

---

### Phase 6: Frontend - Review Sessions & Diff View

#### Step 29: Create ReviewSessionService
**Deliverable**: `frontend/src/services/ReviewSessionService.ts`
- Extend ApiClient
- Implement all review session API methods
- Add proper TypeScript types
- **Checkpoint**: Service compiles
- **Ask user**: "Step 29 complete. ReviewSessionService created. Proceed to Step 30?"

#### Step 30: Create BranchSelector Component
**Deliverable**: `frontend/src/components/BranchSelector.tsx`
- Dropdown for selecting source and target branches
- Fetch branches from API
- Visual indication of selected branches
- Follow DESIGN.md styling
- **Checkpoint**: Component compiles
- **Ask user**: "Step 30 complete. BranchSelector created. Proceed to Step 31?"

#### Step 31: Create DiffView Component
**Deliverable**: `frontend/src/components/DiffView.tsx`
- Unified diff display following DESIGN.md:
  - Use `font-mono text-[11px]` for code
  - Green background for additions (`bg-green-500/10`)
  - Red background for deletions (`bg-red-500/10`)
  - Line numbers in `text-zinc-600`
  - Proper line highlighting
- Accept props: `diffHunks`, `comments`, `onLineClick`
- Show inline AI comments anchored to specific lines
- **Checkpoint**: Component compiles
- **Ask user**: "Step 31 complete. DiffView created. Proceed to Step 32?"

#### Step 32: Create InlineComment Component
**Deliverable**: `frontend/src/components/InlineComment.tsx`
- Display AI comment below code line (GitLab-style)
- Show:
  - Severity indicator (color-coded bar)
  - Issue type badge
  - Message
  - Code suggestion (if available)
- Follow DESIGN.md:
  - Use `bg-card/50 backdrop-blur-sm` for comment background
  - Severity colors from tokens
- **Checkpoint**: Component compiles
- **Ask user**: "Step 32 complete. InlineComment created. Proceed to Step 33?"

#### Step 33: Write DiffView and InlineComment Tests
**Deliverable**: Component tests
- Create `frontend/src/__tests__/components/DiffView.test.tsx`
- Test diff rendering with various scenarios
- Test comment display at correct lines
- Test line click handling
- **Checkpoint**: All tests pass
- **Ask user**: "Step 33 complete. DiffView tests written. Proceed to Step 34?"

#### Step 34: Create ReviewSessionView Component
**Deliverable**: `frontend/src/components/ReviewSessionView.tsx`
- Main view for a review session:
  - Header with session name, branches, status
  - File list sidebar (changed files)
  - DiffView for selected file
  - Overall score display
- Follow DESIGN.md layout patterns
- Handle loading states with existing LoadingOverlay
- **Checkpoint**: Component compiles
- **Ask user**: "Step 34 complete. ReviewSessionView created. Proceed to Step 35?"

#### Step 35: Create ReviewSessionList Component
**Deliverable**: `frontend/src/components/ReviewSessionList.tsx`
- List all review sessions for a repository
- Show: name, branches, status, score, date
- Actions: view, delete, re-run analysis
- Follow DESIGN.md card styling
- **Checkpoint**: Component compiles
- **Ask user**: "Step 35 complete. ReviewSessionList created. Proceed to Step 36?"

#### Step 36: Create useReviewSession Hook
**Deliverable**: `frontend/src/hooks/useReviewSession.ts`
- Manage review session state
- Methods: createSession, loadSession, runAnalysis
- Handle loading and error states
- **Checkpoint**: Hook compiles
- **Ask user**: "Step 36 complete. useReviewSession hook created. Proceed to Step 37?"

#### Step 37: Write ReviewSessionView Tests
**Deliverable**: Component tests
- Create `frontend/src/__tests__/components/ReviewSessionView.test.tsx`
- Test file selection
- Test diff display
- Test comment rendering
- **Checkpoint**: All tests pass
- **Ask user**: "Step 37 complete. ReviewSessionView tests written. Proceed to Step 38?"

---

### Phase 7: App Integration

#### Step 38: Update App.tsx Layout
**Deliverable**: Modified App.tsx with new navigation
- Add navigation between:
  - Quick Review (existing functionality)
  - Persistent Repos
  - Review Sessions
- Keep existing sidebar for quick review
- Add route/view switching logic
- Preserve all existing functionality
- **Checkpoint**: App compiles, existing features work
- **Ask user**: "Step 38 complete. App.tsx updated. Proceed to Step 39?"

#### Step 39: Integrate New Components
**Deliverable**: Full feature integration
- Connect PersistentRepoManager to main app
- Connect ReviewSessionView
- Wire up navigation between features
- Test all flows work together
- **Checkpoint**: Full application works
- **Ask user**: "Step 39 complete. Integration complete. Proceed to Step 40?"

#### Step 40: Update Frontend Types
**Deliverable**: `frontend/src/types/api.types.ts` updated
- Add new types for persistent repos
- Add new types for review sessions
- Ensure all types match backend responses
- **Checkpoint**: No TypeScript errors in frontend
- **Ask user**: "Step 40 complete. Types updated. Proceed to Step 41?"

---

### Phase 8: Documentation & Agents.md Files

#### Step 41: Create Backend Agents.md
**Deliverable**: `backend/Agents.md`
- Document folder structure
- Explain each service's responsibility
- Document database schema
- Explain API endpoints
- Include code patterns used
- **Checkpoint**: Documentation is comprehensive
- **Ask user**: "Step 41 complete. Backend Agents.md created. Proceed to Step 42?"

#### Step 42: Create Frontend Agents.md
**Deliverable**: `frontend/Agents.md`
- Document component hierarchy
- Explain hooks and their purposes
- Document services and API calls
- Explain styling patterns from DESIGN.md
- **Checkpoint**: Documentation is comprehensive
- **Ask user**: "Step 42 complete. Frontend Agents.md created. Proceed to Step 43?"

#### Step 43: Create Folder-Level Agents.md Files
**Deliverable**: Agents.md in each major folder
- `backend/src/controllers/Agents.md`
- `backend/src/services/Agents.md`
- `backend/src/models/Agents.md`
- `backend/src/database/Agents.md`
- `frontend/src/components/Agents.md`
- `frontend/src/hooks/Agents.md`
- `frontend/src/services/Agents.md`
- **Checkpoint**: All folders have documentation
- **Ask user**: "Step 43 complete. Folder Agents.md files created. Proceed to Step 44?"

#### Step 44: Create CODING_GUIDELINES.md
**Deliverable**: Root-level coding standards document
- TypeScript best practices
- Commenting standards
- Error handling patterns
- Testing requirements
- Git commit message format
- PR/Review process
- **Checkpoint**: Guidelines are clear and actionable
- **Ask user**: "Step 44 complete. Coding guidelines created. Proceed to Step 45?"

---

### Phase 9: Final Testing & Verification

#### Step 45: Run All Backend Tests
**Deliverable**: All backend tests passing
- Run `cd backend && npm test`
- Fix any failures
- Verify coverage is adequate
- **Checkpoint**: All tests pass
- **Ask user**: "Step 45 complete. Backend tests pass. Proceed to Step 46?"

#### Step 46: Run All Frontend Tests
**Deliverable**: All frontend tests passing
- Run `cd frontend && npm test`
- Fix any failures
- **Checkpoint**: All tests pass
- **Ask user**: "Step 46 complete. Frontend tests pass. Proceed to Step 47?"

#### Step 47: Docker Integration Test
**Deliverable**: Full Docker stack works
- Run `docker compose --profile dev up --build`
- Verify all containers start
- Verify database migrations run
- Verify API is accessible
- Verify frontend loads
- **Checkpoint**: Docker stack is healthy
- **Ask user**: "Step 47 complete. Docker integration verified. Proceed to Step 48?"

#### Step 48: Manual End-to-End Testing
**Deliverable**: All features verified working
- Test existing quick review (must still work)
- Test persistent repo creation
- Test branch comparison review session
- Test inline comments display
- Test loading overlay still works
- **Checkpoint**: All features work as expected
- **Ask user**: "Step 48 complete. Manual testing done. Proceed to Step 49?"

#### Step 49: Production Docker Test
**Deliverable**: Production profile works
- Run `docker compose --profile prod up --build`
- Verify frontend serves via nginx
- Verify backend uses compiled JS
- Verify all features work
- **Checkpoint**: Production mode works
- **Ask user**: "Step 49 complete. Production verified. Refactoring complete!"

---

## Testing Requirements

1. **All existing functionality MUST be preserved** - Quick review must still work
2. **Database operations must be tested** - Use test database
3. **API endpoints must match expected shapes** - Integration tests verify this
4. **UI components must render correctly** - React Testing Library tests
5. **Docker containers must be healthy** - Health checks in compose file

---

## Coding Guidelines Summary

1. **Comments**: Every function must have JSDoc comments explaining purpose
2. **Error Handling**: Always use try/catch with meaningful error messages
3. **Types**: No `any` types unless absolutely necessary with comment explaining why
4. **Tests**: Every service/component must have corresponding test file
5. **Commits**: Atomic commits with descriptive messages
