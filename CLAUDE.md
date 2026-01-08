# Claude Code Assistant Instructions for @chabaduniverse/auth

## Project Overview

**Project Name:** @chabaduniverse/auth
**Architecture:** TypeScript authentication library with React integration
**Purpose:** Framework-agnostic authentication library for ChabadUniverse applications with multiple provider support
**Package Type:** npm library (published to @chabaduniverse scope)

## Project Description

This is a pluggable authentication library designed for the ChabadUniverse ecosystem. It provides:

- **Multiple Authentication Methods**: Bearer Token, Credentials, Google OAuth, Chabad.org SSO, Cross-Domain SSO (CDSSO)
- **Framework-Agnostic Core**: Pure TypeScript core with no framework dependencies
- **React Integration**: Optional React hooks, contexts, and components
- **Adapter Pattern**: Pluggable adapters for different backend systems (Merkos API, custom backends)
- **Dual Authentication**: Support for simultaneous Valu Social + Merkos Platform authentication
- **Database Models**: MongoDB/Mongoose schemas for user profiles, preferences, activity, analytics
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Well-Tested**: Jest + React Testing Library with 304 tests passing (83%+ coverage)

## Technology Stack

**Core Technologies:**
- **Language:** TypeScript 5.7+ (strict mode)
- **Build Tool:** Rollup for ESM/CJS dual builds
- **Package Manager:** npm
- **Testing:** Jest + React Testing Library + ts-jest
- **Linting:** ESLint 9 with TypeScript parser
- **Formatting:** Prettier

**Dependencies:**
- **Runtime:**
  - `jose` - JWT handling and validation
  - `zod` - Runtime type validation
  - `mongoose` - MongoDB ODM
  - `eventemitter3` - Event emitter for auth events
- **Peer Dependencies (optional):**
  - `react` >= 16.8.0 - For React integration
  - `react-dom` >= 16.8.0 - For React components

**Development Tools:**
- `rollup` + plugins - Module bundling
- `size-limit` - Bundle size monitoring
- `typescript` - Type checking and declaration generation

## Project Structure

```
chabaduniverse-auth/
├── src/
│   ├── core/              # Framework-agnostic core
│   │   ├── AuthManager.ts       # Core auth state management
│   │   ├── TokenStorage.ts      # Token persistence utilities
│   │   ├── contexts/            # Base context interfaces
│   │   ├── hooks/               # Core hooks (framework-agnostic)
│   │   └── utils/               # Utilities (CDSSO, cookies, etc.)
│   ├── react/             # React-specific integration
│   │   ├── AuthProvider.tsx     # React context provider
│   │   ├── hooks/               # React hooks (useAuth, etc.)
│   │   ├── components/          # React components (AuthGuard, etc.)
│   │   └── index.ts             # React entry point
│   ├── adapters/          # Backend adapters
│   │   ├── MerkosAPIAdapter.ts  # Merkos Platform API adapter
│   │   ├── BaseAdapter.ts       # Base adapter interface
│   │   └── index.ts             # Adapters entry point
│   ├── database/          # Database models
│   │   ├── models/              # Mongoose models
│   │   ├── connection.ts        # DB connection utility
│   │   └── index.ts             # Database entry point
│   ├── types/             # TypeScript type definitions
│   │   ├── auth.ts              # Auth types
│   │   ├── valu.ts              # Valu integration types
│   │   └── index.ts             # Types entry point
│   └── index.ts           # Main library entry point
├── __tests__/             # Test files
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── docs/                  # Documentation
│   ├── merkos-platform/   # Merkos Platform API docs
│   ├── workflows/         # Development workflow docs
│   ├── CDSSO_*.md         # Cross-Domain SSO documentation
│   ├── MERKOS_OIDC_*.md   # OIDC integration docs
│   └── README.md          # Docs index
├── .claude/               # Claude Code configuration
│   ├── agents/            # Specialized agents
│   ├── commands/          # Custom commands
│   └── settings.local.json # Permissions
├── dist/                  # Build output (gitignored)
│   ├── esm/               # ES modules
│   ├── cjs/               # CommonJS modules
│   └── types/             # TypeScript declarations
├── rollup.config.js       # Build configuration
├── tsconfig.json          # TypeScript configuration
├── jest.config.js         # Test configuration
└── package.json           # Package manifest
```

