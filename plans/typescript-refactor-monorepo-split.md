---
name: TypeScript Refactor & Monorepo Split
overview: Refactor the codebase to TypeScript, reorganize into a clear monorepo structure (frontend/ and backend/), and implement full OOP architecture with classes for controllers, services, and models to improve maintainability and debuggability.
todos:
  - id: backend-structure
    content: Create backend directory structure and TypeScript configuration
    status: pending
  - id: backend-models
    content: Create TypeScript models and interfaces for all data structures
    status: pending
    dependencies:
      - backend-structure
  - id: backend-services
    content: Create service classes (RepositoryService, AnalysisService, EncryptionService, etc.)
    status: pending
    dependencies:
      - backend-models
  - id: backend-controllers
    content: Create controller classes for all API endpoints
    status: pending
    dependencies:
      - backend-services
  - id: backend-routes
    content: Create route definitions using controllers
    status: pending
    dependencies:
      - backend-controllers
  - id: backend-server
    content: Refactor server.js to TypeScript server.ts with new structure
    status: pending
    dependencies:
      - backend-routes
  - id: frontend-structure
    content: Reorganize client/ to frontend/ and create TypeScript configuration
    status: pending
  - id: frontend-types
    content: Create TypeScript types and interfaces for frontend
    status: pending
    dependencies:
      - frontend-structure
  - id: frontend-services
    content: Create API service classes for frontend
    status: pending
    dependencies:
      - frontend-types
  - id: frontend-components
    content: Break down App.jsx into smaller TypeScript components
    status: pending
    dependencies:
      - frontend-services
  - id: frontend-hooks
    content: Create custom React hooks for state management
    status: pending
    dependencies:
      - frontend-components
  - id: backend-test-setup
    content: Set up Jest testing framework for backend with TypeScript support
    status: pending
    dependencies:
      - backend-server
  - id: backend-unit-tests
    content: Write comprehensive unit tests for all backend services and controllers
    status: pending
    dependencies:
      - backend-test-setup
  - id: backend-integration-tests
    content: Write integration tests for all API endpoints to verify functionality
    status: pending
    dependencies:
      - backend-unit-tests
  - id: frontend-test-setup
    content: Set up Vitest testing framework for frontend with React Testing Library
    status: pending
    dependencies:
      - frontend-hooks
  - id: frontend-component-tests
    content: Write component tests for all React components to verify UI functionality
    status: pending
    dependencies:
      - frontend-test-setup
  - id: frontend-service-tests
    content: Write tests for all frontend service classes and hooks
    status: pending
    dependencies:
      - frontend-test-setup
  - id: e2e-verification
    content: Perform end-to-end manual testing and verify all functionality works as before
    status: pending
    dependencies:
      - backend-integration-tests
      - frontend-component-tests
      - frontend-service-tests
  - id: migration-testing
    content: Test complete migration, fix TypeScript errors, verify all tests pass
    status: pending
    dependencies:
      - e2e-verification
  - id: documentation
    content: Update README and add architecture documentation
    status: pending
    dependencies:
      - migration-testing
---

# TypeScript Refactor & Monorepo Architecture Plan

## Overview

This plan will transform the JavaScript codebase into a well-structured TypeScript monorepo with clear separation between frontend and backend, implementing full OOP architecture for better maintainability and debugging.

**CRITICAL REQUIREMENT: All existing functionality MUST be preserved and working.** Every feature, API endpoint, UI interaction, and business logic must work exactly as before the refactoring. The refactoring is purely structural - no functionality should be lost or changed.

## Current State Analysis

**Backend:**
- `server.js` - Express server entry point
- `routes/` - Express route handlers (repo.js, review.js, savedRepos.js)
- `utils/` - Utility modules (openrouter.js, repoStore.js, repoMapping.js)
- All JavaScript, no type safety

**Frontend:**
- `client/src/App.jsx` - Monolithic 900+ line component
- `client/src/components/ui/` - UI components
- All JavaScript/JSX, no type safety

## Target Architecture

