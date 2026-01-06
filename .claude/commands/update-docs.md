# Update Documentation : Automatically Update All Project Documentation

This command automatically analyzes the project structure and updates all documentation files to keep them in sync with the codebase.

## Usage

To update all documentation files:
```
/update-docs
```

## What This Command Does

1. **Self-Update First**: Analyzes the project and updates this `/update-docs` command itself to ensure it reflects all current documentation files

2. **Analyze Project Structure**: Scans the entire project to understand:
   - Current features and components
   - API endpoints and integrations
   - Database models and schemas
   - Testing coverage and status
   - Recent changes and additions
   
3. **Identify Documentation Files**: Automatically discovers all documentation files:

   **Root Documentation:**
   - `README.md` (main package README)
   - `CLAUDE.md` (Claude Code assistant instructions for auth library)
   - `CHANGELOG.md` (version history and release notes)
   - `INTEGRATION_GUIDE.md` (integration guide for consumers)
   - `TESTING_GUIDE.md` (testing patterns and examples)
   - `QUICK_START.md` (quick start guide)

   **Status & Summary Documents:**
   - `TEST_COVERAGE_REPORT.md` (test coverage status)
   - `EXTRACTION_SUMMARY.md` (extraction from universe-portal summary)
   - `MONGODB_IMPLEMENTATION_SUMMARY.md` (database implementation notes)
   - `DATABASE_RELATIONSHIPS.md` (database schema relationships)

   **Documentation Directory (`docs/`):**
   - `docs/README.md` (documentation index)
   - `docs/npm-workflow.md` (npm package publishing workflow)
   - `docs/VALU_AUTH_COMPONENTS.md` (Valu authentication components)
   - `docs/components/BearerTokenDialog.md` (component documentation)

   **CDSSO Documentation (7 files):**
   - `docs/CDSSO_IMPLEMENTATION_PLAN.md`
   - `docs/CDSSO_API_IMPLEMENTATION.md`
   - `docs/CDSSO_APP_INTEGRATION.md`
   - `docs/CDSSO_CHANGES_SUMMARY.md`
   - `docs/CDSSO_PHASE_4_SUMMARY.md`
   - `docs/CDSSO_SECURITY_ANALYSIS.md`
   - `docs/CDSSO_SETUP_GUIDE.md`

   **Merkos OIDC Documentation (3 files):**
   - `docs/MERKOS_OIDC_IFRAME_AUTHENTICATION_PLAN.md`
   - `docs/MERKOS_OIDC_REACT_AUTH_SUMMARY.md`
   - `docs/MERKOS_OIDC_REACT_AUTHENTICATION.md`

   **Merkos Platform API Documentation (7 files):**
   - `docs/MERKOS_PLATFORM_API_DOCUMENTATION.md`
   - `docs/MERKOS_PLATFORM_API_DOCUMENTATION_2.md`
   - `docs/MERKOS_API_ENDPOINTS.md`
   - `docs/MERKOS_DASHBOARD_INTEGRATION_NOTES.md`
   - `docs/MERKOS_PLATFORM_API_VERSIONS_DOCUMENTATION.md`
   - `docs/MERKOS_PLATFORM_DEVELOPER_ONBOARDING.md`
   - `docs/MERKOS_API_MAXIMIZATION_PLAN.md`

   **Source Code Documentation:**
   - `src/database/README.md` (database models documentation)
   - `src/core/hooks/README.md` (core hooks documentation)
   - `src/react/components/README.md` (React components documentation)
   - `src/react/components/BearerTokenDialog.README.md` (BearerTokenDialog component)
   - `src/react/components/QUICK_START.md` (React components quick start)

   **Claude Code Workflow:**
   - `.claude/commands/update-docs.md` (this file)
   - `.claude/agents/*.md` (6 specialized agents)
   - `.claude/sessions/*.md` (session files)

   **Any other documentation files discovered during analysis**

4. **Update Documentation**: For each file:
   - Updates feature lists based on implemented functionality
   - Updates component and hook listings
   - Updates API endpoint documentation
   - Updates database schema documentation
   - Updates project structure diagrams
   - Updates test coverage information (57 test files with 859 tests - 854 passing, 5 skipped)
   - Updates environment variable requirements
   - Maintains consistent information across all docs

5. **Verify Consistency**: Ensures all documentation files contain matching information

6. **Summary Report**: Shows what was updated in each file

## Documentation Update Strategy

### Files to Update

1. **CLAUDE.md**:
   - Project structure and key files
   - Component and hook listings
   - Development guidelines
   - Testing requirements
   - Important notes and patterns
   - Session context management

2. **README.md**:
   - Features list with current implementation status
   - Tech stack and dependencies
   - Project structure
   - Getting Started instructions
   - Available scripts
   - Testing information

3. **PRD.md**:
   - Completed features section
   - Current state and version
   - Technology stack table
   - Project structure diagram
   - Demo pages and functionality

4. **pages/docs/index.jsx and pages/docs/**/*.jsx**:
   - Documentation hub page with navigation cards
   - Feature documentation across multiple pages
   - Component library listings
   - API integration guides
   - Demo page descriptions
   - Project structure visualization
   - Workflow documentation

5. **pages/merkos-api-docs.tsx**:
   - Comprehensive Merkos API documentation
   - Endpoint specifications
   - Authentication methods
   - Request/response examples
   - Integration guides

6. **Planning Files** (`.claude/planning/*.md`):
   - Update completion checkmarks
   - Mark implemented features
   - Add any missing items discovered during implementation

7. **Subdirectory README Files**:
   - `api/README.md` - API client implementation documentation
   - `public/README.md` - Static assets and images documentation
   - Update with current file listings and usage instructions

8. **Self-Update** (`.claude/commands/update-docs.md`):
   - Discovers any new documentation files in the project
   - Updates its own file list to include newly found docs
   - Ensures the command stays current with project structure
   - Updates implementation steps based on project patterns

### Update Process

For each documentation file:
1. Read the current content
2. Analyze the entire codebase for relevant information
3. Update sections with accurate, current data
4. Ensure consistency with other documentation
5. Preserve manual content and custom sections

## Best Practices

- **Automatic Analysis**: Always analyzes the project first to ensure accuracy
- **Comprehensive Updates**: Updates ALL documentation files in one pass
- **Consistency**: Ensures all files contain matching information
- **Preserves Custom Content**: Maintains manually added sections
- **Current State**: Reflects the actual implementation, not plans

## Implementation Steps

1. **Self-Update Phase**:
   - Scan for all `*.md` files and documentation pages
   - Update this command file with any newly discovered documentation
   - Ensure all documentation paths are current
   - Note: Old summary files have been archived to `docs/archive/` folder

2. **Analysis Phase**:
   - Scan project structure using Glob patterns
   - Read and analyze:
     - Component directories (`components/**`)
     - Pages and API routes (`pages/**`)
     - Hooks and contexts (`hooks/**`, `contexts/**`)
     - Test files (`__tests__/**`)
     - Configuration files

3. **Update Phase**:
   - For each documentation file:
     - Identify sections that need updating
     - Update with current, accurate information
     - Maintain formatting and structure
   - Ensure consistency across all files

4. **Summary Phase**:
   - Provide a detailed summary of all updates made
   - List any new documentation files discovered
   - DO NOT automatically commit - let user review changes first