## Key Features

### 1. Multiple Authentication Methods

The library supports five authentication methods:

1. **Bearer Token** (`loginWithBearerToken`) - Direct JWT authentication
2. **Credentials** (`loginWithCredentials`) - Username/password
3. **Google OAuth** (`loginWithGoogle`) - OAuth code flow
4. **Chabad.org SSO** (`loginWithChabadOrg`) - Key-based SSO
5. **Cross-Domain SSO** (`CDSSO`) - Cross-domain token retrieval

### 2. Adapter Pattern

Backend integration via adapters:
- `MerkosAPIAdapter` - Merkos Platform API v2 integration
- Custom adapters can be created by implementing `IAPIAdapter` interface

### 3. React Integration

React-specific features:
- `AuthProvider` - Context provider with auth state
- `useAuth` hook - Access auth state and methods
- `useValuAuth` hook - Valu-specific authentication
- `AuthGuard` component - Protected route wrapper
- `BearerTokenDialog` - Token input dialog

### 4. Database Models

MongoDB/Mongoose schemas for:
- `User` - User accounts and authentication
- `Profile` - User profiles (Valu + Merkos)
- `Preferences` - User preferences and settings
- `Activity` - User activity tracking
- `Analytics` - Analytics data
- `AppData` - Application-specific data

### 5. Type Safety

Full TypeScript support with:
- Strict type checking
- Comprehensive type definitions
- Generic type parameters for extensibility
- Discriminated unions for auth states

## Development Guidelines

### 1. Code Organization

- **Core First**: Core functionality should be framework-agnostic
- **React Optional**: React integration lives in `/react` directory
- **Adapters Separated**: Backend adapters in `/adapters` directory
- **Types Centralized**: All types in `/types` directory
- **Tests Colocated**: Tests in `__tests__` directory

### 2. TypeScript Best Practices

- Use strict mode (`strict: true`)
- Avoid `any` - use `unknown` or proper types
- Export types for public APIs
- Use const assertions where appropriate
- Document complex types with JSDoc comments

### 3. Testing Standards

- **Unit Tests**: Test individual functions/classes in isolation
- **Integration Tests**: Test component/adapter integration
- **Coverage Target**: 80%+ code coverage
- **Test Structure**: Describe/it blocks with clear descriptions
- **Mocking**: Mock external dependencies (API calls, storage)

Example test structure:
```typescript
describe('AuthManager', () => {
  describe('loginWithBearerToken', () => {
    it('should authenticate with valid bearer token', async () => {
      // Arrange
      const mockAdapter = createMockAdapter();
      const authManager = new AuthManager(mockAdapter);

      // Act
      await authManager.loginWithBearerToken('valid-token');

      // Assert
      expect(authManager.isAuthenticated).toBe(true);
    });
  });
});
```

### 4. Error Handling

- Use custom error classes where appropriate
- Provide helpful error messages
- Don't expose sensitive information in errors
- Log errors appropriately (without logging tokens)

### 5. Bundle Size Management

- Keep core bundle under 15 KB
- React bundle under 5 KB
- Use tree-shaking friendly exports
- Monitor with `npm run size`

## Build & Development Commands

```bash
# Development
npm run dev                 # Watch mode build
npm run build              # Production build
npm run clean              # Clean dist directory

# Testing
npm test                   # Run tests
npm run test:watch         # Watch mode tests
npm run test:coverage      # Coverage report
npm run test:ci            # CI tests with coverage

# Code Quality
npm run lint               # Lint code
npm run lint:fix           # Fix linting issues
npm run format             # Format code with Prettier
npm run format:check       # Check formatting
npm run type-check         # TypeScript type checking

# Publishing
npm run prepublishOnly     # Pre-publish checks (test + build)
npm run size               # Check bundle size
npm run analyze            # Analyze bundle composition
```

## Authentication Flows

### Merkos Platform API Authentication

The library integrates with Merkos Platform API v2, which uses:

- **Base URL**: `https://org.merkos302.com` (NOT shop.merkos302.com - see Issue #1)
- **API Versions**:
  - **v2** (modern): POST `/api/v2` - Unified endpoint with service-based routing
  - **v4** (legacy): `/apiv4/*` - Traditional REST endpoints
- **Auth Header**: Uses `identifier` header (not `Authorization`)
- **Token Type**: JWT tokens from Merkos authentication service

### Cross-Domain SSO (CDSSO)

CDSSO enables iframe-based applications to access Merkos Platform API:

1. Application retrieves token from `id.merkos302.com/apiv4/users/sso/remote/status`
2. Token stored in application's cookie/storage
3. Application can now authenticate with Merkos Platform API

See `docs/CDSSO_*.md` for detailed documentation.

### Valu Social Integration

Dual authentication support for Valu Social + Merkos Platform:

- Valu authentication via `@arkeytyp/valu-api`
- Simultaneous sessions with both platforms
- Separate auth states for each platform
- Unified user experience

See `src/core/hooks/useValuAuth.tsx` for implementation.

## API Adapter Pattern

### Creating Custom Adapters

Implement the `IAPIAdapter` interface:

```typescript
interface IAPIAdapter {
  // Authentication methods
  loginWithBearerToken(token: string, siteId?: string): Promise<AuthResponse>;
  loginWithCredentials(username: string, password: string, siteId?: string): Promise<AuthResponse>;
  loginWithGoogle(code: string, host?: string, siteId?: string): Promise<AuthResponse>;
  loginWithChabadOrg(key: string, siteId?: string): Promise<AuthResponse>;

  // User info
  getUserInfo(): Promise<UserInfo>;

  // Logout
  logout(): Promise<void>;
}
```

### MerkosAPIAdapter

Built-in adapter for Merkos Platform API v2:

- Unified POST endpoint (`/api/v2`)
- Service-based routing (e.g., `auth:username:login`)
- `identifier` header for authentication
- Environment-based URL configuration

**Phase 5A Implementation (✅ Completed - Issue #10):**
- `setToken(token: string): void` - Token storage for authenticated requests
- `clearToken(): void` - Token cleanup on logout
- `v2Request<T>(service, path, params): Promise<T>` - Core v2 API request method
- Intelligent error code mapping (Merkos errors → AuthErrorCode enum)
- AbortController-based timeout handling
- Type-safe generic responses
- 20 comprehensive unit tests
- Full JSDoc documentation

## Development Workflow: Session Management and Code Commits

### Development Flow Overview

1. **Start Session**: Use `/session-start` to begin a feature/task (creates `.claude/sessions/` file)
2. **Work on Code**: Make changes with Claude's assistance
3. **Document Progress**: Session file auto-updates with progress
4. **Create Commits**: Use `gsave` skill for well-formatted commits
5. **End Session**: Use `/session-end` to finalize (moves to archive if needed)

### Session Management Guidelines

**Starting a Session:**
- Use `/session-start <task-description>` to begin work
- Creates session file: `.claude/sessions/YYYY-MM-DD-HHMM-<task-slug>.md`
- Session tracks: objectives, progress, decisions, blockers

**During Development:**
- Session file maintained automatically
- Key decisions documented in session notes
- Links to relevant issues/PRs added

**Ending a Session:**
- Use `/session-end` to close active session
- Session moves to archive if completed
- Summary added to main documentation if needed

### Code Commit Guidelines

**Use the `gsave` skill** (Git Save) for all commits:
- Automatically formats commit messages according to Conventional Commits
- Includes Co-Authored-By line for Claude contributions
- Adds link to Claude Code

**Commit Message Format:**
```
<type>(<scope>): <description>

[optional body]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Commit Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `test` - Adding/updating tests
- `refactor` - Code refactoring
- `chore` - Maintenance tasks
- `ci` - CI/CD changes
- `perf` - Performance improvements

**Scopes** (examples):
- `core` - Core authentication
- `react` - React integration
- `adapters` - API adapters
- `database` - Database models
- `types` - TypeScript types
- `tests` - Test files
- `build` - Build configuration

### ⚠️ CRITICAL: Pull Request Approval Requirements ⚠️

**NEVER commit and push without user review and approval!**

When creating pull requests:
1. Draft PR message
2. **Wait for user review**
3. Get explicit approval
4. Only then push and create PR

## Documentation Maintenance

### Documentation Guidelines

- Update `README.md` for public API changes
- Update `INTEGRATION_GUIDE.md` for integration examples
- Update `TESTING_GUIDE.md` for testing patterns
- Keep `CHANGELOG.md` updated with changes
- Document breaking changes prominently

### Workflow Documentation

The `/docs/workflows/` directory contains workflow documentation:

- `npm-workflow.md` - npm package development workflow
- `README.md` - Workflow documentation index

Update workflow docs when development processes change.

## Claude Subagents

### Available Subagents

Located in `.claude/agents/` directory:

#### Core Development Subagents:

1. **test-writer** - Testing patterns and test case generation
2. **security-reviewer** - Security audits and vulnerability detection
3. **validation-specialist** - Zod schema design and validation patterns

#### Auth-Specific Subagents:

4. **auth-flow-specialist** - Authentication flow design and implementation
5. **merkos-integration-specialist** - Merkos Platform API integration
6. **valu-api-specialist** - Valu Social API integration

### Using Subagents

Subagents can be invoked for specialized tasks:
- Testing strategies and test writing
- Security reviews of auth flows
- API integration patterns
- Validation schema design

### Important:

- Subagents have specific expertise areas
- Use appropriate subagent for the task
- Subagents can collaborate on complex problems

## Session Context Management

**Session File Locations:**
- Active sessions: `.claude/sessions/`
- Archived sessions: `.claude/sessions/archive/` (if needed)

**Session File Format:**
```markdown
# [Task Description]

**Started:** YYYY-MM-DD HH:MM
**Status:** Active | Completed | Blocked

## Objective
[What we're trying to achieve]

## Progress
[What's been done]

## Decisions
[Key technical decisions]

## Next Steps
[What remains to be done]
```

## Publishing Workflow

### Pre-Publish Checklist

Before publishing to npm:

1. **Tests Pass**: `npm test` shows all tests passing
2. **Build Succeeds**: `npm run build` completes without errors
3. **Types Valid**: `npm run type-check` passes
4. **Linting Clean**: `npm run lint` shows no errors
5. **Bundle Size**: `npm run size` shows sizes within limits
6. **Version Updated**: `package.json` version bumped appropriately
7. **CHANGELOG Updated**: `CHANGELOG.md` includes new version
8. **Documentation Current**: README and guides reflect changes

### Publishing Process

```bash
# 1. Ensure clean working directory
git status

# 2. Run pre-publish checks (automatic via prepublishOnly)
npm publish

# 3. Tag release
git tag v0.x.x
git push origin v0.x.x
```

### Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward compatible)
- **PATCH** (0.0.1): Bug fixes

## Common Development Tasks

### Adding New Authentication Method

1. Add method to `IAPIAdapter` interface
2. Implement in `MerkosAPIAdapter`
3. Add method to `AuthManager`
4. Add React hook method to `useAuth`
5. Update type definitions
6. Add tests
7. Update documentation

### Adding New Database Model

1. Create model in `src/database/models/`
2. Define Mongoose schema and model
3. Export from `src/database/index.ts`
4. Add TypeScript types in `src/types/`
5. Add tests
6. Document usage

### Adding New Adapter

1. Create adapter in `src/adapters/`
2. Implement `IAPIAdapter` interface
3. Export from `src/adapters/index.ts`
4. Add configuration types
5. Add tests
6. Update documentation with usage example

## Error Handling & Troubleshooting

### Common Issues

**Build Failures:**
- Check TypeScript errors: `npm run type-check`
- Verify imports are correct (ESM vs CJS)
- Check for circular dependencies

**Test Failures:**
- Check for missing mocks
- Verify async/await handling
- Check test environment setup

**Bundle Size Issues:**
- Check what's being imported: `npm run analyze`
- Verify tree-shaking is working
- Check for unnecessary dependencies

### When Making Changes

1. **Type Check First**: Run `npm run type-check`
2. **Test Locally**: Run `npm test`
3. **Check Bundle**: Run `npm run size`
4. **Build**: Run `npm run build`
5. **Manual Testing**: Test in a consuming app if possible

## Key Files to Understand

### Core Files

- `src/index.ts` - Main entry point
- `src/core/AuthManager.ts` - Core authentication logic
- `src/core/TokenStorage.ts` - Token persistence
- `src/types/auth.ts` - Core authentication types
- `src/adapters/MerkosAPIAdapter.ts` - Merkos Platform API v2 adapter (Phase 5A)

### React Integration

- `src/react/AuthProvider.tsx` - React context provider
- `src/react/hooks/useAuth.ts` - Primary React hook
- `src/react/components/AuthGuard.tsx` - Route protection

### Configuration

- `rollup.config.js` - Build configuration
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Test configuration
- `package.json` - Package manifest and scripts

## Design Philosophy

1. **Framework-Agnostic Core**: Core authentication logic has no framework dependencies
2. **Progressive Enhancement**: Start with minimal API, extend via adapters
3. **Type Safety**: Full TypeScript support with no `any` types in public API
4. **Tree-Shakeable**: Modular design for optimal bundle sizes
5. **Well-Tested**: Comprehensive test coverage for reliability
6. **Developer Experience**: Clear APIs, good error messages, helpful documentation

## Current Implementation Status

### Phase 5A: MerkosAPIAdapter Core Infrastructure (✅ Completed - Issue #10)

**Completed Methods:**
1. `setToken(token: string): void` - Store Merkos JWT for API requests
2. `clearToken(): void` - Clear stored token on logout
3. `v2Request<T>(service, path, params): Promise<T>` - Core v2 API request method

**Key Features:**
- POST to unified `/api/v2` endpoint
- Custom `identifier` header (not standard `Authorization`)
- Intelligent error code mapping
- AbortController-based timeout handling
- Type-safe generic responses
- Comprehensive error detection (API errors, network errors, timeouts)

**Testing:**
- 20 focused unit tests
- All 273 tests passing
- 93.5% code coverage
- Comprehensive mocking patterns

### Phase 5B: MerkosAPIAdapter Authentication Methods (✅ Completed)

**Completed Methods:**
1. `loginWithBearerToken(token, siteId?): Promise<AuthResponse>` - Bearer token authentication
2. `loginWithCredentials(username, password, siteId?): Promise<AuthResponse>` - Username/password login
3. `loginWithGoogle(code, host?, siteId?): Promise<AuthResponse>` - Google OAuth login
4. `loginWithChabadOrg(key, siteId?): Promise<AuthResponse>` - Chabad.org SSO login

**Key Features:**
- Four complete authentication methods
- Full error handling for all methods
- Type-safe AuthResponse return type
- Site ID support for multi-tenant scenarios
- Host parameter for OAuth redirects

**Testing:**
- 26 comprehensive unit tests for authentication methods
- All 304 tests passing (up from 273)
- Test coverage: 83.09% statements, 80% branches, 92.85% functions
- Comprehensive error scenario testing

**Security Improvements:**
- Created secure logger utility (src/core/utils/logger.ts)
- Replaced 106 console calls with secure logging
- Fixed HIGH PRIORITY security issue (token exposure prevention)

**Next Phases:**
- Phase 5C: User info retrieval (getCurrentUser)
- Phase 5D: Token refresh and verification
- Phase 5E: Integration with Universe Portal Auth API

## Critical Notes

### ⚠️ URL Changes (Issue #1)

The correct Merkos Platform API base URL is:
- ✅ Correct: `https://org.merkos302.com`
- ❌ Incorrect: `https://shop.merkos302.com`

**Update all references, documentation, and examples.** This has been fixed in Phase 5A.

### 🔒 Security Considerations

- Never log authentication tokens
- Use `identifier` header (not `Authorization`) for Merkos API
- Validate tokens before use
- Handle token expiration gracefully
- Clear sensitive data on logout

### 📦 Bundle Monitoring

Watch bundle sizes:
- Core library: < 15 KB target
- React integration: < 5 KB target
- Run `npm run size` before releases

## Important Notes for Claude Code

- This is a **library package**, not an application
- Changes affect **downstream consumers** - be careful with breaking changes
- Always run **full test suite** before suggesting changes
- **Document breaking changes** prominently
- Consider **bundle size** impact of new dependencies
- Maintain **backward compatibility** when possible
- Use **semantic versioning** correctly