```
hellbender-ai-code-review/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Business logic classes
│   │   ├── models/             # Data models/interfaces
│   │   ├── routes/             # Express route definitions
│   │   ├── utils/              # Helper functions
│   │   ├── config/             # Configuration
│   │   └── server.ts           # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API client classes
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Helper functions
│   │   └── App.tsx             # Main component
│   ├── package.json
│   └── tsconfig.json
├── package.json                # Root workspace config
└── README.md
```

## Concrete Step-by-Step Execution Plan

**IMPORTANT**: After completing each step, commit the changes with an appropriate message before proceeding. Then, the agent will ask for your confirmation to proceed to the next step. This ensures context is maintained and you can review progress incrementally.

### Step 1: Create Backend Directory Structure
**Deliverable**: Empty directory structure created
- Create `backend/src/` directory
- Create subdirectories: `controllers/`, `services/`, `models/`, `routes/`, `utils/`, `config/`
- Create `backend/src/__tests__/` directory with subdirectories: `services/`, `controllers/`, `integration/`
- **Checkpoint**: Verify directory structure exists
- **Ask user**: "Step 1 complete. Directory structure created. Proceed to Step 2?"

### Step 2: Backend TypeScript Configuration
**Deliverable**: TypeScript configured for backend
- Create `backend/tsconfig.json` with strict settings
- Create `backend/package.json` (copy from root, update for backend)
- Install TypeScript dependencies: `typescript`, `@types/node`, `@types/express`, `@types/uuid`
- Add build scripts: `build`, `start`, `dev`
- **Checkpoint**: Run `cd backend && npm install` to verify dependencies install
- **Ask user**: "Step 2 complete. TypeScript configured. Proceed to Step 3?"

### Step 3: Create Backend Models - Part 1 (Core Types)
**Deliverable**: Core TypeScript interfaces created
- Create `backend/src/models/FileInfo.ts` with `FileInfo` interface (path, size)
- Create `backend/src/models/Vulnerability.ts` with `Vulnerability` interface (line, type, severity, code)
- **Checkpoint**: Verify files compile with `tsc --noEmit`
- **Ask user**: "Step 3 complete. Core models created. Proceed to Step 4?"

### Step 4: Create Backend Models - Part 2 (Repository Types)
**Deliverable**: Repository-related types created
- Create `backend/src/models/Repository.ts` with `Repository` interface (repoId, repoPath, files, cached)
- Create `backend/src/models/SavedRepository.ts` with `SavedRepository` interface (id, name, url, branch, etc.)
- **Checkpoint**: Verify files compile
- **Ask user**: "Step 4 complete. Repository models created. Proceed to Step 5?"

### Step 5: Create Backend Models - Part 3 (Analysis Types)
**Deliverable**: Analysis-related types created
- Create `backend/src/models/AnalysisResult.ts` with interfaces: `Issue`, `AnalysisResult`, `AnalysisSummary`
- Ensure types match existing API response structure exactly
- **Checkpoint**: Verify files compile and types are correct
- **Ask user**: "Step 5 complete. Analysis models created. Proceed to Step 6?"

### Step 6: Create Configuration Files
**Deliverable**: Config classes created
- Create `backend/src/config/constants.ts` with application constants
- Create `backend/src/config/environment.ts` with environment variable validation
- **Checkpoint**: Verify files compile
- **Ask user**: "Step 6 complete. Configuration created. Proceed to Step 7?"

### Step 7: Create FileService
**Deliverable**: FileService class with file operations
- Create `backend/src/services/FileService.ts`
- Port `getAllFiles` function from `routes/repo.js` as class method
- **MUST preserve**: Directory traversal, .git exclusion, file path handling
- **Checkpoint**: Verify class compiles, test manually if possible
- **Ask user**: "Step 7 complete. FileService created. Proceed to Step 8?"

### Step 8: Create EncryptionService
**Deliverable**: EncryptionService class
- Create `backend/src/services/EncryptionService.ts`
- Port encryption/decryption logic from `utils/repoStore.js`
- **MUST preserve**: AES-256-CBC, IV generation, key handling
- **Checkpoint**: Verify class compiles
- **Ask user**: "Step 8 complete. EncryptionService created. Proceed to Step 9?"

