# Testing Guide

> Complete guide for testing the @chabaduniverse/auth library

**✅ UPDATED:** Phase 5A core infrastructure complete with 273 tests passing

## 🧪 Testing Guide

### 1. **Quick Verification (30 seconds)**

```bash
# Verify build succeeds
npm run build

# Verify all tests pass
npm test
```

**Expected Results:**
- ✅ Build completes without errors (creates dist/esm, dist/cjs, dist/types)
- ✅ All 273 tests pass across test suites

---

### 2. **Detailed Test Breakdown**

```bash
# Run tests with coverage report
npm test -- --coverage

# Run specific test suites
npm test AuthManager              # Core authentication manager tests
npm test TokenStorage             # Token storage tests
npm test MerkosAPIAdapter         # Merkos API adapter tests (Phase 5A)
npm test BearerTokenDialog        # Bearer token dialog component tests
npm test AuthProvider             # Auth provider tests

# Run only integration tests
npm test integration

# Run tests in watch mode (for development)
npm test -- --watch
```

### 3. **Phase 5A Testing (MerkosAPIAdapter Core)**

Phase 5A introduced 20 comprehensive unit tests for the MerkosAPIAdapter core infrastructure:

```bash
# Run all MerkosAPIAdapter tests
npm test MerkosAPIAdapter

# Run with verbose output
npm test -- MerkosAPIAdapter --verbose
```

**Test Categories (20 tests):**
- Token management (setToken, clearToken) - 6 tests
- Successful requests - 2 tests
- Authentication headers - 2 tests
- Request body structure - 1 test
- Error handling (API errors, network errors, timeouts) - 7 tests
- Response parsing - 2 tests

**Key Test Scenarios:**
1. ✅ Token storage and retrieval
2. ✅ Token cleared on logout
3. ✅ POST requests to `/api/v2` endpoint
4. ✅ Custom `identifier` header injection
5. ✅ Request body format validation
6. ✅ Merkos v2 error response detection
7. ✅ HTTP status code error handling (401, 403, 404, 500, 503)
8. ✅ Network error handling
9. ✅ Timeout error handling
10. ✅ Type-safe response parsing

---

### 3. **Test the Package Locally in Another Project**

#### Option A: Using npm pack (Recommended)

```bash
# In chabaduniverse-auth directory
npm pack

# This creates a tarball: chabaduniverse-auth-1.0.0.tgz
# Copy the path to this file

# In your test project
npm install /path/to/chabaduniverse-auth-1.0.0.tgz
```

#### Option B: Using npm link

```bash
# In chabaduniverse-auth directory
npm link

# In your test project
npm link @chabaduniverse/auth
```

---

### 4. **Test Integration in a Next.js App**

Create a test file to verify the extracted components work:

**`pages/_app.tsx`** (Test Project)
```tsx
import { AuthProvider } from '@chabaduniverse/auth/react';
import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';
import type { AppProps } from 'next/app';

const merkosAdapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
  apiVersion: 'v2'
});

const userServiceAdapter = {
  async getUserInfo(userId: string) {
    return { id: userId, name: 'Test User' };
  },
  async updateUser(userId: string, data: any) {
    return { id: userId, ...data };
  }
};

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider
      config={{
        apiAdapter: merkosAdapter,
        userServiceAdapter
      }}
    >
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
```

