# Coding Guidelines

This document outlines the coding standards and practices for the Hellbender project.

## General Principles

1. **Code Quality First**: Write code that is easy to understand, maintain, and extend.
2. **Robustness**: Handle errors gracefully and validate inputs.
3. **Simplicity**: Prefer simple solutions over complex ones.
4. **Consistency**: Follow existing patterns and conventions.

## TypeScript Guidelines

### Type Safety
- **Never use `any`** unless absolutely necessary. If you must, add a comment explaining why.
- Use explicit types for function parameters and return values.
- Create TypeScript interfaces for all API responses and data structures.

### Example
```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// Avoid
function getUser(id: any): Promise<any> {
  // ...
}
```

### Enums vs Union Types
- Use union types for simple string-based values:
```typescript
type Status = 'pending' | 'in_progress' | 'completed' | 'failed';
```
- Use enums only when you need reverse mapping or additional metadata.

## Code Documentation

### JSDoc Comments
Every exported function, class, and interface must have JSDoc comments:

```typescript
/**
 * Creates a new persistent repository by cloning it to persistent storage.
 * 
 * @param url The repository URL to clone
 * @param name Optional custom name for the repository
 * @param branch The branch to clone (defaults to 'main')
 * @param accessToken Optional GitHub access token for private repos
 * @returns Promise<PersistentRepository> The created repository record
 * @throws Error if URL is invalid or clone fails
 */
static async create(
  url: string,
  name?: string,
  branch: string = 'main',
  accessToken?: string
): Promise<PersistentRepository> {
  // ...
}
```

### Inline Comments
- Add comments for complex logic or non-obvious behavior.
- Avoid commenting obvious code.
- Use comments to explain "why", not "what".

## Error Handling

### Backend (Express)
```typescript
try {
  // Operation that may fail
} catch (error) {
  // Log the error
  console.error('Operation failed:', error);
  
  // Return appropriate HTTP response
  next(error); // Let error middleware handle it
}
```

### Frontend (React)
```typescript
try {
  await someApiCall();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  setError(message);
}
```

### Error Messages
- Use user-friendly messages.
- Include relevant details without exposing internals.
- Log detailed errors server-side.

## API Design

### RESTful Endpoints
- `GET /api/resources` - List all
- `GET /api/resources/:id` - Get one
- `POST /api/resources` - Create
- `PATCH /api/resources/:id` - Update
- `DELETE /api/resources/:id` - Delete

### Request/Response Format
```typescript
// Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  count?: number;
}
```

## React Component Guidelines

### Component Structure
```typescript
// 1. Imports
import React from 'react';

// 2. Types/interfaces
interface Props {
  title: string;
  onClick: () => void;
}

// 3. Component
export function Component({ title, onClick }: Props) {
  // 4. State (if needed)
  const [count, setCount] = useState(0);
  
  // 5. Callbacks
  const handleClick = () => {
    onClick();
    setCount(c => c + 1);
  };
  
  // 6. Render
  return (
    <button onClick={handleClick}>
      {title}: {count}
    </button>
  );
}
```

### Props Naming
- Use `on*` for event handlers: `onClick`, `onChange`, `onSelect`
- Use `is*` or `has*` for booleans: `isLoading`, `hasError`
- Use descriptive names: `selectedFiles`, `onSelectionChange`

## Testing

### Backend Tests (Jest)
```typescript
describe('PersistentRepositoryService', () => {
  describe('create', () => {
    it('should clone repository and save to database', async () => {
      // Arrange
      const url = 'https://github.com/owner/repo';
      
      // Act
      const repo = await service.create(url);
      
      // Assert
      expect(repo).toBeDefined();
      expect(repo.url).toBe(url);
    });
  });
});
```

### Frontend Tests (React Testing Library)
```typescript
describe('DiffView', () => {
  it('should render diff hunks correctly', () => {
    render(<DiffView diffHunks={sampleHunks} />);
    expect(screen.getByText('+ added line')).toBeInTheDocument();
    expect(screen.getByText('- removed line')).toBeInTheDocument();
  });
});
```

## Git Commit Messages

Format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting changes (no code change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Example:
```
feat(persistent-repos): add repository sync functionality

Add ability to sync persistent repositories with their remote
using git pull. Includes error handling for network issues.

Closes #123
```

## File Organization

### Backend
```
src/
├── controllers/    # HTTP request handlers
├── services/       # Business logic
├── models/         # Data models/types
├── routes/         # Route definitions
├── database/       # DB connection & migrations
├── utils/          # Utility functions
└── config/         # Configuration
```

### Frontend
```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── services/       # API clients
├── types/          # TypeScript types
└── assets/         # Static assets
```

## Docker Best Practices

### Multi-stage Builds
```dockerfile
# Build stage
FROM node:20-alpine AS build
RUN npm run build

# Production stage
FROM node:20-alpine
COPY --from=build /app/dist ./dist
CMD ["node", "dist/server.js"]
```

### Environment Variables
- Use `.env.example` to document required variables
- Never commit `.env` files
- Use defaults for development

## Security

### Input Validation
- Validate all user inputs on the server
- Use parameterized queries (prevents SQL injection)
- Sanitize outputs (prevents XSS)

### Secrets
- Never commit secrets to version control
- Use environment variables for sensitive data
- Rotate secrets periodically

## Performance

### Backend
- Use connection pooling for database
- Implement caching where appropriate
- Use streaming for large responses

### Frontend
- Lazy load routes/components
- Memoize expensive computations
- Optimize images and assets

## Code Review Process

1. **Self-review**: Check your changes before creating PR
2. **Automated checks**: Ensure CI passes
3. **Peer review**: At least one approval required
4. **Testing**: All tests must pass
5. **Documentation**: Update docs if needed

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Jest](https://jestjs.io/docs/getting-started)
- [Express.js](https://expressjs.com/en/guide/routing.html)
