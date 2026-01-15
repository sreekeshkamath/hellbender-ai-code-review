# AI Code Review Platform - Development Plan

## Overview
Building an AI-powered code review platform similar to Greptile, enabling developers to get intelligent code analysis, security vulnerability detection, and quality assessments using multiple AI models.

## Core Features

### 1. Repository Management
- **Smart Cloning**: Clone repositories once, reuse existing clones
- **Multi-Branch Support**: Support different branches per repository
- **Repository Caching**: Cache cloned repos to avoid redundant operations
- **Sync Capability**: Update existing clones with latest changes
- **Saved Repositories**: Save frequently used repos for quick access

### 2. AI-Powered Code Analysis
- **Multi-Model Support**: 
  - Claude 3.5 Sonnet
  - Claude 3 Haiku
  - GPT-4o
  - GPT-4o Mini
  - Gemini 2.0 Flash
  - DeepSeek Chat (Free tier)
- **Intelligent Review**: Context-aware code analysis
- **Security Scanning**: Automated vulnerability detection
- **Code Quality Metrics**: Scoring and recommendations

### 3. Analysis Features
- **File Selection**: Choose specific files or entire repository
- **Batch Processing**: Analyze multiple files simultaneously
- **Issue Categorization**: 
  - Security vulnerabilities (critical, high, medium, low)
  - Code quality issues
  - Best practices violations
  - Performance concerns
- **Detailed Reports**: Comprehensive analysis results with:
  - Overall score
  - File-by-file breakdown
  - Issue descriptions
  - Fix suggestions
  - Code snippets

### 4. User Interface
- **Modern Dark Theme**: Cyberpunk-inspired design
- **Real-time Activity Log**: Track all operations
- **Interactive Results**: Expandable result cards
- **Responsive Design**: Works on all screen sizes
- **Visual Indicators**: Color-coded severity levels

## Technical Architecture

### Backend
- **Node.js + Express**: RESTful API server
- **Simple-Git**: Git operations
- **OpenRouter API**: Multi-model AI access
- **File System**: Local repository storage
- **UUID**: Unique repository identifiers

### Frontend
- **React**: Component-based UI
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client
- **Lucide Icons**: Modern icon set

### Data Storage
- **Repository Cache**: `temp/repos/{repoId}/`
- **Saved Repos**: Encrypted JSON storage
- **Repository Mapping**: URL + Branch → RepoId mapping

## Implementation Phases

### Phase 1: Core Infrastructure ✅
- [x] Repository cloning
- [x] File listing
- [x] Basic UI
- [x] AI model integration
- [x] Code analysis endpoint

### Phase 2: Smart Caching (Current)
- [ ] Repository reuse logic
- [ ] URL + Branch mapping
- [ ] Cache management
- [ ] Sync functionality

### Phase 3: Enhanced Analysis
- [ ] Advanced vulnerability detection
- [ ] Code quality metrics
- [ ] Performance analysis
- [ ] Dependency scanning
- [ ] License compliance

### Phase 4: User Experience
- [ ] Search functionality
- [ ] Filtering options
- [ ] Export reports
- [ ] History tracking
- [ ] Comparison views

### Phase 5: Advanced Features
- [ ] Multi-repository comparison
- [ ] Custom analysis rules
- [ ] Integration with CI/CD
- [ ] Webhook support
- [ ] Team collaboration

## Repository Caching Strategy

### Current Implementation
- Each clone creates a new UUID-based directory
- No reuse of existing clones
- Wastes disk space and time

### Improved Implementation
1. **Repository Mapping**: Store `repoUrl + branch → repoId` mapping
2. **Existence Check**: Before cloning, check if repo already exists
3. **Reuse Logic**: If exists, return existing repoId and files
4. **Sync Option**: Allow updating existing clones
5. **Cleanup**: Periodic cleanup of unused repos

### Storage Structure
```
temp/
  repos/
    {repoId}/          # Actual cloned repository
  mappings.json        # URL + Branch → RepoId mapping
```

### Mapping Format
```json
{
  "https://github.com/user/repo:main": "repo-id-1",
  "https://github.com/user/repo:dev": "repo-id-2"
}
```

## API Endpoints

### Repository Management
- `POST /api/repo/clone` - Clone or reuse repository
- `POST /api/repo/sync/:repoId` - Sync existing repository
- `GET /api/repo/files/:repoId` - List files in repository
- `GET /api/repo/file/:repoId/*` - Get file content
- `DELETE /api/repo/:repoId` - Delete repository

### Analysis
- `POST /api/review/analyze` - Analyze selected files
- `GET /api/review/models` - Get available AI models

### Saved Repositories
- `GET /api/saved-repos` - List saved repositories
- `POST /api/saved-repos` - Save repository
- `DELETE /api/saved-repos/:id` - Delete saved repository

## Security Considerations
- Input validation for repository URLs
- Secure credential handling
- Rate limiting for API calls
- File path sanitization
- Repository size limits

## Performance Optimizations
- Repository caching
- Lazy file loading
- Pagination for large repositories
- Background sync operations
- Efficient file indexing

## Future Enhancements
- Database integration for better persistence
- User authentication and authorization
- Team workspaces
- Custom AI model configurations
- Integration with GitHub/GitLab APIs
- Real-time collaboration
- Code diff visualization
- Historical analysis tracking

## Similar Platforms
- **Greptile**: AI-powered code search and analysis
- **CodeRabbit**: AI code review for pull requests
- **DeepCode**: AI-powered code review
- **Snyk**: Security-focused code analysis

## Success Metrics
- Clone time reduction (via caching)
- Analysis accuracy
- User satisfaction
- Platform reliability
- Response times