### Step 9: Create RepositoryMappingService
**Deliverable**: RepositoryMappingService class
- Create `backend/src/services/RepositoryMappingService.ts`
- Port mapping logic from `utils/repoMapping.js`
- **MUST preserve**: URL normalization, branch handling, persistence
- **Checkpoint**: Verify class compiles
- **Ask user**: "Step 9 complete. RepositoryMappingService created. Proceed to Step 10?"

### Step 10: Create VulnerabilityScanner
**Deliverable**: VulnerabilityScanner class
- Create `backend/src/services/VulnerabilityScanner.ts`
- Port vulnerability detection from `utils/openrouter.js` (detectVulnerabilities function)
- **MUST preserve**: All patterns, line numbers, context extraction
- **Checkpoint**: Verify class compiles, patterns match original
- **Ask user**: "Step 10 complete. VulnerabilityScanner created. Proceed to Step 11?"

### Step 11: Create AnalysisService
**Deliverable**: AnalysisService class
- Create `backend/src/services/AnalysisService.ts`
- Port OpenRouter integration from `utils/openrouter.js`
- **MUST preserve**: API calls, prompt structure, response parsing, error handling
- **Checkpoint**: Verify class compiles
- **Ask user**: "Step 11 complete. AnalysisService created. Proceed to Step 12?"

### Step 12: Create SavedRepositoryService
**Deliverable**: SavedRepositoryService class
- Create `backend/src/services/SavedRepositoryService.ts`
- Port CRUD logic from `utils/repoStore.js`
- Use EncryptionService for encryption
- **MUST preserve**: All CRUD operations, lastUsed tracking, sorting
- **Checkpoint**: Verify class compiles
- **Ask user**: "Step 12 complete. SavedRepositoryService created. Proceed to Step 13?"

### Step 13: Create RepositoryService
**Deliverable**: RepositoryService class
- Create `backend/src/services/RepositoryService.ts`
- Port git cloning logic from `routes/repo.js`
- Use FileService, RepositoryMappingService
- **MUST preserve**: Clone, branch support, caching, file listing
- **Checkpoint**: Verify class compiles
- **Ask user**: "Step 13 complete. RepositoryService created. Proceed to Step 14?"

### Step 14: Create RepositoryController
**Deliverable**: RepositoryController class
- Create `backend/src/controllers/RepositoryController.ts`
- Port route handlers from `routes/repo.js`
- Use RepositoryService
- **MUST preserve**: All endpoints, request/response formats
- **Checkpoint**: Verify class compiles
- **Ask user**: "Step 14 complete. RepositoryController created. Proceed to Step 15?"

### Step 15: Create ReviewController
**Deliverable**: ReviewController class
- Create `backend/src/controllers/ReviewController.ts`
- Port route handlers from `routes/review.js`
- Use AnalysisService
- **MUST preserve**: GET /models, POST /analyze formats
- **Checkpoint**: Verify class compiles
- **Ask user**: "Step 15 complete. ReviewController created. Proceed to Step 16?"

### Step 16: Create SavedReposController
**Deliverable**: SavedReposController class
- Create `backend/src/controllers/SavedReposController.ts`
- Port route handlers from `routes/savedRepos.js`
- Use SavedRepositoryService
- **MUST preserve**: All CRUD endpoints
- **Checkpoint**: Verify class compiles
- **Ask user**: "Step 16 complete. SavedReposController created. Proceed to Step 17?"

### Step 17: Create Backend Routes
**Deliverable**: Route definitions using controllers
- Create `backend/src/routes/repository.routes.ts` using RepositoryController
- Create `backend/src/routes/review.routes.ts` using ReviewController
- Create `backend/src/routes/savedRepos.routes.ts` using SavedReposController
- **Checkpoint**: Verify routes compile
- **Ask user**: "Step 17 complete. Routes created. Proceed to Step 18?"

### Step 18: Create Backend Server Entry Point
**Deliverable**: TypeScript server.ts
- Create `backend/src/server.ts`
- Port logic from `server.js`
- Use new route structure
- Add error handling middleware
- **Checkpoint**: Verify server.ts compiles
- **Ask user**: "Step 18 complete. Server created. Proceed to Step 19?"