**`pages/test-auth.tsx`** (Test Component)
```tsx
import { useAuth } from '@chabaduniverse/auth/react';
import { AuthGuard, BearerTokenDialog } from '@chabaduniverse/auth/react';
import { useState } from 'react';

function TestAuthPage() {
  const {
    isAuthenticated,
    user,
    loginWithBearerToken,
    logout
  } = useAuth();

  const [showDialog, setShowDialog] = useState(false);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Auth Package Test</h1>

      {/* Test 1: Auth State */}
      <div>
        <h2>Authentication State</h2>
        <p>Authenticated: {isAuthenticated ? 'Yes ✅' : 'No ❌'}</p>
        {user && <pre>{JSON.stringify(user, null, 2)}</pre>}
      </div>

      {/* Test 2: BearerTokenDialog */}
      <div>
        <h2>Bearer Token Dialog Test</h2>
        <button onClick={() => setShowDialog(true)}>
          Show Bearer Token Dialog
        </button>
        <BearerTokenDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onTokenSubmit={async (token) => {
            await loginWithBearerToken(token);
            setShowDialog(false);
          }}
        />
      </div>

      {/* Test 3: AuthGuard */}
      <div>
        <h2>Auth Guard Test</h2>
        <AuthGuard
          requireMerkosAuth
          BearerTokenDialog={BearerTokenDialog}
        >
          <div style={{
            padding: '1rem',
            background: '#e8f5e9',
            borderRadius: '8px'
          }}>
            ✅ This content is protected by AuthGuard!
          </div>
        </AuthGuard>
      </div>

      {/* Test 4: Logout */}
      {isAuthenticated && (
        <button onClick={logout}>Logout</button>
      )}
    </div>
  );
}

export default TestAuthPage;
```

---

### 5. **Mocking Patterns**

#### Mocking MerkosAPIAdapter

For Phase 5A, the adapter uses `global.fetch` for HTTP requests. Mock it in your tests:

```typescript
// Mock successful v2 API request
beforeEach(() => {
  (global.fetch as jest.Mock) = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

it('should make authenticated v2 request', async () => {
  const mockResponse = {
    user: { uuid: '123', email: 'test@example.com', name: 'Test User' }
  };

  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  });

  const adapter = new MerkosAPIAdapter({
    baseUrl: 'https://org.merkos302.com',
    apiVersion: 'v2',
  });

  adapter.setToken('test-token');
  const result = await adapter.v2Request('auth', 'auth:user:info', {});

  expect(result).toEqual(mockResponse);
  expect(global.fetch).toHaveBeenCalledWith(
    'https://org.merkos302.com/api/v2',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'identifier': 'test-token',
      }),
      body: JSON.stringify({
        service: 'auth',
        path: 'auth:user:info',
        params: {},
      }),
    })
  );
});
```

#### Mocking Error Responses

```typescript
it('should handle Merkos API errors', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ err: 'Unauthorized', code: 'AUTH_FAILED' }),
  });

  const adapter = new MerkosAPIAdapter({
    baseUrl: 'https://org.merkos302.com',
    apiVersion: 'v2',
  });

  await expect(
    adapter.v2Request('auth', 'auth:user:info', {})
  ).rejects.toThrow(AuthError);
});
```

#### Mocking Network Errors

```typescript
it('should handle network errors', async () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(
    new Error('Network error')
  );

  const adapter = new MerkosAPIAdapter({
    baseUrl: 'https://org.merkos302.com',
    apiVersion: 'v2',
  });

  await expect(
    adapter.v2Request('auth', 'auth:user:info', {})
  ).rejects.toThrow(AuthError);
});
```

---

### 6. **Test Specific Components**

#### A. **BearerTokenDialog** (New Headless Component)

```bash
# Run BearerTokenDialog-specific tests
npm test -- BearerTokenDialog.test.tsx --verbose
```

**Manual Test:** Visit `/test-auth` in your test app and click "Show Bearer Token Dialog"

**Expected Behavior:**
- ✅ Dialog renders with default HTML implementation
- ✅ Input field is auto-focused
- ✅ Password type input (masked)
- ✅ Can submit token
- ✅ Can cancel/close
- ✅ Shows loading state during submission
- ✅ Shows error messages

#### B. **AuthContext** (Refactored from SimpleAuthContext)

```tsx
// Test AuthContext directly
import { useAuth } from '@chabaduniverse/auth/react';

function TestAuthContext() {
  const auth = useAuth();

  console.log('Auth State:', {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
    hasMerkosBearerToken: auth.hasMerkosBearerToken,
    isValuAuthenticated: auth.isValuAuthenticated
  });

  return <div>Check console for auth state</div>;
}
```

#### C. **useValuAuth Hook** (Extracted and Enhanced)

