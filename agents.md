# Agents

This document describes the available agents that can be used with Hellbender.

## General Agent

**Type:** `general`

A general-purpose agent for researching complex questions and executing multi-step tasks.

### Capabilities
- Complex multi-step task execution
- Research and investigation
- Code analysis and problem-solving
- File operations and modifications
- Shell command execution

### Usage

**Note**: The agent architecture described here is a planned enhancement. Currently, Hellbender uses a direct API approach. See the actual API documentation below.

**Planned API** (TODO - not yet implemented):
```json
{
  "subagent_type": "general",
  "description": "Short description of the task",
  "prompt": "Detailed instructions for the agent"
}
```

**Current API** (`POST /api/review/analyze`):
```json
{
  "repoId": "uuid-string",
  "model": "anthropic/claude-3.5-sonnet",
  "files": [
    { "path": "src/index.js", "size": 1024 }
  ]
}
```

## Explore Agent

**Type:** `explore`

Fast agent specialized for exploring codebases.

### Capabilities
- Quick file searches by patterns
- Code content searches
- Codebase analysis
- Finding specific patterns and implementations
- Answering questions about codebase structure

### Thoroughness Levels
- **quick:** Basic searches for common patterns
- **medium:** Moderate exploration across multiple locations
- **very thorough:** Comprehensive analysis across multiple naming conventions

### Usage

**Note**: The agent architecture described here is a planned enhancement. Currently, Hellbender uses a direct API approach.

**Planned API** (TODO - not yet implemented):
```json
{
  "subagent_type": "explore",
  "description": "Analyze codebase structure",
  "prompt": "Find all React components and explain their relationships",
  "thoroughness": "medium"
}
```

**Current API** (`POST /api/review/analyze`):
```json
{
  "repoId": "uuid-string",
  "model": "anthropic/claude-3.5-sonnet",
  "files": [
    { "path": "src/components/App.tsx", "size": 2048 },
    { "path": "src/components/Header.tsx", "size": 512 }
  ]
}
```

## Current API Implementation

Hellbender currently uses a direct review API endpoint. The agent architecture described above is a planned enhancement.

### POST /api/review/analyze

Analyzes selected files from a cloned repository.

**Request Schema:**
- `repoId` (string, required): UUID of the cloned repository
- `model` (string, required): OpenRouter model identifier (e.g., "anthropic/claude-3.5-sonnet")
- `files` (array, required): Array of file objects with:
  - `path` (string, required): Relative path to the file within the repository
  - `size` (number, optional): File size in bytes

**Example Request:**
```json
{
  "repoId": "49af0684-57d2-4ed7-b415-13ea6fc4e017",
  "model": "anthropic/claude-3.5-sonnet",
  "files": [
    { "path": "src/index.js", "size": 1024 },
    { "path": "src/utils/helpers.ts", "size": 2048 }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "file": "src/index.js",
      "score": 85,
      "issues": [...],
      "vulnerabilities": [...],
      "strengths": [...],
      "summary": "..."
    }
  ],
  "summary": {
    "overallScore": 85,
    "totalFiles": 2,
    "vulnerabilityCount": 0,
    "reviewedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Custom Agents (Planned)

To add custom agents (future enhancement):

1. Define the agent type and description in your configuration
2. Implement the agent's capabilities
3. Document the agent in this file

## Agent Communication

Agents return results in their final message. Results are not automatically shown to the user - you should summarize them in a text response.

Agents are stateless between calls.
