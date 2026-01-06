# CDSSO Setup & Testing Guide

**Last Updated:** December 23, 2025
**Status:** Production Ready
**Issue:** #132 - Implement CDSSO to Enable Merkos Platform API Access from Portal Iframe

---

## 📋 Table of Contents

1. [Environment Variables Setup](#environment-variables-setup)
2. [Getting the JWT Secret Key](#getting-the-jwt-secret-key)
3. [Local Development Testing](#local-development-testing)
4. [Production Setup](#production-setup)
5. [Testing Checklist](#testing-checklist)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Environment Variables Setup

### Required Environment Variables

Add these to your `.env.local` file (create it if it doesn't exist):

```bash
# Merkos Platform JWT Secret (REQUIRED for CDSSO)
# MUST match the JWT secret used by Merkos Platform (id.merkos302.com)
# This enables Cross-Domain SSO by validating JWT tokens from Merkos SSO
MERKOS_JWT_SECRET_KEY=your-merkos-platform-jwt-secret-here

# Optional: Your own JWT secret for portal-specific features
JWT_SECRET=your-portal-jwt-secret-here
```

### Quick Setup

```bash
# Copy the example file
cp .env.example .env.local

# Edit the file and add the MERKOS_JWT_SECRET_KEY
nano .env.local  # or use your preferred editor
```

---

## 🔑 Getting the JWT Secret Key

### What is MERKOS_JWT_SECRET_KEY?

The `MERKOS_JWT_SECRET_KEY` is the **same secret key** that Merkos Platform uses to sign JWT tokens at `id.merkos302.com`. The portal backend needs this key to:

1. **Verify token signatures** - Ensure tokens haven't been tampered with
2. **Validate token claims** - Check expiration and user data
3. **Security** - Prevent token forgery attacks

### How to Get It

**Contact the Merkos Platform team** to obtain the production `JWT_SECRET_KEY`:

- **Who to Contact:** Yossi (Merkos Platform lead)
- **What to Ask For:** "JWT_SECRET_KEY used by id.merkos302.com for signing SSO tokens"
- **Security Note:** This is a sensitive credential - store it securely and never commit to git

### For Development/Testing

If you don't have access to the production key yet, you can use a **test key** for local development:

```bash
# Generate a test JWT secret for local development ONLY
openssl rand -base64 64

# Add to .env.local
MERKOS_JWT_SECRET_KEY=<generated-test-key>
```

**⚠️ IMPORTANT:** A test key will only work for locally-generated tokens. It won't validate real tokens from `id.merkos302.com`.

---

## 🧪 Local Development Testing

### Method 1: Mock CDSSO Flow (No Merkos Platform Required)

Test the CDSSO implementation with mock tokens:

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Run the CDSSO test suite
npm test -- __tests__/lib/cdsso-utils.test.ts
npm test -- __tests__/api/sso/remote/status.test.ts
```

**Expected Results:**
- ✅ 44 tests passing in `cdsso-utils.test.ts`
- ✅ 27 tests passing in `sso/remote/status.test.ts`
- ✅ All token validation logic working

### Method 2: Test with Real Merkos Platform (Requires MERKOS_JWT_SECRET_KEY)

To test with actual Merkos Platform SSO:

#### Prerequisites

1. **MERKOS_JWT_SECRET_KEY** from Merkos Platform team
2. **User account** on `id.merkos302.com`
3. **Browser** (Chrome recommended for DevTools)

#### Testing Steps

```bash
# 1. Ensure MERKOS_JWT_SECRET_KEY is set in .env.local
cat .env.local | grep MERKOS_JWT_SECRET_KEY

# 2. Start the development server
npm run dev

# 3. Open two browser tabs:
#    Tab 1: http://localhost:3000
#    Tab 2: https://id.merkos302.com
```

#### CDSSO Flow Test

**Step 1: Login to Merkos Platform**
```
1. Go to https://id.merkos302.com
2. Login with your credentials
3. You should see the Merkos dashboard
```

**Step 2: Check CDSSO Authentication**
```
1. Go to http://localhost:3000 in Tab 1
2. Open browser DevTools (F12) → Console tab
3. Look for these log messages:

   ✅ [CDSSO] Step 1: Checking remote session at id.merkos302.com...
   ✅ [CDSSO] Remote session active, token retrieved
   ✅ [CDSSO] Step 2: Applying token to portal backend...
   ✅ [CDSSO] Token applied successfully, user authenticated: <your-email>
   ✅ [CDSSO] Token stored in localStorage
   ✅ [CDSSO] Token set in merkosApiClient for API authentication
   ✅ [CDSSO] Authentication complete: <your-email>
```

**Step 3: Verify Token Storage**
```javascript
// In browser DevTools Console, run:
localStorage.getItem('merkos_auth_token')
// Should return: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

document.cookie
// Should include: "x-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Step 4: Test Merkos Platform API Call**
```javascript
// In browser DevTools Console, run:
fetch('/api/test-merkos-api')
  .then(r => r.json())
  .then(console.log)

// Expected response:
// { success: true, authenticated: true, user: {...} }
```

### Method 3: Test Token Validation Endpoint

Test the backend token validation directly:

```bash
# 1. Get a JWT token from Merkos Platform
# (Login at id.merkos302.com and copy token from DevTools)

# 2. Test the validation endpoint
curl -X POST http://localhost:3000/api/sso/remote/status \
  -H "Content-Type: application/json" \
  -d '{"token":"<paste-jwt-token-here>"}'

# Expected response:
# {"status":"success","user":{"id":"...","email":"...","name":"..."}}
```

---

## 🚀 Production Setup

### Vercel Environment Variables

Add the `MERKOS_JWT_SECRET_KEY` to your Vercel project:

```bash
# Using Vercel CLI
vercel env add MERKOS_JWT_SECRET_KEY production

# Or via Vercel Dashboard:
# 1. Go to Project Settings → Environment Variables
# 2. Add variable:
#    Name: MERKOS_JWT_SECRET_KEY
#    Value: <merkos-platform-jwt-secret>
#    Environment: Production
```

### Production URL Configuration

The CDSSO implementation automatically uses the correct URLs in production:

- **Remote SSO Endpoint:** `https://id.merkos302.com/apiv4/users/sso/remote/status`
- **Portal Validation:** `https://portal.chabaduniverse.com/api/sso/remote/status`
- **Merkos Platform API:** `https://api.merkos302.com/api/v2`

### Cookie Configuration in Production

Cookies are automatically configured for production:

```javascript
// Automatically set in pages/api/sso/remote/status.ts
Domain: portal.chabaduniverse.com
SameSite: None  // Required for cross-domain API calls
Secure: true    // HTTPS only
HttpOnly: true  // XSS prevention
Max-Age: 1209600 // 14 days
```

---

## ✅ Testing Checklist

### Pre-Deployment Testing

- [ ] **Environment Variables Set**
  - [ ] `MERKOS_JWT_SECRET_KEY` configured in `.env.local`
  - [ ] Value matches Merkos Platform's secret

- [ ] **Unit Tests Pass**
  - [ ] `npm test -- __tests__/lib/cdsso-utils.test.ts` (44 tests)
  - [ ] `npm test -- __tests__/api/sso/remote/status.test.ts` (27 tests)
  - [ ] `npm test -- __tests__/pages/_app-cdsso-integration.test.tsx` (9 tests)

- [ ] **TypeScript Compilation**
  - [ ] `npx tsc --noEmit` (0 errors)

- [ ] **Local Integration Test**
  - [ ] Login to `id.merkos302.com` works
  - [ ] Portal iframe receives token
  - [ ] Token stored in localStorage
  - [ ] Token set in merkosApiClient
  - [ ] Browser console shows success logs

- [ ] **API Authentication Test**
  - [ ] Merkos Platform API calls return 200 (not 401)
  - [ ] User data correctly fetched from API
  - [ ] Token automatically included in headers

### Post-Deployment Testing

- [ ] **Production Environment**
  - [ ] `MERKOS_JWT_SECRET_KEY` set in Vercel environment variables
  - [ ] HTTPS enforced (Secure cookies working)
  - [ ] SameSite=None cookies working cross-domain

- [ ] **Production CDSSO Flow**
  - [ ] Login to `id.merkos302.com` in production
  - [ ] Navigate to `portal.chabaduniverse.com`
  - [ ] CDSSO authentication completes automatically
  - [ ] Token persists across page refreshes

- [ ] **Cross-Browser Testing**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **Security Validation**
  - [ ] Cookies are HTTP-only (not accessible via JavaScript)
  - [ ] Cookies are Secure (HTTPS only)
  - [ ] Invalid tokens rejected (401 response)
  - [ ] Expired tokens rejected

---

## 🔍 Troubleshooting

### Problem: "MERKOS_JWT_SECRET_KEY not configured" Error

**Symptom:**
```
Server configuration error
or
MERKOS_JWT_SECRET_KEY not configured
```

**Solution:**
```bash
# Check if MERKOS_JWT_SECRET_KEY is set
cat .env.local | grep MERKOS_JWT_SECRET_KEY

# If missing, add it:
echo "MERKOS_JWT_SECRET_KEY=your-key-here" >> .env.local

# Restart the dev server
npm run dev
```

### Problem: "Token validation failed: Invalid token signature"

**Symptom:**
```
[CDSSO] Token validation failed: Invalid token signature
```

**Cause:** Your `MERKOS_JWT_SECRET_KEY` doesn't match the key used by Merkos Platform

**Solution:**
1. Verify you have the correct `MERKOS_JWT_SECRET_KEY` from Merkos Platform team
2. Check for typos or extra whitespace in `.env.local`
3. Ensure the key is the **exact same** value used by `id.merkos302.com`

### Problem: "Remote session not logged in"

**Symptom:**
```
[CDSSO] Remote session not logged in
```

**Cause:** You're not logged into `id.merkos302.com`

**Solution:**
1. Open `https://id.merkos302.com` in a new tab
2. Login with your credentials
3. Return to the portal and refresh the page

### Problem: "CORS error" when calling Merkos API

**Symptom:**
```
Access to fetch at 'https://id.merkos302.com/...' has been blocked by CORS policy
```

**Cause:** Browser blocking cross-origin request

**Solution:**
This is expected behavior. The CDSSO implementation uses `credentials: 'include'` which is correct. Check:
1. Merkos Platform CORS headers allow `portal.chabaduniverse.com`
2. Request includes `credentials: 'include'`
3. Response includes `Access-Control-Allow-Credentials: true`

### Problem: Cookies not being set

**Symptom:**
```
document.cookie  // Empty or missing x-auth-token
```

**Debugging Steps:**

```javascript
// 1. Check if backend validation succeeded
// Look for this log in browser console:
// [CDSSO] Token applied successfully, user authenticated: <email>

// 2. Check cookie in DevTools
// Chrome: DevTools → Application → Cookies → http://localhost:3000
// Look for: x-auth-token

// 3. Check cookie attributes
// Should have:
//   - HttpOnly: true
//   - Secure: true (in production)
//   - SameSite: None
//   - Domain: portal.chabaduniverse.com (in production)
```

### Problem: Tests failing

**Symptom:**
```
FAIL __tests__/lib/cdsso-utils.test.ts
```

**Solution:**
```bash
# Clear test cache
npm test -- --clearCache

# Run tests in verbose mode
npm test -- __tests__/lib/cdsso-utils.test.ts --verbose

# Check for mock setup issues
# Ensure fetch is properly mocked in jest.setup.js
```

### Problem: Token expires immediately

**Symptom:**
User has to re-authenticate frequently

**Check:**
1. Token expiration in JWT payload:
```javascript
// Decode token in browser console
const token = localStorage.getItem('merkos_auth_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires:', new Date(payload.exp * 1000));
```

2. Cookie Max-Age setting (should be 14 days):
```javascript
// Check in pages/api/sso/remote/status.ts
Max-Age: 1209600  // 14 days = 60 * 60 * 24 * 14
```

---

## 📊 Monitoring & Logging

### Production Logging

CDSSO operations are logged with structured logging:

```javascript
// Authentication logs
authLog.tokenValidation(true/false, 'CDSSO', { userId, endpoint, reason });

// API logs
apiLog.request('POST', '/api/sso/remote/status', { token });
apiLog.response('POST', '/api/sso/remote/status', 200);

// Security logs
securityLog.suspiciousActivity(userId, 'Invalid JWT token in status check', { error });
```

### Log Levels

Set in `.env.local`:
```bash
AUTH_LOG_LEVEL=DEBUG      # Verbose authentication logs
API_LOG_LEVEL=DEBUG       # API request/response details
SECURITY_LOG_LEVEL=WARN   # Security events only
```

### Monitoring Checklist

- [ ] Monitor 401 errors from Merkos Platform API (indicates token issues)
- [ ] Track CDSSO authentication success rate
- [ ] Alert on JWT validation failures (potential security issue)
- [ ] Monitor cookie setting success rate
- [ ] Track token refresh frequency

---

## 🎯 Success Indicators

You'll know CDSSO is working correctly when:

✅ **Browser Console Shows:**
```
[CDSSO] Step 1: Checking remote session at id.merkos302.com...
[CDSSO] Remote session active, token retrieved
[CDSSO] Step 2: Applying token to portal backend...
[CDSSO] Token applied successfully, user authenticated: user@example.com
[CDSSO] Token stored in localStorage
[CDSSO] Token set in merkosApiClient for API authentication
[CDSSO] Authentication complete: user@example.com
```

✅ **LocalStorage Has:**
```javascript
localStorage.getItem('merkos_auth_token')
// Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjU..."
```

✅ **Cookies Include:**
```javascript
document.cookie
// Includes: "x-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

✅ **Merkos API Calls Succeed:**
```javascript
// API calls return 200 (not 401)
// User data correctly fetched
// No authentication errors
```

---

## 📚 Additional Resources

- **Implementation Plan:** [CDSSO_IMPLEMENTATION_PLAN.md](./CDSSO_IMPLEMENTATION_PLAN.md)
- **Security Analysis:** [CDSSO_SECURITY_ANALYSIS.md](./CDSSO_SECURITY_ANALYSIS.md)
- **GitHub Issue:** [#132 - Implement CDSSO](https://github.com/merkos-302/universe-portal/issues/132)
- **JWT Library Documentation:** [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- **Cookie Documentation:** [MDN - Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)

---

## 🚀 Quick Start Commands

```bash
# 1. Setup environment
cp .env.example .env.local
# Add MERKOS_JWT_SECRET_KEY to .env.local

# 2. Install dependencies
npm install

# 3. Run tests
npm test -- __tests__/lib/cdsso-utils.test.ts
npm test -- __tests__/api/sso/remote/status.test.ts

# 4. Start development server
npm run dev

# 5. Test in browser
# Open http://localhost:3000
# Login at https://id.merkos302.com
# Check browser console for CDSSO logs
```

---

**Document Version:** 1.0.0
**Last Updated:** December 23, 2025
**Status:** ✅ PRODUCTION READY
**Contact:** Reuven (Merkos 302)