### Step 19: Test Backend Compilation
**Deliverable**: Backend compiles without errors
- Run `cd backend && npm run build`
- Fix any TypeScript compilation errors
- Verify all imports resolve correctly
- **Checkpoint**: Backend builds successfully
- **Ask user**: "Step 19 complete. Backend compiles. Proceed to Step 20?"

### Step 20: Backend Manual Smoke Test
**Deliverable**: Backend runs and responds
- Start backend server: `cd backend && npm run dev`
- Test health endpoint: `curl http://localhost:3001/health`
- Verify server starts without errors
- **Checkpoint**: Server runs and health check works
- **Ask user**: "Step 20 complete. Backend runs. Proceed to Step 21?"

### Step 21: Create Frontend Directory Structure
**Deliverable**: Frontend structure created
- Rename `client/` to `frontend/`
- Create subdirectories: `components/`, `services/`, `hooks/`, `types/`, `utils/`
- Create `frontend/src/__tests__/` with subdirectories: `components/`, `hooks/`, `services/`
- Move existing UI components to `frontend/src/components/ui/`
- **Checkpoint**: Verify directory structure
- **Ask user**: "Step 21 complete. Frontend structure created. Proceed to Step 22?"

### Step 22: Frontend TypeScript Configuration
**Deliverable**: TypeScript configured for frontend
- Update `frontend/tsconfig.json` for React + TypeScript
- Update `frontend/package.json` (ensure TypeScript deps present)
- Verify Vite config supports TypeScript
- **Checkpoint**: Run `cd frontend && npm install` to verify
- **Ask user**: "Step 22 complete. Frontend TypeScript configured. Proceed to Step 23?"

### Step 23: Create Frontend Types - Part 1 (API Types)
**Deliverable**: API-related TypeScript types
- Create `frontend/src/types/api.types.ts`
- Define request/response types matching backend models
- **Checkpoint**: Verify types compile
- **Ask user**: "Step 23 complete. API types created. Proceed to Step 24?"

### Step 24: Create Frontend Types - Part 2 (Model Types)
**Deliverable**: Frontend model types
- Create `frontend/src/types/models.types.ts`
- Define frontend-specific data models
- **Checkpoint**: Verify types compile
- **Ask user**: "Step 24 complete. Model types created. Proceed to Step 25?"

### Step 25: Create Frontend Types - Part 3 (UI Types)
**Deliverable**: UI component prop types
- Create `frontend/src/types/ui.types.ts`
- Define component prop interfaces
- **Checkpoint**: Verify types compile
- **Ask user**: "Step 25 complete. UI types created. Proceed to Step 26?"

### Step 26: Create ApiClient Base Class
**Deliverable**: Base HTTP client class
- Create `frontend/src/services/ApiClient.ts`
- Implement base HTTP methods (get, post, delete, put)
- Handle error responses
- **Checkpoint**: Verify class compiles
- **Ask user**: "Step 26 complete. ApiClient created. Proceed to Step 27?"

### Step 27: Create Frontend RepositoryService
**Deliverable**: Repository API service
- Create `frontend/src/services/RepositoryService.ts`
- Extend ApiClient
- Implement clone, sync, getFiles methods
- **Checkpoint**: Verify class compiles
- **Ask user**: "Step 27 complete. RepositoryService created. Proceed to Step 28?"

### Step 28: Create Frontend ReviewService
**Deliverable**: Review API service
- Create `frontend/src/services/ReviewService.ts`
- Extend ApiClient
- Implement getModels, analyze methods
- **Checkpoint**: Verify class compiles
- **Ask user**: "Step 28 complete. ReviewService created. Proceed to Step 29?"

### Step 29: Create Frontend SavedReposService
**Deliverable**: Saved repos API service
- Create `frontend/src/services/SavedReposService.ts`
- Extend ApiClient
- Implement CRUD methods
- **Checkpoint**: Verify class compiles
- **Ask user**: "Step 29 complete. SavedReposService created. Proceed to Step 30?"

### Step 30: Convert UI Components to TypeScript
**Deliverable**: All UI components in TypeScript
- Convert `components/ui/*.jsx` to `*.tsx`
- Add proper prop types
- **Checkpoint**: Verify all components compile
- **Ask user**: "Step 30 complete. UI components converted. Proceed to Step 31?"