```tsx
import { useValuAuth, ValuAPIProvider } from '@chabaduniverse/auth/react';

// Create a mock Valu API adapter
const mockValuAdapter = {
  getConnectionState: () => ({
    isConnected: true,
    isReady: true,
    isInIframe: false,
    isNavigatingApp: false
  }),
  getApi: async (apiName: string) => ({
    run: async (method: string) => ({
      id: 'test-user-123',
      name: 'Test User',
      email: 'test@example.com'
    })
  }),
  runConsoleCommand: async (command: string) => null
};

function TestValuAuth() {
  return (
    <ValuAPIProvider adapter={mockValuAdapter}>
      <ValuAuthComponent />
    </ValuAPIProvider>
  );
}

function ValuAuthComponent() {
  const valu = useValuAuth();

  return (
    <div>
      <h2>Valu Auth Test</h2>
      <p>Connected: {valu.isValuConnected ? 'Yes' : 'No'}</p>
      <p>Authenticated: {valu.isAuthenticated ? 'Yes' : 'No'}</p>
      <p>In Valu Frame: {valu.isInValuFrame ? 'Yes' : 'No'}</p>
      <button onClick={valu.login}>Login with Valu</button>
      <button onClick={valu.refreshUser}>Refresh User</button>
    </div>
  );
}
```

#### D. **AuthGuard Component**

```tsx
import { AuthGuard } from '@chabaduniverse/auth/react';

function TestAuthGuard() {
  return (
    <>
      {/* Test: Require Merkos Auth */}
      <AuthGuard requireMerkosAuth>
        <div>Protected by Merkos Auth</div>
      </AuthGuard>

      {/* Test: Require Valu Auth */}
      <AuthGuard requireValuAuth>
        <div>Protected by Valu Auth</div>
      </AuthGuard>

      {/* Test: Require Both */}
      <AuthGuard requireMerkosAuth requireValuAuth>
        <div>Protected by Both Auth Methods</div>
      </AuthGuard>

      {/* Test: Custom Fallback */}
      <AuthGuard
        requireMerkosAuth
        fallback={<div>Custom Loading...</div>}
      >
        <div>Protected Content</div>
      </AuthGuard>
    </>
  );
}
```

---

### 6. **Verify Package Exports**

```bash
# Check that all exports are accessible
node -e "
const auth = require('./dist/cjs/index.js');
console.log('Core exports:', Object.keys(auth));
const react = require('./dist/cjs/react/index.js');
console.log('React exports:', Object.keys(react));
const adapters = require('./dist/cjs/adapters/index.js');
console.log('Adapter exports:', Object.keys(adapters));
"
```

**Expected Output:**
```
Core exports: [ 'VERSION', 'AuthManager', 'TokenStorage', 'AuthContext', 'useAuth', 'useValuAuth', 'ValuAPIProvider', ... ]
React exports: [ 'AuthProvider', 'useAuth', 'AuthGuard', 'BearerTokenDialog', ... ]
Adapter exports: [ 'MerkosAPIAdapter' ]
```

---

### 7. **Type Checking Test**

Create a TypeScript file to verify types work correctly:

**`test-types.ts`**
```typescript
import {
  AuthProvider,
  useAuth,
  AuthGuard,
  BearerTokenDialog,
  type UseValuAuthReturn,
  type PortalUser,
  type BearerTokenDialogProps
} from '@chabaduniverse/auth/react';

import { MerkosAPIAdapter } from '@chabaduniverse/auth/adapters';

// Test: Adapter creation
const adapter = new MerkosAPIAdapter({
  baseUrl: 'https://org.merkos302.com',
  apiVersion: 'v2'
});

// Test: Hook return type
const testHookReturn = (auth: UseValuAuthReturn) => {
  auth.login();
  auth.logout();
  auth.refreshUser();
  auth.getUserIcon('user-123', 64);
};

// Test: PortalUser type
const testUser: PortalUser = {
  id: 'test-123',
  valuUserId: 'valu-456',
  name: 'Test User',
  displayName: 'Test',
  roles: ['user'],
  permissions: [],
  isValuAuthenticated: true
};

console.log('✅ All types compile successfully!');
```

