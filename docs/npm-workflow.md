# NPM Publishing Workflow Guide

**Complete guide for publishing and maintaining @chabaduniverse packages**

---

## Table of Contents

1. [Overview & Introduction](#overview--introduction)
2. [Initial NPM Organization Setup (One-Time)](#initial-npm-organization-setup-one-time)
3. [Team Access Management](#team-access-management)
4. [Repository Setup (Per Package)](#repository-setup-per-package)
5. [Semantic Versioning Strategy](#semantic-versioning-strategy)
6. [Pre-Publish Checklist](#pre-publish-checklist)
7. [Manual Publishing Workflow](#manual-publishing-workflow)
8. [CI/CD Automation (GitHub Actions)](#cicd-automation-github-actions)
9. [Package Maintenance](#package-maintenance)
10. [Breaking Changes & Major Versions](#breaking-changes--major-versions)
11. [Rollback & Hotfix Procedures](#rollback--hotfix-procedures)
12. [Troubleshooting & FAQ](#troubleshooting--faq)
13. [Quick Reference: npm Commands](#quick-reference-npm-commands)

---

## Overview & Introduction

This guide covers the complete npm workflow for publishing and maintaining packages in the **@chabaduniverse** namespace, from initial setup through ongoing maintenance.

**Target Audience:**
- Developers publishing new @chabaduniverse packages
- Team members maintaining existing packages
- CI/CD automation engineers

**Scope:**
- General workflow applicable to all @chabaduniverse packages
- Uses **@chabaduniverse/auth** as consistent reference example
- Covers manual and automated publishing workflows

**Quick Navigation:**
- **First-time setup?** Start with [Initial NPM Organization Setup](#initial-npm-organization-setup-one-time)
- **Publishing a new package?** See [Repository Setup](#repository-setup-per-package) and [Manual Publishing](#manual-publishing-workflow)
- **Updating an existing package?** See [Pre-Publish Checklist](#pre-publish-checklist) and [Manual Publishing](#manual-publishing-workflow)
- **Breaking change?** See [Breaking Changes & Major Versions](#breaking-changes--major-versions)
- **Critical bug fix?** See [Rollback & Hotfix Procedures](#rollback--hotfix-procedures)
- **Automation setup?** See [CI/CD Automation](#cicd-automation-github-actions)

---

## Initial NPM Organization Setup (One-Time)

**Status:** 🔴 Required once for @chabaduniverse namespace

This section covers creating the npm organization and reserving the @chabaduniverse namespace. **This only needs to be done once.**

### Step 1: Create npm Account

If you don't have an npm account:
1. Go to https://www.npmjs.com/signup
2. Create account with email verification
3. Enable two-factor authentication (recommended)

### Step 2: Create Organization

```bash
# 1. Login to npm
npm login

# 2. Create the @chabaduniverse organization
npm org create chabaduniverse
```

**Cost:** **FREE** for unlimited public packages ✅
- No monthly fees for public packages
- Only pay for private packages ($7/user/month)

### Step 3: Reserve Namespace with Placeholder Package

Publish a placeholder package to fully claim the namespace:

```bash
# 1. Create temporary directory
mkdir chabaduniverse-placeholder
cd chabaduniverse-placeholder

# 2. Initialize package.json
npm init -y

# 3. Edit package.json to set name and metadata
```

**package.json for placeholder:**
```json
{
  "name": "@chabaduniverse/placeholder",
  "version": "0.0.1",
  "description": "Placeholder package to reserve @chabaduniverse namespace",
  "private": false,
  "publishConfig": {
    "access": "public"
  },
  "author": "Chabad Universe",
  "license": "MIT"
}
```

```bash
# 4. Publish the placeholder (public access required for scoped packages)
npm publish --access public
```

### Step 4: Verify Organization

```bash
# Verify you're a member
npm org ls chabaduniverse

# View organization packages
npm org ls-packages chabaduniverse
```

**Result:** The **@chabaduniverse** namespace is now permanently reserved. No one else can publish packages under this namespace.

---

## Team Access Management

**Purpose:** Configure team members and their publishing permissions

### Adding Team Members

```bash
# Add a team member with specific role
npm org set chabaduniverse <username> <role>

# Example: Add developer
npm org set chabaduniverse johndoe developer
```

### Available Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **owner** | Full control (add/remove members, publish, delete org) | Organization admins |
| **admin** | Manage members and packages, publish | Team leads |
| **developer** | Publish packages only | Active package maintainers |
| **member** | Read access only | Observers, documentation writers |

### Managing Team Members

```bash
# List all members
npm org ls chabaduniverse

# Change member role
npm org set chabaduniverse johndoe admin

# Remove member
npm org rm chabaduniverse johndoe
```

### Best Practices

✅ **Two-Factor Authentication:**
- Require 2FA for all organization members
- npm enforces 2FA for owners/admins of popular packages

✅ **Principle of Least Privilege:**
- Grant minimum necessary permissions
- Use "developer" role for most team members
- Reserve "owner"/"admin" for 2-3 trusted members

✅ **Regular Audits:**
- Review team membership quarterly
- Remove inactive members promptly
- Update roles as responsibilities change

---

## Repository Setup (Per Package)

**Purpose:** Configure a new package repository for npm publishing

### package.json Configuration

Example using **@chabaduniverse/auth** as reference:

```json
{
  "name": "@chabaduniverse/auth",
  "version": "1.0.0",
  "description": "Authentication and user data management for Chabad Universe",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "mongoose": "^8.0.0",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.0.0",
    "dompurify": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "rollup": "^4.0.0",
    "jest": "^29.0.0"
  },
  "scripts": {
    "build": "rollup -c",
    "test": "jest",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm test",
    "version": "npm run build",
    "postversion": "git push && git push --tags"
  },
  "keywords": [
    "authentication",
    "auth",
    "chabad",
    "merkos"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/chabaduniverse/auth.git"
  },
  "bugs": {
    "url": "https://github.com/chabaduniverse/auth/issues"
  },
  "homepage": "https://github.com/chabaduniverse/auth#readme"
}
```

### Key Configuration Fields

#### Entry Points

```json
{
  "main": "dist/index.js",       // CommonJS entry (Node.js require)
  "module": "dist/index.esm.js", // ES Module entry (import/export)
  "types": "dist/index.d.ts"     // TypeScript type definitions
}
```

**Why multiple entry points?**
- `main`: Backwards compatibility with CommonJS (Node.js `require()`)
- `module`: Modern ES6 imports for tree-shaking and smaller bundles
- `types`: TypeScript IntelliSense and type checking

#### Files to Include

```json
{
  "files": [
    "dist",           // Built JavaScript files
    "README.md",      // Package documentation
    "LICENSE"         // License file (MIT recommended)
  ]
}
```

**What gets published:**
- Only files listed in `files` array
- `package.json` and `README.md` are always included
- Use `.npmignore` to exclude specific files if needed

**Alternative: .npmignore**
```
# .npmignore (if not using "files" field)
src/
tests/
*.test.ts
.env
.env.*
tsconfig.json
rollup.config.js
```

#### Dependencies vs Peer Dependencies

**dependencies** - Installed with your package:
```json
{
  "dependencies": {
    "mongoose": "^8.0.0",      // Database ORM
    "jsonwebtoken": "^9.0.0",  // JWT utilities
    "zod": "^3.0.0"            // Validation
  }
}
```

**peerDependencies** - Expected to be provided by consuming app:
```json
{
  "peerDependencies": {
    "react": "^18.0.0",       // Consumer must install React 18+
    "react-dom": "^18.0.0"
  }
}
```

**When to use each:**
- **dependencies**: Utility libraries, core functionality
- **peerDependencies**: Frameworks (React, Next.js), avoid version conflicts
- **devDependencies**: Build tools, testing frameworks

#### npm Scripts

```json
{
  "scripts": {
    "build": "rollup -c",                    // Build for production
    "test": "jest",                          // Run tests
    "prepublishOnly": "npm run build && npm test", // Run before EVERY publish
    "version": "npm run build",              // Run before version bump
    "postversion": "git push && git push --tags"  // Push after version bump
  }
}
```

**Lifecycle hooks:**
- `prepublishOnly`: Runs before `npm publish` (build + test safety net)
- `version`: Runs before version number changes
- `postversion`: Runs after version bump (auto-push to git)

### LICENSE File

**Recommended:** MIT License

```
MIT License

Copyright (c) 2025 Chabad Universe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### README.md Requirements

Minimum sections for npm README:

```markdown
# @chabaduniverse/auth

> Authentication and user data management for Chabad Universe

## Installation

\`\`\`bash
npm install @chabaduniverse/auth
\`\`\`

## Quick Start

\`\`\`typescript
import { useAuth } from '@chabaduniverse/auth';

function MyComponent() {
  const { user, isAuthenticated, login } = useAuth();
  // ...
}
\`\`\`

## API Reference

[Link to full documentation]

## License

MIT © Chabad Universe
```

---

## Semantic Versioning Strategy

**Purpose:** Define when to bump MAJOR vs MINOR vs PATCH versions

### Versioning Format: MAJOR.MINOR.PATCH

```
1.2.3
│ │ └─ PATCH: Bug fixes, backward compatible
│ └─── MINOR: New features, backward compatible
└───── MAJOR: Breaking changes
```

### Version Bump Rules

#### MAJOR Version (Breaking Changes)

**When:** API changes that break existing code

**Examples:**
```typescript
// Before (1.x): useAuth() returns { user, login }
// After (2.0): useAuth() returns { user, login, logout, isAuthenticated }
// Breaking: Changed return signature

// Before (1.x): loginWithToken(token: string)
// After (2.0): loginWithToken(config: { token: string; rememberMe?: boolean })
// Breaking: Parameter signature changed
```

**Command:**
```bash
npm version major  # 1.5.3 → 2.0.0
```

#### MINOR Version (New Features)

**When:** Adding new functionality without breaking existing code

**Examples:**
```typescript
// Before (1.0): useAuth() with { user, login }
// After (1.1): useAuth() with { user, login, logout }
// Non-breaking: Added new method, old code still works

// Before (1.0): useAuth()
// After (1.1): useAuth() + new hook useProfile()
// Non-breaking: New hook doesn't affect existing code
```

**Command:**
```bash
npm version minor  # 1.0.5 → 1.1.0
```

#### PATCH Version (Bug Fixes)

**When:** Fixing bugs without changing API

**Examples:**
```typescript
// Before (1.0.0): login() had race condition bug
// After (1.0.1): login() bug fixed, same API
// Non-breaking: Bug fix only

// Before (1.0.1): logout() didn't clear cache
// After (1.0.2): logout() now clears cache properly
// Non-breaking: Same API, correct behavior
```

**Command:**
```bash
npm version patch  # 1.0.0 → 1.0.1
```

### Pre-release Versions

#### Alpha (Early Development)
```bash
npm version prerelease --preid=alpha
# Result: 1.0.0-alpha.0

# Subsequent alphas
npm version prerelease --preid=alpha
# Result: 1.0.0-alpha.1, 1.0.0-alpha.2, ...
```

**When to use:** Experimental features, unstable API

#### Beta (Feature Complete, Testing)
```bash
npm version prerelease --preid=beta
# Result: 1.0.0-beta.0
```

**When to use:** Feature complete, gathering feedback, fixing bugs

#### Release Candidate (Final Testing)
```bash
npm version prerelease --preid=rc
# Result: 1.0.0-rc.0
```

**When to use:** Production-ready, final validation before release

### CHANGELOG.md Maintenance

**Format:** Keep-a-Changelog standard

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2025-01-15

### Breaking Changes
- Changed `loginWithToken()` signature to accept config object
- Removed deprecated `getUserData()` method

### Added
- New `useProfile()` hook for profile management
- Support for OAuth 2.0 authentication

### Fixed
- Race condition in `login()` method
- Memory leak in session cleanup

## [1.5.0] - 2024-12-20

### Added
- New `logout()` method in useAuth hook
- Support for refresh tokens

### Fixed
- Token expiration handling
```

---

## Pre-Publish Checklist

**Purpose:** Ensure quality before publishing to npm

### Essential Checks

- [ ] **All tests passing**
  ```bash
  npm test
  # Must see: All tests passed
  ```

- [ ] **Build succeeds**
  ```bash
  npm run build
  # Verify: dist/ directory contains all entry points
  ```

- [ ] **TypeScript types generated**
  ```bash
  ls dist/*.d.ts
  # Verify: index.d.ts exists
  ```

- [ ] **README.md updated**
  - Installation instructions current
  - API examples reflect latest version
  - Breaking changes documented

- [ ] **CHANGELOG.md updated**
  - New version section added
  - All changes categorized (Added/Changed/Fixed/Removed)
  - Breaking changes clearly marked

- [ ] **Version bumped appropriately**
  ```bash
  npm version major|minor|patch
  # Verify: package.json version updated
  # Verify: Git tag created
  ```

- [ ] **Git committed and tagged**
  ```bash
  git status
  # Should be clean or only show version bump commit
  ```

- [ ] **Peer dependencies tested**
  - Test with minimum supported versions
  - Test with latest versions
  ```bash
  npm install react@18.0.0 react-dom@18.0.0
  npm test
  ```

- [ ] **Bundle size checked**
  ```bash
  npm pack
  tar -tzf chabaduniverse-auth-1.0.0.tgz | wc -l
  # Target: <50KB gzipped for @chabaduniverse/auth
  ```

- [ ] **No sensitive data in published files**
  ```bash
  npm pack --dry-run
  # Review file list - ensure no .env, keys, credentials
  ```

### Testing the Package Locally

Before publishing to npm, test the package locally:

```bash
# 1. Pack the package (creates .tgz file)
npm pack

# 2. Install in a test project
cd /path/to/test-project
npm install /path/to/chabaduniverse-auth-1.0.0.tgz

# 3. Test imports and functionality
# Create test file: test-import.js
```

**test-import.js:**
```javascript
import { useAuth } from '@chabaduniverse/auth';

console.log('Import successful:', typeof useAuth);
// Expected: "Import successful: function"
```

```bash
# 4. Verify no missing dependencies
npm install
# Should not show peer dependency warnings

# 5. Clean up
npm uninstall @chabaduniverse/auth
```

---

## Manual Publishing Workflow

**Purpose:** Step-by-step guide for publishing packages manually

### First Publish (New Package)

```bash
# 1. Ensure you're logged in to npm
npm whoami
# Expected: your-npm-username
# If not logged in:
npm login

# 2. Verify package configuration
npm pack --dry-run
# Review output - check files list

# 3. Run pre-publish checks
npm run build
npm test

# 4. Publish to npm (public access required for scoped packages)
npm publish --access public

# 5. Verify publication
npm view @chabaduniverse/auth
# Expected: Package metadata displayed

# 6. Test installation
npm install @chabaduniverse/auth
```

**Expected Output:**
```
+ @chabaduniverse/auth@1.0.0
```

### Subsequent Updates (Existing Package)

```bash
# 1. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 2. Run pre-publish checks
npm test
npm run build

# 3. Bump version (auto-commits and tags)
npm version patch  # or minor/major
# This triggers:
# - version script (npm run build)
# - Git commit with message "1.0.1"
# - Git tag "v1.0.1"
# - postversion script (git push && git push --tags)

# 4. Publish
npm publish

# 5. Verify publication
npm view @chabaduniverse/auth versions
# Expected: Array of all published versions
```

**Version bump automation:**
```bash
npm version patch
# Runs:
# 1. npm run version (pre-version hook)
# 2. Updates package.json version
# 3. Git commit "1.0.1"
# 4. Git tag "v1.0.1"
# 5. npm run postversion (git push && git push --tags)
```

### Handling Publish Failures

**Error: "403 Forbidden"**
```bash
# Solution: Verify authentication
npm whoami
npm login

# Verify organization membership
npm org ls chabaduniverse
```

**Error: "Version already exists"**
```bash
# Cannot re-publish same version
# Solution: Bump version
npm version patch
npm publish
```

**Error: "Package name too similar"**
```
# npm prevents typosquatting
# Solution: Choose more distinctive name or contact npm support
```

---

## CI/CD Automation (GitHub Actions)

**Purpose:** Automate testing and publishing with GitHub Actions

### Workflow File

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      # 1. Checkout code
      - uses: actions/checkout@v3

      # 2. Setup Node.js with npm registry
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      # 3. Install dependencies
      - run: npm ci

      # 4. Run tests
      - run: npm test

      # 5. Build package
      - run: npm run build

      # 6. Publish to npm (public access for scoped packages)
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Setting Up npm Automation Token

**Step 1: Generate Token**
1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token"
3. Select "Automation" type
4. Copy token (starts with `npm_...`)

**Step 2: Add to GitHub Secrets**
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste token from Step 1
6. Click "Add secret"

### Workflow Triggers

#### On Release (Recommended)
```yaml
on:
  release:
    types: [published]
```

**Workflow:**
1. Create git tag: `git tag v1.0.0 && git push --tags`
2. Create GitHub Release from tag
3. Workflow automatically publishes to npm

#### On Tag Push
```yaml
on:
  push:
    tags:
      - 'v*'
```

**Workflow:**
1. Push tag: `git push --tags`
2. Workflow automatically publishes

#### Manual Trigger
```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to publish'
        required: true
```

**Workflow:**
1. Go to Actions tab in GitHub
2. Select "Publish to NPM" workflow
3. Click "Run workflow"
4. Enter version number

### Environment-Specific Publishing

```yaml
jobs:
  publish-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - run: npm publish --tag staging
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-production:
    if: github.ref == 'refs/tags/v*'
    runs-on: ubuntu-latest
    steps:
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Install specific tag:**
```bash
npm install @chabaduniverse/auth@staging
```

### Notifications

**Slack notification on publish:**
```yaml
- name: Notify Slack
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "✅ Published @chabaduniverse/auth@${{ github.ref_name }} to npm"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Package Maintenance

**Purpose:** Guide for ongoing package maintenance tasks

### Updating Dependencies

```bash
# Check for outdated dependencies
npm outdated

# Expected output:
# Package    Current  Wanted  Latest
# mongoose   7.5.0    7.6.0   8.0.0
# zod        3.20.0   3.22.0  3.22.0
```

**Update strategies:**

**Conservative (Recommended):**
```bash
# Update to "Wanted" versions (respects package.json semver ranges)
npm update

# Test thoroughly
npm test
npm run build
```

**Aggressive (Use with caution):**
```bash
# Update specific package to latest
npm install mongoose@latest

# Update all to latest (breaking changes possible)
npm update --latest
```

**Best Practice Workflow:**
```bash
# 1. Review changes
npm outdated

# 2. Update one package at a time
npm install mongoose@latest

# 3. Test thoroughly
npm test

# 4. Commit
git commit -m "chore: update mongoose to 8.0.0"

# 5. Repeat for next package
```

### Security Vulnerabilities

```bash
# Check for security vulnerabilities
npm audit

# Expected output:
# found 3 vulnerabilities (1 moderate, 2 high)
```

**Response workflow:**

```bash
# 1. Review vulnerabilities
npm audit

# 2. Attempt automatic fix
npm audit fix

# 3. If fix requires breaking changes
npm audit fix --force
# ⚠️ Warning: May introduce breaking changes

# 4. Manual fix if needed
npm install vulnerable-package@safe-version

# 5. Test thoroughly
npm test

# 6. Publish patch version
npm version patch
npm publish

# 7. Communicate to users
# Create GitHub issue or announcement
```

**Security patch response time:**
- **Critical vulnerability:** Patch within 24 hours
- **High vulnerability:** Patch within 1 week
- **Moderate vulnerability:** Patch in next minor release

### Deprecating Old Versions

```bash
# Deprecate a specific version
npm deprecate @chabaduniverse/auth@1.0.0 "Security vulnerability, upgrade to 1.0.1+"

# Deprecate a version range
npm deprecate @chabaduniverse/auth@"<1.5.0" "Old version, upgrade to 1.5.0+"

# Undeprecate (if mistake)
npm deprecate @chabaduniverse/auth@1.0.0 ""
```

**Users will see:**
```bash
npm install @chabaduniverse/auth@1.0.0
# npm WARN deprecated @chabaduniverse/auth@1.0.0: Security vulnerability, upgrade to 1.0.1+
```

---

## Breaking Changes & Major Versions

**Purpose:** Handle major version releases and migration guides

### When to Bump Major Version

**Breaking changes include:**
- ❌ Removing exported functions/components
- ❌ Changing function signatures
- ❌ Removing or renaming props
- ❌ Changing default behavior
- ❌ Upgrading peer dependencies (React 17 → 18)
- ❌ Changing data formats (API responses)

**NOT breaking:**
- ✅ Adding new functions/components
- ✅ Adding optional parameters
- ✅ Adding new props
- ✅ Deprecation warnings (with backward compatibility)
- ✅ Bug fixes
- ✅ Internal refactoring

### Major Version Release Workflow

```bash
# 1. Create migration guide
# File: docs/MIGRATION_v2.md
```

**Migration Guide Template:**
```markdown
# Migration Guide: v1.x → v2.0

## Breaking Changes

### 1. Changed useAuth() Return Signature

**Before (v1.x):**
\`\`\`typescript
const { user, login } = useAuth();
\`\`\`

**After (v2.0):**
\`\`\`typescript
const { user, login, logout, isAuthenticated } = useAuth();
\`\`\`

**Migration Steps:**
1. Update all \`useAuth()\` destructuring to include new properties
2. Replace manual \`user !== null\` checks with \`isAuthenticated\`
3. Replace custom logout logic with \`logout()\` method

**Code Changes:**
\`\`\`diff
- const { user, login } = useAuth();
- const isLoggedIn = user !== null;
+ const { user, login, logout, isAuthenticated } = useAuth();

- if (user) {
+ if (isAuthenticated) {
    // ... authenticated logic
  }
\`\`\`

### 2. Removed Deprecated getUserData() Method

**Before (v1.x):**
\`\`\`typescript
const data = getUserData();
\`\`\`

**After (v2.0):**
\`\`\`typescript
const { user } = useAuth();
\`\`\`

**Migration Steps:**
1. Find all \`getUserData()\` calls
2. Replace with \`useAuth()\` hook
3. Access \`user\` property instead

## Estimated Migration Time

- **Small app (< 10 uses):** 15-30 minutes
- **Medium app (10-50 uses):** 1-2 hours
- **Large app (50+ uses):** 3-5 hours
```

```bash
# 2. Update CHANGELOG.md
```

**CHANGELOG.md:**
```markdown
## [2.0.0] - 2025-02-01

### Breaking Changes ⚠️
- Changed `useAuth()` return signature - now includes `logout` and `isAuthenticated`
- Removed deprecated `getUserData()` method - use `useAuth()` instead
- Updated minimum React version from 17 to 18

### Migration
See [MIGRATION_v2.md](docs/MIGRATION_v2.md) for detailed migration instructions.

### Added
- New `logout()` method in useAuth hook
- New `isAuthenticated` boolean flag
- Support for React 18 concurrent features

### Fixed
- Race condition in login flow
- Memory leak in session cleanup
```

```bash
# 3. Bump major version
npm version major  # 1.5.3 → 2.0.0

# 4. Publish
npm publish

# 5. Create GitHub Release
# - Title: "v2.0.0 - Breaking Changes"
# - Description: Copy CHANGELOG + link to migration guide
# - Attach migration guide as asset
```

### Communication Strategy

**1. Pre-release announcement** (1-2 weeks before):
```markdown
# Upcoming Breaking Changes in v2.0

We're planning to release v2.0 with breaking changes on Feb 1, 2025.

**Key Changes:**
- useAuth() signature change
- Removal of deprecated getUserData()
- React 18+ required

**Action Required:**
- Review migration guide: [MIGRATION_v2.md](link)
- Test your app with v2.0-beta.0
- Report any migration issues

**Beta Testing:**
\`\`\`bash
npm install @chabaduniverse/auth@2.0.0-beta.0
\`\`\`
```

**2. Release announcement:**
```markdown
# v2.0.0 Released - Breaking Changes

@chabaduniverse/auth v2.0.0 is now available!

**Migration Guide:** [MIGRATION_v2.md](link)

**Breaking Changes:**
- [List of changes]

**How to Upgrade:**
\`\`\`bash
npm install @chabaduniverse/auth@latest
\`\`\`

Then follow the migration guide.

**Support:**
- Questions? Comment below or open an issue
- Migration problems? We're here to help
```

### Supporting Multiple Major Versions

**Strategy:** Maintain previous major version for 6-12 months

```bash
# Backport critical fixes to v1.x
git checkout -b v1-maintenance v1.6.0
# ... apply fix ...
npm version patch  # 1.6.0 → 1.6.1
npm publish --tag v1-latest

# Users can install v1.x
npm install @chabaduniverse/auth@v1-latest
```

---

## Rollback & Hotfix Procedures

**Purpose:** Handle publishing mistakes and critical bugs

### Deprecating a Published Version

**Use deprecation when:**
- Critical bug found after publish
- Security vulnerability discovered
- Accidental publish of wrong version

```bash
# Deprecate a specific version
npm deprecate @chabaduniverse/auth@1.2.0 "Critical bug, use 1.2.1"

# Deprecate a version range
npm deprecate @chabaduniverse/auth@"1.2.x" "Use 1.3.0 or higher"

# Deprecate all versions below a threshold
npm deprecate @chabaduniverse/auth@"<1.5.0" "Deprecated, upgrade to 1.5.0+"
```

**Effect:**
```bash
npm install @chabaduniverse/auth@1.2.0
# npm WARN deprecated @chabaduniverse/auth@1.2.0: Critical bug, use 1.2.1
```

**Undeprecate (if mistake):**
```bash
npm deprecate @chabaduniverse/auth@1.2.0 ""
```

### Unpublishing (Use Sparingly)

**⚠️ WARNING:** Unpublishing breaks existing users

**npm unpublish rules:**
- Only within 72 hours of publish
- Only if package has no downloads
- Requires justification

```bash
# Unpublish specific version (rarely needed)
npm unpublish @chabaduniverse/auth@1.2.0

# Unpublish entire package (VERY rare, requires npm support)
npm unpublish @chabaduniverse/auth --force
```

**Best Practice:**
- **Prefer deprecation + fixed version** over unpublishing
- Unpublishing is destructive and breaks existing installs

### Hotfix Workflow

**Scenario:** Critical bug in production (v1.2.0)

```bash
# 1. Create hotfix branch from affected version tag
git checkout -b hotfix/1.2.1 v1.2.0

# 2. Fix the critical bug
# ... make changes ...

# 3. Test thoroughly
npm test
npm run build

# 4. Bump patch version
npm version patch  # 1.2.0 → 1.2.1

# 5. Publish immediately
npm publish

# 6. Deprecate broken version
npm deprecate @chabaduniverse/auth@1.2.0 "Critical bug, upgrade to 1.2.1 immediately"

# 7. Verify hotfix
npm view @chabaduniverse/auth versions
# Expected: [..., "1.2.0", "1.2.1"]

# 8. Merge hotfix back to main
git checkout main
git merge hotfix/1.2.1

# 9. Create GitHub Issue/Announcement
```

**GitHub Announcement Template:**
```markdown
# 🚨 Critical Security Fix: v1.2.1

A critical security vulnerability was discovered in v1.2.0.

**Affected Versions:** 1.2.0
**Fixed in:** 1.2.1

**Action Required:**
\`\`\`bash
npm install @chabaduniverse/auth@latest
\`\`\`

**Details:**
[Description of vulnerability and fix]

**Timeline:**
- Vulnerability discovered: 2025-01-15 10:00 AM
- Fix published: 2025-01-15 2:00 PM (4 hours)
- v1.2.0 deprecated: 2025-01-15 2:05 PM
```

### Emergency Rollback Procedure

**Scenario:** v1.3.0 causes widespread issues

```bash
# 1. Deprecate problematic version
npm deprecate @chabaduniverse/auth@1.3.0 "Known issues, use 1.2.5 instead"

# 2. Publish fixed version quickly
git checkout v1.2.5
git checkout -b hotfix/1.3.1
# ... apply minimal fix ...
npm version patch  # → 1.3.1
npm publish

# 3. Communicate rollback
# GitHub Issue + Announcement
```

---

## Troubleshooting & FAQ

**Purpose:** Common issues and solutions

### Authentication Issues

#### "403 Forbidden" when publishing

**Cause:** Not logged in or insufficient permissions

**Solution:**
```bash
# Check if logged in
npm whoami
# Expected: your-npm-username

# If not logged in
npm login

# Verify organization membership
npm org ls chabaduniverse
# You should appear in the list

# Verify your role
# Owner/Admin/Developer can publish
```

#### "401 Unauthorized" error

**Cause:** Invalid or expired authentication token

**Solution:**
```bash
# Re-authenticate
npm logout
npm login

# For CI/CD: regenerate NPM_TOKEN
# 1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
# 2. Revoke old token
# 3. Generate new "Automation" token
# 4. Update GitHub secret NPM_TOKEN
```

### Publishing Errors

#### "Package name too similar to existing package"

**Cause:** npm prevents typosquatting (malicious packages with similar names)

**Solution:**
- Choose a more distinctive package name
- Contact npm support if legitimate

#### "Version already published"

**Cause:** Cannot re-publish same version number

**Solution:**
```bash
# Bump version and publish
npm version patch
npm publish
```

#### "You cannot publish over the previously published versions"

**Cause:** Attempting to publish older version number

**Solution:**
```bash
# Check latest published version
npm view @chabaduniverse/auth version

# Bump to higher version
npm version major  # or minor/patch
```

### TypeScript Issues

#### "Missing types file" error for consumers

**Cause:** TypeScript declarations not generated during build

**Solution:**

**tsconfig.json must include:**
```json
{
  "compilerOptions": {
    "declaration": true,          // Generate .d.ts files
    "declarationMap": true,       // Generate .d.ts.map files
    "outDir": "dist",             // Output directory
    "rootDir": "src"              // Source directory
  }
}
```

**Verify types are published:**
```bash
npm pack --dry-run
# Should show: dist/index.d.ts
```

**package.json must include:**
```json
{
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ]
}
```

#### "Type errors in consuming app"

**Cause:** Peer dependency version mismatch

**Solution:**

**Check peer dependencies:**
```json
{
  "peerDependencies": {
    "react": "^18.0.0"  // Should match consumer's React version
  }
}
```

**Verify in consumer app:**
```bash
npm list react
# Should match peer dependency requirement
```

### Peer Dependency Warnings

#### "WARN unmet peer dependency"

**Cause:** Consuming app doesn't have required peer dependencies installed

**Solution for package authors:**
- Document required peer dependencies in README
- Use correct version ranges (^18.0.0 not ^18.2.0)

**Solution for package consumers:**
```bash
# Install missing peer dependencies
npm install react@^18.0.0 react-dom@^18.0.0
```

### Build Issues

#### "Build fails in CI but works locally"

**Cause:** Environment differences (Node version, dependencies)

**Solution:**

**Use exact Node version:**
```yaml
# .github/workflows/publish.yml
- uses: actions/setup-node@v3
  with:
    node-version: '18'  # Match your local version
```

**Use `npm ci` instead of `npm install`:**
```yaml
# Install from package-lock.json exactly
- run: npm ci
```

**Lock Node version locally:**
```json
// package.json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### "Out of memory" error during build

**Cause:** Large build, insufficient memory

**Solution:**
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**In package.json:**
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' rollup -c"
  }
}
```

### Common Questions

#### "Should I use `npm ci` or `npm install`?"

**For CI/CD:** Always use `npm ci`
- Installs from package-lock.json exactly
- Faster than npm install
- Removes node_modules first (clean install)

**For local development:** Use `npm install`
- Updates package-lock.json if needed
- More flexible

#### "When should I publish pre-release versions?"

**Use pre-release when:**
- Testing breaking changes (alpha/beta)
- Gathering user feedback before stable release
- Validating fixes in production-like environment

**Don't use pre-release for:**
- Regular bug fixes (use patch version)
- Minor feature additions (use minor version)

#### "How do I test a package before publishing?"

**Best practices:**
```bash
# 1. Pack locally
npm pack

# 2. Install in test project
cd /path/to/test-project
npm install /path/to/package.tgz

# 3. Test imports and functionality
npm test

# 4. Clean up
npm uninstall package-name
```

---

## Quick Reference: npm Commands

### Organization Management

```bash
# Create organization
npm org create chabaduniverse

# Add team member with role
npm org set chabaduniverse <username> <role>
# Roles: owner, admin, developer, member

# List organization members
npm org ls chabaduniverse

# Remove team member
npm org rm chabaduniverse <username>

# List organization packages
npm org ls-packages chabaduniverse
```

### Package Publishing

```bash
# Login to npm
npm login

# Check current user
npm whoami

# Publish package (first time or update)
npm publish --access public

# Publish with specific tag
npm publish --tag beta

# Unpublish specific version (within 72 hours, no downloads)
npm unpublish <pkg>@<version>

# Deprecate version
npm deprecate <pkg>@<version> "message"

# Undeprecate
npm deprecate <pkg>@<version> ""
```

### Version Management

```bash
# Bump major version (1.0.0 → 2.0.0)
npm version major

# Bump minor version (1.0.0 → 1.1.0)
npm version minor

# Bump patch version (1.0.0 → 1.0.1)
npm version patch

# Pre-release version
npm version prerelease --preid=alpha
# Result: 1.0.0-alpha.0

npm version prerelease --preid=beta
# Result: 1.0.0-beta.0

npm version prerelease --preid=rc
# Result: 1.0.0-rc.0

# Use git tag as version
npm version from-git
```

### Testing & Verification

```bash
# Create tarball locally (doesn't publish)
npm pack

# Preview what would be published (dry-run)
npm pack --dry-run

# View published package info
npm view <pkg>

# View specific field
npm view <pkg> version
npm view <pkg> versions
npm view <pkg> description
npm view <pkg> dependencies

# View package as JSON
npm view <pkg> --json

# Download tarball of published package
npm pack <pkg>
```

### Package Maintenance

```bash
# Check for outdated dependencies
npm outdated

# Update dependencies (respect package.json ranges)
npm update

# Update specific package to latest
npm install <pkg>@latest

# Check for security vulnerabilities
npm audit

# Auto-fix vulnerabilities (patch/minor only)
npm audit fix

# Force fix (may introduce breaking changes)
npm audit fix --force

# List installed packages
npm list

# List production dependencies only
npm list --prod

# List dependencies at specific depth
npm list --depth=0
```

### Installation

```bash
# Install dependencies from package-lock.json (CI/CD)
npm ci

# Install package
npm install <pkg>

# Install specific version
npm install <pkg>@1.2.3

# Install from tarball
npm install /path/to/package.tgz

# Install with specific tag
npm install <pkg>@beta

# Uninstall package
npm uninstall <pkg>
```

### Useful Flags

```bash
# All commands
--dry-run              # Preview without executing
--json                 # Output as JSON
--loglevel=<level>     # Set log level (silent, error, warn, info, verbose)

# npm install
--save                 # Add to dependencies (default)
--save-dev             # Add to devDependencies
--save-peer            # Add to peerDependencies
--save-optional        # Add to optionalDependencies

# npm publish
--access public        # Required for scoped packages
--tag <tag>            # Publish with specific tag (default: latest)
--dry-run              # Show what would be published

# npm version
--no-git-tag-version   # Don't create git tag
-m "message"           # Custom commit message
```

---

## Related Documentation

**Cross-Reference Links:**
- [VISION_PLANNING_DOCUMENT.md](../VISION_PLANNING_DOCUMENT.md) - Overall project vision and roadmap
- [CDSSO_IMPLEMENTATION_PLAN.md](../CDSSO_IMPLEMENTATION_PLAN.md) - Authentication flows and SSO setup
- [LOGGING_GUIDE.md](../LOGGING_GUIDE.md) - Logging best practices for package development

**Related Workflows:**
- Development workflow (session management, testing)
- CI/CD pipelines (GitHub Actions integration)
- Database migrations (MongoDB → DynamoDB strategy)

**External Resources:**
- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning Specification](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Last Updated:** 2025-01-04
**Maintained By:** Chabad Universe Development Team
**Questions?** Open an issue or contact the team