### Step 31: Create useActivityLog Hook
**Deliverable**: Activity log hook
- Create `frontend/src/hooks/useActivityLog.ts`
- Port activity log logic from App.jsx
- **MUST preserve**: Log entries, timestamps, color coding, clear, 100 entry limit
- **Checkpoint**: Verify hook compiles
- **Ask user**: "Step 31 complete. useActivityLog created. Proceed to Step 32?"

### Step 32: Create useModels Hook
**Deliverable**: Models hook
- Create `frontend/src/hooks/useModels.ts`
- Port model selection logic from App.jsx
- **MUST preserve**: Model fetching, custom models, search, filter
- **Checkpoint**: Verify hook compiles
- **Ask user**: "Step 32 complete. useModels created. Proceed to Step 33?"

### Step 33: Create useRepository Hook
**Deliverable**: Repository hook
- Create `frontend/src/hooks/useRepository.ts`
- Port repository state management from App.jsx
- **MUST preserve**: Clone, sync, file management
- **Checkpoint**: Verify hook compiles
- **Ask user**: "Step 33 complete. useRepository created. Proceed to Step 34?"

### Step 34: Create useAnalysis Hook
**Deliverable**: Analysis hook
- Create `frontend/src/hooks/useAnalysis.ts`
- Port analysis state management from App.jsx
- **MUST preserve**: Analysis flow, results handling
- **Checkpoint**: Verify hook compiles
- **Ask user**: "Step 34 complete. useAnalysis created. Proceed to Step 35?"

### Step 35: Create ActivityLog Component
**Deliverable**: ActivityLog component
- Create `frontend/src/components/ActivityLog.tsx`
- Port activity log UI from App.jsx
- Use useActivityLog hook
- **MUST preserve**: All UI behavior
- **Checkpoint**: Verify component compiles
- **Ask user**: "Step 35 complete. ActivityLog component created. Proceed to Step 36?"

### Step 36: Create SavedReposList Component
**Deliverable**: SavedReposList component
- Create `frontend/src/components/SavedReposList.tsx`
- Port saved repos UI from App.jsx
- **MUST preserve**: Display, load, delete functionality
- **Checkpoint**: Verify component compiles
- **Ask user**: "Step 36 complete. SavedReposList created. Proceed to Step 37?"

### Step 37: Create RepositoryConfig Component
**Deliverable**: RepositoryConfig component
- Create `frontend/src/components/RepositoryConfig.tsx`
- Port repository input UI from App.jsx
- Use useRepository hook
- **MUST preserve**: URL validation, branch input, clone, sync
- **Checkpoint**: Verify component compiles
- **Ask user**: "Step 37 complete. RepositoryConfig created. Proceed to Step 38?"

### Step 38: Create ModelSelector Component
**Deliverable**: ModelSelector component
- Create `frontend/src/components/ModelSelector.tsx`
- Port model selection UI from App.jsx
- Use useModels hook
- **MUST preserve**: Dropdown, search, filter, custom models
- **Checkpoint**: Verify component compiles
- **Ask user**: "Step 38 complete. ModelSelector created. Proceed to Step 39?"

### Step 39: Create FileSelector Component
**Deliverable**: FileSelector component
- Create `frontend/src/components/FileSelector.tsx`
- Port file selection UI from App.jsx
- **MUST preserve**: File list, selection, select all/none
- **Checkpoint**: Verify component compiles
- **Ask user**: "Step 39 complete. FileSelector created. Proceed to Step 40?"

### Step 40: Create ResultCard Component
**Deliverable**: ResultCard component
- Create `frontend/src/components/ResultCard.tsx`
- Port result card UI from App.jsx
- **MUST preserve**: Expand/collapse, issues, vulnerabilities, code snippets
- **Checkpoint**: Verify component compiles
- **Ask user**: "Step 40 complete. ResultCard created. Proceed to Step 41?"

### Step 41: Create AnalysisResults Component
**Deliverable**: AnalysisResults component
- Create `frontend/src/components/AnalysisResults.tsx`
- Port results display UI from App.jsx
- Use ResultCard component
- **MUST preserve**: Score display, scroll/slide modes, navigation
- **Checkpoint**: Verify component compiles
- **Ask user**: "Step 41 complete. AnalysisResults created. Proceed to Step 42?"

