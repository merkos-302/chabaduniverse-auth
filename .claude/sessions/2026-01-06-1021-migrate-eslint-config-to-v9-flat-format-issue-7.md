# Migrate ESLint Configuration to v9 Flat Config Format (Issue #7)

**Started:** 2026-01-06 10:21 AM
**Status:** Active
**Branch:** `chore/migrate-eslint-config-to-v9-flat-format-issue-7`
**Issue:** #7

## Overview

Migrate ESLint configuration from legacy `.eslintrc.json` format to the new v9 flat config format (`eslint.config.js`) to fix CI/CD pipeline failures.

## Problem Statement

GitHub Actions CI/CD pipeline is failing on the linter step:
```
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
From ESLint v9.0.0, the default configuration file is now eslint.config.js.
```

**Current State:**
- ESLint version: `^9.19.0` (package.json)
- Config format: `.eslintrc.json` (legacy, unsupported in v9)
- Status: ❌ CI failing on all Node versions (16.x, 18.x, 20.x)
- **Blocking:** This prevents tests from running in CI

## Goals

- [ ] Read and understand ESLint v9 migration guide
- [ ] Analyze current `.eslintrc.json` configuration
- [ ] Create new `eslint.config.js` with flat config format
- [ ] Convert all extends, plugins, and rules to new format
- [ ] Test linting locally (`npm run lint`)
- [ ] Test lint fixing locally (`npm run lint:fix`)
- [ ] Delete `.eslintrc.json`
- [ ] Commit changes
- [ ] Verify CI passes with new configuration
- [ ] Document any migration notes

## Current Configuration

**From `.eslintrc.json`:**
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": [
    "@typescript-eslint",
    "react",
    "react-hooks"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

**Dependencies:**
- `eslint`: ^9.19.0
- `@typescript-eslint/eslint-plugin`: ^8.20.0
- `@typescript-eslint/parser`: ^8.20.0
- `eslint-config-prettier`: ^10.0.2
- Plugins: react, react-hooks (need to verify versions)

## Progress

### Investigation Phase
- [ ] Review ESLint v9 migration guide
- [ ] Identify required changes for flat config
- [ ] Check plugin compatibility with ESLint v9

### Implementation Phase
- [ ] Create `eslint.config.js` with new format
- [ ] Convert extends to flat config imports
- [ ] Convert parser and parser options
- [ ] Convert plugins array
- [ ] Convert rules object
- [ ] Convert settings object

### Testing Phase
- [ ] Run `npm run lint` locally
- [ ] Run `npm run lint:fix` locally
- [ ] Verify no regressions in linting behavior
- [ ] Test on sample files with intentional errors

### Cleanup Phase
- [ ] Delete `.eslintrc.json`
- [ ] Update any documentation references
- [ ] Commit with conventional commit format

### Verification Phase
- [ ] Push to branch
- [ ] Monitor GitHub Actions CI
- [ ] Verify linter passes on all Node versions
- [ ] Verify tests run successfully after linting

## Key Decisions

*To be documented as we make them*

## Technical Notes

### Flat Config Key Differences

1. **Export Format:** Must use `export default []` or `module.exports = []`
2. **Extends:** Replaced with importing and spreading configs
3. **Plugins:** Must be imported and referenced directly
4. **Files/Ignores:** Uses `files` and `ignores` patterns instead of separate ignore files
5. **Language Options:** Parser options moved to `languageOptions` key

### Migration Resources

- **Official Guide:** https://eslint.org/docs/latest/use/configure/migration-guide
- **Flat Config Reference:** https://eslint.org/docs/latest/use/configure/configuration-files-new
- **TypeScript ESLint v9 Guide:** https://typescript-eslint.io/getting-started

## Blockers & Issues

*None currently*

## Next Steps

1. Read migration guide
2. Create `eslint.config.js`
3. Test locally
4. Delete old config
5. Commit and push
6. Verify CI passes

## Related Issues

- Issue #7: This issue (ESLint migration)
- Issue #5: Fix timer tests (blocked by this - tests can't run if linter fails)
- PR #6: Previously blocked by linter failure

## Success Criteria

✅ `eslint.config.js` created with flat config format
✅ All existing lint rules preserved
✅ `npm run lint` passes locally
✅ `npm run lint:fix` works correctly
✅ GitHub Actions CI passes on all Node versions
✅ No breaking changes to code quality checks
✅ Tests can run after linting passes