```bash
# Run type check
npx tsc test-types.ts --noEmit
```

---

### 8. **Documentation Review Test**

```bash
# Verify all documentation exists and is readable
cat README.md | head -n 50
cat INTEGRATION_GUIDE.md | head -n 50
cat QUICK_START.md
cat src/react/components/BearerTokenDialog.README.md | head -n 30
```

---

### 9. **Bundle Size Check**

```bash
# Check bundle sizes
ls -lh dist/esm/*.js
ls -lh dist/cjs/*.js

# More detailed size analysis
npm run build && du -sh dist/*
```

**Expected Sizes:**
- ESM bundle: ~50-100KB
- CJS bundle: ~50-100KB
- Types: ~200-500KB

---

### 10. **Regression Test Checklist**

Manually verify these scenarios work:

- [ ] ✅ Bearer token login flow
- [ ] ✅ Credentials login flow
- [ ] ✅ Google OAuth login flow
- [ ] ✅ Chabad.org SSO login flow
- [ ] ✅ CDSSO login flow
- [ ] ✅ Dual authentication (Valu + Merkos)
- [ ] ✅ AuthGuard blocks unauthenticated access
- [ ] ✅ BearerTokenDialog prompts for token
- [ ] ✅ Token persistence in localStorage
- [ ] ✅ Cookie-based caching
- [ ] ✅ Logout clears all auth state

---

## 📊 Success Criteria

The session work is **successful** if:

✅ **Build:** `npm run build` completes without errors
✅ **Tests:** All 156 tests pass
✅ **Types:** TypeScript compilation works
✅ **Exports:** All components/hooks are importable
✅ **Integration:** Package works in a Next.js app
✅ **Documentation:** README and guides are complete

---

## 🐛 If You Find Issues

```bash
# Get detailed test output
npm test -- --verbose

# Check specific test file
npm test -- src/react/components/__tests__/BearerTokenDialog.test.tsx

# Debug build issues
npm run build:types -- --listEmittedFiles

# Verify package contents
tar -tzf chabaduniverse-auth-1.0.0.tgz | head -n 50
```

---

## ⚡ Quick Start Testing (60 seconds)

```bash
# 1. Build
npm run build

# 2. Test
npm test

# 3. Pack and install in test project
npm pack
cd /path/to/test-project
npm install /path/to/chabaduniverse-auth-1.0.0.tgz

# 4. Use in test-auth.tsx page (see example above)
# Visit http://localhost:3000/test-auth
```

---

## 📝 What Was Completed in Phase B

### Files Extracted and Integrated

1. ✅ **SimpleAuthContext.tsx** → `src/core/contexts/AuthContext.tsx` (859 lines)
2. ✅ **useValuAuth.ts** → `src/core/hooks/useValuAuth.tsx` (897 lines)
3. ✅ **AuthenticationGuard.tsx** → `src/react/components/AuthGuard.tsx` (264 lines)
4. ✅ **BearerTokenPromptDialog.tsx** → `src/react/components/BearerTokenDialog.tsx` (415 lines)

### Key Features Implemented

- ✨ Headless component pattern for BearerTokenDialog
- ✨ Adapter pattern for framework-agnostic core
- ✨ Dual authentication (Valu + Merkos) support
- ✨ Complete TypeScript type safety
- ✨ Comprehensive test coverage (156 tests)
- ✨ Production-ready documentation

### Build Output

- **ESM Bundle:** `dist/esm/` (2.8s build time)
- **CJS Bundle:** `dist/cjs/` (2s build time)
- **Type Declarations:** `dist/types/` (102ms build time)

---

## 🎯 Next Steps After Testing

If all tests pass, the package is ready for:

1. **Phase C:** Testing & Documentation Review
2. **Phase D:** NPM Publishing
3. **Phase E:** Migration to universe-portal

---

**Last Updated:** January 2026
**Session:** Phase B Integration - Core Auth File Extraction
**Status:** ✅ Complete and Ready for Testing