### Step 42: Create LoadingOverlay Component
**Deliverable**: LoadingOverlay component
- Create `frontend/src/components/LoadingOverlay.tsx`
- Port loading UI from App.jsx
- **MUST preserve**: Spinner, model name, overlay behavior
- **Checkpoint**: Verify component compiles
- **Ask user**: "Step 42 complete. LoadingOverlay created. Proceed to Step 43?"

### Step 43: Refactor App.tsx
**Deliverable**: Simplified App.tsx using new components
- Refactor `frontend/src/App.tsx` to use all new components
- Use all new hooks
- **MUST preserve**: All state management, layout, sidebar resizing, view modes
- **Checkpoint**: Verify App.tsx compiles
- **Ask user**: "Step 43 complete. App.tsx refactored. Proceed to Step 44?"

### Step 44: Frontend Compilation Test
**Deliverable**: Frontend compiles without errors
- Run `cd frontend && npm run build`
- Fix any TypeScript compilation errors
- Verify all imports resolve
- **Checkpoint**: Frontend builds successfully
- **Ask user**: "Step 44 complete. Frontend compiles. Proceed to Step 45?"

### Step 45: Backend Test Setup
**Deliverable**: Jest configured for backend
- Install: `jest`, `@types/jest`, `ts-jest`, `supertest`, `@types/supertest`
- Create `backend/jest.config.js`
- Add test scripts to `backend/package.json`
- **Checkpoint**: Run `cd backend && npm test` (should show no tests yet)
- **Ask user**: "Step 45 complete. Backend test setup done. Proceed to Step 46?"

### Step 46: Write FileService Tests
**Deliverable**: FileService unit tests
- Create `backend/src/__tests__/services/FileService.test.ts`
- Test getAllFiles method
- Test .git exclusion
- **Checkpoint**: Tests pass
- **Ask user**: "Step 46 complete. FileService tests written. Proceed to Step 47?"

### Step 47: Write EncryptionService Tests
**Deliverable**: EncryptionService unit tests
- Create `backend/src/__tests__/services/EncryptionService.test.ts`
- Test encryption/decryption roundtrip
- Test error handling
- **Checkpoint**: Tests pass
- **Ask user**: "Step 47 complete. EncryptionService tests written. Proceed to Step 48?"

### Step 48: Write VulnerabilityScanner Tests
**Deliverable**: VulnerabilityScanner unit tests
- Create `backend/src/__tests__/services/VulnerabilityScanner.test.ts`
- Test each vulnerability pattern
- Test line numbers and context
- **Checkpoint**: Tests pass
- **Ask user**: "Step 48 complete. VulnerabilityScanner tests written. Proceed to Step 49?"

### Step 49: Write RepositoryMappingService Tests
**Deliverable**: RepositoryMappingService unit tests
- Create `backend/src/__tests__/services/RepositoryMappingService.test.ts`
- Test URL normalization, persistence, existence checking
- **Checkpoint**: Tests pass
- **Ask user**: "Step 49 complete. RepositoryMappingService tests written. Proceed to Step 50?"

### Step 50: Write AnalysisService Tests
**Deliverable**: AnalysisService unit tests
- Create `backend/src/__tests__/services/AnalysisService.test.ts`
- Mock OpenRouter API
- Test prompt generation, response parsing
- **Checkpoint**: Tests pass
- **Ask user**: "Step 50 complete. AnalysisService tests written. Proceed to Step 51?"

### Step 51: Write RepositoryService Tests
**Deliverable**: RepositoryService unit tests
- Create `backend/src/__tests__/services/RepositoryService.test.ts`
- Mock git operations
- Test clone, caching, file listing
- **Checkpoint**: Tests pass
- **Ask user**: "Step 51 complete. RepositoryService tests written. Proceed to Step 52?"

### Step 52: Write SavedRepositoryService Tests
**Deliverable**: SavedRepositoryService unit tests
- Create `backend/src/__tests__/services/SavedRepositoryService.test.ts`
- Test CRUD operations, encryption integration
- **Checkpoint**: Tests pass
- **Ask user**: "Step 52 complete. SavedRepositoryService tests written. Proceed to Step 53?"

