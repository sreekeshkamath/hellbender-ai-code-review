# NOTE:
This application was entirely Vibe Coded! Use it at your own risk and preferably not in a sensitive or production codebase.

# AI Code Reviewer

An AI-powered code review application that analyzes your codebase for issues, vulnerabilities, and best practices using OpenRouter models.

## Features

- **Repository Analysis**: Clone and analyze any GitHub repository
- **Model Selection**: Choose from multiple AI models (Claude, GPT-4, Gemini, DeepSeek)
- **Automated Review**: AI analyzes code for bugs, performance issues, and security vulnerabilities
- **Vulnerability Detection**: Built-in pattern matching for common security issues
- **Scoring System**: Overall code quality score (0-100) for each file
- **Activity Log**: Real-time visibility into what's happening (API calls, prompts, git operations)
- **Saved Repositories**: Securely save and quick-load frequently reviewed repos
- **Dark Mode**: Full-screen dark theme interface

## Storage

- **Cloned Repositories**: Stored in `temp/repos/{uuid}/` - not version controlled, auto-cleaned on clear
- **Saved Repositories**: Encrypted storage in `data/repos.json.enc` with AES-256 encryption

## Prerequisites

- Node.js 18+
- npm or yarn
- OpenRouter API key (get one at https://openrouter.ai/)

## Installation

1. Clone the repository:
```bash
cd hellbender-ai-code-review
```

2. Install all dependencies:
```bash
npm run install:all
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your OpenRouter API key:
```
OPENROUTER_API_KEY=your_api_key_here
```

## Running the Application

### Development Mode (both servers)

```bash
npm run dev
```

This will start:
- Backend server at http://localhost:3001
- Frontend at http://localhost:5173

### Individual Servers

Backend only:
```bash
npm run dev
```

Frontend only:
```bash
npm run client
```

### Production Build

```bash
npm run build
npm start
```

## Usage

1. Open the frontend in your browser (http://localhost:5173)
2. Enter a GitHub repository URL (e.g., `https://github.com/facebook/react`)
3. Optionally add a GitHub access token for private repositories
4. Click "Clone Repository"
5. Select the AI model you want to use for review
6. Choose which files to analyze
7. Click "Start Review" to begin the analysis
8. Review the results showing scores, issues, and vulnerabilities

## Available Models

| Model | Provider |
|-------|----------|
| Claude 3.5 Sonnet | Anthropic |
| Claude 3 Haiku | Anthropic |
| GPT-4o | OpenAI |
| GPT-4o Mini | OpenAI |
| Gemini 2.0 Flash | Google |
| DeepSeek Chat | DeepSeek |

## Vulnerability Detection

The application automatically detects common security issues including:

- Hardcoded credentials (passwords, API keys, secrets)
- Code injection risks (eval, exec)
- XSS vulnerabilities
- SQL injection patterns
- Weak hashing algorithms (MD5)
- Insecure protocols (HTTP)
- Debug code left in production

## API Endpoints

### GET /health
Health check endpoint.

### POST /api/repo/clone
Clone a repository for analysis.

Request body:
```json
{
  "repoUrl": "https://github.com/user/repo",
  "accessToken": "optional_github_token"
}
```

Response:
```json
{
  "repoId": "uuid",
  "repoPath": "/path/to/repo",
  "files": [{ "path": "src/index.js", "size": 1024 }]
}
```

### GET /api/review/models
Get available AI models.

### POST /api/review/analyze
Analyze selected files.

Request body:
```json
{
  "repoId": "uuid",
  "model": "anthropic/claude-3.5-sonnet",
  "files": [{ "path": "src/index.js" }]
}
```

### GET /api/saved-repos
Get all saved repositories.

### POST /api/saved-repos
Save a repository for quick access.

### DELETE /api/saved-repos/:id
Delete a saved repository.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| OPENROUTER_API_KEY | Your OpenRouter API key | Required |
| GITHUB_ACCESS_TOKEN | GitHub token for private repos | Optional |
| ENCRYPTION_KEY | 32+ char key for saved repos encryption | Required for saved repos |
| PORT | Backend server port | 3001 |
| SITE_URL | Site URL for OpenRouter referrer | http://localhost:5173 |

## Architecture

This application uses a monorepo structure:

```
hellbender-ai-code-review/
├── server.js              # Express server entry point (CommonJS)
├── routes/                # Route handlers
│   ├── repo.js           # Repository cloning/management
│   ├── review.js         # Code review endpoints
│   └── savedRepos.js     # Saved repositories management
├── utils/                 # Utility functions
│   ├── openrouter.js     # OpenRouter API client
│   ├── repoMapping.js    # Repository ID mapping
│   └── repoStore.js      # Encrypted repository storage
├── backend/               # TypeScript backend (alternative implementation)
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── services/     # Business logic classes
│   │   ├── models/       # TypeScript interfaces
│   │   ├── routes/       # Express route definitions
│   │   └── utils/        # Helper functions
│   └── package.json
├── frontend/              # React TypeScript application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API client classes
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Helper functions
│   └── package.json
├── data/                  # Data storage
│   └── repo-mappings.json # Repository ID mappings
├── temp/                  # Temporary cloned repositories
└── package.json
```

## Tech Stack

- **Backend**: Node.js, Express, simple-git
- **Frontend**: React, TypeScript, Vite, Axios, Tailwind CSS
- **AI**: OpenRouter API (access to multiple models)
- **Testing**: Jest
- **Styling**: Tailwind CSS, Radix UI components

## Scripts

| Script | Description |
|--------|-------------|
| `npm run install:all` | Install all dependencies (root, backend, frontend) |
| `npm run dev` | Start both backend and frontend in development mode |
| `npm run client` | Start only the frontend in development mode |
| `npm run build` | Build the frontend for production |
| `npm start` | Start the production server |

## License

MIT