### Step 53: Write Controller Tests
**Deliverable**: Controller integration tests
- Create tests for RepositoryController, ReviewController, SavedReposController
- Use supertest to test API endpoints
- **Checkpoint**: All controller tests pass
- **Ask user**: "Step 53 complete. Controller tests written. Proceed to Step 54?"

### Step 54: Write Backend Integration Tests
**Deliverable**: End-to-end API tests
- Create `backend/src/__tests__/integration/api.integration.test.ts`
- Test full flows: clone → analyze → save
- **Checkpoint**: Integration tests pass
- **Ask user**: "Step 54 complete. Backend integration tests written. Proceed to Step 55?"

### Step 55: Frontend Test Setup
**Deliverable**: Vitest configured for frontend
- Install: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- Create `frontend/vitest.config.ts`
- Add test scripts to `frontend/package.json`
- **Checkpoint**: Run `cd frontend && npm test` (should show no tests yet)
- **Ask user**: "Step 55 complete. Frontend test setup done. Proceed to Step 56?"

### Step 56: Write Frontend Service Tests
**Deliverable**: Frontend service tests
- Create tests for ApiClient, RepositoryService, ReviewService, SavedReposService
- Mock API calls
- **Checkpoint**: All service tests pass
- **Ask user**: "Step 56 complete. Frontend service tests written. Proceed to Step 57?"

### Step 57: Write Frontend Hook Tests
**Deliverable**: Frontend hook tests
- Create tests for useRepository, useAnalysis, useActivityLog, useModels
- **Checkpoint**: All hook tests pass
- **Ask user**: "Step 57 complete. Frontend hook tests written. Proceed to Step 58?"

### Step 58: Write Frontend Component Tests
**Deliverable**: Component tests
- Create tests for all components: ActivityLog, SavedReposList, RepositoryConfig, ModelSelector, FileSelector, ResultCard, AnalysisResults, LoadingOverlay
- **Checkpoint**: All component tests pass
- **Ask user**: "Step 58 complete. Frontend component tests written. Proceed to Step 59?"

### Step 59: Manual End-to-End Testing
**Deliverable**: All features verified working
- Start both backend and frontend
- Go through manual testing checklist (from plan)
- Verify every feature works as before
- **Checkpoint**: All manual tests pass
- **Ask user**: "Step 59 complete. Manual testing done. Proceed to Step 60?"

### Step 60: Fix Any Remaining Issues
**Deliverable**: All issues resolved
- Fix any TypeScript errors
- Fix any test failures
- Fix any runtime issues found in manual testing
- **Checkpoint**: Everything works
- **Ask user**: "Step 60 complete. All issues fixed. Proceed to Step 61?"

### Step 61: Update Documentation
**Deliverable**: Documentation updated
- Update README with new structure
- Add architecture documentation
- Document class responsibilities
- **Checkpoint**: Documentation complete
- **Ask user**: "Step 61 complete. Documentation updated. Proceed to Step 62?"

### Step 62: Cleanup Old Files
**Deliverable**: Old JavaScript files removed
- Remove old `server.js`, `routes/*.js`, `utils/*.js`
- Remove old `client/` directory if still exists
- Update .gitignore if needed
- **Checkpoint**: Old files removed, project still works
- **Ask user**: "Step 62 complete. Cleanup done. Refactoring complete!"

## Testing Requirements

1. **All existing functionality MUST be preserved** - verified through comprehensive tests
2. **All API endpoints MUST work identically** - verified through integration tests
3. **All UI interactions MUST work identically** - verified through component tests
4. **All business logic MUST produce same results** - verified through unit tests
5. **No breaking changes** - all tests must pass before removing old code

## Migration Strategy

- **CRITICAL**: Maintain backward compatibility during migration
- **CRITICAL**: All functions must work exactly as before - no functionality changes
- Convert one module at a time
- **Write tests BEFORE refactoring each module** (test-driven refactoring)
- Test after each major component conversion
- Run full test suite after each phase
- Keep old files until new structure is verified working with tests passing
- Verify API contracts remain identical
- Verify UI behavior remains identical
